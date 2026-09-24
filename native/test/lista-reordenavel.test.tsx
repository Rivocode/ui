import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import { timingCalls } from "react-native-reanimated";
import type { ReactTestInstance } from "react-test-renderer";

import * as root from "../src";
import { SortableList, type SortableListProps } from "../src/dnd";
import { tokens } from "../tokens";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

type Responder = {
  onStartShouldSetPanResponder: () => boolean;
  onPanResponderTerminationRequest: () => boolean;
  onPanResponderGrant: (event: unknown, gesture: unknown) => void;
  onPanResponderMove: (event: unknown, gesture: { dx: number; dy: number }) => void;
  onPanResponderRelease: (event: unknown, gesture: unknown) => void;
  onPanResponderTerminate: (event: unknown, gesture: unknown) => void;
};

const { panResponders } = (await import("react-native")) as unknown as {
  panResponders: Responder[];
};

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
  setReduceMotion: (next: boolean) => void;
};

type Timing = { to: number; config: { duration: number } };

beforeEach(() => {
  spoken.clearAnnouncements();
  panResponders.length = 0;
  timingCalls.length = 0;
});

afterEach(() => {
  act(() => spoken.setReduceMotion(false));
});

type Note = { id: number; client: string };

const NOTES: Note[] = [
  { id: 1041, client: "Clínica São Lucas" },
  { id: 1042, client: "Padaria Pão Quente" },
  { id: 1043, client: "Oficina do Zé" },
  { id: 1044, client: "Escola Aprender" },
];

function Notes(props: Partial<SortableListProps<Note>>) {
  return (
    <SortableList
      items={NOTES}
      getKey={(note) => note.id}
      getLabel={(note) => `Nota ${note.id}`}
      onReorder={() => {}}
      renderItem={(note) => <Text>{note.client}</Text>}
      {...props}
    />
  );
}

const ROW = 44;
const GAP = 8;

function rows(screen: ReturnType<typeof render>): ReactTestInstance[] {
  return byType(screen, "View").filter((node) => typeof node.props.onLayout === "function");
}

function layOut(screen: ReturnType<typeof render>, horizontal = false) {
  const found = rows(screen);
  expect(found.length).toBeGreaterThan(1);
  act(() => {
    found.forEach((row, index) => {
      const start = index * (ROW + GAP);
      row.props.onLayout({
        nativeEvent: {
          layout: horizontal
            ? { x: start, y: 0, width: ROW, height: 44 }
            : { x: 0, y: start, width: 320, height: ROW },
        },
      });
    });
  });
}

function drag(index: number, path: number[], end: "release" | "terminate" = "release") {
  const responder = panResponders[index]!;
  act(() => responder.onPanResponderGrant({}, { dx: 0, dy: 0 }));
  for (const distance of path) {
    act(() => responder.onPanResponderMove({}, { dx: distance, dy: distance }));
  }
  act(() =>
    end === "release"
      ? responder.onPanResponderRelease({}, {})
      : responder.onPanResponderTerminate({}, {}),
  );
}

const order = (screen: ReturnType<typeof render>) =>
  textOf(screen)
    .split(/(?=Clínica|Padaria|Oficina|Escola)/)
    .map((chunk) => chunk.trim());

