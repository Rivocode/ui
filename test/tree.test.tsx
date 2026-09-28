import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Tree, type TreeNode } from "../src/components/tree";
import { TreeSelect } from "../src/components/tree-select";

const TREE: TreeNode[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    children: [
      { id: "contas-pagar", label: "Contas a pagar" },
      { id: "contas-receber", label: "Contas a receber" },
    ],
  },
  {
    id: "operacao",
    label: "Operacao",
    children: [{ id: "expedicao", label: "Expedicao" }],
  },
];

function ControlledTree({ multiple = true, filter = "" }) {
  const [ids, setIds] = useState<string[]>([]);
  return (
    <RivoProvider scope="local">
      <Tree
        items={TREE}
        value={ids}
        onValueChange={setIds}
        multiple={multiple}
        filter={filter}
        open={["financeiro", "operacao"]}
      />
      <p>Escolhidos: {ids.join(",") || "nenhum"}</p>
    </RivoProvider>
  );
}

test("checking the parent checks every leaf under it", () => {
  render(<ControlledTree />);
  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: contas-pagar,contas-receber")).toBeDefined();
});

test("a parent with some of its children checked is in a mixed state", () => {
  render(<ControlledTree />);
  fireEvent.click(screen.getByText("Contas a pagar"));

  const parent = screen.getByText("Financeiro").closest("[role=treeitem]")!;
  expect(parent.getAttribute("aria-selected")).toBe("false");
  expect(parent.querySelector('[data-rc-check="indeterminate"]')).not.toBeNull();
});

test("unchecking the parent clears only its leaves", () => {
  render(<ControlledTree />);
  fireEvent.click(screen.getByText("Financeiro"));
  fireEvent.click(screen.getByText("Expedicao"));
  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: expedicao")).toBeDefined();
});

test("without multiple selection, only a leaf selects and the selection swaps", () => {
  render(<ControlledTree multiple={false} />);

  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: nenhum")).toBeDefined();

  fireEvent.click(screen.getByText("Contas a pagar"));
  fireEvent.click(screen.getByText("Expedicao"));
  expect(screen.getByText("Escolhidos: expedicao")).toBeDefined();
});

test("the search keeps the path to whatever matched", () => {
  render(<ControlledTree filter="expedicao" />);
  expect(screen.getByText("Operacao")).toBeDefined();
  expect(screen.getByText("Expedicao")).toBeDefined();
  expect(screen.queryByText("Contas a pagar")).toBeNull();
});

test("the tree announces itself with the right roles", () => {
  render(<ControlledTree />);
  expect(screen.getByRole("tree").getAttribute("aria-multiselectable")).toBe("true");
  expect(screen.getAllByRole("treeitem").length).toBe(5);
  expect(screen.getAllByRole("group").length).toBe(2);
});

test("the arrows move through the rows on screen", () => {
  render(<ControlledTree />);
  const rows = screen.getAllByRole("treeitem");
  rows[0]!.focus();

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowDown" });
  expect(document.activeElement).toBe(rows[1]!);

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowLeft" });
  expect(document.activeElement).toBe(rows[0]!);
});

function RtlTree() {
  const [open, setOpen] = useState<string[]>(["financeiro"]);
  return (
    <RivoProvider scope="local" dir="rtl">
      <Tree items={TREE} open={open} onOpenChange={setOpen} />
    </RivoProvider>
  );
}

test("in rtl the opening arrow switches sides, and the indent grows from the edge where reading starts", () => {
  render(<RtlTree />);
  const finance = screen.getByText("Financeiro").closest("[role=treeitem]") as HTMLElement;
  const child = screen.getByText("Contas a pagar").closest("[role=treeitem]") as HTMLElement;

  expect(finance.style.paddingLeft).toBe("");
  expect(finance.style.paddingInlineStart).toBe("0.25rem");
  expect(child.style.paddingInlineStart).toBe("1.5rem");

  finance.focus();

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowRight" });
  expect(finance.getAttribute("aria-expanded")).toBe("false");

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowLeft" });
  expect(finance.getAttribute("aria-expanded")).toBe("true");

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowLeft" });
  expect(document.activeElement).toBe(
    screen.getByText("Contas a pagar").closest("[role=treeitem]"),
  );

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowRight" });
  expect(document.activeElement).toBe(finance);
});

