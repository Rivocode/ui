"use client";

import type { ComponentProps, ReactNode } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { cn } from "../lib/cn";
import { percent } from "../shared/format";
import { useTokenMotion } from "./use-chart-motion";

export type ChartRadialProps = Omit<ComponentProps<"div">, "color" | "children"> & {
  /**
   * From 0 to `max`. Above that the arc stops at the end, and does not wrap around, but the text
   * states the real value. `NaN`, infinity or a `max` with no size become "—".
   */
  value: number;
  max?: number;
  /** The arc's color. Without it, the theme accent. */
  color?: string;
  /** The big number in the middle. Without it, the percentage. */
  centerValue?: ReactNode;
  /** The small line below the number. */
  centerLabel?: ReactNode;
  /** Where the arc starts and ends, in degrees. `360` closes the circle. */
  sweep?: number;
  className?: string;
  /** What the screen reader hears. */
  label?: string;
  /**
   * `solid` draws a smooth arc; `segmented` draws the arc in dashes, which
   * is the most requested gauge variation in dashboards and cost 42 lines of SVG
   * in the consumer's project - with the color hardcoded, so not responding to the theme.
   */
  variant?: "solid" | "segmented";
  /** How many dashes, in `segmented`. */
  segments?: number;
};

export function ChartRadial({
  value,
  max = 100,
  color = "var(--rc-accent)",
  centerValue,
  centerLabel,
  sweep = 270,
  className,
  label,
  variant = "solid",
  segments = 44,
  ...rest
}: ChartRadialProps) {
  const motion = useTokenMotion(null);
  const known = Number.isFinite(value) && Number.isFinite(max) && max > 0;
  const clamped = known ? Math.max(0, Math.min(value, max)) : 0;
  const percentage = known ? Math.round((clamped / max) * 100) : 0;
  const written = known ? percent((value / max) * 100) : "—";

  const start = 90 + sweep / 2;
  const end = start - sweep;

  return (
    <div
      className={cn("relative h-44 w-full", className)}
      role="img"
      aria-label={label ?? written}
      {...rest}
    >
      {variant === "segmented" ? (
        <SegmentedArc percentage={percentage} sweep={sweep} segments={segments} color={color} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ value: clamped }]}
            startAngle={start}
            endAngle={end}
            innerRadius="72%"
            outerRadius="100%"
            barSize={14}
            tabIndex={-1}
            aria-hidden="true"
          >
            <PolarAngleAxis
              type="number"
              domain={[0, known ? max : 1]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              angleAxisId={0}
              fill={color}
              cornerRadius={999}
              background={{ fill: "var(--rc-skeleton)" }}
              {...motion}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="max-w-[62%] text-center font-display font-rc-display text-2xl leading-tight text-balance text-fg">
          {centerValue ?? written}
        </span>
        {centerLabel && (
          <span className="mt-0.5 max-w-[70%] text-center text-xs text-fg-subtle">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function SegmentedArc({
  percentage,
  sweep,
  segments,
  color,
}: {
  percentage: number;
  sweep: number;
  segments: number;
  color: string;
}) {
  const lit = Math.round((percentage / 100) * segments);
  const first = -sweep / 2;
  const step = segments > 1 ? sweep / (segments - 1) : 0;

  return (
    <svg viewBox="-50 -50 100 100" className="h-full w-full" aria-hidden="true">
      {Array.from({ length: segments }, (_, index) => {
        const angle = first + index * step;
        const on = index < lit;

        return (
          <line
            key={index}
            data-rc-tick={on ? "on" : "off"}
            className={on ? "animate-appear" : undefined}
            style={
              on ? { animationDelay: `calc(var(--rc-duration-slow) * ${index / lit})` } : undefined
            }
            x1={0}
            y1={-46}
            x2={0}
            y2={-38}
            stroke={on ? color : "var(--rc-skeleton)"}
            strokeWidth={2.4}
            strokeLinecap="round"
            transform={`rotate(${angle})`}
          />
        );
      })}
    </svg>
  );
}
