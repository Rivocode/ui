import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { currencyShort } from "../src/shared/format";
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
 * Every Brazilian financial listing ends in "Total: R$ 248,3K", and until now
 * that line was a <div> below the table: without column widths, it never sat
 * under the value it sums, and with `maxHeight` it scrolled away.
 *
 * What these tests guard is the difference between the two: that the total
 * renders inside a real <tfoot>, with one cell per column, and that it counts
 * the filter and not the page.
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

/* --- the raw component --------------------------------------------------- */

test("TableFooter renders as <tfoot>, and not as one more body row", () => {
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
  // Inside the same <table>, and not in a sibling <div>: that is what gives it
  // the widths of the columns above.
  expect(foot!.closest("table")).toBe(container.querySelector("table"));
  expect(screen.getByText("Total")).toBeDefined();
});

test("the consumer's class beats the TableFooter one", () => {
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

/* --- the row DataTable produces ------------------------------------------ */

test("one column declaring total is enough for the footer to exist", () => {
  const { container } = table();

  const row = footRow(container);
  expect(row).not.toBeNull();
  // One cell per column, and not one stretched cell: that is the alignment the
  // <div> lost.
  expect(row!.querySelectorAll("td")).toHaveLength(COLUMNS.length);
  expect(row!.querySelectorAll("td")[2]!.textContent).toBe(currencyShort(sum(INVOICES)));
});

test("without a column with total, there is no footer at all", () => {
  const { container } = table({
    columns: [
      { key: "number", header: "Numero" },
      { key: "customer", header: "Cliente" },
    ],
  });

  expect(container.querySelector("tfoot")).toBeNull();
});

test("the total cell inherits the column's alignment and hide-on-mobile", () => {
  const { container } = table();
  const cells = footRow(container)!.querySelectorAll("td");

  expect(cells[1]!.className).toContain("max-sm:hidden");
  expect(cells[2]!.className).toContain("text-right");
});

test("the total counts what is left after the filter, and not the whole list", () => {
  const { container } = table({ filter: "Padaria" });

  expect(footRow(container)!.querySelectorAll("td")[2]!.textContent).toBe(currencyShort(1620));
});

test("turning the page does not change the total: it is the search's, not the page's", () => {
  const { container } = table({ pageSize: 2 });

  const total = currencyShort(sum(INVOICES));
  expect(footRow(container)!.querySelectorAll("td")[2]!.textContent).toBe(total);

  fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
  expect(footRow(container)!.querySelectorAll("td")[2]!.textContent).toBe(total);
});

test("with selection, the footer gets the empty cell of the checkbox column", () => {
  const { container } = table({ selectable: true });

  const cells = footRow(container)!.querySelectorAll("td");
  expect(cells).toHaveLength(COLUMNS.length + 1);
  expect(cells[0]!.textContent).toBe("");
});

test("loading shows no total, because there is nothing to sum", () => {
  const { container } = table({ data: undefined });

  expect(container.querySelector("tfoot")).toBeNull();
});

test("a search with no results shows no total under the notice", () => {
  const { container } = table({ filter: "prefeitura" });

  expect(screen.getByText("Nenhum resultado para a busca.")).toBeDefined();
  expect(container.querySelector("tfoot")).toBeNull();
});

test("with its own frame, the total sticks to the bottom as the header sticks to the top", () => {
  const { container } = table({ maxHeight: 200 });

  const foot = container.querySelector("tfoot")!;
  expect(foot.className.split(" ")).toContain("sticky");
  expect(foot.className.split(" ")).toContain("bottom-0");
  expect(foot.className).toContain("z-[var(--rc-z-sticky)]");
});

test("without its own frame there is nothing to stick to, and the footer does not stick", () => {
  const { container } = table();

  expect(container.querySelector("tfoot")!.className).not.toContain("sticky");
});

test("virtualized, the total enters the screen reader row count", () => {
  const { container } = table({ virtual: true, maxHeight: 200 });

  const rows = INVOICES.length;
  // Header + data rows + the totals row.
  expect(container.querySelector("table")!.getAttribute("aria-rowcount")).toBe(String(rows + 2));
  expect(footRow(container)!.getAttribute("aria-rowindex")).toBe(String(rows + 2));
});
