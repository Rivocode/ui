import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Progress } from "../src/components/progress";
import { Meter } from "../src/components/meter";
import { formatters } from "../src/shared/format";

/*
 * `format` meant three things in the same library: Intl options on Meter,
 * Progress, Slider and NumberField; a name or function on the chart axis; and
 * only a function on ChartDonut.
 *
 * The path that gave a type error was the less bad one. The one that did not
 * was worse: { style: "percent" } on a 0 to 100 meter prints 8.200% next to a
 * bar at 82%, and nothing complains.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the formatter name works on the meter, as it does on the axis", () => {
  withTheme(<Meter value={82} aria-label="Cota" showValue format="percent" />);

  expect(screen.getByText("82%")).toBeDefined();
});

test("a custom function also works, without going through Intl", () => {
  withTheme(
    <Progress value={3} aria-label="Notas" showValue format={(value) => `${value} de 10 notas`} />,
  );

  expect(screen.getByText("3 de 10 notas")).toBeDefined();
});

test("whoever wants the Intl options asks for them by name", () => {
  // The old contract does not go away, it is renamed: numberFormat says what it is, and
  // stops competing for the word `format` with the chart vocabulary.
  withTheme(
    <Meter value={0.82} aria-label="Cota" showValue numberFormat={{ style: "percent" }} max={1} />,
  );

  expect(screen.getByText("82%")).toBeDefined();
});

test("the formatters are a single set, and the chart does not own them", async () => {
  // They lived in chart/, so formatting money in a table forced an import
  // from the chart subpath.
  const fromChart = await import("../src/chart/format");

  expect(formatters.currencyShort(2480)).toBe("R$\u00a02,5K");
  expect(fromChart.formatters.currencyShort).toBe(formatters.currencyShort);
});
