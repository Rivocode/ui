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

test("a caixa de acoes nasce shrink-0, e o chamador alcanca ela para deixar encolher", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <PageHeader
        title="Notas fiscais"
        actions={<button type="button">Nova nota</button>}
      />
    </RivoProvider>,
  );

  const fixed = container.querySelector("header > div > div:last-child")!;
  expect(String(fixed.className).split(" ")).toContain("shrink-0");

  const { container: loose } = render(
    <RivoProvider scope="local">
      <PageHeader
        title="Notas fiscais"
        actions={<button type="button">Nova nota</button>}
        classNames={{ actions: "min-w-0 shrink" }}
      />
    </RivoProvider>,
  );

  const box = loose.querySelector("header > div > div:last-child")!;
  expect(String(box.className).split(" ")).toContain("min-w-0");
  expect(String(box.className).split(" ")).toContain("shrink");
  expect(String(box.className).split(" ")).not.toContain("shrink-0");
});
