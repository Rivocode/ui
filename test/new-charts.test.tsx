import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { ChartFunnel } from "../src/chart/chart-funnel";
import { ChartGauge, type ChartGaugeBand } from "../src/chart/chart-gauge";
import { ChartHeatmap } from "../src/chart/chart-heatmap";
import { ChartTreemap } from "../src/chart/chart-treemap";
import { CHART_TINT } from "../src/lib/contrast";
import { RivoProvider } from "../src/provider/rivo-provider";
import {
  HEAT_ALPHAS,
  TREEMAP_TINT,
  bandAt,
  funnelRates,
  heatStep,
  labelFit,
  squarify,
} from "../src/shared/chart-layout";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const EMISSIONS = [
  { dia: "Seg", hora: "8h", total: 0 },
  { dia: "Seg", hora: "9h", total: 12 },
  { dia: "Ter", hora: "8h", total: 4 },
  { dia: "Ter", hora: "9h", total: null },
];

function heatmap(extra: Partial<React.ComponentProps<typeof ChartHeatmap>> = {}) {
  return withTheme(
    <ChartHeatmap
      data={EMISSIONS}
      rowKey="dia"
      columnKey="hora"
      valueKey="total"
      label="Emissões por dia e hora"
      {...extra}
    />,
  );
}

