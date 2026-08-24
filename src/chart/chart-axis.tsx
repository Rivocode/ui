"use client";

import type { ComponentProps } from "react";
import { XAxis, YAxis } from "recharts";

import { resolveFormat, type Format } from "./format";

/* ---------------------------------------------------------------------------
 * The axes.
 *
 * Recharts draws an axis the 2015 way: thick line, a tick mark on every value,
 * raw number. Every chart in the library turned those three off by hand, and
 * repeated `tickLine={false} axisLine={false}` on each screen, until someone
 * forgot, and one chart came out different from the rest.
 *
 * Here the default is already right, and what is left is what actually
 * changes: which field the axis reads, and how the number appears.
 * ------------------------------------------------------------------------- */

type BaseX = ComponentProps<typeof XAxis>;
type BaseY = ComponentProps<typeof YAxis>;

export type ChartXAxisProps = Omit<BaseX, "tickFormatter"> & {
  /** `'monthShort'`, `'dayMonth'`, or a function of your own. */
  format?: Format;
};

export type ChartYAxisProps = Omit<BaseY, "tickFormatter"> & {
  /** `'currencyShort'`, `'compact'`, `'percent'`, `'integer'`, or a function of your own. */
  format?: Format;
};

/**
 * The bottom axis: category or time.
 *
 * ```tsx
 * <ChartXAxis dataKey="month" />
 * <ChartXAxis dataKey="day" format="dayMonth" />
 * ```
 */
export function ChartXAxis({ format, ...props }: ChartXAxisProps) {
  return (
    <XAxis
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      minTickGap={16}
      tickFormatter={resolveFormat(format)}
      {...props}
    />
  );
}

/**
 * The left axis: the magnitude.
 *
 * ```tsx
 * <ChartYAxis format="currencyShort" />
 * <ChartYAxis format="percent" domain={[0, 100]} />
 * ```
 *
 * `width` is smaller than Recharts' on purpose: with the number abbreviated by
 * the format, their default width leaves a gap between the axis and the chart
 * area, and everyone compensated with `margin={{ left: -20 }}`. Pass your own
 * when the numbers are longer than a short currency.
 */
export function ChartYAxis({ format, ...props }: ChartYAxisProps) {
  return (
    <YAxis
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      // Wide enough for `R$ 246,7 mil`, which is what `currencyShort` writes
      // at the top of a dashboard axis. At 48 the label wrapped onto three
      // lines and the axis turned into a paragraph.
      width={64}
      tickFormatter={resolveFormat(format)}
      {...props}
    />
  );
}
