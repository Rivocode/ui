import { afterEach, beforeAll, expect, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Bar, BarChart, Line, LineChart, XAxis } from "recharts";

import { ChartContainer, seriesColors, type ChartConfig } from "../src/chart/chart";
import { readChartMotion, STILL, type ChartMotion } from "../src/chart/use-chart-motion";
import { DataTable, type Column } from "../src/components/data-table";
import { Editable } from "../src/components/editable";
import { FileUploadItem } from "../src/components/file-upload";
import { SETTLED } from "../src/shared/settled";

const CONFIG: ChartConfig = { emitidas: { label: "Emitidas" } };
const POINTS = [{ mes: "Mar", emitidas: 3 }];

const shapeTokens = await Bun.file("src/tokens/forma.css").text();
const root = shapeTokens.slice(0, shapeTokens.indexOf("}"));
const SLOW = Number(/--rc-duration-slow:\s*(\d+)ms/.exec(root)![1]);
const EASE = /--rc-ease:\s*cubic-bezier\(([^)]+)\)/
  .exec(root)![1]!
  .split(",")
  .map((point) => Number(point.trim()));

beforeAll(() => {
  const style = document.createElement("style");
  style.textContent = root.replace(":root", ":root, [data-rc-chart]") + "}";
  document.head.append(style);
});

const realMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = realMatchMedia;
});

function reduceMotion() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, SETTLED + 60));
  });

function marks(node: ReactNode): ReactElement[] {
  const found: ReactElement[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    found.push(child);
    found.push(...marks((child.props as { children?: ReactNode }).children));
  });
  return found;
}

const MOVING: ChartMotion = {
  isAnimationActive: true,
  animationDuration: SLOW,
  animationEasing: `cubic-bezier(${EASE.join(",")})` as ChartMotion["animationEasing"],
};

test("a duracao e a curva da Recharts saem dos tokens do forma.css", () => {
  expect(SLOW).toBeGreaterThan(0);
  expect(readChartMotion(document.documentElement)).toEqual(MOVING);

  const zeroed = document.createElement("div");
  zeroed.style.setProperty("--rc-duration-slow", "0ms");
  document.body.append(zeroed);
  expect(readChartMotion(zeroed)).toEqual(STILL);
  zeroed.remove();
});

test("a moldura veste toda marca que anima, e respeita quem desligou a mao", () => {
  const chart = (
    <LineChart data={POINTS}>
      <XAxis dataKey="mes" />
      <Line dataKey="emitidas" />
      <Line dataKey="emitidas" isAnimationActive={false} />
      <Line dataKey="emitidas" animationDuration={900} />
    </LineChart>
  );
  const [axis, free, off, slower] = marks(
    (seriesColors(chart, CONFIG, MOVING).chart.props as { children: ReactNode }).children,
  ) as ReactElement<Record<string, unknown>>[];

  expect(axis!.props.isAnimationActive).toBeUndefined();
  expect(free!.props).toMatchObject(MOVING);
  expect(off!.props.isAnimationActive).toBe(false);
  expect(slower!.props.animationDuration).toBe(900);
  expect(slower!.props.animationEasing).toBe(MOVING.animationEasing);

  const bars = seriesColors(
    <BarChart data={POINTS}>
      <Bar dataKey="emitidas" isAnimationActive />
    </BarChart>,
    CONFIG,
    STILL,
  );
  const [bar] = marks((bars.chart.props as { children: ReactNode }).children) as ReactElement<
    Record<string, unknown>
  >[];
  expect(bar!.props.isAnimationActive).toBe(false);
});

function Probe(props: Record<string, unknown>) {
  seen.push(props);
  return null;
}
Probe.displayName = "Line";

function Frame({ children }: { data: unknown[]; children: ReactNode }) {
  return <>{children}</>;
}

let seen: Record<string, unknown>[] = [];

const framed = (loading = false) => (
  <ChartContainer config={CONFIG} isLoading={loading} className="h-40">
    <Frame data={POINTS}>
      <Probe dataKey="emitidas" />
    </Frame>
  </ChartContainer>
);

function measured() {
  seen = [];
  const real = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 400,
      height: 200,
      top: 0,
      left: 0,
      right: 400,
      bottom: 200,
      x: 0,
      y: 0,
    } as DOMRect;
  };
  return () => {
    HTMLElement.prototype.getBoundingClientRect = real;
  };
}