describe("ChartHeatmap", () => {
  test("zero is a value and paints the first step; a cell with no data has no ink", () => {
    const { container } = heatmap({ rows: ["Seg", "Ter", "Qua"] });

    const step = (cell: string) =>
      container.querySelector(`[data-rc-cell="${cell}"]`)?.getAttribute("data-rc-step");

    expect(step("0-0")).toBe("0");
    expect(step("0-1")).toBe(String(HEAT_ALPHAS.length - 1));
    expect(step("1-1")).toBe("empty");
    expect(step("2-0")).toBe("empty");

    const empty = container.querySelector<HTMLElement>('[data-rc-cell="1-1"]')!;
    expect(empty.className.split(" ")).toContain("border-dashed");

    const zero = container.querySelector<HTMLElement>('[data-rc-cell="0-0"]')!;
    expect(zero.className.split(" ")).toContain(
      `bg-[color-mix(in_srgb,var(--rc-heat)_${Math.round(HEAT_ALPHAS[0] * 100)}%,transparent)]`,
    );
    expect(zero.className.split(" ")).not.toContain("border-dashed");
    expect(empty.className).not.toContain("bg-");
  });

  test("the hidden table states each cell's number, and says 'Sem dado' where there is none, clipped by a box so it does not widen the page", () => {
    heatmap();

    const table = screen.getByRole("table", { name: "Emissões por dia e hora" });
    expect(table.className.split(" ")).not.toContain("sr-only");
    expect(table.parentElement!.className.split(" ")).toContain("sr-only");
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);

    const monday = within(rows[1]!)
      .getAllByRole("cell")
      .map((cell) => cell.textContent);
    const tuesday = within(rows[2]!)
      .getAllByRole("cell")
      .map((cell) => cell.textContent);
    expect(monday).toEqual(["0", "12"]);
    expect(tuesday).toEqual(["4", "Sem dado"]);
    expect(within(rows[1]!).getByRole("rowheader").textContent).toBe("Seg");
  });

  test("labels.empty replaces the 'Sem dado' in the table and in the reading", () => {
    heatmap({ labels: { empty: "No data" } });
    const table = screen.getByRole("table", { name: "Emissões por dia e hora" });
    expect(table.textContent).toContain("No data");
    expect(table.textContent).not.toContain("Sem dado");
  });

  test("the arrow moves through the grid and the screen reader hears the cell it stopped on", () => {
    heatmap();
    const grid = screen.getByRole("group", { name: "Emissões por dia e hora" });

    fireEvent.focus(grid);
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: "ArrowRight" });

    expect(screen.getByRole("status").textContent).toBe("Ter, 9h: Sem dado");

    fireEvent.keyDown(grid, { key: "ArrowUp" });
    expect(screen.getByRole("status").textContent).toBe("Seg, 9h: 12");
  });

  test("the legend only shows the empty swatch when there is an empty cell", () => {
    const { container, unmount } = heatmap({ data: EMISSIONS.slice(0, 3), columns: ["8h", "9h"] });
    const legend = () => container.querySelector("[data-rc-heat-legend]")!;
    expect(legend().textContent).toContain("Sem dado");
    unmount();

    const full = heatmap({ data: EMISSIONS.slice(0, 2) });
    expect(full.container.querySelector("[data-rc-heat-legend]")!.textContent).not.toContain(
      "Sem dado",
    );
  });

  test("the five steps paint the alphas of the scale shared with native, over the requested color", () => {
    const { container } = heatmap({ color: "var(--rc-chart-3)" });
    const root = container.querySelector<HTMLElement>("[data-rc-heat-legend]")!.parentElement!;
    expect(root.style.getPropertyValue("--rc-heat")).toBe("var(--rc-chart-3)");

    const swatches = [...container.querySelectorAll("[data-rc-heat-legend] span span span")].map(
      (swatch) => swatch.className.split(" ").find((token) => token.startsWith("bg-")),
    );
    expect(swatches).toEqual(
      HEAT_ALPHAS.map((alpha) =>
        alpha === 1
          ? "bg-(--rc-heat)"
          : `bg-[color-mix(in_srgb,var(--rc-heat)_${Math.round(alpha * 100)}%,transparent)]`,
      ),
    );
  });

  test("the fixed domain is the ruler: the same number lands on the same step in both grids", () => {
    const { container } = heatmap({ domain: [0, 120] });
    expect(container.querySelector('[data-rc-cell="0-1"]')!.getAttribute("data-rc-step")).toBe("0");
  });

  test("an all-zero grid, or a zero-width domain, paints the faintest step, and not the fullest", () => {
    const zeros = heatmap({
      data: [
        { dia: "Seg", hora: "8h", total: 0 },
        { dia: "Seg", hora: "9h", total: 0 },
      ],
    });
    const steps = () =>
      [...document.querySelectorAll("[data-rc-cell]")].map((cell) =>
        cell.getAttribute("data-rc-step"),
      );
    expect(steps()).toEqual(["0", "0"]);
    zeros.unmount();

    heatmap({ domain: [5, 5] });
    expect(steps().filter((step) => step !== "empty")).toEqual(["0", "0", "0"]);
  });

  test("a long row label has a width cap and truncates, and the grid keeps most of the space", () => {
    const long = "Clínica São Lucas Serviços Médicos e Laboratoriais Ltda";
    const { container } = heatmap({
      data: [
        { dia: long, hora: "8h", total: 1 },
        { dia: long, hora: "9h", total: 2 },
      ],
    });
    const grid = screen.getByRole("group", { name: "Emissões por dia e hora" });
    expect(grid.style.gridTemplateColumns).toBe(
      "fit-content(min(40%, 10rem)) repeat(2, minmax(0, 1fr))",
    );
    const label = [...container.querySelectorAll("[role=group] > span")].find(
      (span) => span.textContent === long,
    )!;
    expect(label.className.split(" ")).toContain("truncate");
  });
});

const BANDS: ChartGaugeBand[] = [
  { until: 60, tone: "success", label: "Bom" },
  { until: 85, tone: "warning", label: "Atenção" },
  { until: 100, tone: "danger", label: "Crítico" },
];

