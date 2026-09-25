import { afterEach, describe, expect, test } from "bun:test";
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
  test("zero e valor e pinta o primeiro degrau; celula sem dado nao tem tinta", () => {
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

  test("a tabela escondida diz o numero de cada celula, e diz 'Sem dado' onde nao ha, recortada por uma caixa para nao alargar a pagina", () => {
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

  test("a seta anda pela grade e o leitor de tela ouve a celula em que parou", () => {
    heatmap();
    const grid = screen.getByRole("group", { name: "Emissões por dia e hora" });

    fireEvent.focus(grid);
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: "ArrowRight" });

    expect(screen.getByRole("status").textContent).toBe("Ter, 9h: Sem dado");

    fireEvent.keyDown(grid, { key: "ArrowUp" });
    expect(screen.getByRole("status").textContent).toBe("Seg, 9h: 12");
  });

  test("a legenda so mostra a amostra de vazio quando ha celula vazia", () => {
    const { container, unmount } = heatmap({ data: EMISSIONS.slice(0, 3), columns: ["8h", "9h"] });
    const legend = () => container.querySelector("[data-rc-heat-legend]")!;
    expect(legend().textContent).toContain("Sem dado");
    unmount();

    const full = heatmap({ data: EMISSIONS.slice(0, 2) });
    expect(full.container.querySelector("[data-rc-heat-legend]")!.textContent).not.toContain(
      "Sem dado",
    );
  });

  test("os cinco degraus pintam os alfas da escala compartilhada com o nativo, sobre a cor pedida", () => {
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

  test("o dominio fixo e a regua: o mesmo numero cai no mesmo degrau nas duas grades", () => {
    const { container } = heatmap({ domain: [0, 120] });
    expect(container.querySelector('[data-rc-cell="0-1"]')!.getAttribute("data-rc-step")).toBe("0");
  });
});

const BANDS: ChartGaugeBand[] = [
  { until: 60, tone: "success", label: "Bom" },
  { until: 85, tone: "warning", label: "Atenção" },
  { until: 100, tone: "danger", label: "Crítico" },
];

describe("ChartGauge", () => {
  test("o nome carrega valor, maximo e faixa, e a regua das faixas vai na descricao", () => {
    withTheme(<ChartGauge value={72} bands={BANDS} />);

    const gauge = screen.getByRole("img", { name: "72 de 100, Atenção" });
    const described = document.getElementById(gauge.getAttribute("aria-describedby")!);
    expect(described?.textContent).toBe(
      "Bom: de 0 a 60; Atenção: de 60 a 85; Crítico: de 85 a 100",
    );
    expect(gauge.getAttribute("data-rc-gauge-tone")).toBe("warning");
    expect(screen.getByText("Atenção")).toBeDefined();
  });

  test("o arco pinta o papel -text da faixa, que e o que o contraste mede sobre o trilho", () => {
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

  test("acima do maximo o ponteiro para na ponta, e a faixa e a ultima", () => {
    withTheme(<ChartGauge value={140} bands={BANDS} />);
    expect(screen.getByRole("img", { name: "100 de 100, Crítico" })).toBeDefined();
  });

  test("sem faixas e um arco neutro, sem ponteiro e sem descricao", () => {
    const { container } = withTheme(<ChartGauge value={40} max={80} format="integer" />);
    const gauge = screen.getByRole("img", { name: "40 de 80" });

    expect(gauge.getAttribute("aria-describedby")).toBeNull();
    expect(container.querySelector("[data-rc-gauge-needle]")).toBeNull();
    expect(container.querySelector("[data-rc-gauge-value]")!.getAttribute("stroke")).toBe(
      "var(--rc-accent-text)",
    );
  });

  test("a faixa cai pelo limite inclusivo: 60 ainda e bom", () => {
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
  test("cada etapa e item da lista, com a taxa sobre a anterior escrita por extenso", () => {
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

  test("a barra mede em relacao a etapa mais larga", () => {
    const { container } = withTheme(<ChartFunnel data={STAGES} valueKey="total" nameKey="etapa" />);
    const widths = [...container.querySelectorAll<HTMLElement>("[data-rc-funnel-bar]")].map(
      (bar) => bar.style.width,
    );
    expect(widths).toEqual(["100%", "40%", "10%"]);
  });

  test("etapa anterior zerada nao inventa taxa, e a linha do total some com false", () => {
    withTheme(
      <ChartFunnel
        data={[
          { etapa: "A", total: 0 },
          { etapa: "B", total: 0 },
        ]}
        valueKey="total"
        nameKey="etapa"
        overallLabel={false}
      />,
    );
    expect(screen.getByText("—")).toBeDefined();
    expect(screen.queryByText("do início ao fim")).toBeNull();
  });

  test("a conta das taxas", () => {
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

test("na grade estreita o rotulo de coluna aparece de tanto em tanto, em vez de virar reticencias", () => {
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

describe("ChartTreemap", () => {
  test("a lista escondida traz todas as categorias com a fatia, inclusive a que nao ganhou area", () => {
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

  test("sem medida, nenhum rotulo e desenhado: nao se adivinha o que cabe", () => {
    const { container } = withTheme(
      <ChartTreemap data={NATURES} valueKey="total" nameKey="natureza" label="Por natureza" />,
    );
    const fits = [...container.querySelectorAll("[data-rc-tile]")].map((tile) =>
      tile.getAttribute("data-rc-fit"),
    );
    expect(fits).toEqual(["none", "none", "none"]);
  });

  test("medido, o rotulo aparece onde cabe e some onde nao cabe", () => {
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

  test("a tinta da categoria e a que o contraste mede", () => {
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

  test("o teclado percorre as categorias e o leitor de tela ouve cada uma", () => {
    withTheme(
      <ChartTreemap data={NATURES} valueKey="total" nameKey="natureza" label="Por natureza" />,
    );
    const map = screen.getByRole("group", { name: "Por natureza" });

    fireEvent.focus(map);
    fireEvent.keyDown(map, { key: "End" });
    expect(screen.getByRole("status").textContent).toBe("Locação: 100 (10%)");
  });
});

describe("a geometria", () => {
  test("o squarify cobre a area inteira, sem sair do quadro, e na ordem de entrada", () => {
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

  test("valor nulo, negativo ou invalido nao ganha area", () => {
    const boxes = squarify([5, 0, -3, Number.NaN], 100, 100);
    expect(boxes.slice(1).every((box) => box.width === 0 && box.height === 0)).toBe(true);
  });

  test("o degrau da escala", () => {
    expect(heatStep(0, 0, 100, 5)).toBe(0);
    expect(heatStep(100, 0, 100, 5)).toBe(4);
    expect(heatStep(50, 0, 100, 5)).toBe(2);
    expect(heatStep(7, 7, 7, 5)).toBe(4);
  });

  test("o rotulo que nao cabe some inteiro, e nao vira reticencias", () => {
    expect(labelFit("Serviços", "600", 200, 60)).toBe("both");
    expect(labelFit("Serviços", "600", 200, 30)).toBe("name");
    expect(labelFit("Serviços", "600", 40, 60)).toBe("none");
    expect(labelFit("Serviços", "600", 200, 12)).toBe("none");
  });
});
