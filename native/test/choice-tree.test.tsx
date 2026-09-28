import { describe, expect, mock, test } from "bun:test";

import type { TreeNode } from "../src/tree";
import { TreeSelect } from "../src/tree-select";
import { act, byLabel, byRole, render, textOf } from "./helpers";

const PLAN: TreeNode[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    children: [
      { id: "pagar", label: "Contas a pagar" },
      { id: "receber", label: "Contas a receber" },
    ],
  },
  { id: "marketing", label: "Marketing" },
];

/* The trigger is the button that carries the piece's name; the open sheet puts
   the same name on the tree's list, which is `list` and not `button`. */
const trigger = (screen: ReturnType<typeof render>) =>
  byRole(screen, "button").find((node) => node.props.accessibilityLabel === "Centro de custo")!;

/* `Aplicar` is the only accent-painted button in the sheet: the dimmed
   backdrop is `bg-overlay`, and the tree rows have no background of their own. */
const apply = (screen: ReturnType<typeof render>) =>
  byRole(screen, "button").find((node) => node.props.className?.includes("bg-accent "))!;

describe("TreeSelect", () => {
  test("the trigger summarizes with the same words as Select, and counts only the leaves that exist", () => {
    const one = render(
      <TreeSelect
        items={PLAN}
        value={["pagar"]}
        onValueChange={() => {}}
        label="Centro de custo"
      />,
    );
    // With a single choice its name is what counts, as in the other two's `summarize`.
    expect(textOf(one)).toContain("Contas a pagar");
    expect(trigger(one).props.accessibilityValue.text).toBe("Contas a pagar");

    const many = render(
      <TreeSelect
        items={PLAN}
        value={["pagar", "receber", "sumiu"]}
        onValueChange={() => {}}
        label="Centro de custo"
      />,
    );
    // "sumiu" is not a leaf of this tree: counting three would be the trigger lying.
    expect(trigger(many).props.accessibilityValue.text).toBe("2 selecionados");
  });

  test("the sheet opens with the tree inside, and the footer counts the draft", () => {
    const screen = render(
      <TreeSelect items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    act(() => trigger(screen).props.onPress());
    expect(textOf(screen)).toContain("Financeiro");
    expect(textOf(screen)).toContain("Nada escolhido");

    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    // The footer count moves while the person checks, without anyone confirming.
    expect(textOf(screen)).toContain("2 selecionados");
  });

  test("checking does not confirm, and leaving through the side gives up", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <TreeSelect items={PLAN} value={[]} onValueChange={onValueChange} label="Centro de custo" />,
    );

    act(() => trigger(screen).props.onPress());
    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => byLabel(screen, "Fechar")[0].props.onPress());
    // Tapping the dimmed backdrop is the gesture of someone who changed their mind: nothing came out.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("applying delivers the leaves and closes the sheet", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <TreeSelect items={PLAN} value={[]} onValueChange={onValueChange} label="Centro de custo" />,
    );

    act(() => trigger(screen).props.onPress());
    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    act(() => apply(screen).props.onPress());

    // The leaves, and never the parent's id - the web rule carries over whole.
    expect(onValueChange).toHaveBeenCalledWith(["pagar", "receber"]);
    // Sheet closed: the tree left the screen.
    expect(textOf(screen)).not.toContain("Contas a receber");
  });

  test("the discarded draft does not come back on the next opening", () => {
    const screen = render(
      <TreeSelect items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    act(() => trigger(screen).props.onPress());
    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    expect(textOf(screen)).toContain("2 selecionados");

    act(() => byLabel(screen, "Fechar")[0].props.onPress());
    act(() => trigger(screen).props.onPress());
    expect(textOf(screen)).toContain("Nada escolhido");
  });

  test("disabled does not open the sheet", () => {
    const screen = render(
      <TreeSelect
        items={PLAN}
        value={[]}
        onValueChange={() => {}}
        label="Centro de custo"
        disabled
      />,
    );
    expect(trigger(screen).props.disabled).toBe(true);
    expect(textOf(screen)).not.toContain("Financeiro");
  });
});