describe("ChartGauge", () => {
  test("the name carries value, maximum and band, and the band ruler goes in the description", () => {
    withTheme(<ChartGauge value={72} bands={BANDS} />);

    const gauge = screen.getByRole("img", { name: "72 de 100, Atenção" });
    const described = document.getElementById(gauge.getAttribute("aria-describedby")!);
    expect(described?.textContent).toBe(
      "Bom: de 0 a 60; Atenção: de 60 a 85; Crítico: de 85 a 100",
    );
    expect(gauge.getAttribute("data-rc-gauge-tone")).toBe("warning");
    expect(screen.getByText("Atenção")).toBeDefined();
  });

  test("the arc paints the band's -text role, which is what contrast measures over the track", () => {
    const { container } = withTheme(<ChartGauge value={95} bands={BANDS} />);
    const arc = container.querySelector("[data-rc-gauge-value]")!;

    expect(arc.getAttribute("stroke")).toBe("var(--rc-danger-text)");
    const ring = [...container.querySelectorAll("[data-rc-gauge-band]")].map((band) =>
      band.getAttribute("stroke"),
    );
    expect(ring).toEqual([
      "var(--rc-success-text)",
      "var(--rc-warning-text)",
      "var(--rc-danger-text)",
    ]);
  });

  test("above the maximum the number is the real one, and only the arc, the needle and the band stop at the end", () => {
    const { container } = withTheme(<ChartGauge value={140} bands={BANDS} />);
    const gauge = screen.getByRole("img", { name: "140 de 100, Crítico" });
    expect(gauge.getAttribute("data-rc-gauge-tone")).toBe("danger");
    expect(container.querySelector("[data-rc-gauge-center]")!.textContent).toBe("140");
  });

  test("below zero the number is also the real one, and the band is the first", () => {
    const { container } = withTheme(<ChartGauge value={-5} bands={BANDS} />);
    expect(screen.getByRole("img", { name: "-5 de 100, Bom" })).toBeDefined();
    expect(container.querySelector("[data-rc-gauge-center]")!.textContent).toBe("-5");
  });

  test("a number that is not a number becomes a dash, with no band and no painted arc", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const { container, unmount } = withTheme(<ChartGauge value={value} bands={BANDS} />);
      const gauge = screen.getByRole("img", { name: "— de 100" });
      expect(gauge.getAttribute("data-rc-gauge-tone")).toBe("neutral");
      expect(container.querySelector("[data-rc-gauge-center]")!.textContent).toBe("—");
      expect(screen.queryByText("Crítico")).toBeNull();
      expect(screen.queryByText("Bom")).toBeNull();
      unmount();
    }
  });

  test("with centerValue, the accessible name says the same text the screen shows", () => {
    withTheme(<ChartGauge value={1234.5} max={2000} format="currency" centerValue="R$ 1.234,50" />);
    expect(screen.getByRole("img", { name: /^R\$ 1\.234,50 de R\$\s2\.000,00$/ })).toBeDefined();
  });

  test("the center text has the width of the arc hole, and not of the card", () => {
    const { container } = withTheme(<ChartGauge value={72} bands={BANDS} />);
    const hole = container.querySelector<HTMLElement>("[data-rc-gauge-hole]")!;
    expect(hole.className.split(" ")).toContain("w-[52cqmin]");
    expect(hole.parentElement!.className.split(" ")).toContain("[container-type:size]");
  });

  test("a 360 sweep draws the whole ring, in two arcs, and above that stops at 360", () => {
    for (const sweep of [360, 400]) {
      const { container, unmount } = withTheme(<ChartGauge value={50} sweep={sweep} />);
      const d = container.querySelector("[data-rc-gauge-value]")!.getAttribute("d")!;
      const points = [...d.matchAll(/(-?\d+\.\d+) (-?\d+\.\d+)/g)].map((match) => [
        Number(match[1]),
        Number(match[2]),
      ]);
      expect(d.match(/A /g)).toHaveLength(2);
      expect(points[0]![0]).toBeCloseTo(0, 3);
      expect(points[0]![1]).toBeCloseTo(38, 3);
      expect(points[1]![1]).toBeCloseTo(-38, 3);
      unmount();
    }
  });

  test("without bands it is a neutral arc, with no needle and no description", () => {
    const { container } = withTheme(<ChartGauge value={40} max={80} format="integer" />);
    const gauge = screen.getByRole("img", { name: "40 de 80" });

    expect(gauge.getAttribute("aria-describedby")).toBeNull();
    expect(container.querySelector("[data-rc-gauge-needle]")).toBeNull();
    expect(container.querySelector("[data-rc-gauge-value]")!.getAttribute("stroke")).toBe(
      "var(--rc-accent-text)",
    );
  });

  test("the band falls by the inclusive limit: 60 is still good", () => {
    expect(bandAt(BANDS, 60)?.label).toBe("Bom");
    expect(bandAt(BANDS, 60.1)?.label).toBe("Atenção");
  });
});