test("o grafico nasce pronto: a primeira pintura nao anima, e a troca de dado anima", async () => {
  const restore = measured();
  const view = render(framed());
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, SETTLED / 2));
  });
  expect(seen.at(-1)!.isAnimationActive).toBe(false);
  await settle();
  expect(seen.length).toBeGreaterThan(1);

  expect(seen[0]!.isAnimationActive).toBe(false);
  expect(seen.at(-1)).toMatchObject(MOVING);

  seen = [];
  view.rerender(framed(true));
  view.rerender(framed());
  expect(seen[0]!.isAnimationActive).toBe(false);
  await settle();
  expect(seen.at(-1)!.isAnimationActive).toBe(true);
  restore();
});

test("com reduzir movimento, a moldura nunca liga a animacao", async () => {
  reduceMotion();
  const restore = measured();
  render(framed());
  await settle();
  restore();
  expect(seen.length).toBeGreaterThan(0);
  for (const props of seen) expect(props.isAnimationActive).toBe(false);
});

test("a rosca e o arco animam pelo mesmo gancho; a Sparkline fica parada nas tres formas", async () => {
  const files = ["chart-donut", "chart-radial", "sparkline"];
  const [donut, radial, sparkline] = await Promise.all(
    files.map((name) => Bun.file(`src/chart/${name}.tsx`).text()),
  );

  for (const code of [donut!, radial!]) {
    expect(code).toContain("useTokenMotion(null)");
    expect(code).toContain("{...motion}");
    expect(code).not.toContain("isAnimationActive={false}");
  }
  expect(sparkline!.match(/isAnimationActive=\{false\}/g)).toHaveLength(3);
  expect(sparkline).not.toContain("useTokenMotion");
});

type Invoice = { id: string; amount: number };

test("a seta de ordenacao e uma so, e gira meia volta ao inverter o sentido", () => {
  const columns: Column<Invoice>[] = [{ key: "amount", header: "Valor", sortable: true }];
  render(
    <DataTable
      data={[
        { id: "1", amount: 3 },
        { id: "2", amount: 1 },
      ]}
      columns={columns}
      rowKey={(row) => row.id}
    />,
  );
  const header = screen.getByRole("button", { name: /valor/i });
  const arrow = () => header.querySelector("svg")!;

  fireEvent.click(header);
  const rising = arrow();
  const tokens = rising.getAttribute("class")!.split(" ");
  expect(tokens).toContain("transition-transform");
  expect(tokens).toContain("duration-[var(--rc-duration-base)]");
  expect(tokens).not.toContain("rotate-180");

  fireEvent.click(header);
  expect(arrow()).toBe(rising);
  expect(arrow().getAttribute("class")!.split(" ")).toContain("rotate-180");
});

const FADE = "animate-[rc-fade_var(--rc-duration-base)_var(--rc-ease)_both]";

test("a troca entre leitura e edicao esmaece, e a leitura da primeira pintura nao", () => {
  const { container } = render(<Editable defaultValue="Clinica" label="Cliente" />);
  const shell = () => container.firstElementChild!;
  const reading = shell();
  expect(reading.className.split(" ")).not.toContain(FADE);

  fireEvent.click(screen.getByRole("button", { name: "Clinica" }));
  const editing = shell();
  expect(editing).not.toBe(reading);
  expect(editing.querySelector("input")).not.toBeNull();
  expect(editing.className.split(" ")).toContain(FADE);

  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  expect(shell()).not.toBe(editing);
  expect(shell().querySelector("button")).not.toBeNull();
  expect(shell().className.split(" ")).toContain(FADE);
});

test("a barra de progresso do arquivo anda ate o valor novo pela largura", () => {
  const { rerender } = render(
    <FileUploadItem name="nota.xml" size={100} progress={20} onRemove={() => {}} />,
  );
  const fill = () => screen.getByRole("progressbar").firstElementChild as HTMLElement;
  const before = fill();
  expect(before.style.width).toBe("20%");
  const tokens = before.className.split(" ");
  expect(tokens).toContain("transition-[width]");
  expect(tokens).toContain("duration-[var(--rc-duration-base)]");

  rerender(<FileUploadItem name="nota.xml" size={100} progress={70} onRemove={() => {}} />);
  expect(fill()).toBe(before);
  expect(fill().style.width).toBe("70%");
});
