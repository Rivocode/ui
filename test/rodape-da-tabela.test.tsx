import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { currencyShort } from "../src/lib/format";
import { DataTable, type Column } from "../src/components/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/table";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * Toda listagem financeira brasileira termina em "Total: R$ 248,3K", e ate
 * aqui essa linha era uma <div> embaixo da tabela: sem largura de coluna, ela
 * nunca ficava debaixo do valor que soma, e com `maxHeight` rolava embora.
 *
 * O que estes testes guardam e a diferenca entre as duas: que o total sai
 * dentro de um <tfoot> de verdade, com uma celula por coluna, e que ele conta
 * o filtro e nao a pagina.
 */

type Invoice = { id: string; number: string; customer: string; amount: number };

const INVOICES: Invoice[] = [
  { id: "1", number: "4813", customer: "Clinica Sao Lucas", amount: 2480 },
  { id: "2", number: "4814", customer: "Transportes Cabo Branco", amount: 940 },
  { id: "3", number: "4815", customer: "Padaria Aurora", amount: 1620 },
  { id: "4", number: "4816", customer: "Otica Central", amount: 310 },
  { id: "5", number: "4817", customer: "Acougue do Ze", amount: 75 },
];

const sum = (rows: Invoice[]) => rows.reduce((total, row) => total + row.amount, 0);

const COLUMNS: Column<Invoice>[] = [
  { key: "number", header: "Numero", total: () => "Total" },
  { key: "customer", header: "Cliente", hideOnMobile: true },
  {
    key: "amount",
    header: "Valor",
    align: "right",
    sortable: true,
    total: (rows) => currencyShort(sum(rows)),
  },
];

function table(props: Partial<React.ComponentProps<typeof DataTable<Invoice>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={props.columns ?? COLUMNS}
        rowKey={(invoice) => invoice.id}
        {...props}
      />
    </RivoProvider>,
  );
}

const footRow = (container: HTMLElement) => container.querySelector("tfoot tr");

/* --- a peca crua --------------------------------------------------------- */

test("o TableFooter sai como <tfoot>, e nao como mais uma linha do corpo", () => {
  const { container } = render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Clinica Sao Lucas</TableCell>
          <TableCell>R$ 2,5K</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>R$ 2,5K</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );

  const foot = container.querySelector("tfoot");
  expect(foot).not.toBeNull();
  // Dentro da mesma <table>, e nao numa <div> irma: e isso que da a ele a
  // largura das colunas de cima.
  expect(foot!.closest("table")).toBe(container.querySelector("table"));
  expect(screen.getByText("Total")).toBeDefined();
});

test("a classe de quem usa vence a do TableFooter", () => {
  const { container } = render(
    <Table>
      <TableFooter className="bg-surface-raised">
        <TableRow>
          <TableCell>Total</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );

  const foot = container.querySelector("tfoot")!;
  expect(foot.className).toContain("bg-surface-raised");
  expect(foot.className).not.toContain("bg-surface ");
});

/* --- a linha que o DataTable produz -------------------------------------- */

test("basta uma coluna declarar total para o rodape existir", () => {
  const { container } = table();

  const row = footRow(container);
  expect(row).not.toBeNull();
  // Uma celula por coluna, e nao uma celula esticada: e o alinhamento que a
  // <div> perdia.
  expect(row!.querySelectorAll("td")).toHaveLength(COLUMNS.length);
  expect(row!.querySelectorAll("td")[2]!.textContent).toBe(currencyShort(sum(INVOICES)));
});

test("sem coluna com total, nao ha rodape nenhum", () => {
  const { container } = table({
    columns: [
      { key: "number", header: "Numero" },
      { key: "customer", header: "Cliente" },
    ],
  });

  expect(container.querySelector("tfoot")).toBeNull();
});

test("a celula do total herda o alinhamento e o esconde-no-celular da coluna", () => {
  const { container } = table();
  const cells = footRow(container)!.querySelectorAll("td");

  expect(cells[1]!.className).toContain("max-sm:hidden");
  expect(cells[2]!.className).toContain("text-right");
});

test("o total conta o que sobrou do filtro, e nao a lista inteira", () => {
  const { container } = table({ filter: "Padaria" });

  expect(footRow(container)!.querySelectorAll("td")[2]!.textContent).toBe(currencyShort(1620));
});

test("virar de pagina nao muda o total: ele e o da busca, nao o da pagina", () => {
  const { container } = table({ pageSize: 2 });

  const total = currencyShort(sum(INVOICES));
  expect(footRow(container)!.querySelectorAll("td")[2]!.textContent).toBe(total);

  fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
  expect(footRow(container)!.querySelectorAll("td")[2]!.textContent).toBe(total);
});

test("com selecao, o rodape ganha a celula vazia da coluna de marcar", () => {
  const { container } = table({ selectable: true });

  const cells = footRow(container)!.querySelectorAll("td");
  expect(cells).toHaveLength(COLUMNS.length + 1);
  expect(cells[0]!.textContent).toBe("");
});

test("carregando nao mostra total, porque nao ha o que somar", () => {
  const { container } = table({ data: undefined });

  expect(container.querySelector("tfoot")).toBeNull();
});

test("busca sem resultado nao mostra total debaixo do aviso", () => {
  const { container } = table({ filter: "prefeitura" });

  expect(screen.getByText("Nenhum resultado para a busca.")).toBeDefined();
  expect(container.querySelector("tfoot")).toBeNull();
});

test("com moldura propria, o total gruda embaixo como o cabecalho gruda em cima", () => {
  const { container } = table({ maxHeight: 200 });

  const foot = container.querySelector("tfoot")!;
  expect(foot.className).toContain("sticky");
  expect(foot.className).toContain("bottom-0");
  expect(foot.className).toContain("z-[var(--rc-z-sticky)]");
});

test("sem moldura propria nao ha o que grudar, e o rodape nao gruda", () => {
  const { container } = table();

  expect(container.querySelector("tfoot")!.className).not.toContain("sticky");
});

test("virtualizada, o total entra na contagem de linhas do leitor de tela", () => {
  const { container } = table({ virtual: true, maxHeight: 200 });

  const rows = INVOICES.length;
  // Cabecalho + linhas de dado + a linha de totais.
  expect(container.querySelector("table")!.getAttribute("aria-rowcount")).toBe(String(rows + 2));
  expect(footRow(container)!.getAttribute("aria-rowindex")).toBe(String(rows + 2));
});
