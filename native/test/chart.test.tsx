import { describe, expect, test } from "bun:test";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { tokens } from "../tokens";
import { Sparkline } from "../src/sparkline";
import { Stat } from "../src/stat";
import { Tracker } from "../src/tracker";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

const dark = tokens.themes["rivocode-dark"];

/**
 * As marcas do desenho sao os unicos nos com cor inline na arvore: a cor vem
 * do token como VALOR, e nao como classe, entao procurar por backgroundColor
 * acha exatamente as barras ou os segmentos - e de quebra confere a cor.
 */
function marks(screen: ReactTestRenderer): ReactTestInstance[] {
  return screen.root.findAll(
    (node) =>
      typeof node.type === "string" &&
      typeof (node.props?.style as { backgroundColor?: unknown } | undefined)?.backgroundColor ===
        "string",
  );
}

/** O contorno nativo do web: no telefone a largura so existe depois do layout. */
function layout(screen: ReactTestRenderer, width: number) {
  const [box] = screen.root.findAll(
    (node) => typeof node.type === "string" && typeof node.props?.onLayout === "function",
  );
  act(() => box.props.onLayout({ nativeEvent: { layout: { width, height: 32 } } }));
}

describe("Sparkline", () => {
  test("a barra desenha uma marca por ponto, sem precisar medir", () => {
    const screen = render(<Sparkline variant="bar" data={[3, 1, 4, 1, 5]} />);
    expect(marks(screen)).toHaveLength(5);
  });

  test("a linha so desenha depois de medir, e sai um segmento a menos que os pontos", () => {
    const screen = render(<Sparkline data={[3, 1, 4, 1, 5]} />);
    // Antes do onLayout nao ha largura, e meio desenho pisca torto na tela.
    expect(marks(screen)).toHaveLength(0);
    layout(screen, 96);
    expect(marks(screen)).toHaveLength(4);
  });

  test("some do leitor de tela, porque o numero ao lado dela ja foi lido", () => {
    const silent = render(<Sparkline variant="bar" data={[1, 2, 3]} />);
    const [box] = silent.root.findAll(
      (node) => typeof node.type === "string" && node.props?.accessibilityElementsHidden === true,
    );
    expect(box.props.importantForAccessibility).toBe("no-hide-descendants");

    // Com rotulo ela vira a informacao, e precisa ser lida como imagem.
    const spoken = render(<Sparkline variant="bar" data={[1, 2, 3]} label="Vendas subindo" />);
    const [labelled] = byLabel(spoken, "Vendas subindo");
    expect(labelled.props.accessibilityRole).toBe("image");
    expect(labelled.props.accessibilityElementsHidden).toBeUndefined();
  });

  test("tone auto pinta de sucesso na subida e de perigo na queda", () => {
    const rising = render(<Sparkline variant="bar" tone="auto" data={[1, 9]} />);
    expect(marks(rising)[0].props.style.backgroundColor).toBe(dark["success-text"]);

    const falling = render(<Sparkline variant="bar" tone="auto" data={[9, 1]} />);
    expect(marks(falling)[0].props.style.backgroundColor).toBe(dark["danger-text"]);
  });

  test("sem tone ela usa o acento, e o papel de token requested vence", () => {
    const byDefault = render(<Sparkline variant="bar" data={[1, 9]} />);
    expect(byDefault.root && marks(byDefault)[0].props.style.backgroundColor).toBe(dark["accent-text"]);

    const requested = render(<Sparkline variant="bar" tone="auto" color="chart-3" data={[9, 1]} />);
    expect(marks(requested)[0].props.style.backgroundColor).toBe(dark["chart-3"]);
  });

  test("serie vazia ou flat nao quebra nem divide por zero", () => {
    expect(marks(render(<Sparkline variant="bar" data={[]} />))).toHaveLength(0);

    const singlePoint = render(<Sparkline data={[7]} />);
    layout(singlePoint, 96);
    // Um ponto so nao e tendencia: nao ha segmento para desenhar.
    expect(marks(singlePoint)).toHaveLength(0);

    const flat = render(<Sparkline data={[4, 4, 4]} />);
    layout(flat, 96);
    const tops = marks(flat).map((node) => node.props.style.top);
    expect(tops.every((value: number) => Number.isFinite(value))).toBe(true);
  });

  test("os segmentos se encontram: o fim de um e o comeco do proximo", () => {
    const screen = render(<Sparkline data={[3, 1, 4, 1, 5]} height={32} />);
    layout(screen, 96);

    // Girar View e desenhar a mao: se o pivo ou o angulo estiver errado, a
    // polilinha abre buraco entre os pontos e ninguem ve isso num teste de
    // contagem. Aqui a ponta de cada segmento tem de cair sobre a proxima.
    const parts = marks(screen).map((node) => {
      const style = node.props.style as {
        left: number;
        top: number;
        width: number;
        transform: [{ rotate: string }];
      };
      const radians = (parseFloat(style.transform[0].rotate) * Math.PI) / 180;
      return {
        start: { x: style.left, y: style.top + 1 },
        end: {
          x: style.left + style.width * Math.cos(radians),
          y: style.top + 1 + style.width * Math.sin(radians),
        },
      };
    });

    expect(parts).toHaveLength(4);
    // A conta acima so vale se o pivo do giro for a borda esquerda no meio da
    // altura; com o pivo no centro cada segmento anda meio comprimento e a
    // polilinha desanda sem que a aritmetica do teste perceba.
    marks(screen).forEach((node) => {
      expect(node.props.style.transformOrigin).toEqual([0, 1, 0]);
    });
    parts.slice(1).forEach((part, index) => {
      expect(part.start.x).toBeCloseTo(parts[index]!.end.x, 6);
      expect(part.start.y).toBeCloseTo(parts[index]!.end.y, 6);
    });

    // E o eixo aponta para onde deve: subir de valor sobe na tela, ou seja,
    // cai no `top`, que no nativo cresce para baixo.
    const rising = render(<Sparkline data={[1, 9]} height={32} />);
    layout(rising, 96);
    const [only] = marks(rising);
    expect(only!.props.style.top).toBeGreaterThan(0);
    expect(parseFloat(only!.props.style.transform[0].rotate)).toBeLessThan(0);
  });

  test("preenche o slot `chart` do Stat sem roubar a leitura do numero", () => {
    const screen = render(
      <Stat
        label="Faturamento"
        value="R$ 82,4 mil"
        delta={12}
        chart={<Sparkline variant="bar" data={[12, 15, 14, 19, 22, 28]} tone="auto" />}
      />,
    );

    // O motivo de a peca existir: o slot estava vazio esperando por ela.
    expect(marks(screen)).toHaveLength(6);
    expect(textOf(screen)).toContain("R$ 82,4 mil");

    // E o desenho continua mudo: quem le a tela ouve o numero, nao a barra.
    const hidden = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props?.accessibilityElementsHidden === true,
    );
    expect(hidden).toHaveLength(1);
  });
});

