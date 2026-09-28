import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { LineChart, Line } from "recharts";

import { ChartContainer } from "../src/chart/chart";
import { DataTable, type Column } from "../src/components/data-table";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * Three texts were hardcoded in the JSX, and none of them had a prop: the two
 * error titles and the no-results search line. A screen that loads three
 * listings could not say which of them failed, and a product that does not
 * speak Portuguese could not say anything.
 *
 * `errorTitle` has the same name in both pieces on purpose - it is the same
 * pair that `errorMessage` already formed.
 */

type Invoice = { id: string; number: string };

const COLUMNS: Column<Invoice>[] = [{ key: "number", header: "Numero" }];

function table(props: Partial<React.ComponentProps<typeof DataTable<Invoice>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <DataTable
        data={[{ id: "1", number: "4813" }]}
        columns={COLUMNS}
        rowKey={(invoice) => invoice.id}
        {...props}
      />
    </RivoProvider>,
  );
}

function chart(props: Partial<React.ComponentProps<typeof ChartContainer>> = {}) {
  return render(
    <RivoProvider scope="local">
      <ChartContainer config={{ paid: { label: "Pagas" } }} className="h-40" {...props}>
        <LineChart data={[{ month: "ago", paid: 3 }]}>
          <Line dataKey="paid" />
        </LineChart>
      </ChartContainer>
    </RivoProvider>,
  );
}

test("without errorTitle, the error title stays the usual one", () => {
  table({ isError: true, data: undefined });
  expect(screen.getByText("Não foi possível carregar")).toBeDefined();
});

test("errorTitle says what failed, not just that something failed", () => {
  table({
    isError: true,
    data: undefined,
    errorTitle: "Não foi possível carregar as notas",
    errorMessage: "A prefeitura não respondeu.",
  });

  expect(screen.getByText("Não foi possível carregar as notas")).toBeDefined();
  expect(screen.queryByText("Não foi possível carregar")).toBeNull();
});

test("without noResultsMessage, the empty search keeps the usual line", () => {
  table({ filter: "prefeitura" });
  expect(screen.getByText("Nenhum resultado para a busca.")).toBeDefined();
});

test("noResultsMessage replaces the empty search line, without touching empty", () => {
  table({ filter: "prefeitura", noResultsMessage: "Nenhuma nota bate com esse texto." });

  expect(screen.getByText("Nenhuma nota bate com esse texto.")).toBeDefined();
  expect(screen.queryByText("Nenhum resultado para a busca.")).toBeNull();
});

test("the empty search does not become an empty state: empty is reserved for the database", () => {
  table({
    filter: "prefeitura",
    noResultsMessage: "Nenhuma nota bate com esse texto.",
    empty: { title: "Nenhuma nota por aqui", description: "Emita a primeira." },
  });

  expect(screen.queryByText("Nenhuma nota por aqui")).toBeNull();
});

test("without errorTitle, the chart keeps the usual title", () => {
  chart({ isError: true });
  expect(screen.getByText("Não foi possível carregar o gráfico")).toBeDefined();
});

test("errorTitle says which chart of the dashboard failed", () => {
  chart({ isError: true, errorTitle: "Não foi possível carregar o faturamento" });

  expect(screen.getByText("Não foi possível carregar o faturamento")).toBeDefined();
  expect(screen.queryByText("Não foi possível carregar o gráfico")).toBeNull();
});

test("errorTitle and errorMessage are the pair, and keep showing together", () => {
  chart({
    isError: true,
    errorTitle: "Não foi possível carregar o faturamento",
    errorMessage: "A consulta expirou.",
  });

  expect(screen.getByText("Não foi possível carregar o faturamento")).toBeDefined();
  expect(screen.getByText("A consulta expirou.")).toBeDefined();
});

/*
 * Error beats loading, and the four pieces have to agree on it.
 *
 * `ChartContainer` ordered it the other way - `isLoading ? skeleton : isError`
 * -, so a query that failed during a refetch showed a skeleton and hid the
 * failure: whoever looked saw endless loading and had no retry button.
 * `DataTable` always ordered it right, and `DataTable.md` and the parity table
 * already stated that this was the house rule - it was the piece that
 * silently disagreed with the text.
 */
test("with error and loading together, DataTable shows the error and not the skeleton", () => {
  const { container } = table({ isLoading: true, isError: true });

  expect(screen.getByText("Não foi possível carregar")).toBeDefined();
  expect(container.querySelectorAll(".bg-skeleton")).toHaveLength(0);
});

test("with error and loading together, ChartContainer shows the error and not the skeleton", () => {
  const { container } = chart({ isLoading: true, isError: true });

  expect(screen.getByText("Não foi possível carregar o gráfico")).toBeDefined();
  expect(container.querySelectorAll(".bg-skeleton")).toHaveLength(0);
});
