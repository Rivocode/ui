import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Children, isValidElement, type ReactNode } from "react";
import { Line, LineChart } from "recharts";

import { ChartContainer, seriesColors, type ChartConfig } from "../src/chart/chart";
import { ChartDonut, donutTipPlace } from "../src/chart/chart-donut";
import { ChartFunnel } from "../src/chart/chart-funnel";
import { ChartHeatmap } from "../src/chart/chart-heatmap";
import { ChartRadial } from "../src/chart/chart-radial";
import { ChartTreemap } from "../src/chart/chart-treemap";
import { Sparkline } from "../src/chart/sparkline";
import { RivoProvider } from "../src/provider/rivo-provider";

const IDENT = /^--color-[\p{L}\p{N}_-]+$/u;

const EMPTY = { title: "Nada neste mês", description: "Nenhuma nota foi emitida." };

function withTheme(node: ReactNode, dir: "ltr" | "rtl" = "ltr") {
  return render(
    <RivoProvider scope="local" dir={dir}>
      {node}
    </RivoProvider>,
  );
}

test("chave de serie com espaco ou ponto vira variavel de CSS valida, a mesma na declaracao e na marca", () => {
  const config: ChartConfig = {
    "Receita total": { label: "Receita total" },
    "v1.2": { label: "Versao" },
    faturado: { label: "Faturado" },
  };
  const data = [{ m: 1, "Receita total": 2, "v1.2": 3, faturado: 4 }];
  const chart = (
    <LineChart data={data}>
      <Line dataKey="Receita total" />
      <Line dataKey="v1.2" />
      <Line dataKey="faturado" />
    </LineChart>
  );

  const { container } = withTheme(
    <ChartContainer config={config} className="h-40">
      {chart}
    </ChartContainer>,
  );
  const declared = [
    ...(container.querySelector("style")!.textContent ?? "").matchAll(/(--color-[^:]+):/g),
  ].map((match) => match[1]!);
  expect(declared).toHaveLength(3);
  for (const name of declared) expect(name).toMatch(IDENT);
  expect(declared).toContain("--color-faturado");

  const painted = seriesColors(chart, config).chart;
  const strokes = Children.toArray((painted.props as { children: ReactNode }).children).map(
    (line) => (isValidElement(line) ? (line.props as { stroke: string }).stroke : ""),
  );
  expect(strokes).toEqual(declared.map((name) => `var(${name})`));
});

test("a cor da fatia sem color segue a ordem do config, e nao a do data", () => {
  const config: ChartConfig = { produto: { label: "Produto" }, servico: { label: "Serviço" } };
  const { container } = withTheme(
    <ChartDonut
      data={[
        { natureza: "servico", total: 10 },
        { natureza: "produto", total: 20 },
      ]}
      valueKey="total"
      nameKey="natureza"
      config={config}
    />,
  );

  const swatches = [...container.querySelectorAll("li > span[aria-hidden]")].map(
    (swatch) => (swatch as HTMLElement).style.background,
  );
  expect(swatches).toEqual(["var(--rc-chart-2)", "var(--rc-chart-1)"]);
});

test("o arco sem numero diz travessao, e acima do maximo diz o valor real", () => {
  const read = (node: ReactNode) => {
    const { container, unmount } = withTheme(node);
    const root = container.querySelector("[role=img]")!;
    const text = [root.getAttribute("aria-label"), root.textContent];
    unmount();
    return text;
  };

  expect(read(<ChartRadial value={Number.NaN} />)).toEqual(["—", "—"]);
  expect(read(<ChartRadial value={10} max={0} />)).toEqual(["—", "—"]);
  expect(read(<ChartRadial value={140} />)).toEqual(["140%", "140%"]);
  expect(read(<ChartRadial value={41} max={50} />)).toEqual(["82%", "82%"]);
});

test("no rtl o mapa espelha as caixas, e a seta que anda para frente vai para a esquerda na tela", () => {
  const data = [
    { nome: "A", total: 60 },
    { nome: "B", total: 40 },
  ];
  const place = (dir: "ltr" | "rtl") => {
    const { container, unmount } = withTheme(
      <ChartTreemap data={data} valueKey="total" nameKey="nome" label="Por nome" />,
      dir,
    );
    const tiles = [...container.querySelectorAll<HTMLElement>("[data-rc-tile]")].map((tile) => ({
      left: Number.parseFloat(tile.style.left),
      width: Number.parseFloat(tile.style.width),
    }));
    unmount();
    return tiles;
  };

  const ltr = place("ltr");
  const rtl = place("rtl");
  expect(ltr.length).toBe(2);
  expect(rtl[0]!.left).toBeCloseTo(100 - ltr[0]!.left - ltr[0]!.width, 5);
  expect(rtl[1]!.left).toBeCloseTo(100 - ltr[1]!.left - ltr[1]!.width, 5);
  expect(rtl[1]!.left).toBeLessThan(rtl[0]!.left);

  const { container } = withTheme(
    <ChartTreemap data={data} valueKey="total" nameKey="nome" label="Por nome" />,
    "rtl",
  );
  const group = screen.getByRole("group", { name: "Por nome" });
  fireEvent.focus(group);
  fireEvent.keyDown(group, { key: "ArrowLeft" });
  const cursor = container.querySelector<HTMLElement>("[data-rc-tile-cursor]")!;
  expect(Number.parseFloat(cursor.style.left)).toBeCloseTo(rtl[1]!.left, 5);
});

