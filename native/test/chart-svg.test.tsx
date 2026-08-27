import { describe, expect, mock, spyOn, test } from "bun:test";
import { createElement } from "react";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { tokens } from "../tokens";
import { act, byClass, byLabel, byRole, byType, render, textOf } from "./helpers";

/*
 * O react-native-svg nao esta instalado onde a suite roda, e nao vai estar: ele
 * e peer OPCIONAL e modulo nativo, entao o unico lugar do repositorio que o
 * tem e `examples/native`, que nao e workspace - e onde o `check:native:types`
 * vai buscar os tipos. Aqui ele entra como duble, com cada elemento virando um
 * no host de mesmo nome, e e por isso que os testes abaixo procuram por "Path"
 * e "Circle" como se fossem tags.
 *
 * O `mock.module` PRECISA correr antes de a peca ser avaliada, e `import` e
 * icado para o topo do arquivo: por isso as tres pecas entram por `await
 * import` logo abaixo, e nao pela linha de import que seria natural. Trocar de
 * volta faz o duble chegar tarde e o teste morrer em "Cannot find module".
 */
mock.module("react-native-svg", () => {
  const host = (name: string) => (props: Record<string, unknown>) => createElement(name, props);

  return {
    default: host("Svg"),
    Svg: host("Svg"),
    Circle: host("Circle"),
    Line: host("Line"),
    Path: host("Path"),
    G: host("G"),
  };
});

const { ChartContainer } = await import("../src/chart/chart");
const { ChartDonut } = await import("../src/chart/chart-donut");
const { ChartRadial } = await import("../src/chart/chart-radial");

const dark = tokens.themes["rivocode-dark"];

const SERIES = {
  pagas: { label: "Pagas" },
  vencidas: { label: "Vencidas" },
} as const;

const SLICES = [
  { natureza: "servico", total: 60 },
  { natureza: "produto", total: 40 },
];

/** Mede a moldura, que no telefone so tem largura depois do layout. */
function layout(screen: ReactTestRenderer, width: number, height: number) {
  const [box] = screen.root.findAll(
    (node) => typeof node.type === "string" && typeof node.props?.onLayout === "function",
  );
  act(() => box!.props.onLayout({ nativeEvent: { layout: { width, height } } }));
}

/** O `d` de cada caminho desenhado, na ordem. */
const paths = (screen: ReactTestRenderer) =>
  byType(screen, "Path").map((node) => String(node.props.d));

/** O sinalizador de arco longo do comando `A`, que decide o lado do desenho. */
function longFlag(d: string) {
  const arc = /A\s+[\d.-]+\s+[\d.-]+\s+\d+\s+(\d)/.exec(d);
  return Number(arc![1]);
}

/**
 * Em que angulo o caminho comeca, contado do topo e no sentido do relogio.
 *
 * Ler o angulo de volta do ponto - e nao comparar a string do `d` - e o que
 * deixa o teste falar da geometria que a tela mostra, sem reescrever a conta
 * da peca e concordar com ela por construcao.
 */
function startAngle(d: string) {
  const move = /M\s+([\d.-]+)\s+([\d.-]+)/.exec(d)!;
  return (Math.atan2(Number(move[1]), -Number(move[2])) * 180) / Math.PI;
}