const STAGES = [
  { etapa: "Visitas", total: 1000 },
  { etapa: "Cadastros", total: 400 },
  { etapa: "Primeira nota", total: 100 },
];

describe("ChartFunnel", () => {
  test("each stage is a list item, with the rate over the previous one spelled out", () => {
    withTheme(
      <ChartFunnel data={STAGES} valueKey="total" nameKey="etapa" label="Funil de adesão" />,
    );

    const items = within(screen.getByRole("list", { name: "Funil de adesão" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(3);
    expect(items[0]!.textContent).not.toContain("etapa anterior");
    expect(items[1]!.textContent).toContain("40%da etapa anterior");
    expect(items[2]!.textContent).toContain("25%da etapa anterior");
    expect(screen.getByText("do início ao fim").previousSibling?.textContent).toBe("10%");
  });

  test("the bar measures relative to the widest stage", () => {
    const { container } = withTheme(<ChartFunnel data={STAGES} valueKey="total" nameKey="etapa" />);
    const widths = [...container.querySelectorAll<HTMLElement>("[data-rc-funnel-bar]")].map(
      (bar) => bar.style.width,
    );
    expect(widths).toEqual(["100%", "40%", "10%"]);
  });

  test("a zeroed previous stage does not invent a rate, and the total line disappears with showOverall off", () => {
    withTheme(
      <ChartFunnel
        data={[
          { etapa: "A", total: 0 },
          { etapa: "B", total: 0 },
        ]}
        valueKey="total"
        nameKey="etapa"
        showOverall={false}
      />,
    );
    expect(screen.getByText("—")).toBeDefined();
    expect(screen.queryByText("do início ao fim")).toBeNull();
  });

  test("the funnel sentences come from labels, so the language can be changed", () => {
    withTheme(
      <ChartFunnel
        data={[
          { etapa: "A", total: 10 },
          { etapa: "B", total: 5 },
        ]}
        valueKey="total"
        nameKey="etapa"
        labels={{ rate: "of the previous step", overall: "end to end" }}
      />,
    );
    expect(screen.getByText("of the previous step")).toBeDefined();
    expect(screen.getByText("end to end")).toBeDefined();
    expect(screen.queryByText("da etapa anterior")).toBeNull();
  });

  test("a repeated name does not repeat a key, and no stage disappears", () => {
    const warn = spyOn(console, "error").mockImplementation(() => {});
    withTheme(
      <ChartFunnel
        data={[
          { etapa: "Retorno", total: 10 },
          { etapa: "Retorno", total: 5 },
        ]}
        valueKey="total"
        nameKey="etapa"
        label="Funil repetido"
      />,
    );
    const keys = warn.mock.calls.filter((call) => String(call[0]).includes("same key"));
    warn.mockRestore();
    expect(keys).toHaveLength(0);
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(2);
  });

  test("a long word without spaces breaks inside the name, instead of widening the page", () => {
    const word = "Supercalifragilisticexpialidociousnotafiscalsupercalifragilistic";
    withTheme(<ChartFunnel data={[{ etapa: word, total: 1 }]} valueKey="total" nameKey="etapa" />);
    expect(screen.getByText(word).className.split(" ")).toContain("wrap-anywhere");
  });

  test("the rate math", () => {
    expect(funnelRates([200, 50, 25])).toEqual({ fromPrevious: [null, 25, 50], overall: 12.5 });
    expect(funnelRates([10])).toEqual({ fromPrevious: [null], overall: null });
  });
});

const NATURES = [
  { natureza: "Serviços", total: 600 },
  { natureza: "Produtos", total: 300 },
  { natureza: "Locação", total: 100 },
  { natureza: "Estorno", total: 0 },
];

const realWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
const realHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");

function measureAs(width: number, height: number) {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => height,
  });
}

afterEach(() => {
  if (realWidth) Object.defineProperty(HTMLElement.prototype, "clientWidth", realWidth);
  if (realHeight) Object.defineProperty(HTMLElement.prototype, "clientHeight", realHeight);
});

test("in a narrow grid the column label shows up every so often, instead of turning into an ellipsis", () => {
  measureAs(300, 200);
  const hours = Array.from({ length: 24 }, (_, index) => `${index}h`);
  const { container } = withTheme(
    <ChartHeatmap
      data={hours.map((hour) => ({ dia: "Seg", hora: hour, total: 1 }))}
      rowKey="dia"
      columnKey="hora"
      valueKey="total"
      label="Por hora"
    />,
  );
  const shown = [...container.querySelectorAll('[role="group"] > span[aria-hidden="true"]')]
    .slice(1, 25)
    .filter((label) => !label.className.split(" ").includes("invisible"))
    .map((label) => label.textContent);

  expect(shown).toEqual(["0h", "4h", "8h", "12h", "16h", "20h"]);
});

test("how many column labels fit is measured by the cell area, and not by the grid with the label column", () => {
  measureAs(300, 200);
  const realOffset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-rc-heat-corner") ? 120 : 0;
    },
  });
  try {
    const hours = Array.from({ length: 24 }, (_, index) => `${index}h`);
    const { container } = withTheme(
      <ChartHeatmap
        data={hours.map((hour) => ({ dia: "Clínica São Lucas", hora: hour, total: 1 }))}
        rowKey="dia"
        columnKey="hora"
        valueKey="total"
        label="Por hora"
      />,
    );
    const shown = [...container.querySelectorAll('[role="group"] > span[aria-hidden="true"]')]
      .slice(1, 25)
      .filter((label) => !label.className.split(" ").includes("invisible"))
      .map((label) => label.textContent);

    expect(shown).toEqual(["0h", "6h", "12h", "18h"]);
  } finally {
    if (realOffset) Object.defineProperty(HTMLElement.prototype, "offsetWidth", realOffset);
  }
});

