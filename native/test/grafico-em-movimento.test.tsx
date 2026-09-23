import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createElement, type ReactElement } from "react";
import { AccessibilityInfo } from "react-native";
import { timingCalls } from "react-native-reanimated";
import type { ReactTestRenderer } from "react-test-renderer";

import { tokens } from "../tokens";
import { RivoProvider } from "../src";
import { act, byType, render } from "./helpers";

mock.module("react-native-svg", () => {
  const host = (name: string) => (props: Record<string, unknown>) => createElement(name, props);

  return {
    default: host("Svg"),
    Svg: host("Svg"),
    Circle: host("Circle"),
    Line: host("Line"),
    Path: host("Path"),
    Rect: host("Rect"),
    G: host("G"),
  };
});

const { ChartDonut } = await import("../src/chart/chart-donut");
const { ChartRadial } = await import("../src/chart/chart-radial");
const { ChartBar, ChartLine } = await import("../src/chart/marks");
const { arcPath } = await import("../src/chart/arc");
const { Sparkline } = await import("../src/sparkline");

type Timing = {
  to: number | number[];
  config: { duration: number; easing: unknown; reduceMotion: string };
};

const timings = () => timingCalls as unknown as Timing[];

const reduceMotion = (enabled: boolean) =>
  act(() =>
    (AccessibilityInfo as unknown as { setReduceMotion: (next: boolean) => void }).setReduceMotion(
      enabled,
    ),
  );

const quiet = () => {
  timingCalls.length = 0;
};

beforeEach(quiet);

afterEach(() => {
  reduceMotion(false);
  quiet();
});

const swap = (screen: ReactTestRenderer, element: ReactElement) =>
  act(() => screen.update(<RivoProvider>{element}</RivoProvider>));

const slow = {
  duration: tokens.scales["duration-slow"],
  easing: { bezier: [...tokens.easings.ease] },
  reduceMotion: "never",
};

const paths = (screen: ReactTestRenderer) =>
  byType(screen, "Path").map((node) => String(node.props.d));

const SLICES = (servico: number, produto: number) => [
  { natureza: "servico", total: servico },
  { natureza: "produto", total: produto },
];

const donut = (servico: number, produto: number) => (
  <ChartDonut data={SLICES(servico, produto)} valueKey="total" nameKey="natureza" legend={false} />
);

describe("ChartDonut", () => {
  test("nasce no valor, sem animar, e cada fatia anda ate o angulo novo no tempo slow", () => {
    const screen = render(donut(60, 40));
    expect(timings()).toEqual([]);
    const before = paths(screen);
    expect(before).toHaveLength(2);

    swap(screen, donut(25, 75));
    const middle = (44 + 44 * (1 - 0.34)) / 2;
    const after = paths(screen);
    expect(after).toEqual([arcPath(middle, 1, 89), arcPath(middle, 91, 359)]);
    expect(after).not.toEqual(before);

    expect(timings().map((call) => call.to)).toEqual([89, 91]);
    for (const call of timings()) expect(call.config).toEqual(slow);
  });

  test("com reduzir movimento, a fatia salta para o valor novo", () => {
    reduceMotion(true);
    quiet();
    const screen = render(donut(60, 40));
    swap(screen, donut(25, 75));
    expect(timings().length).toBeGreaterThan(0);
    for (const call of timings()) {
      expect(call.config.duration).toBe(0);
      expect(call.config.reduceMotion).toBe("always");
    }
  });
});

describe("ChartRadial", () => {
  test("o arco do valor anda ate o novo, e o trilho fica parado", () => {
    const screen = render(<ChartRadial value={40} />);
    expect(timings()).toEqual([]);

    swap(screen, <ChartRadial value={80} />);
    expect(timings()).toEqual([{ to: -135 + 270 * 0.8, config: slow }]);
    expect(paths(screen)).toEqual([arcPath(42, -135, 135), arcPath(42, -135, -135 + 270 * 0.8)]);
  });

  test("com reduzir movimento, o arco salta", () => {
    reduceMotion(true);
    quiet();
    const screen = render(<ChartRadial value={40} />);
    swap(screen, <ChartRadial value={80} />);
    expect(timings()).toHaveLength(1);
    expect(timings()[0]!.config.duration).toBe(0);
  });
});

describe("ChartBar e ChartLine", () => {
  test("a barra nasce no lugar e, com o valor novo, anda o topo e a altura no tempo slow", () => {
    const bar = (y: number, height: number) => (
      <ChartBar x={10} y={y} width={20} height={height} fill="#000" radius={2} />
    );
    const screen = render(bar(60, 40));
    expect(timings()).toEqual([]);
    expect(byType(screen, "Rect")[0]!.props).toMatchObject({ x: 10, y: 60, width: 20, height: 40 });

    swap(screen, bar(20, 80));
    expect(timings()).toEqual([
      { to: 20, config: slow },
      { to: 80, config: slow },
    ]);
    expect(byType(screen, "Rect")[0]!.props).toMatchObject({ x: 10, y: 20, width: 20, height: 80 });
  });

  test("a linha anda ponto a ponto quando a contagem e a mesma, e troca de uma vez quando nao e", () => {
    const line = (ys: number[]) => (
      <ChartLine points={ys.map((y, index) => ({ x: index * 10, y }))} stroke="#000" />
    );
    const screen = render(line([5, 15]));
    expect(timings()).toEqual([]);
    expect(paths(screen)).toEqual(["M 0.00 5.00 L 10.00 15.00"]);

    swap(screen, line([30, 1]));
    expect(timings()).toEqual([{ to: [0, 30, 10, 1], config: slow }]);
    expect(paths(screen)).toEqual(["M 0.00 30.00 L 10.00 1.00"]);

    timingCalls.length = 0;
    swap(screen, line([30, 1, 8]));
    expect(timings()).toEqual([]);
    expect(paths(screen)).toEqual(["M 0.00 30.00 L 10.00 1.00 L 20.00 8.00"]);
  });

  test("com reduzir movimento, a barra salta", () => {
    reduceMotion(true);
    quiet();
    const screen = render(<ChartBar x={0} y={10} width={4} height={10} fill="#000" />);
    swap(screen, <ChartBar x={0} y={5} width={4} height={15} fill="#000" />);
    expect(timings().map((call) => call.config.duration)).toEqual([0, 0]);
  });
});

describe("Sparkline", () => {
  test("fica parada: miniatura de tabela nao anima, nem na troca de dados", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../src/sparkline.tsx", import.meta.url)),
      "utf8",
    );
    expect(source).not.toMatch(/react-native-reanimated|\.\/motion/);

    const screen = render(<Sparkline data={[1, 4, 2]} variant="bar" />);
    swap(screen, <Sparkline data={[9, 1, 5]} variant="bar" />);
    expect(timings()).toEqual([]);
  });
});