test("space selects from the keyboard", () => {
  render(<ControlledTree />);
  screen.getAllByRole("treeitem")[1]!.focus();
  fireEvent.keyDown(screen.getByRole("tree"), { key: " " });
  expect(screen.getByText("Escolhidos: contas-pagar")).toBeDefined();
});

const WITH_LOCKED: TreeNode[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    children: [
      { id: "contas-pagar", label: "Contas a pagar" },
      { id: "contas-receber", label: "Contas a receber", disabled: true },
      { id: "caixa", label: "Caixa", disabled: true },
    ],
  },
  { id: "arquivo", label: "Arquivo", disabled: true },
];

function LockedTree({ multiple = true, initial = [] as string[] }) {
  const [ids, setIds] = useState<string[]>(initial);
  return (
    <RivoProvider scope="local">
      <Tree items={WITH_LOCKED} value={ids} onValueChange={setIds} multiple={multiple} open={["financeiro"]} />
      <p>Escolhidos: {ids.join(",") || "nenhum"}</p>
    </RivoProvider>
  );
}

test("Enter and space on a disabled node do not select, as the click does not", () => {
  render(<LockedTree multiple={false} />);
  const locked = screen.getByText("Contas a receber").closest("[role=treeitem]") as HTMLElement;
  locked.focus();

  fireEvent.keyDown(screen.getByRole("tree"), { key: "Enter" });
  expect(screen.getByText("Escolhidos: nenhum")).toBeDefined();
  fireEvent.keyDown(screen.getByRole("tree"), { key: " " });
  expect(screen.getByText("Escolhidos: nenhum")).toBeDefined();
});

test("checking and unchecking the parent does not touch disabled leaves", () => {
  render(<LockedTree initial={["caixa"]} />);

  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: caixa,contas-pagar")).toBeDefined();

  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: caixa")).toBeDefined();
});

test("search ignores accents and case, on both sides", () => {
  render(<ControlledTree filter="operação" />);
  expect(screen.getByText("Operacao")).toBeDefined();
  expect(screen.queryByText("Financeiro")).toBeNull();
});

test("the TreeSelect search finds an accented label when typing without accents", () => {
  const ACCENTED: TreeNode[] = [
    { id: "sp", label: "São Paulo" },
    { id: "rj", label: "Rio de Janeiro" },
  ];
  render(
    <RivoProvider scope="local">
      <TreeSelect items={ACCENTED} placeholder="Escolha a cidade" />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByText("Escolha a cidade"));
  fireEvent.change(screen.getByLabelText("Buscar na árvore"), { target: { value: "sao" } });

  expect(screen.getByText("São Paulo")).toBeDefined();
  expect(screen.queryByText("Rio de Janeiro")).toBeNull();
});

test("Home and End go to the first and last row on screen", () => {
  render(<ControlledTree />);
  const rows = screen.getAllByRole("treeitem");
  rows[2]!.focus();

  fireEvent.keyDown(screen.getByRole("tree"), { key: "End" });
  expect(document.activeElement).toBe(rows[rows.length - 1]!);

  fireEvent.keyDown(screen.getByRole("tree"), { key: "Home" });
  expect(document.activeElement).toBe(rows[0]!);
});

test("the row reached by Tab is the last one that had focus, and only it", () => {
  render(<ControlledTree />);
  const rows = screen.getAllByRole("treeitem");
  const tabbable = () => rows.filter((row) => row.tabIndex === 0);

  expect(tabbable()).toEqual([rows[0]!]);

  rows[0]!.focus();
  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowDown" });
  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowDown" });
  expect(document.activeElement).toBe(rows[2]!);
  expect(tabbable()).toEqual([rows[2]!]);
});