describe("ChartTreemap", () => {
  test("the hidden list brings every category with its share, including the one that got no area", () => {
    const { container } = withTheme(
      <ChartTreemap data={NATURES} valueKey="total" nameKey="natureza" label="Por natureza" />,
    );

    const items = within(screen.getByRole("list", { name: "Por natureza" }))
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(items).toEqual([
      "Serviços: 600 (60%)",
      "Produtos: 300 (30%)",
      "Locação: 100 (10%)",
      "Estorno: 0 (0%)",
    ]);
    expect(container.querySelectorAll("[data-rc-tile]")).toHaveLength(3);
  });

  test("without a measurement, no label is drawn: what fits is not guessed", () => {
    const { container } = withTheme(
      <ChartTreemap data={NATURES} valueKey="total" nameKey="natureza" label="Por natureza" />,
    );
    const fits = [...container.querySelectorAll("[data-rc-tile]")].map((tile) =>
      tile.getAttribute("data-rc-fit"),
    );
    expect(fits).toEqual(["none", "none", "none"]);
  });

  test("once measured, the label shows where it fits and disappears where it does not", () => {
    measureAs(400, 200);
    const { container } = withTheme(
      <ChartTreemap
        data={[
          { natureza: "Serviços", total: 900 },
          { natureza: "Retenções de ISS", total: 6 },
        ]}
        valueKey="total"
        nameKey="natureza"
        label="Por natureza"
      />,
    );

    const tiles = [...container.querySelectorAll("[data-rc-tile]")];
    expect(tiles.map((tile) => tile.getAttribute("data-rc-fit"))).toEqual(["both", "none"]);
    expect(within(tiles[0] as HTMLElement).getByText("Serviços")).toBeDefined();
    expect(within(tiles[1] as HTMLElement).queryByText("Retenções de ISS")).toBeNull();
  });

  test("the category ink is the one contrast measures", () => {
    expect(TREEMAP_TINT).toBe(CHART_TINT);

    const { container } = withTheme(
      <ChartTreemap data={NATURES} valueKey="total" nameKey="natureza" label="Por natureza" />,
    );
    const tile = container.querySelector<HTMLElement>('[data-rc-tile="0"]')!;
    const paint = tile.firstElementChild!;
    expect(tile.style.getPropertyValue("--rc-tile")).toBe("var(--rc-chart-1)");
    expect(paint.className.split(" ")).toContain(
      `bg-[color-mix(in_srgb,var(--rc-tile)_${CHART_TINT * 100}%,transparent)]`,
    );
  });

  test("a repeated name does not repeat a key, neither in the grid nor in the hidden list", () => {
    measureAs(400, 200);
    const warn = spyOn(console, "error").mockImplementation(() => {});
    withTheme(
      <ChartTreemap
        data={[
          { natureza: "Outros", total: 10 },
          { natureza: "Outros", total: 5 },
        ]}
        valueKey="total"
        nameKey="natureza"
        label="Repetido"
      />,
    );
    const keys = warn.mock.calls.filter((call) => String(call[0]).includes("same key"));
    warn.mockRestore();
    expect(keys).toHaveLength(0);
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(2);
  });

  test("the keyboard walks the categories and the screen reader hears each one", () => {
    withTheme(
      <ChartTreemap data={NATURES} valueKey="total" nameKey="natureza" label="Por natureza" />,
    );
    const map = screen.getByRole("group", { name: "Por natureza" });

    fireEvent.focus(map);
    fireEvent.keyDown(map, { key: "End" });
    expect(screen.getByRole("status").textContent).toBe("Locação: 100 (10%)");
  });
});