function strokeOf(node: unknown): string | undefined {
  if (!isValidElement(node)) return undefined;
  const props = node.props as { stroke?: string; children?: unknown };
  if (typeof props.stroke === "string") return props.stroke;
  for (const child of Children.toArray(props.children as ReactNode)) {
    const found = strokeOf(child);
    if (found) return found;
  }
  return undefined;
}

test("a sparkline de um ponto so nao tem tendencia, e sai neutra", () => {
  expect(strokeOf(Sparkline({ data: [5], trend: "auto" }))).toBe("var(--rc-accent)");
  expect(strokeOf(Sparkline({ data: [], trend: "auto" }))).toBe("var(--rc-accent)");
  expect(strokeOf(Sparkline({ data: [5, 3], trend: "auto" }))).toBe("var(--rc-danger)");
});

test("a dica da rosca fica inteira dentro da moldura e fora do buraco, em qualquer tamanho", () => {
  const sizes = [
    [160, 192],
    [240, 192],
    [256, 192],
    [320, 192],
    [358, 192],
    [390, 192],
    [500, 192],
    [640, 192],
    [1200, 192],
  ] as const;
  const tips = [
    [120, 38],
    [162, 38],
    [180, 60],
  ] as const;
  const holes = [0.88 * (1 - 0.34), 0.88 * (1 - 0.5), 0.88 * (1 - 0.2)];
  let checked = 0;

  for (const [width, height] of sizes) {
    for (const [tipWidth, tipHeight] of tips) {
      for (const hole of holes) {
        const { left, top } = donutTipPlace(width, height, tipWidth, tipHeight, hole);
        const inner = (Math.min(width, height) / 2) * hole;
        const middleX = width / 2;
        const middleY = height / 2;
        const dx = Math.max(left - middleX, 0, middleX - (left + tipWidth));
        const dy = Math.max(top - middleY, 0, middleY - (top + tipHeight));

        expect(top).toBeGreaterThanOrEqual(0);
        expect(top + tipHeight).toBeLessThanOrEqual(height);
        expect(left).toBeGreaterThanOrEqual(0);
        expect(left + tipWidth).toBeLessThanOrEqual(Math.max(width, tipWidth));
        expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(Math.min(inner, middleY - tipHeight));
        expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(24);
        checked += 1;
      }
    }
  }
  expect(checked).toBe(sizes.length * tips.length * holes.length);
});

function withSize<T>(width: number, height: number, run: () => Promise<T>) {
  const keys = ["clientWidth", "offsetWidth", "clientHeight", "offsetHeight"] as const;
  const saved = keys.map((key) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));
  const savedRect = HTMLElement.prototype.getBoundingClientRect;
  const rect = { width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0 };
  HTMLElement.prototype.getBoundingClientRect = () => ({ ...rect, toJSON: () => rect }) as DOMRect;
  for (const key of keys) {
    const value = key.endsWith("Width") ? width : height;
    Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => value });
  }
  return run().finally(() => {
    HTMLElement.prototype.getBoundingClientRect = savedRect;
    keys.forEach((key, index) => {
      const descriptor = saved[index];
      if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
    });
  });
}

const HIDING = ["opacity-0", "invisible", "hidden", "sr-only"];

test("o miolo da rosca continua visivel enquanto a dica le uma fatia", () =>
  withSize(320, 192, async () => {
    const { container } = withTheme(
      <ChartDonut
        data={[
          { natureza: "servico", total: 1 },
          { natureza: "produto", total: 2 },
        ]}
        valueKey="total"
        nameKey="natureza"
        centerValue="R$ 3"
        centerLabel="no mes"
      />,
    );
    await Bun.sleep(30);
    const sectors = container.querySelectorAll(".recharts-pie-sector");
    expect(sectors.length).toBeGreaterThan(1);
    fireEvent.mouseOver(sectors[sectors.length - 1]!);
    await Bun.sleep(20);

    expect(container.querySelector("[data-rc-donut-tip]")).not.toBeNull();
    let node: Element | null = screen.getByText("R$ 3");
    let steps = 0;
    while (node && node !== container) {
      const tokens = (node.getAttribute("class") ?? "").split(" ");
      for (const hiding of HIDING) expect(tokens).not.toContain(hiding);
      const style = (node as HTMLElement).style;
      expect(style.opacity === "0" || style.visibility === "hidden").toBe(false);
      node = node.parentElement;
      steps += 1;
    }
    expect(steps).toBeGreaterThan(1);
  }));

