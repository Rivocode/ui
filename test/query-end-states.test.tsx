import { expect, spyOn, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { QueryBoundary } from "../src/components/query-boundary";

type Invoice = { id: string; customer: string };

const INVOICES: Invoice[] = [
  { id: "1", customer: "Clinica Sao Lucas" },
  { id: "2", customer: "Transportes Cabo Branco" },
];

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

function list(invoices: Invoice[]) {
  return (
    <ul>
      {invoices.map((invoice) => (
        <li key={invoice.id}>{invoice.customer}</li>
      ))}
    </ul>
  );
}

test("with the response in hand, the child draws, with no wrapper at all", () => {
  const { container } = withTheme(
    <QueryBoundary data={INVOICES}>{(invoices) => list(invoices)}</QueryBoundary>,
  );

  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  expect(container.querySelector("[aria-busy]")).toBeNull();
});

test("a function child receives the data without the undefined the screen had to guard against", () => {
  let seen: Invoice[] | undefined;

  withTheme(
    <QueryBoundary data={INVOICES}>
      {(invoices) => {
        seen = invoices;
        return list(invoices);
      }}
    </QueryBoundary>,
  );

  expect(seen?.length).toBe(2);
});

test("the child can also be a node, for whoever does not need the data", () => {
  withTheme(
    <QueryBoundary isLoading={false}>
      <p>A folha inteira</p>
    </QueryBoundary>,
  );

  expect(screen.getByText("A folha inteira")).toBeDefined();
});

test("without a response and without isLoading, the component starts in loading", () => {
  const { container } = withTheme(
    <QueryBoundary<Invoice[]>>{(invoices) => list(invoices)}</QueryBoundary>,
  );

  expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
  expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
});

test("with a function child, a response that has not arrived is waiting even with isLoading false", () => {
  const { container } = withTheme(
    <QueryBoundary<Invoice[]> isLoading={false}>{(invoices) => list(invoices)}</QueryBoundary>,
  );

  expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
});

test("while loading, it does not show stale data", () => {
  withTheme(
    <QueryBoundary data={INVOICES} isLoading>
      {(invoices) => list(invoices)}
    </QueryBoundary>,
  );

  expect(screen.queryByText("Clinica Sao Lucas")).toBeNull();
});

test("the caller's skeleton replaces the generic rows", () => {
  const { container } = withTheme(
    <QueryBoundary isLoading skeleton={<div data-testid="molde" />}>
      <p>A folha inteira</p>
    </QueryBoundary>,
  );

  expect(screen.getByTestId("molde")).toBeDefined();
  expect(container.querySelectorAll(".animate-pulse").length).toBe(0);
});

test("error beats loading, and offers a retry", () => {
  let retries = 0;

  withTheme(
    <QueryBoundary
      data={INVOICES}
      isError
      isLoading
      onRetry={() => (retries += 1)}
      errorTitle="Nao foi possivel carregar as notas"
    >
      {(invoices) => list(invoices)}
    </QueryBoundary>,
  );

  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.getByText("Nao foi possivel carregar as notas")).toBeDefined();
  expect(screen.queryByText("Clinica Sao Lucas")).toBeNull();

  fireEvent.click(screen.getByText("Tentar de novo"));
  expect(retries).toBe(1);
});

test("without onRetry the error speaks alone, without a button that leads nowhere", () => {
  withTheme(
    <QueryBoundary data={undefined} isError>
      <p>A folha inteira</p>
    </QueryBoundary>,
  );

  expect(screen.queryByRole("button")).toBeNull();
});

test("an empty response explains the emptiness and offers a way out", () => {
  withTheme(
    <QueryBoundary
      data={[]}
      empty={{
        title: "Nenhuma nota por aqui",
        description: "Quando voce emitir a primeira, ela aparece nesta lista.",
        action: <button type="button">Emitir nota</button>,
      }}
    >
      {(invoices: Invoice[]) => list(invoices)}
    </QueryBoundary>,
  );

  expect(screen.getByText("Nenhuma nota por aqui")).toBeDefined();
  expect(screen.getByRole("button", { name: "Emitir nota" })).toBeDefined();
});

