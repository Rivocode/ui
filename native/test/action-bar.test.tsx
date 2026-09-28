import { beforeEach, describe, expect, mock, test } from "bun:test";
import { AccessibilityInfo } from "react-native";

import { ActionBar, Button } from "../src";
import { act, byLabel, byRole, render, textOf } from "./helpers";

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

beforeEach(() => spoken.clearAnnouncements());

describe("ActionBar", () => {
  test("with zero selected there is no bar, and nothing is announced", () => {
    const screen = render(<ActionBar count={0} onClear={() => {}} />);
    expect(byRole(screen, "button")).toHaveLength(0);
    expect(byLabel(screen, "Ações em lote")).toHaveLength(0);
    expect(textOf(screen)).toBe("");
    expect(spoken.announced).toEqual([]);
  });

  test("above zero it says the count with the right plural, in the named region", () => {
    const screen = render(<ActionBar count={1} />);
    expect(textOf(screen)).toContain("1 selecionado");
    expect(byLabel(screen, "Ações em lote")).toHaveLength(1);

    act(() => screen.update(<ActionBar count={1234} />));
    expect(textOf(screen)).toContain("1.234 selecionados");
  });

  test("the count is announced, and so is clearing", () => {
    const screen = render(<ActionBar count={2} />);
    expect(spoken.announced).toEqual(["2 selecionados"]);

    act(() => screen.update(<ActionBar count={3} />));
    act(() => screen.update(<ActionBar count={0} />));
    expect(spoken.announced).toEqual(["2 selecionados", "3 selecionados", "Seleção limpa"]);
  });

  test("\"Limpar seleção\" only exists with onClear, and calls the controller", () => {
    const without = render(<ActionBar count={2} />);
    expect(byLabel(without, "Limpar seleção")).toHaveLength(0);
    expect(textOf(without)).not.toContain("Limpar seleção");

    const onClear = mock(() => {});
    const screen = render(
      <ActionBar count={2} onClear={onClear}>
        <Button size="sm" variant="secondary">
          Exportar
        </Button>
      </ActionBar>,
    );
    const buttons = byRole(screen, "button");
    expect(buttons).toHaveLength(2);
    act(() => buttons[1]!.props.onPress());
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test("sits above the bottom safe area the mounter reports", () => {
    const bottomOf = (inset?: number) => {
      const screen = render(<ActionBar count={1} bottomInset={inset} />);
      const style = screen.root.findAll(
        (node) => typeof node.type === "string" && node.props?.style?.bottom !== undefined,
      )[0]!.props.style as { bottom: number; pointerEvents: string };
      expect(style.pointerEvents).toBe("box-none");
      return style.bottom;
    };

    expect(bottomOf()).toBe(16);
    expect(bottomOf(34)).toBe(50);
  });

  test("labels names the item in both places: on screen and in the announcement", () => {
    const screen = render(
      <ActionBar
        count={2}
        onClear={() => {}}
        labels={{
          selected: (count) => (count === 1 ? "1 nota selecionada" : `${count} notas selecionadas`),
          clear: "Desmarcar",
        }}
      />,
    );
    expect(textOf(screen)).toContain("2 notas selecionadas");
    expect(textOf(screen)).toContain("Desmarcar");
    expect(spoken.announced).toEqual(["2 notas selecionadas"]);
  });
});