test("a closed branch hands Tab back to a row that is on screen", () => {
  function Closing() {
    const [open, setOpen] = useState<string[]>(["financeiro"]);
    return (
      <RivoProvider scope="local">
        <Tree items={TREE} open={open} onOpenChange={setOpen} />
        <button onClick={() => setOpen([])}>Fechar tudo</button>
      </RivoProvider>
    );
  }
  render(<Closing />);
  (screen.getByText("Contas a pagar").closest("[role=treeitem]") as HTMLElement).focus();

  fireEvent.click(screen.getByText("Fechar tudo"));
  const rows = screen.getAllByRole("treeitem");
  expect(rows.filter((row) => row.tabIndex === 0)).toEqual([rows[0]!]);
});

test("the trigger shows the names while they fit", () => {
  render(
    <RivoProvider scope="local">
      <TreeSelect items={TREE} defaultValue={["contas-pagar"]} />
    </RivoProvider>,
  );
  expect(screen.getByText("Contas a pagar")).toBeDefined();
});

test("past three, the trigger counts instead of listing", () => {
  const large: TreeNode[] = [
    {
      id: "todos",
      label: "Todos",
      children: Array.from({ length: 5 }, (_, index) => ({
        id: `setor-${index}`,
        label: `Setor ${index}`,
      })),
    },
  ];

  render(
    <RivoProvider scope="local">
      <TreeSelect items={large} defaultValue={large[0]!.children!.map((node) => node.id)} />
    </RivoProvider>,
  );
  expect(screen.getByText("5 escolhidos")).toBeDefined();
});

test("an id that no longer exists in the tree does not count as selected", () => {
  render(
    <RivoProvider scope="local">
      <TreeSelect items={TREE} defaultValue={["setor-que-sumiu"]} placeholder="Escolha" />
    </RivoProvider>,
  );
  expect(screen.getByText("Escolha")).toBeDefined();
});

test("without a selection, the trigger shows the prompt", () => {
  render(
    <RivoProvider scope="local">
      <TreeSelect items={TREE} placeholder="Escolha o setor" />
    </RivoProvider>,
  );
  expect(screen.getByText("Escolha o setor")).toBeDefined();
});

test("the list item leaves the role map, and the row is a direct child of the tree or the group", () => {
  render(<ControlledTree />);
  const rows = screen.getByRole("tree").querySelectorAll("[role=treeitem]");
  expect(rows.length).toBeGreaterThan(3);
  for (const row of rows) {
    const holder = row.parentElement!;
    expect(holder.tagName).toBe("LI");
    expect(holder.getAttribute("role")).toBe("none");
    expect(["tree", "group"]).toContain(holder.parentElement!.getAttribute("role")!);
  }
});

test("the expand button stretches the target from 16 to 24 pixels without growing the drawing", () => {
  render(<ControlledTree />);
  const toggle = screen.getAllByRole("button", { name: "Fechar", hidden: true })[0]!;
  const tokens = toggle.className.split(" ");
  expect(tokens).toContain("size-4");
  expect(tokens).toContain("relative");
  expect(tokens).toContain("after:absolute");
  expect(tokens).toContain("after:-inset-1");

  const box = toggle.parentElement!.querySelector('[role="checkbox"]')!;
  expect(box.className.split(" ")).toContain("after:hidden");
});

test("defaultOpen opens the branches on mount, and then the tree opens and closes on its own", () => {
  const opened: string[][] = [];
  render(
    <RivoProvider scope="local">
      <Tree items={TREE} defaultOpen={["financeiro"]} onOpenChange={(ids) => opened.push(ids)} />
    </RivoProvider>,
  );
  const finance = screen.getByText("Financeiro").closest("[role=treeitem]") as HTMLElement;
  expect(finance.getAttribute("aria-expanded")).toBe("true");

  finance.focus();
  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowLeft" });
  expect(finance.getAttribute("aria-expanded")).toBe("false");
  expect(opened).toEqual([[]]);
});
