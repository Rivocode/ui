import { expect, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { DataTable, type Column } from "../src/components/data-table";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * Os invariantes velhos (erro vence carregando, vazio so depois da consulta,
 * guard do clique na linha) vivem em onda-c.test.tsx e continuam valendo sem
 * uma linha editada: e a prova de que o motor novo nao quebrou a API.
 * Aqui entram so as capacidades novas.
 */

type Invoice = { id: string; number: string; customer: string; amount: number };

const INVOICES: Invoice[] = [
  { id: "1", number: "4813", customer: "Clinica Sao Lucas", amount: 2480 },
  { id: "2", number: "4814", customer: "Transportes Cabo Branco", amount: 940 },
  { id: "3", number: "4815", customer: "Padaria Aurora", amount: 1620 },
  { id: "4", number: "4816", customer: "Otica Central", amount: 310 },
  { id: "5", number: "4817", customer: "Acougue do Ze", amount: 75 },
];

const COLUMNS: Column<Invoice>[] = [
  { key: "number", header: "Numero", sortable: true },
  { key: "customer", header: "Cliente" },
  { key: "amount", header: "Valor", align: "right", sortable: true },
];

function table(props: Partial<React.ComponentProps<typeof DataTable<Invoice>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={props.columns ?? COLUMNS}
        rowKey={(nota) => nota.id}
        {...props}
      />
    </RivoProvider>,
  );
}

/** Os textos da primeira celula de cada linha do corpo, na ordem visivel. */
function firstColumn(container: HTMLElement) {
  return [...container.querySelectorAll("tbody tr")].map(
    (row) => row.querySelector("td")?.textContent ?? "",
  );
}

test("clicar no cabecalho ordena, clicar de novo inverte, e a terceira vez desfaz", () => {
  const { container } = table();
  const header = screen.getByRole("button", { name: /valor/i });

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4817", "4816", "4814", "4815", "4813"]);

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4813", "4815", "4814", "4816", "4817"]);

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4813", "4814", "4815", "4816", "4817"]);
});

test("o th anuncia a direcao com aria-sort", () => {
  table();
  const th = screen.getByRole("columnheader", { name: /valor/i });
  expect(th.getAttribute("aria-sort")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(th.getAttribute("aria-sort")).toBe("ascending");

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(th.getAttribute("aria-sort")).toBe("descending");
});

test("coluna sem sortable nao vira botao", () => {
  table();
  expect(screen.queryByRole("button", { name: /cliente/i })).toBeNull();
});

test("a coluna com cell usa value para ordenar", () => {
  const columns: Column<Invoice>[] = [
    { key: "number", header: "Numero" },
    {
      key: "amount",
      header: "Valor",
      sortable: true,
      value: (nota) => nota.amount,
      cell: (nota) => <span>{`R$ ${nota.amount}`}</span>,
    },
  ];
  const { container } = table({ columns: columns });

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(firstColumn(container)).toEqual(["4817", "4816", "4814", "4815", "4813"]);
});

test("o filtro acha sem acento e sem caixa", () => {
  const { container } = table({ filter: "ótica" });
  expect(firstColumn(container)).toEqual(["4816"]);
});

test("o filtro sem resultado explica, sem roubar o EmptyState da consulta vazia", () => {
  table({
    filter: "zzz",
    empty: { title: "Nenhuma nota", description: "Emita a primeira." },
  });
  expect(screen.getByText(/nenhum resultado/i)).toBeDefined();
  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("pageSize corta a lista e o rodape conta o todo", () => {
  const { container } = table({ pageSize: 2 });
  expect(firstColumn(container)).toEqual(["4813", "4814"]);
  expect(screen.getByText(/1–2 de 5/)).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(firstColumn(container)).toEqual(["4815", "4816"]);
  expect(screen.getByText(/3–4 de 5/)).toBeDefined();
});

test("sem pageSize nao ha rodape", () => {
  table();
  expect(screen.queryByRole("navigation")).toBeNull();
});

test("filtrar volta para a primeira pagina", async () => {
  const { container, rerender } = table({ pageSize: 2 });
  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(firstColumn(container)).toEqual(["4815", "4816"]);

  rerender(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={COLUMNS}
        rowKey={(nota) => nota.id}
        pageSize={2}
        filter="48"
      />
    </RivoProvider>,
  );
  // O reset de pagina do motor sai numa microtask; na app ele ja aconteceu
  // antes de qualquer olho ver, aqui o teste espera a fila esvaziar.
  await act(async () => {});
  expect(firstColumn(container)).toEqual(["4813", "4814"]);
});

test("selecionar uma linha devolve a chave do rowKey", () => {
  let selecionadas: string[] = [];
  table({ selectable: true, onSelectedChange: (keys) => (selecionadas = keys) });

  const row = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(selecionadas).toEqual(["3"]);
});

test("o checkbox do cabecalho seleciona a pagina visivel, nao o mundo", () => {
  let selecionadas: string[] = [];
  table({
    selectable: true,
    pageSize: 2,
    onSelectedChange: (keys) => (selecionadas = keys),
  });

  fireEvent.click(screen.getByRole("checkbox", { name: /selecionar todas/i }));
  expect(selecionadas.toSorted()).toEqual(["1", "2"]);
});

test("selecao controlada obedece a prop", () => {
  table({ selectable: true, selected: ["2"] });

  const row = screen.getByText("Transportes Cabo Branco").closest("tr")!;
  const checkbox = within(row).getByRole("checkbox");
  expect(checkbox.getAttribute("aria-checked")).toBe("true");
});

test("linha clicavel e selecao convivem: o clique no checkbox nao abre a linha", () => {
  let aberta: Invoice | undefined;
  table({ selectable: true, onRowClick: (nota) => (aberta = nota) });

  const row = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(aberta).toBeUndefined();

  fireEvent.click(screen.getByText("Padaria Aurora"));
  expect(aberta?.id).toBe("3");
});

test("a coluna que ordena sai na mesma caixa da que nao ordena", () => {
  // O th ja pede uppercase, e a folha do navegador zera text-transform em
  // controle de formulario: a coluna com sortable renderiza um button dentro,
  // e a linha saia com caixa misturada - "Numero" ao lado de "CLIENTE".
  const { container } = table();

  const header = container.querySelector("th") as HTMLElement;
  const botao = container.querySelector("th button") as HTMLElement;

  expect(header.className).toContain("uppercase");
  expect(botao.className).toContain("uppercase");
});
