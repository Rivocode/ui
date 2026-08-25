import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Tree, type TreeNode } from "../src/components/tree";
import { TreeSelect } from "../src/components/tree-select";

const ARVORE: TreeNode[] = [
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

function ArvoreControlada({ multiple = true, filter = "" }) {
  const [ids, setIds] = useState<string[]>([]);
  return (
    <RivoProvider scope="local">
      <Tree
        items={ARVORE}
        selected={ids}
        onSelectedChange={setIds}
        multiple={multiple}
        filter={filter}
        expanded={["financeiro", "operacao"]}
      />
      <p>Escolhidos: {ids.join(",") || "nenhum"}</p>
    </RivoProvider>
  );
}

test("marcar o pai marca todas as folhas debaixo dele", () => {
  render(<ArvoreControlada />);
  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: contas-pagar,contas-receber")).toBeDefined();
});

test("o pai com parte das filhas fica em estado misto", () => {
  render(<ArvoreControlada />);
  fireEvent.click(screen.getByText("Contas a pagar"));

  const parent = screen.getByText("Financeiro").closest("[role=treeitem]")!;
  expect(parent.getAttribute("aria-selected")).toBe("false");
  expect(parent.querySelector('[data-rc-check="indeterminate"]')).not.toBeNull();
});

test("desmarcar o pai limpa so as folhas dele", () => {
  render(<ArvoreControlada />);
  fireEvent.click(screen.getByText("Financeiro"));
  fireEvent.click(screen.getByText("Expedicao"));
  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: expedicao")).toBeDefined();
});

test("sem escolha multipla, so folha escolhe e a escolha troca", () => {
  render(<ArvoreControlada multiple={false} />);

  fireEvent.click(screen.getByText("Financeiro"));
  expect(screen.getByText("Escolhidos: nenhum")).toBeDefined();

  fireEvent.click(screen.getByText("Contas a pagar"));
  fireEvent.click(screen.getByText("Expedicao"));
  expect(screen.getByText("Escolhidos: expedicao")).toBeDefined();
});

test("a busca guarda o caminho ate quem casou", () => {
  render(<ArvoreControlada filter="expedicao" />);
  expect(screen.getByText("Operacao")).toBeDefined();
  expect(screen.getByText("Expedicao")).toBeDefined();
  expect(screen.queryByText("Contas a pagar")).toBeNull();
});

test("a arvore se anuncia com os papeis certos", () => {
  render(<ArvoreControlada />);
  expect(screen.getByRole("tree").getAttribute("aria-multiselectable")).toBe("true");
  expect(screen.getAllByRole("treeitem").length).toBe(5);
  expect(screen.getAllByRole("group").length).toBe(2);
});

test("as setas andam pelas linhas que estao na tela", () => {
  render(<ArvoreControlada />);
  const rows = screen.getAllByRole("treeitem");
  rows[0]!.focus();

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowDown" });
  expect(document.activeElement).toBe(rows[1]!);

  fireEvent.keyDown(screen.getByRole("tree"), { key: "ArrowLeft" });
  expect(document.activeElement).toBe(rows[0]!);
});

test("espaco escolhe pelo teclado", () => {
  render(<ArvoreControlada />);
  screen.getAllByRole("treeitem")[1]!.focus();
  fireEvent.keyDown(screen.getByRole("tree"), { key: " " });
  expect(screen.getByText("Escolhidos: contas-pagar")).toBeDefined();
});

test("o gatilho mostra os nomes enquanto eles cabem", () => {
  render(
    <RivoProvider scope="local">
      <TreeSelect items={ARVORE} defaultValue={["contas-pagar"]} />
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
      <TreeSelect items={ARVORE} defaultValue={["setor-que-sumiu"]} placeholder="Escolha" />
    </RivoProvider>,
  );
  expect(screen.getByText("Escolha")).toBeDefined();
});

test("sem escolha, o gatilho mostra o convite", () => {
  render(
    <RivoProvider scope="local">
      <TreeSelect items={ARVORE} placeholder="Escolha o setor" />
    </RivoProvider>,
  );
  expect(screen.getByText("Escolha o setor")).toBeDefined();
});