test("the empty state does not show while the query is in flight", () => {
  withTheme(
    <QueryBoundary
      data={[]}
      isLoading
      empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
    >
      {(invoices: Invoice[]) => list(invoices)}
    </QueryBoundary>,
  );

  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("the empty state also does not show before the response arrives", () => {
  withTheme(
    <QueryBoundary<Invoice[]>
      empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
    >
      {(invoices) => list(invoices)}
    </QueryBoundary>,
  );

  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("a null response counts as empty, and not as waiting", () => {
  withTheme(
    <QueryBoundary<Invoice | null>
      data={null}
      empty={{ title: "Nota apagada", description: "Ela nao esta mais no sistema." }}
    >
      {(invoice) => <p>{invoice.customer}</p>}
    </QueryBoundary>,
  );

  expect(screen.getByText("Nota apagada")).toBeDefined();
});

test("without `empty`, the empty list falls to the children, which draw their own empty state", () => {
  withTheme(
    <QueryBoundary data={[] as Invoice[]}>
      {(invoices) => (invoices.length === 0 ? <p>Zero notas</p> : list(invoices))}
    </QueryBoundary>,
  );

  expect(screen.getByText("Zero notas")).toBeDefined();
});

test("`isEmpty` decides emptiness when the response is not a list", () => {
  withTheme(
    <QueryBoundary
      data={{ items: [] as Invoice[], total: 0 }}
      isEmpty
      empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
    >
      {(page) => list(page.items)}
    </QueryBoundary>,
  );

  expect(screen.getByText("Nenhuma nota")).toBeDefined();
});

test("`isEmpty` false beats the count, for a list that came back empty on purpose", () => {
  withTheme(
    <QueryBoundary
      data={[] as Invoice[]}
      isEmpty={false}
      empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
    >
      <p>A folha inteira</p>
    </QueryBoundary>,
  );

  expect(screen.getByText("A folha inteira")).toBeDefined();
});

test("the component warns when asked for an empty state that could never appear", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  withTheme(
    <QueryBoundary
      data={{ items: [] as Invoice[], total: 0 }}
      empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
    >
      {(page) => list(page.items)}
    </QueryBoundary>,
  );

  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain("isEmpty");
  warn.mockRestore();
});

test("the frame class dresses the three endings, and not the children", () => {
  const { container: loading } = withTheme(
    <QueryBoundary isLoading className="min-h-64">
      <p>A folha inteira</p>
    </QueryBoundary>,
  );
  expect(loading.querySelector("[aria-busy='true']")!.className).toContain("min-h-64");

  const { container: data } = withTheme(
    <QueryBoundary data={INVOICES} className="min-h-64">
      {(invoices) => list(invoices)}
    </QueryBoundary>,
  );
  expect(data.querySelector(".min-h-64")).toBeNull();
});

test("classNames dresses each ending by name, without `[&_div]`", () => {
  const parts = { loading: "espera", error: "queda", empty: "vazio" };

  const { container: loading } = withTheme(
    <QueryBoundary isLoading classNames={parts}>
      <p>A folha inteira</p>
    </QueryBoundary>,
  );
  expect(loading.querySelector(".espera")).not.toBeNull();

  const { container: error } = withTheme(
    <QueryBoundary isError classNames={parts}>
      <p>A folha inteira</p>
    </QueryBoundary>,
  );
  expect(error.querySelector(".queda")).not.toBeNull();

  const { container: empty } = withTheme(
    <QueryBoundary
      data={[] as Invoice[]}
      classNames={parts}
      empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
    >
      {(invoices) => list(invoices)}
    </QueryBoundary>,
  );
  expect(empty.querySelector(".vazio")).not.toBeNull();
});
