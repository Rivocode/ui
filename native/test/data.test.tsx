import { describe, expect, mock, test } from "bun:test";
import { Text } from "react-native";

import { Avatar, DataList, EmptyState, Progress, Stat } from "../src";
import { Meter } from "../src/meter";
import { act, byClass, byRole, render, textOf } from "./helpers";

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
    expect(textOf(screen)).toContain("Nao foi possivel carregar a lista.");
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
      <EmptyState title="Nada aqui" description="Emita a primeira nota." action={<Text>Emitir</Text>} />,
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
    const screen = render(<Meter value={8} max={15} label="Armazenamento" valueLabel="8 GB de 15 GB" />);
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
