import { describe, expect, mock, test } from "bun:test";
import { Text } from "react-native";

import { Avatar, DataList, EmptyState, Progress, Stat } from "../src";
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
