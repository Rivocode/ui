import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Container } from "../src/components/container";
import { Grid } from "../src/components/grid";
import { Stack } from "../src/components/stack";
import { RivoProvider } from "../src/provider/rivo-provider";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const classesOf = (element: HTMLElement) => element.className.split(" ");

test("the stack starts as a column, with the scale's medium gap and no imposed alignment", () => {
  withTheme(
    <Stack data-testid="pilha">
      <span>Um</span>
      <span>Dois</span>
    </Stack>,
  );

  const classes = classesOf(screen.getByTestId("pilha"));
  expect(classes).toContain("flex");
  expect(classes).toContain("flex-col");
  expect(classes).not.toContain("flex-row");
  expect(classes).toContain("gap-[var(--rc-gap-md)]");
  expect(classes.some((name) => name.startsWith("items-"))).toBe(false);
  expect(classes).not.toContain("flex-wrap");
});

test("the row stack aligns, distributes and wraps when asked", () => {
  withTheme(
    <Stack data-testid="linha" direction="row" gap="xs" align="center" justify="between" wrap>
      <span>Um</span>
    </Stack>,
  );

  const classes = classesOf(screen.getByTestId("linha"));
  expect(classes).toContain("flex-row");
  expect(classes).not.toContain("flex-col");
  expect(classes).toContain("gap-[var(--rc-gap-xs)]");
  expect(classes).not.toContain("gap-[var(--rc-gap-md)]");
  expect(classes).toContain("items-center");
  expect(classes).toContain("justify-between");
  expect(classes).toContain("flex-wrap");
});

test("gap none zeroes it, and the caller's class beats the component's", () => {
  withTheme(
    <>
      <Stack data-testid="colada" gap="none" />
      <Stack data-testid="trocada" gap="lg" className="gap-10" />
    </>,
  );

  expect(classesOf(screen.getByTestId("colada"))).toContain("gap-0");
  const replaced = classesOf(screen.getByTestId("trocada"));
  expect(replaced).toContain("gap-10");
  expect(replaced).not.toContain("gap-[var(--rc-gap-lg)]");
});

test("render swaps the element and the list stays a list", () => {
  withTheme(
    <Stack render={<ul />} gap="sm">
      <li>Nota 4813</li>
      <li>Nota 4814</li>
    </Stack>,
  );

  const list = screen.getByRole("list");
  expect(list.tagName).toBe("UL");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(classesOf(list)).toContain("gap-[var(--rc-gap-sm)]");
});

test("compact density rewrites the gap scale that the stack and the grid read", async () => {
  const scales = await Bun.file("src/tokens/scales.css").text();
  const compact = scales.slice(scales.indexOf('[data-rc-density="compact"]'));
  const comfortable = scales.slice(0, scales.indexOf('[data-rc-density="compact"]'));
  const value = (css: string, token: string) =>
    Number(new RegExp(`${token}:\\s*(\\d+)px`).exec(css)?.[1]);

  for (const step of ["sm", "md", "lg", "xl"]) {
    const token = `--rc-gap-${step}`;
    expect(value(comfortable, token)).toBeGreaterThan(0);
    expect(value(compact, token)).toBeLessThan(value(comfortable, token));
  }
  expect(value(compact, "--rc-gap-xs")).toBe(4);
});

test("the fixed-column grid splits into equal parts that do not overflow", () => {
  withTheme(
    <Grid data-testid="grade" columns={3} gap="lg">
      <span>Um</span>
    </Grid>,
  );

  const grid = screen.getByTestId("grade");
  expect(classesOf(grid)).toContain("grid");
  expect(classesOf(grid)).toContain("gap-[var(--rc-gap-lg)]");
  expect(grid.style.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))");
});

test("the min-width grid fits as many as possible, without overflowing on a narrow screen", () => {
  withTheme(
    <>
      <Grid data-testid="rem" minItemWidth="12rem" />
      <Grid data-testid="pixel" minItemWidth={200} columns={4} />
    </>,
  );

  expect(screen.getByTestId("rem").style.gridTemplateColumns).toBe(
    "repeat(auto-fill, minmax(min(12rem, 100%), 1fr))",
  );
  expect(screen.getByTestId("pixel").style.gridTemplateColumns).toBe(
    "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
  );
});

test("without columns, the grid renders a single one and respects the caller's style", () => {
  withTheme(
    <>
      <Grid data-testid="vazia" columns={0} />
      <Grid data-testid="estilo" columns={2} style={{ gridTemplateColumns: "1fr 2fr" }} />
    </>,
  );

  expect(screen.getByTestId("vazia").style.gridTemplateColumns).toBe("");
  expect(screen.getByTestId("estilo").style.gridTemplateColumns).toBe("1fr 2fr");
});

test("the frame centers at the lg step by default, with padding that follows the density", () => {
  withTheme(<Container data-testid="moldura">Conteúdo</Container>);

  const classes = classesOf(screen.getByTestId("moldura"));
  expect(classes).toContain("mx-auto");
  expect(classes).toContain("w-full");
  expect(classes).toContain("max-w-6xl");
  expect(classes).toContain("px-[var(--rc-pad-panel-sm)]");
  expect(classes).toContain("sm:px-[var(--rc-pad-panel)]");
});

test("each frame step is a width the site already uses, and render turns it into the main region", () => {
  withTheme(
    <>
      <Container data-testid="sm" size="sm" />
      <Container data-testid="md" size="md" />
      <Container data-testid="xl" size="xl" />
      <Container data-testid="full" size="full" />
      <Container render={<main />} size="md">
        Cadastro
      </Container>
    </>,
  );

  expect(classesOf(screen.getByTestId("sm"))).toContain("max-w-xl");
  expect(classesOf(screen.getByTestId("md"))).toContain("max-w-3xl");
  expect(classesOf(screen.getByTestId("xl"))).toContain("max-w-7xl");
  const full = classesOf(screen.getByTestId("full"));
  expect(full).toContain("max-w-none");
  expect(full).not.toContain("max-w-6xl");

  const main = screen.getByRole("main");
  expect(main.textContent).toBe("Cadastro");
  expect(classesOf(main)).toContain("max-w-3xl");
});
