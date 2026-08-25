import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { PageHeader } from "../src/components/page-header";
import { RivoProvider } from "../src/provider/rivo-provider";

test("o titulo e um h1, porque cabecalho de pagina e o topo da pagina", () => {
  render(
    <RivoProvider scope="local">
      <PageHeader title="Notas fiscais" description="Tudo que foi emitido no mês." />
    </RivoProvider>,
  );

  const heading = screen.getByRole("heading", { level: 1, name: "Notas fiscais" });
  expect(heading).toBeDefined();
  expect(screen.getByText("Tudo que foi emitido no mês.")).toBeDefined();
});

test("acoes e trilha entram por slot", () => {
  render(
    <RivoProvider scope="local">
      <PageHeader
        title="Notas fiscais"
        breadcrumb={<nav data-testid="trilha" />}
        actions={<button type="button">Nova nota</button>}
      />
    </RivoProvider>,
  );

  expect(screen.getByTestId("trilha")).toBeDefined();
  expect(screen.getByRole("button", { name: "Nova nota" })).toBeDefined();
});
