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

test("marcar o pai marca todas as folhas debaixo dele", () => {
  render(<ControlledTree />);
  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: contas-pagar,contas-receber")).toBeDefined();
});

test("o pai com parte das filhas fica em estado misto", () => {
  render(<ControlledTree />);
  fireEvent.click(screen.getByText("Contas a pagar"));

  const parent = screen.getByText("Financeiro").closest("[role=treeitem]")!;
  expect(parent.getAttribute("aria-selected")).toBe("false");
  expect(parent.querySelector('[data-rc-check="indeterminate"]')).not.toBeNull();
});

test("desmarcar o pai limpa so as folhas dele", () => {
  render(<ControlledTree />);
  fireEvent.click(screen.getByText("Financeiro"));
  fireEvent.click(screen.getByText("Expedicao"));
  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: expedicao")).toBeDefined();
});

test("sem escolha multipla, so folha escolhe e a escolha troca", () => {
  render(<ControlledTree multiple={false} />);

  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: nenhum")).toBeDefined();

  fireEvent.click(screen.getByText("Contas a pagar"));
  fireEvent.click(screen.getByText("Expedicao"));
  expect(screen.getByText("Escolhidos: expedicao")).toBeDefined();
});

test("a busca guarda o caminho ate quem casou", () => {
  render(<ControlledTree filter="expedicao" />);
  expect(screen.getByText("Operacao")).toBeDefined();
  expect(screen.getByText("Expedicao")).toBeDefined();
  expect(screen.queryByText("Contas a pagar")).toBeNull();
});

test("a arvore se anuncia com os papeis certos", () => {
  render(<ControlledTree />);
  expect(screen.getByRole("tree").getAttribute("aria-multiselectable")).toBe("true");
  expect(screen.getAllByRole("treeitem").length).toBe(5);
  expect(screen.getAllByRole("group").length).toBe(2);
});

test("as setas andam pelas linhas que estao na tela", () => {
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

test("em rtl a seta que abre troca de lado, e o recuo cresce da borda que comeca a leitura", () => {
  render(<RtlTree />);
  const financeiro = screen.getByText("Financeiro").closest("[role=treeitem]") as HTMLElement;
  const filha = screen.getByText("Contas a pagar").closest("[role=treeitem]") as HTMLElement;

  expect(financeiro.style.paddingLeft).toBe("");
  expect(financeiro.style.paddingInlineStart).toBe("0.25rem");
  expect(filha.style.paddingInlineStart).toBe("1.5rem");

  financeiro.focus();

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowRight" });
  expect(financeiro.getAttribute("aria-expanded")).toBe("false");

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowLeft" });
  expect(financeiro.getAttribute("aria-expanded")).toBe("true");

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowLeft" });
  expect(document.activeElement).toBe(
    screen.getByText("Contas a pagar").closest("[role=treeitem]"),
  );

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowRight" });
  expect(document.activeElement).toBe(financeiro);
});

test("espaco escolhe pelo teclado", () => {
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

test("Enter e espaco num no desabilitado nao escolhem, como o clique nao escolhe", () => {
  render(<LockedTree multiple={false} />);
  const locked = screen.getByText("Contas a receber").closest("[role=treeitem]") as HTMLElement;
  locked.focus();

  fireEvent.keyDown(screen.getByRole("tree"), { key: "Enter" });
  expect(screen.getByText("Escolhidos: nenhum")).toBeDefined();
  fireEvent.keyDown(screen.getByRole("tree"), { key: " " });
  expect(screen.getByText("Escolhidos: nenhum")).toBeDefined();
});

test("marcar e desmarcar o pai nao mexe nas folhas desabilitadas", () => {
  render(<LockedTree initial={["caixa"]} />);

  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: caixa,contas-pagar")).toBeDefined();

  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: caixa")).toBeDefined();
});

test("a busca ignora acento e caixa, dos dois lados", () => {
  render(<ControlledTree filter="operação" />);
  expect(screen.getByText("Operacao")).toBeDefined();
  expect(screen.queryByText("Financeiro")).toBeNull();
});

test("a busca do TreeSelect acha o rotulo com acento digitando sem acento", () => {
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

test("Home e End levam a primeira e a ultima linha da tela", () => {
  render(<ControlledTree />);
  const rows = screen.getAllByRole("treeitem");
  rows[2]!.focus();

  fireEvent.keyDown(screen.getByRole("tree"), { key: "End" });
  expect(document.activeElement).toBe(rows[rows.length - 1]!);

  fireEvent.keyDown(screen.getByRole("tree"), { key: "Home" });
  expect(document.activeElement).toBe(rows[0]!);
});

test("a linha que entra pelo Tab e a ultima que teve foco, e so ela", () => {
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

test("o galho fechado devolve o Tab para uma linha que esta na tela", () => {
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

test("o gatilho mostra os nomes enquanto eles cabem", () => {
  render(
    <RivoProvider scope="local">
      <TreeSelect items={TREE} defaultValue={["contas-pagar"]} />
    </RivoProvider>,
  );
  expect(screen.getByText("Contas a pagar")).toBeDefined();
});

test("passando de tres, o gatilho conta em vez de listar", () => {
  const grande: TreeNode[] = [
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
      <TreeSelect items={grande} defaultValue={grande[0]!.children!.map((node) => node.id)} />
    </RivoProvider>,
  );
  expect(screen.getByText("5 escolhidos")).toBeDefined();
});

test("id que nao existe mais na arvore nao conta como escolha", () => {
  render(
    <RivoProvider scope="local">
      <TreeSelect items={TREE} defaultValue={["setor-que-sumiu"]} placeholder="Escolha" />
    </RivoProvider>,
  );
  expect(screen.getByText("Escolha")).toBeDefined();
});

test("sem escolha, o gatilho mostra o convite", () => {
  render(
    <RivoProvider scope="local">
      <TreeSelect items={TREE} placeholder="Escolha o setor" />
    </RivoProvider>,
  );
  expect(screen.getByText("Escolha o setor")).toBeDefined();
});

test("o item de lista sai do mapa de papeis, e a linha fica filha direta da arvore ou do grupo", () => {
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

test("o botao de abrir estica o alvo de 16 para 24 pixels sem crescer o desenho", () => {
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

test("defaultOpen abre os galhos na montagem, e depois a arvore abre e fecha sozinha", () => {
  const opened: string[][] = [];
  render(
    <RivoProvider scope="local">
      <Tree items={TREE} defaultOpen={["financeiro"]} onOpenChange={(ids) => opened.push(ids)} />
    </RivoProvider>,
  );
  const financeiro = screen.getByText("Financeiro").closest("[role=treeitem]") as HTMLElement;
  expect(financeiro.getAttribute("aria-expanded")).toBe("true");

  financeiro.focus();
  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowLeft" });
  expect(financeiro.getAttribute("aria-expanded")).toBe("false");
  expect(opened).toEqual([[]]);
});
