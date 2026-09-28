import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { currencyShort, percent } from "../src/shared/format";
import { Stat } from "../src/components/stat";
import { RivoProvider } from "../src/provider/rivo-provider";

function stat(props: Partial<React.ComponentProps<typeof Stat>> = {}) {
  return render(
    <RivoProvider scope="local">
      <Stat label="Faturado em agosto" value="R$ 246,7K" {...props} />
    </RivoProvider>,
  );
}

test("shows the label and the value", () => {
  stat();
  expect(screen.getByText("Faturado em agosto")).toBeDefined();
  expect(screen.getByText("R$ 246,7K")).toBeDefined();
});

test("a positive delta goes up green, with the period beside it", () => {
  const { container } = stat({ delta: 20, deltaLabel: "sobre julho" });
  expect(screen.getByText(/20% sobre julho/)).toBeDefined();
  expect(container.querySelector(".text-success-text")).not.toBeNull();
});

test("a negative delta goes down red", () => {
  const { container } = stat({ delta: -8 });
  expect(screen.getByText(/8%/)).toBeDefined();
  expect(container.querySelector(".text-danger-text")).not.toBeNull();
});

test("invert flips the judgment: going up is bad for overdue invoices", () => {
  const { container } = stat({ delta: 50, invert: true });
  expect(container.querySelector(".text-danger-text")).not.toBeNull();
  expect(container.querySelector(".text-success-text")).toBeNull();
});

test("the direction is spoken, not only painted", () => {
  stat({ delta: -8 });
  expect(screen.getByText(/queda de/)).toBeDefined();
});

test("a zero delta is neutral: no arrow, no judgment color and no alta de", () => {
  const { container } = stat({ delta: 0, deltaLabel: "sobre julho" });
  const line = screen.getByText(/0% sobre julho/);

  expect(line.querySelector("svg")).toBeNull();
  expect(line.className.split(" ")).toContain("text-fg-muted");
  expect(line.className.split(" ")).not.toContain("text-success-text");
  expect(container.textContent).not.toContain("alta de");
  expect(container.textContent).not.toContain("queda de");
});

test("a zero delta as a pill is neutral too, and stays neutral with invert", () => {
  stat({ delta: 0, deltaVariant: "pill", invert: true });
  const pill = screen.getByText(/0%/);

  expect(pill.className.split(" ")).toContain("text-fg-muted");
  expect(pill.className.split(" ")).not.toContain("text-danger-text");
});

test("a delta that rounds to zero on screen is neutral too, with both signs", () => {
  for (const delta of [0.0001, -0.0001]) {
    const view = stat({ delta, deltaLabel: "sobre julho" });
    const line = screen.getByText(/0% sobre julho/);

    expect(line.querySelector("svg")).toBeNull();
    expect(line.className.split(" ")).toContain("text-fg-muted");
    expect(view.container.textContent).not.toContain("alta de");
    expect(view.container.textContent).not.toContain("queda de");
    view.unmount();
  }
});

test("without delta there is no change line", () => {
  const { container } = stat();
  expect(container.querySelector(".text-success-text")).toBeNull();
  expect(container.querySelector(".text-danger-text")).toBeNull();
});

test("hint becomes a button with an accessible name", () => {
  stat({ hint: "Só o que já caiu na conta." });
  expect(screen.getByRole("button", { name: /sobre faturado em agosto/i })).toBeDefined();
});

test("the chart slot renders whatever comes", () => {
  stat({ chart: <svg data-testid="spark" /> });
  expect(screen.getByTestId("spark")).toBeDefined();
});

/*
 * The `%` was hardcoded in the JSX, and Stat was the only numeric component in
 * the house outside the formatting vocabulary Progress, Meter and Slider already
 * speak. A delta in reais or in basis points came out with a percent sign that
 * was not true.
 */

test("without deltaFormat, the change still comes out as a percentage", () => {
  stat({ delta: 20, deltaLabel: "sobre julho" });
  expect(screen.getByText(/20% sobre julho/)).toBeDefined();
});

test("a delta in reais comes out in reais, and not with a lying percent sign", () => {
  stat({ delta: 12_400, deltaFormat: "currencyShort" });

  expect(screen.getByText(/R\$ 12,4K/)).toBeDefined();
  expect(screen.queryByText(/%/)).toBeNull();
});

test("the house formatter name works here as it does on the meter", () => {
  stat({ delta: 1240, deltaFormat: "integer" });
  expect(screen.getByText(/1\.240/)).toBeDefined();
});

test("a custom function covers what no house formatter writes", () => {
  stat({ delta: 35, deltaFormat: (value: number) => `${value} pontos-base` });
  expect(screen.getByText(/35 pontos-base/)).toBeDefined();
});

test("the formatter receives the absolute value: the arrow and the speech carry the sign", () => {
  stat({ delta: -8, deltaFormat: (value: number) => `${value}` });

  expect(screen.getByText(/queda de/)).toBeDefined();
  expect(screen.queryByText(/-8/)).toBeNull();
});

test("the decimal place fits, by passing percent with digits", () => {
  stat({ delta: 12.5, deltaFormat: (value: number) => percent(value, 1) });
  expect(screen.getByText(/12,5%/)).toBeDefined();
});

test("the delta formatter is the same as the rest of the house", () => {
  // It is not a second Intl hidden in Stat: it is the `currencyShort` that the axis,
  // the table and the legend already use.
  stat({ delta: 12_400, deltaFormat: "currencyShort" });
  const written = currencyShort(12_400)
    .replace("$", "\\$")
    .replace(/\u00a0/g, "\\s");
  expect(screen.getByText(new RegExp(written))).toBeDefined();
});
