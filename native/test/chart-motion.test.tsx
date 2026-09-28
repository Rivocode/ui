import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createElement, type ReactElement } from "react";
import { AccessibilityInfo } from "react-native";
import { sharedStarts, timingCalls } from "react-native-reanimated";
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
    Text: host("SvgText"),
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
  sharedStarts.length = 0;
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
  const middle = (44 + 44 * (1 - 0.34)) / 2;

  test("enters sweeping: each slice starts at zero and moves to its final angle in the slow duration", () => {
    const screen = render(donut(60, 40));
    expect(sharedStarts).toEqual([0, 0, 0, 0]);
    expect(timings().map((call) => call.to)).toEqual([1, 215, 217, 359]);
    for (const call of timings()) expect(call.config).toEqual(slow);
    expect(paths(screen)).toEqual([arcPath(middle, 1, 215), arcPath(middle, 217, 359)]);

    quiet();
    swap(screen, donut(60, 40));
    expect(timings()).toEqual([]);
  });

  test("with new data, each slice moves from its previous angle to the new one", () => {
    const screen = render(donut(60, 40));
    const before = paths(screen);
    quiet();

    swap(screen, donut(25, 75));
    const after = paths(screen);
    expect(after).toEqual([arcPath(middle, 1, 89), arcPath(middle, 91, 359)]);
    expect(after).not.toEqual(before);

    expect(timings().map((call) => call.to)).toEqual([89, 91]);
    for (const call of timings()) expect(call.config).toEqual(slow);
  });

  test("with reduce motion, the slice starts in place and jumps to the new value", () => {
    reduceMotion(true);
    quiet();
    const screen = render(donut(60, 40));
    expect(sharedStarts).toEqual([1, 215, 217, 359]);
    expect(timings()).toEqual([]);

    swap(screen, donut(25, 75));
    expect(timings().length).toBeGreaterThan(0);
    for (const call of timings()) {
      expect(call.config.duration).toBe(0);
      expect(call.config.reduceMotion).toBe("always");
    }
  });
});

describe("ChartRadial", () => {
  test("the arc starts at the beginning and sweeps to the value; with a new value it moves, and the track stays still", () => {
    const screen = render(<ChartRadial value={40} />);
    expect(sharedStarts).toEqual([-135]);
    expect(timings()).toEqual([{ to: -135 + 270 * 0.4, config: slow }]);

    quiet();
    swap(screen, <ChartRadial value={80} />);
    expect(timings()).toEqual([{ to: -135 + 270 * 0.8, config: slow }]);
    expect(paths(screen)).toEqual([arcPath(42, -135, 135), arcPath(42, -135, -135 + 270 * 0.8)]);
  });

  test("the dashed arc lights up from the first to the last lit dash", () => {
    const screen = render(<ChartRadial value={50} variant="segmented" segments={10} />);
    expect(sharedStarts).toEqual([0]);
    expect(timings()).toEqual([{ to: 5, config: slow }]);
    const lit = byType(screen, "Line").filter((line) => line.props.stroke !== undefined);
    expect(lit).toHaveLength(10);
    const strokes = lit.map((line) => String(line.props.stroke));
    expect(new Set(strokes.slice(0, 5)).size).toBe(1);
    expect(new Set(strokes.slice(5)).size).toBe(1);
    expect(strokes[0]).not.toBe(strokes[9]);
  });

  test("with reduce motion, the arc starts at the value and jumps", () => {
    reduceMotion(true);
    quiet();
    const screen = render(<ChartRadial value={40} />);
    expect(sharedStarts).toEqual([-135 + 270 * 0.4]);
    expect(timings()).toEqual([]);
    swap(screen, <ChartRadial value={80} />);
    expect(timings()).toHaveLength(1);
    expect(timings()[0]!.config.duration).toBe(0);
  });
});

describe("ChartBar and ChartLine", () => {
  const bar = (y: number, height: number) => (
    <ChartBar x={10} y={y} width={20} height={height} fill="#000" radius={2} />
  );

  test("the bar grows from the base on entry and, with a new value, moves its top and height in the slow duration", () => {
    const screen = render(bar(60, 40));
    expect(sharedStarts).toEqual([10, 100, 20, 0]);
    expect(timings()).toEqual([
      { to: 60, config: slow },
      { to: 40, config: slow },
    ]);
    expect(byType(screen, "Rect")[0]!.props).toMatchObject({ x: 10, y: 60, width: 20, height: 40 });

    quiet();
    swap(screen, bar(20, 80));
    expect(timings()).toEqual([
      { to: 20, config: slow },
      { to: 80, config: slow },
    ]);
    expect(byType(screen, "Rect")[0]!.props).toMatchObject({ x: 10, y: 20, width: 20, height: 80 });
  });

  test("the line rises from the base on entry, moves point by point with the same count, and swaps at once without it", () => {
    const line = (ys: number[], baseline?: number) => (
      <ChartLine
        points={ys.map((y, index) => ({ x: index * 10, y }))}
        stroke="#000"
        baseline={baseline}
      />
    );
    const screen = render(line([5, 15]));
    expect(sharedStarts).toEqual([[0, 15, 10, 15]]);
    expect(timings()).toEqual([{ to: [0, 5, 10, 15], config: slow }]);
    expect(paths(screen)).toEqual(["M 0.00 5.00 L 10.00 15.00"]);

    quiet();
    swap(screen, line([30, 1]));
    expect(timings()).toEqual([{ to: [0, 30, 10, 1], config: slow }]);
    expect(paths(screen)).toEqual(["M 0.00 30.00 L 10.00 1.00"]);

    quiet();
    swap(screen, line([30, 1, 8]));
    expect(timings()).toEqual([]);
    expect(paths(screen)).toEqual(["M 0.00 30.00 L 10.00 1.00 L 20.00 8.00"]);

    quiet();
    render(line([5, 15], 40));
    expect(sharedStarts).toEqual([[0, 40, 10, 40]]);
  });

  test("with reduce motion, the bar starts in place and jumps", () => {
    reduceMotion(true);
    quiet();
    const screen = render(<ChartBar x={0} y={10} width={4} height={10} fill="#000" />);
    expect(sharedStarts).toEqual([0, 10, 4, 10]);
    expect(timings()).toEqual([]);
    swap(screen, <ChartBar x={0} y={5} width={4} height={15} fill="#000" />);
    expect(timings().map((call) => call.config.duration)).toEqual([0, 0]);
  });
});

type Built = { preset: string; config: { duration: number } };

const entering = (screen: ReactTestRenderer) =>
  byType(screen, "View")
    .map((node) => node.props.entering as Built | undefined)
    .filter((built): built is Built => built !== undefined);

describe("Sparkline", () => {
  test("enters only fading in, in the base duration, and does not move when the data changes", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../src/sparkline.tsx", import.meta.url)),
      "utf8",
    );
    expect(source).not.toMatch(/react-native-reanimated/);

    for (const variant of ["bar", "line"] as const) {
      const screen = render(<Sparkline data={[1, 4, 2]} variant={variant} />);
      expect(entering(screen).map(({ preset, config }) => [preset, config.duration])).toEqual([
        ["FadeIn", tokens.scales["duration-base"]],
      ]);
      swap(screen, <Sparkline data={[9, 1, 5]} variant={variant} />);
    }
    expect(timings()).toEqual([]);
  });

  test("with reduce motion, the Sparkline appears still", () => {
    reduceMotion(true);
    const screen = render(<Sparkline data={[1, 4, 2]} variant="bar" />);
    expect(entering(screen)).toEqual([]);
  });
});
