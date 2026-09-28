import { expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { ChartAreaGradient, areaGradient } from "../src/chart/chart-gradient";

/*
 * The gradient name belongs to the caller, and not to us. The first version of
 * this took a unique id from the `ChartContainer` context, which looked safer
 * and hid a trap: the `fill` of `<Area>` is evaluated in the render of the
 * outer component, where that context does not exist yet.
 */

test("`fill` points to the declared gradient, without needing context", () => {
  const { container } = render(<ChartAreaGradient id="faturamento" series={["billed"]} />);
  const gradient = container.querySelector("linearGradient")!;

  expect(areaGradient("faturamento", "billed")).toBe(`url(#${gradient.id})`);
});

test("the color comes from the series variable, so it follows the theme", () => {
  const { container } = render(<ChartAreaGradient id="x" series={["billed"]} />);
  const stops = [...container.querySelectorAll("stop")];

  expect(stops.map((p) => p.getAttribute("stop-color"))).toEqual([
    "var(--color-billed)",
    "var(--color-billed)",
  ]);
});

test("different names give different gradients, which is what separates two charts", () => {
  expect(areaGradient("faturamento", "billed")).not.toBe(areaGradient("emissao", "billed"));
});