describe("the geometry", () => {
  test("squarify covers the whole area, without leaving the frame, and in input order", () => {
    const values = [6, 6, 4, 3, 2, 2, 1];
    const boxes = squarify(values, 600, 400);
    const area = boxes.reduce((sum, box) => sum + box.width * box.height, 0);

    expect(area).toBeCloseTo(600 * 400, 3);
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(-1e-9);
      expect(box.y).toBeGreaterThanOrEqual(-1e-9);
      expect(box.x + box.width).toBeLessThanOrEqual(600 + 1e-6);
      expect(box.y + box.height).toBeLessThanOrEqual(400 + 1e-6);
    }
    expect(boxes[0]!.width * boxes[0]!.height).toBeCloseTo((6 / 24) * 600 * 400, 3);
  });

  test("a null, negative or invalid value gets no area", () => {
    const boxes = squarify([5, 0, -3, Number.NaN], 100, 100);
    expect(boxes.slice(1).every((box) => box.width === 0 && box.height === 0)).toBe(true);
  });

  test("the scale step", () => {
    expect(heatStep(0, 0, 100, 5)).toBe(0);
    expect(heatStep(100, 0, 100, 5)).toBe(4);
    expect(heatStep(50, 0, 100, 5)).toBe(2);
    expect(heatStep(7, 7, 7, 5)).toBe(0);
    expect(heatStep(0, 0, 0, 5)).toBe(0);
  });

  test("a label that does not fit disappears whole, and does not turn into an ellipsis", () => {
    expect(labelFit("Serviços", "600", 200, 60)).toBe("both");
    expect(labelFit("Serviços", "600", 200, 44)).toBe("name");
    expect(labelFit("Serviços", "600", 40, 60)).toBe("none");
    expect(labelFit("Serviços", "600", 200, 12)).toBe("none");
  });

  test("'both' never clips: the estimate covers the mono font and the real padding", () => {
    const MONO = 12 * 0.6;
    const INSET = 2 * 2 + 2 * 8 + 2 * 2;
    const LINE = 16;
    for (const value of ["R$ 38.400,00", "R$ 1.234.567,89", "99,9%", "0"]) {
      for (let width = 20; width <= 240; width += 1) {
        for (const height of [30, 40, 50, 60, 80]) {
          const fit = labelFit("Obras", value, width, height);
          if (fit === "both") {
            expect(width).toBeGreaterThanOrEqual(value.length * MONO + INSET);
            expect(height).toBeGreaterThanOrEqual(2 * LINE + INSET);
          }
          if (fit !== "none") expect(height).toBeGreaterThanOrEqual(LINE + INSET);
        }
      }
    }
  });
});
