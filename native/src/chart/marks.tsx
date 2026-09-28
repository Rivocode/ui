import Animated, { useAnimatedProps } from "react-native-reanimated";
import { Path, Rect } from "react-native-svg";

import { useTween } from "../motion";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type ChartBarProps = {
  /** The left edge, in px of the frame the container measured. */
  x: number;
  /**
   * The top of the bar, in px. On entry it rises from the base; when the value
   * changes, it is what moves.
   */
  y: number;
  /** The width, in px. */
  width: number;
  /**
   * The height, in px. On entry it grows from zero; it moves together with `y`,
   * and the base stays still.
   */
  height: number;
  /** The final color, as the frame's `colors` delivers it: `colors.receita`. */
  fill: string;
  /** The corner radius, in px. */
  radius?: number;
};

export function ChartBar({ x, y, width, height, fill, radius = 0 }: ChartBarProps) {
  const base = y + Math.max(0, height);
  const left = useTween(x);
  const top = useTween(y, "slow", base);
  const wide = useTween(Math.max(0, width));
  const tall = useTween(Math.max(0, height), "slow", 0);

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    return { x: left.value, y: top.value, width: wide.value, height: tall.value };
  });

  return <AnimatedRect animatedProps={animatedProps} fill={fill} rx={radius} ry={radius} />;
}

export type ChartPoint = { x: number; y: number };

export type ChartLineProps = {
  /**
   * The points, already in frame px, in axis order. With the same count as
   * before, each point moves to its new place; with a different count, the line
   * switches at once, because there is no pair to interpolate.
   */
  points: readonly ChartPoint[];
  /** The final stroke color: `colors.receita`. */
  stroke: string;
  /** The stroke thickness, in px. */
  strokeWidth?: number;
  /**
   * The `y` the line rises from on entry, in frame px: the axis base. Without
   * it, the line is born lying on the lowest point.
   */
  baseline?: number;
};

export function ChartLine({ points, stroke, strokeWidth = 2, baseline }: ChartLineProps) {
  const floor = baseline ?? Math.max(...points.map((point) => point.y));
  const flat = useTween(
    points.flatMap((point) => [point.x, point.y]),
    "slow",
    points.flatMap((point) => [point.x, floor]),
  );

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    const coordinates = flat.value;
    let d = "";
    for (let index = 0; index + 1 < coordinates.length; index += 2) {
      d += `${index === 0 ? "M" : " L"} ${coordinates[index]!.toFixed(2)} ${coordinates[index + 1]!.toFixed(2)}`;
    }
    return { d };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