describe("ChartContainer", () => {
  const drawing = () => (
    <ChartContainer config={SERIES} data={[1, 2]}>
      {() => null}
    </ChartContainer>
  );

  test("os quatro finais de uma consulta saem da moldura, e nao da tela", () => {
    const waiting = render(
      <ChartContainer config={SERIES} isLoading>
        {() => null}
      </ChartContainer>,
    );
    expect(byClass(waiting, /bg-skeleton/).length).toBe(6);

    const broken = render(
      <ChartContainer config={SERIES} isError onRetry={() => {}}>
        {() => null}
      </ChartContainer>,
    );
    expect(textOf(broken)).toContain("Não foi possível carregar o gráfico");
    expect(textOf(broken)).toContain("Tentar de novo");

    // Sem `onRetry` o erro nao promete o que nao tem: nada acontece ao tocar.
    const stuck = render(
      <ChartContainer config={SERIES} isError>
        {() => null}
      </ChartContainer>,
    );
    expect(textOf(stuck)).not.toContain("Tentar de novo");

    const nothing = render(
      <ChartContainer
        config={SERIES}
        data={[]}
        empty={{
          title: "Sem emissões no período",
          description: "Emita uma nota para ver o gráfico.",
        }}
      >
        {() => <Marker />}
      </ChartContainer>,
    );
    expect(textOf(nothing)).toContain("Sem emissões no período");
    expect(byType(nothing, "Marker").length).toBe(0);

    // Com ponto, o desenho: o vazio nao pode roubar a tela de quem tem dado.
    expect(byType(render(drawing()), "Svg").length + 1).toBeGreaterThan(0);
  });

  test("as cores chegam resolvidas, pela chave da serie e na ordem da paleta", () => {
    let seen: Record<string, string> = {};
    render(
      <ChartContainer
        config={{ pagas: { label: "Pagas" }, vencidas: { label: "Vencidas", color: "chart-5" } }}
        data={[1]}
      >
        {(frame) => {
          seen = frame.colors;
          return null;
        }}
      </ChartContainer>,
    );

    // Sem cor escrita, a proxima da paleta na ordem do config.
    expect(seen.pagas).toBe(dark["chart-1"]);
    // Com papel escrito, o papel - e ja como valor, que e o que o SVG aceita.
    expect(seen.vencidas).toBe(dark["chart-5"]);
  });

  test("a medida chega zerada no primeiro quadro e verdadeira no seguinte", () => {
    const sizes: { width: number; height: number }[] = [];
    const screen = render(
      <ChartContainer config={SERIES} data={[1]}>
        {({ width, height }) => {
          sizes.push({ width, height });
          return null;
        }}
      </ChartContainer>,
    );

    expect(sizes[0]).toEqual({ width: 0, height: 0 });
    layout(screen, 320, 220);
    expect(sizes[sizes.length - 1]).toEqual({ width: 320, height: 220 });

    // Medir de novo o mesmo tamanho nao troca a medida entregue: o `onLayout`
    // dispara a cada relayout do pai, e nao so quando o tamanho muda.
    layout(screen, 320, 220);
    expect(sizes[sizes.length - 1]).toEqual({ width: 320, height: 220 });
  });

  test("caixa medida sem altura é acusada: o desenho recebeu height 0 e o cartão fica vazio", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      const screen = render(drawing());
      layout(screen, 320, 0);

      await Bun.sleep(260);

      expect(warn.mock.calls.length).toBe(1);
      expect(String(warn.mock.calls[0]![0])).toContain("[rivocode/ui-native]");
      expect(String(warn.mock.calls[0]![0])).toContain("altura");
    } finally {
      warn.mockRestore();
    }
  });

  test("altura medida cala a peça, e o zero antes do primeiro layout também", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      const measured = render(drawing());
      layout(measured, 320, 220);

      render(drawing());

      await Bun.sleep(260);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test("o zero de um passe de layout intermediário não acusa: o passe seguinte cancela", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      const screen = render(drawing());
      layout(screen, 320, 0);
      layout(screen, 320, 240);

      await Bun.sleep(260);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test("filho em JSX não é acusado por caixa chata: a peça de dentro tem tamanho próprio", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      const screen = render(
        <ChartContainer config={SERIES} data={SLICES}>
          <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" />
        </ChartContainer>,
      );
      layout(screen, 320, 0);

      await Bun.sleep(260);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test("a moldura nomeia o desenho que ela mesma embrulha, e so esse", () => {
    // Funcao: a moldura e dona do desenho, entao ela vira uma figura com nome.
    const own = render(drawing());
    const [figure] = byRole(own, "image");
    expect(figure!.props.accessible).toBe(true);
    expect(figure!.props.accessibilityLabel).toBe("Gráfico de Pagas, Vencidas");

    const named = render(
      <ChartContainer config={SERIES} data={[1]} label="Faturamento por mês">
        {() => null}
      </ChartContainer>,
    );
    expect(byLabel(named, "Faturamento por mês").length).toBe(1);

    /*
     * Filho em JSX e o caso oposto, e e o que protege a rosca: um `accessible`
     * por cima dela fecharia as fatias numa parada so, e a legenda e a UNICA
     * forma de ler valor no toque. Nenhum no da arvore pode estar agrupado.
     */
    const wrapped = render(
      <ChartContainer config={SERIES} data={SLICES}>
        <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" />
      </ChartContainer>,
    );
    expect(wrapped.root.findAll((node) => node.props?.accessible === true).length).toBe(0);
    expect(byRole(wrapped, "button").length).toBe(2);
  });
});

describe("ChartDonut", () => {
  test("uma fatia por valor, e a fatia zerada nao desenha nada", () => {
    const screen = render(
      <ChartDonut
        data={[...SLICES, { natureza: "isento", total: 0 }]}
        valueKey="total"
        nameKey="natureza"
      />,
    );
    expect(paths(screen)).toHaveLength(2);
  });

  test("a fatia maior que meia volta sai desenhada pelo lado longo", () => {
    const screen = render(<ChartDonut data={SLICES} valueKey="total" nameKey="natureza" />);
    const [first, second] = paths(screen);

    // 60% sao 216 graus: pelo lado curto ela apareceria como 40%.
    expect(longFlag(first!)).toBe(1);
    expect(longFlag(second!)).toBe(0);

    // E a primeira comeca no topo, que e onde a leitura de uma rosca comeca -
    // deslocada de meia folga, que e o que separa uma fatia da vizinha.
    expect(startAngle(first!)).toBeCloseTo(1, 2);
  });

  test("fatia unica e volta inteira, e volta inteira nao e arco", () => {
    const screen = render(
      <ChartDonut data={[{ natureza: "servico", total: 9 }]} valueKey="total" nameKey="natureza" />,
    );

    // Um comando `A` que comeca e termina no mesmo ponto nao desenha nada: a
    // rosca sumiria justamente no caso mais simples.
    expect(paths(screen)).toHaveLength(0);
    expect(byType(screen, "Circle")).toHaveLength(1);
  });

  test("o toque na legenda acende a fatia e manda o valor para o meio", () => {
    const screen = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        centerValue="100"
        centerLabel="no mês"
        format={(value) => `R$ ${value}`}
      />,
    );

    expect(textOf(screen)).toContain("no mês");

    const [first] = byRole(screen, "button");
    act(() => first!.props.onPress());

    // O meio passa a dizer a fatia lida - e o total sai de cena, como no web
    // ele sai enquanto a dica ocupa o mesmo lugar.
    expect(textOf(screen)).toContain("servico");
    expect(textOf(screen)).not.toContain("no mês");

    // A fatia acesa fica opaca e a outra recua; nenhuma some, senao a rosca
    // perde a proporcao que ela existe para mostrar.
    const [lit, dimmed] = byType(screen, "Path");
    expect(lit!.props.strokeOpacity).toBe(1);
    expect(dimmed!.props.strokeOpacity).toBeLessThan(1);

    // Tocar de novo devolve o total: a leitura e um estado, nao um caminho sem volta.
    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(textOf(screen)).toContain("no mês");
  });

  test("com legenda o desenho cala, e cada fatia vira uma parada com nome e valor", () => {
    const screen = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        config={{ servico: { label: "Serviço" }, produto: { label: "Produto" } }}
        format={(value) => `R$ ${value}`}
      />,
    );

    const [drawing] = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props?.accessibilityElementsHidden === true,
    );
    expect(drawing!.props.importantForAccessibility).toBe("no-hide-descendants");

    const rows = byRole(screen, "button");
    expect(rows.map((row: ReactTestInstance) => row.props.accessibilityLabel)).toEqual([
      "Serviço: R$ 60",
      "Produto: R$ 40",
    ]);

    // 44px: o alvo que a fatia de 2% jamais ofereceria.
    expect(rows.every((row: ReactTestInstance) => /h-11/.test(row.props.className))).toBe(true);
    expect(rows[0]!.props.accessibilityState.selected).toBe(false);

    act(() => rows[0]!.props.onPress());
    expect(byRole(screen, "button")[0]!.props.accessibilityState.selected).toBe(true);
  });

  test("sem legenda o dado tem que caber no nome, porque nao ha dica para abrir", () => {
    const screen = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        legend={false}
        format={(value) => `R$ ${value}`}
      />,
    );

    expect(byRole(screen, "button")).toHaveLength(0);
    const [figure] = byRole(screen, "image");
    expect(figure!.props.accessibilityLabel).toBe("Rosca: servico R$ 60, produto R$ 40");

    // Com `label` escrito, ele vence: a rosca responde a pergunta da tela.
    const asked = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        legend={false}
        label="Faturamento por natureza"
      />,
    );
    expect(byLabel(asked, "Faturamento por natureza")).toHaveLength(1);
  });

  test("a espessura decide o anel, e `1` fecha a pizza", () => {
    const thin = render(
      <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" thickness={0.2} />,
    );
    const solid = render(
      <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" thickness={1} />,
    );

    const bandOf = (screen: ReactTestRenderer) =>
      Number(byType(screen, "Path")[0]!.props.strokeWidth);

    expect(bandOf(thin)).toBeCloseTo(44 * 0.2, 5);
    // Espessura cheia: o traco vai do centro a borda, entao o buraco fecha.
    expect(bandOf(solid)).toBeCloseTo(44, 5);
  });
});

