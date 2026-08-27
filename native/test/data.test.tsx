import { describe, expect, mock, setSystemTime, test } from "bun:test";
import { Text } from "react-native";

import { AppState } from "../../test/react-native-mock";
import {
  Avatar,
  Button,
  DataList,
  EmptyState,
  Indicator,
  Progress,
  RelativeTime,
  Stat,
} from "../src";
import { Meter } from "../src/meter";
import { REFRESH, describeRelative } from "../src/relative-time";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

const ROWS = [
  { id: "1", name: "Clínica São Lucas" },
  { id: "2", name: "Transportes Cabo Branco" },
];

function list(props: Partial<Parameters<typeof DataList<(typeof ROWS)[number]>>[0]> = {}) {
  return (
    <DataList
      data={ROWS}
      keyExtractor={(row) => row.id}
      renderItem={(row) => <Text>{row.name}</Text>}
      {...props}
    />
  );
}

describe("DataList", () => {
  test("dados na tela, um nó por linha", () => {
    const screen = render(list());
    expect(textOf(screen)).toContain("Clínica São Lucas");
    expect(textOf(screen)).toContain("Transportes Cabo Branco");
    // Sem onRowPress, linha não é botão: papel só onde há ação.
    expect(byRole(screen, "button").length).toBe(0);
  });

  test("com onRowPress cada linha vira botão e entrega a linha", () => {
    const onRowPress = mock(() => {});
    const screen = render(list({ onRowPress }));
    const rows = byRole(screen, "button");
    expect(rows.length).toBe(2);
    act(() => rows[1].props.onPress());
    expect(onRowPress).toHaveBeenCalledWith(ROWS[1]);
  });

  test("carregando mostra esqueleto, e data undefined também é carregando", () => {
    for (const props of [{ isLoading: true }, { data: undefined }]) {
      const screen = render(list(props as never));
      expect(textOf(screen)).not.toContain("Clínica São Lucas");
      expect(byClass(screen, /bg-skeleton/).length).toBeGreaterThan(0);
    }
  });

  test("erro vence carregando, explica e oferece tentar de novo", () => {
    const onRetry = mock(() => {});
    const screen = render(list({ isError: true, isLoading: true, onRetry }));
    expect(textOf(screen)).toContain("Não foi possível carregar a lista.");
    act(() => byRole(screen, "button")[0].props.onPress());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("filter estreita a lista sem caixa e sem acento, como no DataTable", () => {
    const screen = render(list({ filter: "clinica" }));
    expect(textOf(screen)).toContain("Clínica São Lucas");
    expect(textOf(screen)).not.toContain("Transportes Cabo Branco");
  });

  test("filtro que zerou não é consulta vazia: o EmptyState fica reservado", () => {
    const empty = { title: "Nenhuma nota por aqui", description: "Emita a primeira." };
    const screen = render(list({ filter: "zzz", empty }));
    expect(textOf(screen)).toContain("Nenhum resultado para a busca.");
    expect(textOf(screen)).not.toContain("Nenhuma nota por aqui");

    // Banco vazio de verdade continua sendo EmptyState, mesmo com busca escrita.
    const nothing = render(list({ data: [], filter: "zzz", empty }));
    expect(textOf(nothing)).toContain("Nenhuma nota por aqui");
  });

  test("sem filterValue a busca vê o campo todo da linha, com filterValue só o escolhido", () => {
    // O id é campo da linha: "1" acha a linha 1 quando ninguém diz o contrário.
    expect(textOf(render(list({ filter: "1" })))).toContain("Clínica São Lucas");

    const named = render(list({ filter: "1", filterValue: (row) => row.name }));
    expect(textOf(named)).toContain("Nenhum resultado para a busca.");
  });

  test("selectable põe uma caixa por linha e devolve as chaves do keyExtractor", () => {
    const onSelectedChange = mock(() => {});
    const screen = render(list({ selectable: true, selected: [], onSelectedChange }));
    const boxes = byRole(screen, "checkbox");
    expect(boxes.length).toBe(2);
    act(() => boxes[1].props.onPress());
    expect(onSelectedChange).toHaveBeenCalledWith(["2"]);
  });

  test("selected manda no que está marcado, e desmarcar tira só aquela chave", () => {
    const onSelectedChange = mock(() => {});
    const screen = render(list({ selectable: true, selected: ["1", "2"], onSelectedChange }));
    expect(byRole(screen, "checkbox")[0].props.accessibilityState.checked).toBe(true);
    act(() => byRole(screen, "checkbox")[0].props.onPress());
    expect(onSelectedChange).toHaveBeenCalledWith(["2"]);
  });

  test("sem selected a lista guarda a própria seleção", () => {
    const screen = render(list({ selectable: true }));
    expect(byRole(screen, "checkbox")[0].props.accessibilityState.checked).toBe(false);
    act(() => byRole(screen, "checkbox")[0].props.onPress());
    expect(byRole(screen, "checkbox")[0].props.accessibilityState.checked).toBe(true);
  });

  test("a caixa alcança os 44pt do dedo, que ela sozinha não tem", () => {
    const screen = render(list({ selectable: true }));
    const slop = byRole(screen, "checkbox")[0].props.hitSlop;
    expect(slop.left + 20 + slop.right).toBeGreaterThanOrEqual(44);
    expect(slop.top + 20 + slop.bottom).toBeGreaterThanOrEqual(44);
  });

  test("a chave sai do índice original: filtrar não renumera a seleção", () => {
    const onSelectedChange = mock(() => {});
    const screen = render(
      list({
        filter: "transportes",
        selectable: true,
        selected: [],
        onSelectedChange,
        keyExtractor: (_row, index) => String(index),
      }),
    );
    act(() => byRole(screen, "checkbox")[0].props.onPress());
    // Ela é a segunda linha do conjunto, e continua sendo com o filtro ligado.
    expect(onSelectedChange).toHaveBeenCalledWith(["1"]);
  });

  test("lista vazia sem busca escrita não fala em busca", () => {
    // Sem `empty` e sem filtro, a lista some em silêncio, como sempre fez -
    // dizer "nenhum resultado para a busca" inventaria uma busca que não houve.
    const screen = render(list({ data: [] }));
    expect(textOf(screen)).not.toContain("Nenhum resultado para a busca.");
  });

  test("vazio só vale depois que a consulta voltou, e diz o porquê", () => {
    const empty = {
      title: "Nenhuma nota por aqui",
      description: "Quando você emitir a primeira, ela aparece nesta lista.",
    };
    const screen = render(list({ data: [], empty }));
    expect(textOf(screen)).toContain("Nenhuma nota por aqui");

    // A mesma lista vazia AINDA carregando não é vazia.
    const loading = render(list({ data: undefined, empty } as never));
    expect(textOf(loading)).not.toContain("Nenhuma nota por aqui");
  });
});

describe("EmptyState", () => {
  test("título, porquê e ação no lugar", () => {
    const screen = render(
      <EmptyState
        title="Nada aqui"
        description="Emita a primeira nota."
        action={<Text>Emitir</Text>}
      />,
    );
    expect(textOf(screen)).toContain("Nada aqui");
    expect(textOf(screen)).toContain("Emita a primeira nota.");
    expect(textOf(screen)).toContain("Emitir");
  });
});

describe("Stat", () => {
  test("subir é verde por padrão e vermelho com invert", () => {
    const up = render(<Stat label="Faturado" value="R$ 246,7K" delta={20} />);
    expect(byClass(up, /text-success-text/).length).toBe(1);

    const bad = render(<Stat label="Vencidas" value="6" delta={50} invert />);
    expect(byClass(bad, /text-danger-text/).length).toBe(1);
  });
});

describe("Avatar", () => {
  test("as iniciais entram por fallback, o mesmo nome do web", () => {
    const screen = render(<Avatar fallback="EB" />);
    expect(textOf(screen)).toContain("EB");
  });
});

describe("Progress", () => {
  test("anuncia papel e valor, e não passa de 100", () => {
    const screen = render(<Progress value={140} label="Meta do mês" />);
    const [bar] = byRole(screen, "progressbar");
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
    expect(bar.props.accessibilityLabel).toBe("Meta do mês");
  });
});

describe("Meter", () => {
  test("não é progressbar: medida que sobe e desce não pode anunciar carregando", () => {
    const screen = render(<Meter value={82} label="Espaço usado" />);
    expect(byRole(screen, "progressbar").length).toBe(0);
    const [meter] = byRole(screen, "text");
    expect(meter.props.accessibilityLabel).toBe("Espaço usado");
  });

  test("escala própria: 8 de 15 pinta 53% de barra e anuncia o valor cru", () => {
    const screen = render(<Meter value={8} max={15} label="Armazenamento" />);
    const [bar] = byClass(screen, /\bbg-accent\b/);
    expect(bar.props.style.width).toBe("53%");

    const [meter] = byRole(screen, "text");
    expect(meter.props.accessibilityValue).toEqual({ min: 0, max: 15, now: 8, text: "53%" });
  });

  test("fora da escala não estoura a barra nos dois sentidos", () => {
    const over = render(<Meter value={40} max={15} label="Armazenamento" />);
    expect(byClass(over, /\bbg-accent\b/)[0].props.style.width).toBe("100%");
    // now acima de max é RangeInfo fora da especificação: o leitor de tela
    // recebe a escala, o texto na tela é que conta o estouro.
    expect(byRole(over, "text")[0].props.accessibilityValue.now).toBe(15);

    const under = render(<Meter value={-4} max={15} label="Armazenamento" />);
    expect(byClass(under, /\bbg-accent\b/)[0].props.style.width).toBe("0%");
  });

  test("valueLabel escreve a medida na tela e é o que o leitor de tela diz", () => {
    const screen = render(
      <Meter value={8} max={15} label="Armazenamento" valueLabel="8 GB de 15 GB" />,
    );
    expect(textOf(screen)).toContain("Armazenamento");
    expect(textOf(screen)).toContain("8 GB de 15 GB");
    expect(byRole(screen, "text")[0].props.accessibilityValue.text).toBe("8 GB de 15 GB");
  });

  test("showValue escreve a porcentagem, e sem ele a barra vai sozinha", () => {
    const shown = render(<Meter value={8} max={15} label="Armazenamento" showValue />);
    expect(textOf(shown)).toContain("53%");

    const bare = render(<Meter value={8} max={15} label="Armazenamento" />);
    expect(textOf(bare)).not.toContain("53%");
  });
});

describe("Indicator", () => {
  test("a contagem fica por cima do filho, e o leitor ouve a frase e nao o numero", () => {
    const screen = render(
      <Indicator count={3} label="3 notificações">
        <Button onPress={() => {}}>Avisos</Button>
      </Indicator>,
    );

    expect(textOf(screen)).toContain("3");

    const [pastilha] = byLabel(screen, "3 notificações");
    expect(pastilha.props.accessible).toBe(true);
    expect(pastilha.props.accessibilityRole).toBe("text");
    expect(pastilha.props.className).toContain("absolute");

    // O filho continua sendo botao: a marca nao embrulha o que ela conta,
    // senao o alvo de dentro sumia para o leitor de tela.
    expect(byRole(screen, "button").length).toBe(1);
  });

  test("zero nao desenha nada, e acima do teto sai o teto com mais", () => {
    const zero = render(
      <Indicator count={0} label="Nenhum aviso">
        <Text>Sino</Text>
      </Indicator>,
    );
    expect(byLabel(zero, "Nenhum aviso").length).toBe(0);

    const muitos = render(
      <Indicator count={140} label="Mais de 99 notificações">
        <Text>Sino</Text>
      </Indicator>,
    );
    expect(textOf(muitos)).toContain("99+");

    const proprio = render(
      <Indicator count={12} max={9} label="Mais de 9 notificações">
        <Text>Sino</Text>
      </Indicator>,
    );
    expect(textOf(proprio)).toContain("9+");
  });

  test("o ponto marca sem contar, e mesmo assim se anuncia", () => {
    const screen = render(
      <Indicator dot label="Há mensagens novas">
        <Text>Sino</Text>
      </Indicator>,
    );

    expect(byLabel(screen, "Há mensagens novas").length).toBe(1);
    expect(textOf(screen).trim()).toBe("Sino");
  });
});

describe("RelativeTime", () => {
  const AGORA = new Date("2026-08-26T12:00:00");
  const antes = (ms: number) => new Date(AGORA.getTime() - ms);
  const texto = (element: Parameters<typeof render>[0]) => textOf(render(element)).trim();

  test("a unidade e o plural, para tras e para frente", () => {
    expect(texto(<RelativeTime value={antes(30_000)} now={AGORA} />)).toBe("agora");
    expect(texto(<RelativeTime value={antes(60_000)} now={AGORA} />)).toBe("há 1 minuto");
    expect(texto(<RelativeTime value={antes(120_000)} now={AGORA} />)).toBe("há 2 minutos");
    expect(texto(<RelativeTime value={antes(3_600_000)} now={AGORA} />)).toBe("há 1 hora");
    expect(texto(<RelativeTime value={antes(3 * 86_400_000)} now={AGORA} />)).toBe("há 3 dias");
    expect(texto(<RelativeTime value={antes(60 * 86_400_000)} now={AGORA} />)).toBe("há 2 meses");

    const depois = new Date(AGORA.getTime() + 3 * 86_400_000);
    expect(texto(<RelativeTime value={depois} now={AGORA} />)).toBe("em 3 dias");

    // Aceita o que vier: Date, ISO ou milissegundos.
    expect(texto(<RelativeTime value={antes(120_000).toISOString()} now={AGORA} />)).toBe(
      "há 2 minutos",
    );
    expect(texto(<RelativeTime value={antes(120_000).getTime()} now={AGORA} />)).toBe(
      "há 2 minutos",
    );
  });

  test("cutoff troca o relativo pela data, no formato do formatDate", () => {
    const velho = new Date("2026-01-05T09:00:00");
    expect(texto(<RelativeTime value={velho} cutoff="month" now={AGORA} />)).toBe("05/01/2026");
    // Sem cutoff, continua contando.
    expect(texto(<RelativeTime value={velho} now={AGORA} />)).toBe("há 8 meses");
  });

  test("o passo acompanha a distancia, e a data ja passada nao tem passo", () => {
    expect(describeRelative(antes(90_000), AGORA).step).toBe(REFRESH.minute);
    expect(describeRelative(antes(5 * 3_600_000), AGORA).step).toBe(REFRESH.hour);
    expect(describeRelative(antes(3 * 86_400_000), AGORA).step).toBe(REFRESH.day);
    expect(REFRESH.now).toBeLessThan(REFRESH.minute);
    expect(REFRESH.minute).toBeLessThan(REFRESH.hour);
    expect(REFRESH.hour).toBeLessThan(REFRESH.day);

    // Data absoluta de instante passado nunca mais muda: relogio nenhum.
    const antigo = antes(400 * 86_400_000);
    expect(describeRelative(antigo, AGORA, "month").step).toBeNull();

    // No futuro a mesma data volta a ser relativa quando chegar perto, entao
    // ali o relogio continua.
    const futuro = new Date(AGORA.getTime() + 400 * 86_400_000);
    expect(describeRelative(futuro, AGORA, "month").step).toBe(REFRESH.year);
  });

  test("sem now o texto se refaz ao voltar do fundo; com now ele fica parado", () => {
    setSystemTime(new Date("2026-08-26T12:00:00"));

    const vivo = render(<RelativeTime value={new Date("2026-08-26T11:58:00")} />);
    const parado = render(<RelativeTime value={new Date("2026-08-26T11:58:00")} now={AGORA} />);
    expect(textOf(vivo).trim()).toBe("há 2 minutos");

    // O aparelho dormiu uma hora: o timer do JS nao correu enquanto isso, e e
    // a volta que refaz o texto.
    setSystemTime(new Date("2026-08-26T13:00:00"));
    act(() => AppState.setState("background"));
    act(() => AppState.setState("active"));

    expect(textOf(vivo).trim()).toBe("há 1 hora");
    expect(textOf(parado).trim()).toBe("há 2 minutos");

    act(() => vivo.unmount());
    setSystemTime();
  });
});