describe("SortableList nativa", () => {
  test("sai de @rivocode/ui-native/dnd, e nao do indice da raiz", () => {
    expect("SortableList" in root).toBe(false);
  });

  test("cada item ganha uma alca de 44pt com nome, dica e as duas acoes de mover", () => {
    const screen = render(<Notes />);
    expect(byRole(screen, "list")).toHaveLength(1);

    const handle = byLabel(screen, "Reordenar Nota 1043")[0]!;
    expect(handle.props.className.split(" ")).toContain("size-11");
    expect(handle.props.accessibilityHint).toBe(
      "Arraste pela alça, ou use as ações de mover do leitor de tela.",
    );
    expect(handle.props.accessibilityActions).toEqual([
      { name: "moveEarlier", label: "Mover para cima" },
      { name: "moveLater", label: "Mover para baixo" },
    ]);
  });

  test("o gesto da alca nao cede a rolagem da tela no meio do arrasto", () => {
    render(<Notes />);
    expect(panResponders).toHaveLength(4);
    expect(panResponders[0]!.onStartShouldSetPanResponder()).toBe(true);
    expect(panResponders[0]!.onPanResponderTerminationRequest()).toBe(false);
  });

  test("arrastar pela alca reordena, anuncia cada posicao e entrega a ordem nova", () => {
    const onReorder = mock<(items: Note[], move: unknown) => void>(() => {});
    const screen = render(<Notes onReorder={onReorder} />);
    layOut(screen);

    drag(0, [30, 60, 110]);

    expect(spoken.announced).toEqual([
      "Item Nota 1041 pego. Posição 1 de 4.",
      "Item Nota 1041 movido para a posição 2 de 4.",
      "Item Nota 1041 movido para a posição 3 de 4.",
      "Item Nota 1041 solto na posição 3 de 4.",
    ]);
    expect(onReorder).toHaveBeenCalledTimes(1);
    const [items, move] = onReorder.mock.calls[0]!;
    expect(items.map((note) => note.id)).toEqual([1042, 1043, 1041, 1044]);
    expect(move).toEqual({ key: 1041, from: 0, to: 2 });
  });

  test("durante o arrasto uma copia segue o dedo, e o lugar de origem fica vazio", () => {
    const screen = render(<Notes />);
    layOut(screen);
    const responder = panResponders[1]!;

    act(() => responder.onPanResponderGrant({}, { dx: 0, dy: 0 }));
    act(() => responder.onPanResponderMove({}, { dx: 0, dy: 40 }));

    const copy = byType(screen, "View").find((node) => node.props.pointerEvents === "none")!;
    expect(copy.props.accessibilityElementsHidden).toBe(true);
    expect(copy.props.style).toEqual({
      left: 0,
      right: 0,
      top: ROW + GAP,
      transform: [{ translateY: 40 }],
    });
    expect(rows(screen)[1]!.props.className.split(" ")).toContain("opacity-0");

    act(() => responder.onPanResponderRelease({}, {}));
    expect(byType(screen, "View").some((node) => node.props.pointerEvents === "none")).toBe(false);
  });

  test("os vizinhos abrem espaco com a duracao do token, e sem movimento quando o sistema pede", () => {
    const screen = render(<Notes />);
    layOut(screen);
    const responder = panResponders[0]!;

    act(() => responder.onPanResponderGrant({}, { dx: 0, dy: 0 }));
    act(() => responder.onPanResponderMove({}, { dx: 0, dy: 60 }));
    const moving = (timingCalls as unknown as Timing[]).filter((call) => call.to !== 0);
    expect(moving.at(-1)).toMatchObject({
      to: -(ROW + GAP),
      config: { duration: tokens.scales["duration-base"] },
    });
    act(() => responder.onPanResponderTerminate({}, {}));

    act(() => spoken.setReduceMotion(true));
    timingCalls.length = 0;
    act(() => responder.onPanResponderGrant({}, { dx: 0, dy: 0 }));
    act(() => responder.onPanResponderMove({}, { dx: 0, dy: 60 }));
    const still = (timingCalls as unknown as Timing[]).filter((call) => call.to !== 0);
    expect(still.length).toBeGreaterThan(0);
    for (const call of still) expect(call.config.duration).toBe(0);
  });

  test("o gesto interrompido pelo sistema cancela, e a ordem nao muda", () => {
    const onReorder = mock(() => {});
    const screen = render(<Notes onReorder={onReorder} />);
    layOut(screen);

    drag(1, [60], "terminate");

    expect(onReorder).not.toHaveBeenCalled();
    expect(spoken.announced.at(-1)).toBe(
      "Movimento cancelado. Item Nota 1042 voltou para a posição 2 de 4.",
    );
  });

  test("soltar no mesmo lugar nao chama onReorder", () => {
    const onReorder = mock(() => {});
    const screen = render(<Notes onReorder={onReorder} />);
    layOut(screen);

    drag(2, [10]);

    expect(onReorder).not.toHaveBeenCalled();
    expect(spoken.announced.at(-1)).toBe("Item Nota 1043 solto na posição 3 de 4.");
  });

  test("as acoes do leitor de tela movem um passo e anunciam, e param nas pontas", () => {
    const onReorder = mock<(items: Note[]) => void>(() => {});
    const screen = render(<Notes onReorder={onReorder} />);
    const act_ = (label: string, name: string) =>
      act(() =>
        byLabel(screen, label)[0]!.props.onAccessibilityAction({ nativeEvent: { actionName: name } }),
      );

    act_("Reordenar Nota 1043", "moveEarlier");
    expect(onReorder.mock.calls[0]![0].map((note) => note.id)).toEqual([1041, 1043, 1042, 1044]);
    expect(spoken.announced).toEqual(["Item Nota 1043 movido para a posição 2 de 4."]);

    act_("Reordenar Nota 1041", "moveEarlier");
    act_("Reordenar Nota 1044", "moveLater");
    expect(onReorder).toHaveBeenCalledTimes(1);
  });

  test("controlada: com o estado no pai, a lista volta na ordem nova", () => {
    function Controlled() {
      const [items, setItems] = useState(NOTES);
      return <Notes items={items} onReorder={setItems} />;
    }
    const screen = render(<Controlled />);
    act(() =>
      byLabel(screen, "Reordenar Nota 1044")[0]!.props.onAccessibilityAction({
        nativeEvent: { actionName: "moveEarlier" },
      }),
    );
    expect(order(screen)).toEqual([
      "Clínica São Lucas",
      "Padaria Pão Quente",
      "Escola Aprender",
      "Oficina do Zé",
    ]);
  });

  test("desabilitada, nem o gesto nem as acoes mexem na ordem", () => {
    const onReorder = mock(() => {});
    const screen = render(<Notes disabled onReorder={onReorder} />);
    layOut(screen);
    const handle = byLabel(screen, "Reordenar Nota 1041")[0]!;

    expect(handle.props.accessibilityState).toEqual({ disabled: true });
    expect(handle.props.accessibilityActions).toEqual([]);
    expect(handle.props.onStartShouldSetResponder).toBeUndefined();
    act(() => handle.props.onAccessibilityAction({ nativeEvent: { actionName: "moveLater" } }));
    expect(onReorder).not.toHaveBeenCalled();
  });

  test("sem handle, quem arrasta e a View que recebe handleProps", () => {
    const onReorder = mock<(items: Note[]) => void>(() => {});
    const screen = render(
      <Notes
        handle={false}
        onReorder={onReorder}
        renderItem={(note, { handleProps }) => (
          <View {...handleProps} accessibilityLabel={`Linha ${note.id}`}>
            <Text>{note.client}</Text>
          </View>
        )}
      />,
    );
    expect(byLabel(screen, "Reordenar Nota 1041")).toHaveLength(0);
    layOut(screen);
    drag(0, [60]);
    expect(onReorder.mock.calls[0]![0].map((note) => note.id)).toEqual([1042, 1041, 1043, 1044]);
  });

  test("horizontal, o gesto le dx e as acoes falam de esquerda e direita", () => {
    const onReorder = mock<(items: Note[]) => void>(() => {});
    const screen = render(<Notes orientation="horizontal" onReorder={onReorder} />);
    expect(byRole(screen, "list")[0]!.props.className.split(" ")).toContain("flex-row");
    expect(byLabel(screen, "Reordenar Nota 1041")[0]!.props.accessibilityActions).toEqual([
      { name: "moveEarlier", label: "Mover para a esquerda" },
      { name: "moveLater", label: "Mover para a direita" },
    ]);
    layOut(screen, true);
    drag(0, [60]);
    expect(onReorder.mock.calls[0]![0].map((note) => note.id)).toEqual([1042, 1041, 1043, 1044]);
  });

  test("lista vazia monta sem alca e sem gesto", () => {
    const screen = render(<Notes items={[]} />);
    expect(byRole(screen, "list")).toHaveLength(1);
    expect(panResponders).toHaveLength(0);
    expect(textOf(screen)).toBe("");
  });
});