describe("Tracker", () => {
  const DATA = [
    { tone: "success" as const, label: "10/08 · sem falha" },
    { tone: "danger" as const, label: "11/08 · 3 falhas" },
    { tone: "warning" as const, label: "12/08 · 1 falha" },
  ];

  test("a dica por quadrado nao porta: nao ha portal, nem Pressable por periodo", () => {
    const screen = render(<Tracker data={DATA} label="Emissões dos últimos 3 dias" />);

    // Nenhum alvo de toque por quadrado - 4px de alvo seria promessa que o
    // dedo nao cumpre. O alvo e a faixa inteira, e ela e ajustavel.
    expect(screen.root.findAll((node) => node.props?.accessibilityRole === "button").length).toBe(
      0,
    );
    expect(byRole(screen, "adjustable").length).toBe(1);

    // Um quadrado por periodo, cada um com o tom que o dado pediu.
    expect(byClass(screen, /bg-success/).length).toBe(1);
    expect(byClass(screen, /bg-danger/).length).toBe(1);
    expect(byClass(screen, /bg-warning/).length).toBe(1);
  });

  test("a linha de baixo comeca no periodo mais recente, e o espaco ja esta reservado", () => {
    const screen = render(<Tracker data={DATA} label="Emissões" />);
    expect(textOf(screen)).toContain("12/08 · 1 falha");
  });

  test("a faixa e uma parada so, e o leitor de tela anda periodo a periodo", () => {
    const screen = render(<Tracker data={DATA} label="Emissões" />);

    const [faixa] = byRole(screen, "adjustable");
    expect(faixa.props.accessible).toBe(true);
    expect(faixa.props.accessibilityLabel).toBe("Emissões");
    expect(faixa.props.accessibilityValue.text).toBe("3 de 3: 12/08 · 1 falha");

    act(() => faixa.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
    expect(byRole(screen, "adjustable")[0].props.accessibilityValue.text).toBe(
      "2 de 3: 11/08 · 3 falhas",
    );
    expect(textOf(screen)).toContain("11/08 · 3 falhas");

    // A ponta segura: nao ha periodo antes do primeiro.
    act(() => faixa.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
    act(() => faixa.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
    expect(byRole(screen, "adjustable")[0].props.accessibilityValue.text).toBe(
      "1 de 3: 10/08 · sem falha",
    );

    // E o texto de baixo nao e lido duas vezes: a faixa ja o anuncia.
    const [linha] = byClass(screen, /text-xs text-fg-muted/);
    expect(linha.props.accessibilityElementsHidden).toBe(true);
  });

  test("a marca do periodo lido so aparece depois de medir a faixa", () => {
    const screen = render(<Tracker data={DATA} label="Emissões" />);
    expect(byClass(screen, /w-0\.5/).length).toBe(0);

    const [faixa] = byRole(screen, "adjustable");
    act(() => faixa.props.onLayout({ nativeEvent: { layout: { width: 300, height: 44 } } }));

    const [marca] = byClass(screen, /w-0\.5/);
    // Terceiro de tres numa faixa de 300: meio do ultimo terco, menos o fio.
    expect(marca.props.style.left).toBe(2 * 100 + 50 - 1);
  });

  test("sem dado nao desenha faixa nenhuma", () => {
    expect(textOf(render(<Tracker data={[]} label="Emissões" />)).trim()).toBe("");
  });
});