test("o anel de fundo da rosca e desenhado com dados, zerada e vazia sem empty", () =>
  withSize(320, 192, async () => {
    const cases = [
      [
        { natureza: "servico", total: 1 },
        { natureza: "produto", total: 2 },
      ],
      [{ natureza: "servico", total: 0 }],
      [],
    ];
    for (const data of cases) {
      const view = withTheme(<ChartDonut data={data} valueKey="total" nameKey="natureza" />);
      await Bun.sleep(30);
      const fills = [...view.container.querySelectorAll("path")].map((path) =>
        path.getAttribute("fill"),
      );
      expect(fills).toContain("var(--rc-border)");
      view.unmount();
    }
  }));

test("a rosca vazia ou zerada mostra o empty, e sem ele o anel com o miolo", () => {
  const first = withTheme(
    <ChartDonut data={[]} valueKey="total" nameKey="natureza" empty={EMPTY} centerValue="R$ 0" />,
  );
  expect(screen.getByText("Nada neste mês")).toBeDefined();
  expect(screen.queryByText("R$ 0")).toBeNull();
  first.unmount();

  const zero = [
    { natureza: "servico", total: 0 },
    { natureza: "produto", total: 0 },
  ];
  const second = withTheme(
    <ChartDonut data={zero} valueKey="total" nameKey="natureza" empty={EMPTY} />,
  );
  expect(screen.getByText("Nada neste mês")).toBeDefined();
  second.unmount();

  const { container } = withTheme(
    <ChartDonut data={zero} valueKey="total" nameKey="natureza" centerValue="R$ 0" />,
  );
  expect(screen.queryByText("Nada neste mês")).toBeNull();
  expect(screen.getByText("R$ 0")).toBeDefined();
  expect(container.querySelectorAll("li")).toHaveLength(2);
});

test("funil, mapa e grade de calor mostram o empty quando nao ha o que desenhar", () => {
  const funnel = withTheme(
    <ChartFunnel
      data={[{ etapa: "Emitidas", total: 0 }]}
      valueKey="total"
      nameKey="etapa"
      empty={EMPTY}
    />,
  );
  expect(screen.getByText("Nada neste mês")).toBeDefined();
  expect(document.querySelector("[data-rc-funnel-stage]")).toBeNull();
  funnel.unmount();

  const treemap = withTheme(
    <ChartTreemap
      data={[{ nome: "A", total: 0 }]}
      valueKey="total"
      nameKey="nome"
      label="Por nome"
      empty={EMPTY}
    />,
  );
  expect(screen.getByText("Nada neste mês")).toBeDefined();
  expect(screen.queryByRole("group", { name: "Por nome" })).toBeNull();
  treemap.unmount();

  withTheme(
    <ChartHeatmap
      data={[] as { dia: string; hora: string; total: number }[]}
      rowKey="dia"
      columnKey="hora"
      valueKey="total"
      label="Emissao por hora"
      empty={EMPTY}
    />,
  );
  expect(screen.getByText("Nada neste mês")).toBeDefined();
  expect(screen.queryByRole("group", { name: "Emissao por hora" })).toBeNull();
});

test("a moldura sem empty e com lista vazia avisa, em vez de eixos sobre o nada", () => {
  const config: ChartConfig = { faturado: { label: "Faturado" } };
  const first = withTheme(
    <ChartContainer config={config} className="h-40">
      <LineChart data={[]}>
        <Line dataKey="faturado" />
      </LineChart>
    </ChartContainer>,
  );
  expect(screen.getByText("Sem dados no período")).toBeDefined();
  first.unmount();

  withTheme(
    <ChartContainer config={config} className="h-40" labels={{ noData: "No data" }}>
      <LineChart data={[]}>
        <Line dataKey="faturado" />
      </LineChart>
    </ChartContainer>,
  );
  expect(screen.getByText("No data")).toBeDefined();
});

test("a pizza com miolo escrito mantem a largura do texto, e nao zero", () => {
  withTheme(
    <ChartDonut
      data={[{ natureza: "servico", total: 1 }]}
      valueKey="total"
      nameKey="natureza"
      thickness={1}
      centerValue="R$ 1"
    />,
  );
  const width = screen.getByText("R$ 1").style.maxWidth;
  expect(width).not.toContain("0cqmin");
  expect(width).toBe("52%");
});

test("a grade de calor com todas as celulas em zero ou sem numero mostra o empty", () => {
  const rows = [
    [
      { dia: "Seg", hora: "9h", total: 0 },
      { dia: "Ter", hora: "9h", total: 0 },
    ],
    [{ dia: "Seg", hora: "9h", total: null }],
  ];
  for (const data of rows) {
    const view = withTheme(
      <ChartHeatmap
        data={data as { dia: string; hora: string; total: number | null }[]}
        rowKey="dia"
        columnKey="hora"
        valueKey="total"
        label="Emissao por hora"
        empty={EMPTY}
      />,
    );
    expect(screen.getByText("Nada neste mês")).toBeDefined();
    view.unmount();
  }
  withTheme(
    <ChartHeatmap
      data={[{ dia: "Seg", hora: "9h", total: 3 }]}
      rowKey="dia"
      columnKey="hora"
      valueKey="total"
      label="Emissao por hora"
      empty={EMPTY}
    />,
  );
  expect(screen.queryByText("Nada neste mês")).toBeNull();
});
