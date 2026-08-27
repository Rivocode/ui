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

test("com a resposta na mao, quem desenha e o filho, sem embrulho nenhum", () => {
  const { container } = withTheme(
    <QueryBoundary data={INVOICES}>{(invoices) => list(invoices)}</QueryBoundary>,
  );

  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  expect(container.querySelector("[aria-busy]")).toBeNull();
});

test("o filho em funcao recebe o dado sem o undefined que a tela tinha que afastar", () => {
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

test("o filho tambem pode ser no, para quem nao precisa do dado", () => {
  withTheme(
    <QueryBoundary isLoading={false}>
      <p>A folha inteira</p>
    </QueryBoundary>,
  );

  expect(screen.getByText("A folha inteira")).toBeDefined();
});

test("sem resposta e sem isLoading, a peca ja entra carregando", () => {
  const { container } = withTheme(
    <QueryBoundary<Invoice[]>>{(invoices) => list(invoices)}</QueryBoundary>,
  );

  expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
  expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
});

test("com filho em funcao, a resposta que nao veio e espera mesmo com isLoading falso", () => {
  const { container } = withTheme(
    <QueryBoundary<Invoice[]> isLoading={false}>{(invoices) => list(invoices)}</QueryBoundary>,
  );

  expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
});

test("carregando, ela nao mostra os dados velhos", () => {
  withTheme(
    <QueryBoundary data={INVOICES} isLoading>
      {(invoices) => list(invoices)}
    </QueryBoundary>,
  );

  expect(screen.queryByText("Clinica Sao Lucas")).toBeNull();
});

test("o esqueleto de quem chama substitui as linhas genericas", () => {
  const { container } = withTheme(
    <QueryBoundary isLoading skeleton={<div data-testid="molde" />}>
      <p>A folha inteira</p>
    </QueryBoundary>,
  );

  expect(screen.getByTestId("molde")).toBeDefined();
  expect(container.querySelectorAll(".animate-pulse").length).toBe(0);
});

test("o erro vence o carregando, e oferece nova tentativa", () => {
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

test("sem onRetry o erro fala sozinho, sem botao que nao leva a lugar nenhum", () => {
  withTheme(
    <QueryBoundary data={undefined} isError>
      <p>A folha inteira</p>
    </QueryBoundary>,
  );

  expect(screen.queryByRole("button")).toBeNull();
});

test("a resposta vazia explica o vazio e oferece saida", () => {
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

test("o vazio nao aparece enquanto a consulta esta em pe", () => {
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

test("o vazio tambem nao aparece antes de a resposta chegar", () => {
  withTheme(
    <QueryBoundary<Invoice[]>
      empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
    >
      {(invoices) => list(invoices)}
    </QueryBoundary>,
  );

  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("resposta nula conta como vazia, e nao como espera", () => {
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

test("sem `empty`, a lista vazia cai nos filhos, que desenham o vazio deles", () => {
  withTheme(
    <QueryBoundary data={[] as Invoice[]}>
      {(invoices) => (invoices.length === 0 ? <p>Zero notas</p> : list(invoices))}
    </QueryBoundary>,
  );

  expect(screen.getByText("Zero notas")).toBeDefined();
});

test("`isEmpty` decide o vazio quando a resposta nao e lista", () => {
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

test("`isEmpty` falso vence a contagem, para a lista que veio vazia de proposito", () => {
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

test("a peca avisa quando pediram um vazio que nunca poderia aparecer", () => {
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

test("a classe da moldura veste os tres finais, e nao os filhos", () => {
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

test("classNames veste cada final pelo nome, sem `[&_div]`", () => {
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
