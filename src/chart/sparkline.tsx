"use client";

import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts";

import { cn } from "../lib/cn";

export type SparklineProps = {
  /** Just the numbers, in time order. */
  data: number[];
  /**
   * `line` for pure trend, `area` when volume also counts, `bar`
   * for counts per period - issuances per day, tickets per week.
   *
   * `bar` is the only one that crosses over to `@rivocode/ui-native`: area needs a
   * filled polygon, which cannot be done without SVG. The name means the same thing
   * in both, and the absence is written in the parity table.
   */
  variant?: "line" | "area" | "bar";
  /**
   * The color. Accepts a token: `var(--rc-accent)`. Without it, the theme accent, which is
   * the neutral reading of "this is a number on this screen".
   */
  color?: string;
  /**
   * Paints green or red depending on whether it goes up or down from the first to the last
   * point. Use it only when going up is good: for cost, going up is bad.
   *
   * It is not called `tone` on purpose, and "fixing" it does not help: in the rest of the
   * catalog - `Badge`, `Alert`, `Tracker`, `Timeline`, `MenuItem` - `tone` is
   * the semantic color scale (`success`, `danger`, `warning`, `info`), with
   * other values. Two things with the same name cost more than a name unique
   * to this piece.
   */
  trend?: "auto" | "none";
  className?: string;
  /** What the screen reader hears. Without this it is hidden from it. */
  label?: string;
};

export function Sparkline({
  data,
  variant = "line",
  color,
  trend = "none",
  className,
  label,
}: SparklineProps) {
  const points = data.map((value, index) => ({ i: index, v: value }));

  const first = data[0];
  const last = data[data.length - 1];
  const autoColor =
    data.length < 2 || first === undefined || last === undefined
      ? "var(--rc-accent)"
      : last >= first
        ? "var(--rc-success)"
        : "var(--rc-danger)";
  const stroke = color ?? (trend === "auto" ? autoColor : "var(--rc-accent)");

  const shared = {
    data: points,
    margin: { top: 2, right: 2, bottom: 2, left: 2 },
    tabIndex: -1,
    "aria-hidden": true,
  };

  return (
    <div
      className={cn("h-8 w-24 [&_.recharts-surface]:animate-appear", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart {...shared}>
            <Bar dataKey="v" fill={stroke} radius={1} isAnimationActive={false} />
          </BarChart>
        ) : variant === "area" ? (
          <AreaChart {...shared}>
            <Area
              dataKey="v"
              stroke={stroke}
              strokeWidth={1.5}
              fill={stroke}
              fillOpacity={0.16}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart {...shared}>
            <Line
              dataKey="v"
              stroke={stroke}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
