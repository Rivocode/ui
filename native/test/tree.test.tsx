import { describe, expect, mock, test } from "bun:test";

import { RivoProvider } from "../src/provider";
import { Tree, leavesOf, type TreeNode } from "../src/tree";
import { act, byLabel, byRole, render, textOf } from "./helpers";

const PLAN: TreeNode[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    children: [
      {
        id: "pagar",
        label: "Contas a pagar",
        children: [
          { id: "fornecedores", label: "Fornecedores" },
          { id: "impostos", label: "Impostos" },
        ],
      },
      { id: "receber", label: "Contas a receber" },
    ],
  },
  { id: "marketing", label: "Marketing" },
];

/** The branch on the current screen, by the spoken name the piece assembles. */
const branch = (screen: ReturnType<typeof render>, label: string) =>
  byRole(screen, "button").find((node) =>
    String(node.props.accessibilityLabel ?? "").startsWith(label),
  )!;

describe("Tree", () => {
  test("the root shows a single level, and the branch says how many leaves it has", () => {
    const screen = render(
      <Tree items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    expect(textOf(screen)).toContain("Financeiro");
    expect(textOf(screen)).toContain("Marketing");
    // The inner level is not on screen: that is the difference from the web.
    expect(textOf(screen)).not.toContain("Contas a pagar");

    expect(byLabel(screen, "Financeiro, 3 itens").length).toBe(1);
    expect(byRole(screen, "list")[0].props.accessibilityLabel).toBe("Centro de custo");
  });

  test("tapping a branch pushes the level, and the header goes back one at a time", () => {
    const screen = render(
      <Tree items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    act(() => branch(screen, "Financeiro").props.onPress());
    expect(textOf(screen)).toContain("Contas a pagar");
    expect(textOf(screen)).not.toContain("Marketing");
    expect(byRole(screen, "list")[0].props.accessibilityLabel).toBe("Financeiro");
    expect(byLabel(screen, "Voltar para Centro de custo").length).toBe(1);

    act(() => branch(screen, "Contas a pagar").props.onPress());
    expect(textOf(screen)).toContain("Fornecedores");
    // The whole path, in the order it was walked.
    expect(textOf(screen)).toContain("Financeiro › Contas a pagar");
    expect(byLabel(screen, "Voltar para Financeiro").length).toBe(1);

    // Back goes up ONE level, and does not return to the root.
    act(() => byLabel(screen, "Voltar para Financeiro")[0].props.onPress());
    expect(textOf(screen)).toContain("Contas a receber");
    expect(byLabel(screen, "Voltar para Centro de custo").length).toBe(1);
  });

  test("it is controlled: choosing does not change the screen on its own, it notifies the owner", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree items={PLAN} value={[]} onValueChange={onValueChange} label="Centro de custo" />,
    );

    const leaf = byRole(screen, "button").find(
      (node) => node.props.accessibilityState?.selected === false,
    )!;
    act(() => leaf.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["marketing"]);
    // Nothing changed on screen: whoever keeps the value is outside.
    expect(
      byRole(screen, "button").filter((node) => node.props.accessibilityState?.selected === true)
        .length,
    ).toBe(0);
  });

  test("without multiple, the choice replaces instead of adding, and a branch does not choose", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        value={["marketing"]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    // A branch has no checkbox when the choice is single: it only navigates.
    expect(byRole(screen, "checkbox").length).toBe(0);

    const chosen = byRole(screen, "button").find(
      (node) => node.props.accessibilityState?.selected === true,
    )!;
    act(() => chosen.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  test("multiple: checking the branch checks all the leaves under it", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        multiple
        value={[]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    // The three leaves, and never the parent's id: the leaf is what counts.
    expect(onValueChange).toHaveBeenCalledWith(["fornecedores", "impostos", "receber"]);
  });

  test("multiple: unchecking the full branch removes only its leaves", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        multiple
        value={["fornecedores", "impostos", "receber", "marketing"]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    const box = byLabel(screen, "Marcar tudo em Financeiro")[0];
    expect(box.props.accessibilityState.checked).toBe(true);

    act(() => box.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["marketing"]);
  });

  test("multiple: a half-checked branch announces the mixed state, as on the web", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        multiple
        value={["fornecedores"]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    const box = byLabel(screen, "Marcar tudo em Financeiro")[0];
    expect(box.props.accessibilityState.checked).toBe("mixed");
    expect(textOf(screen)).not.toContain("1 de 3 escolhidos");
    expect(byLabel(screen, "Financeiro, 3 itens, 1 escolhido").length).toBe(1);

    act(() => box.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["fornecedores", "impostos", "receber"]);
  });

  test("multiple: a branch with nothing checked and a full branch are not mixed", () => {
    const empty = render(
      <Tree items={PLAN} multiple value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );
    expect(
      byLabel(empty, "Marcar tudo em Financeiro")[0].props.accessibilityState.checked,
    ).toBe(false);

    const full = render(
      <Tree
        items={PLAN}
        multiple
        value={["fornecedores", "impostos", "receber"]}
        onValueChange={() => {}}
        label="Centro de custo"
      />,
    );
    expect(byLabel(full, "Marcar tudo em Financeiro")[0].props.accessibilityState.checked).toBe(
      true,
    );
  });

  test("multiple: the leaf is a checkbox, and toggles on its own", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        multiple
        value={["marketing"]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    const leaf = byRole(screen, "checkbox").find(
      (node) => node.props.accessibilityState?.checked === true,
    )!;
    act(() => leaf.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  test("a disabled branch does not open and its checkbox does not check", () => {
    const onValueChange = mock(() => {});
    const items: TreeNode[] = [
      {
        id: "raiz",
        label: "Bloqueado",
        disabled: true,
        children: [{ id: "folha", label: "Folha" }],
      },
    ];
    const screen = render(
      <Tree items={items} multiple value={[]} onValueChange={onValueChange} label="Conta" />,
    );

    const row = branch(screen, "Bloqueado");
    expect(row.props.disabled).toBe(true);
    expect(byLabel(screen, "Marcar tudo em Bloqueado")[0].props.disabled).toBe(true);
  });

  test("the path shrinks on its own when the branch vanishes from the new tree", () => {
    const screen = render(
      <Tree items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    act(() => branch(screen, "Financeiro").props.onPress());
    act(() => branch(screen, "Contas a pagar").props.onPress());
    expect(textOf(screen)).toContain("Fornecedores");

    // The query was redone and the inner branch no longer exists.
    const trimmed: TreeNode[] = [
      {
        id: "financeiro",
        label: "Financeiro",
        children: [{ id: "receber", label: "Contas a receber" }],
      },
    ];
    // With the provider outside, the way `render` mounts: by changing the root,
    // React would remount the tree and the path would be lost for another reason.
    act(() => {
      screen.update(
        <RivoProvider>
          <Tree items={trimmed} value={[]} onValueChange={() => {}} label="Centro de custo" />
        </RivoProvider>,
      );
    });

    // The path stops at the last branch that still exists, instead of showing a
    // level the previous response had and this one does not.
    expect(textOf(screen)).toContain("Contas a receber");
    expect(byLabel(screen, "Voltar para Centro de custo").length).toBe(1);
  });

  test("an empty level explains that it is empty", () => {
    const items: TreeNode[] = [];
    const screen = render(<Tree items={items} value={[]} onValueChange={() => {}} label="Conta" />);
    expect(textOf(screen)).toContain("Nada dentro deste nível.");
  });
});

describe("leavesOf", () => {
  test("a node without children is the leaf itself, and a branch delivers the ones below", () => {
    expect(leavesOf({ id: "só", label: "Só" })).toEqual(["só"]);
    expect(leavesOf(PLAN[0]!)).toEqual(["fornecedores", "impostos", "receber"]);
    // An empty children list is a leaf, not a branch with nothing inside.
    expect(leavesOf({ id: "vazio", label: "Vazio", children: [] })).toEqual(["vazio"]);
  });
});