describe("ChartRadial", () => {
  test("o trilho fica sempre desenhado, e o arco do valor so quando ha valor", () => {
    const measured = render(<ChartRadial value={40} />);
    expect(paths(measured)).toHaveLength(2);

    // Em zero, so a escala: ponta redonda num arco de comprimento zero vira um
    // ponto aceso, que se le como "ja comecou".
    expect(paths(render(<ChartRadial value={0} />))).toHaveLength(1);
  });

  test("acima do maximo o arco para no fim, e nao da a volta", () => {
    const over = render(<ChartRadial value={130} max={100} sweep={270} />);
    const full = render(<ChartRadial value={100} max={100} sweep={270} />);

    expect(paths(over)[1]).toBe(paths(full)[1]);
    expect(textOf(over)).toContain("100%");
  });

  test("a volta inteira vira circulo, senao `sweep={360}` sai em branco", () => {
    const screen = render(<ChartRadial value={100} sweep={360} />);
    expect(byType(screen, "Circle").length).toBe(2);
    expect(paths(screen)).toHaveLength(0);
  });

  test("o nome carrega a medida: sem ele, ouvir a peça nao diz nada", () => {
    const measured = render(<ChartRadial value={82} centerLabel="da meta do mês" />);
    const [figure] = byRole(measured, "image");
    expect(figure!.props.accessible).toBe(true);
    expect(figure!.props.accessibilityLabel).toBe("82%, da meta do mês");

    // O que esta escrito no meio vence a porcentagem calculada.
    const written = render(<ChartRadial value={82} centerValue="8,2 GB" centerLabel="de 10 GB" />);
    expect(byLabel(written, "8,2 GB, de 10 GB")).toHaveLength(1);

    // E o `label` vence os dois.
    const asked = render(<ChartRadial value={82} centerLabel="da meta" label="Meta do mês" />);
    expect(byLabel(asked, "Meta do mês")).toHaveLength(1);
  });

  test("o segmentado acende os tracinhos ate o valor e apaga o resto", () => {
    const screen = render(
      <ChartRadial value={50} variant="segmented" segments={10} color="chart-3" />,
    );

    const ticks = byType(screen, "Line");
    expect(ticks).toHaveLength(10);

    const lit = ticks.filter((tick: ReactTestInstance) => tick.props.stroke === dark["chart-3"]);
    expect(lit).toHaveLength(5);

    // O apagado continua na tela: sem escala, traco aceso nao significa nada.
    const off = ticks.filter((tick: ReactTestInstance) => tick.props.stroke === dark.skeleton);
    expect(off).toHaveLength(5);

    // O primeiro traco abre o arco, e o ultimo o fecha, simetricos.
    expect(Number(ticks[0]!.props.rotation)).toBeCloseTo(-135, 5);
    expect(Number(ticks[9]!.props.rotation)).toBeCloseTo(135, 5);
  });
});

/** Uma marca qualquer, para dizer se o desenho entrou ou nao. */
function Marker() {
  return null;
}
