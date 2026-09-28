import { expect, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartDonut } from "../src/chart/chart-donut";
import { ChartLegendContent, useSeriesToggle } from "../src/chart/chart-legend";
import { ChartRadial } from "../src/chart/chart-radial";
import { Sparkline } from "../src/chart/sparkline";
import type { ChartConfig } from "../src/chart/chart";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const SLICES = [
  { natureza: "servico", total: 148_200 },
  { natureza: "produto", total: 62_400 },
];

test("the donut uses the hole for the total, which is the number the person came for", () => {
  withTheme(
    <ChartDonut
      data={SLICES}
      valueKey="total"
      nameKey="natureza"
      centerValue="R$ 210,6 mil"
      centerLabel="faturado"
    />,
  );

  expect(screen.getByText("R$ 210,6 mil")).toBeDefined();
  expect(screen.getByText("faturado")).toBeDefined();
});

test("the tiny line hides from the screen reader, because there is nothing to read in it", () => {
  const { container } = withTheme(<Sparkline data={[1, 4, 3, 9]} />);
  const box = container.querySelector("[aria-hidden=true]");

  expect(box).not.toBeNull();
  expect(box!.getAttribute("role")).toBeNull();
});

test("with a label it becomes an image, and the screen reader has something to say", () => {
  withTheme(<Sparkline data={[1, 4, 3, 9]} label="Emissao subindo desde marco" />);

  expect(screen.getByRole("img", { name: "Emissao subindo desde marco" })).toBeDefined();
});

const CONFIG: ChartConfig = { emitidas: { label: "Emitidas" }, pagas: { label: "Pagas" } };
const PAYLOAD = [
  { dataKey: "emitidas", value: "emitidas", color: "#a" },
  { dataKey: "pagas", value: "pagas", color: "#b" },
];

test("without `onToggle` the legend is text, and does not pretend to be clickable", () => {
  withTheme(<ChartLegendContent payload={PAYLOAD} config={CONFIG} />);

  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText("Emitidas")).toBeDefined();
});

test("with `onToggle` each series becomes a button that says in aria whether it is on", () => {
  function Chart() {
    const series = useSeriesToggle();
    return <ChartLegendContent payload={PAYLOAD} config={CONFIG} {...series} />;
  }

  withTheme(<Chart />);

  const emitidas = screen.getByRole("button", { name: /Emitidas/ });
  expect(emitidas.getAttribute("aria-pressed")).toBe("true");

  fireEvent.click(emitidas);
  expect(screen.getByRole("button", { name: /Emitidas/ }).getAttribute("aria-pressed")).toBe(
    "false",
  );

  // The other series did not go along.
  expect(screen.getByRole("button", { name: /Pagas/ }).getAttribute("aria-pressed")).toBe("true");
});

test("the arc pins the scale, and a lone value does not go all the way around", () => {
  const { container } = withTheme(<ChartRadial value={30} label="30% da meta" />);

  // The hidden axis is what holds this; without it Recharts normalizes by the
  // largest value in the series, which with a single point is the point itself.
  expect(screen.getByRole("img", { name: "30% da meta" })).toBeDefined();
  expect(container.textContent).toContain("30%");
});

test("without a written value, the middle shows the percentage", () => {
  const { container } = withTheme(<ChartRadial value={41} max={50} />);
  expect(container.textContent).toContain("82%");
});

test("the segmented gauge is made of dashes, and not of a smooth arc", () => {
  // The most requested gauge variation on dashboards cost 42 lines of SVG in
  // the consumer's project - and that SVG did not follow the theme on its own.
  const { container } = withTheme(
    <ChartRadial value={82} variant="segmented" label="82% da meta" segments={44} />,
  );

  const ticks = container.querySelectorAll("[data-rc-tick]");
  expect(ticks.length).toBe(44);
  // What is past the value stays dimmed, and not absent: the whole scale must
  // stay visible for the lit dash to mean anything.
  expect([...ticks].filter((tick) => tick.getAttribute("data-rc-tick") === "on").length).toBe(36);
  expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("82% da meta");
});

test("the bar sparkline exists in both worlds, with the same name", () => {
  // Native draws a bar and not an area - an area needs a filled polygon, which
  // View cannot produce. Aligning with the web costs one variant and avoids the
  // name divergence that already bit Avatar, OTPField and ToggleGroup: `bar`
  // means the same thing on both, and only `area` stays out, which is a
  // platform limitation and not a different vocabulary.
  // The drawing itself cannot be checked here: ResponsiveContainer measures
  // 0x0 in jsdom and recharts emits nothing. The drawing is guarded by
  // `bun run visual`; here stays the contract - the variant exists, and the
  // piece still announces itself correctly with it.
  const { container } = withTheme(
    <Sparkline data={[3, 9, 5, 12]} variant="bar" label="Emissões por dia" />,
  );
  const box = container.querySelector('[role="img"]');

  expect(box?.getAttribute("aria-label")).toBe("Emissões por dia");
  expect(box?.getAttribute("aria-hidden")).toBeNull();
});

test("the drawn donut leaves no tab stop hidden from the reader inside the ring", async () => {
  const measure = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, top: 0, left: 0, right: 320, bottom: 192, width: 320, height: 192, toJSON() {} } as DOMRect;
  };
  try {
    const { container } = withTheme(<ChartDonut data={SLICES} valueKey="total" nameKey="natureza" />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    const surface = container.querySelector("svg.recharts-surface");
    expect(surface).not.toBeNull();
    expect(surface!.closest("[aria-hidden=true]")).not.toBeNull();
    const focusable = [...surface!.querySelectorAll("[tabindex]")];
    expect(focusable.length).toBeGreaterThan(0);
    for (const node of focusable) expect(node.getAttribute("tabindex")).toBe("-1");
  } finally {
    HTMLElement.prototype.getBoundingClientRect = measure;
  }
});
