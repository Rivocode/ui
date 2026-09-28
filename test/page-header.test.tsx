import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { PageHeader } from "../src/components/page-header";
import { RivoProvider } from "../src/provider/rivo-provider";

test("the title is an h1, because a page header is the top of the page", () => {
  render(
    <RivoProvider scope="local">
      <PageHeader title="Notas fiscais" description="Tudo que foi emitido no mês." />
    </RivoProvider>,
  );

  const heading = screen.getByRole("heading", { level: 1, name: "Notas fiscais" });
  expect(heading).toBeDefined();
  expect(screen.getByText("Tudo que foi emitido no mês.")).toBeDefined();
});

test("actions and breadcrumb come in through slots", () => {
  render(
    <RivoProvider scope="local">
      <PageHeader
        title="Notas fiscais"
        breadcrumb={<nav data-testid="breadcrumb" />}
        actions={<button type="button">Nova nota</button>}
      />
    </RivoProvider>,
  );

  expect(screen.getByTestId("breadcrumb")).toBeDefined();
  expect(screen.getByRole("button", { name: "Nova nota" })).toBeDefined();
});

test("the actions box is born shrink-0, and the caller reaches it to let it shrink", () => {
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
