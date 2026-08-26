"use client";

import type { ComponentProps } from "react";
import { XAxis, YAxis } from "recharts";

import { resolveFormat, type Format } from "./format";

type BaseX = ComponentProps<typeof XAxis>;
type BaseY = ComponentProps<typeof YAxis>;

export type ChartXAxisProps = Omit<BaseX, "tickFormatter"> & {
  /** `'monthShort'`, `'dayMonth'`, ou uma funcao propria. */
  format?: Format;
};

export type ChartYAxisProps = Omit<BaseY, "tickFormatter"> & {
  /** `'currencyShort'`, `'compact'`, `'percent'`, `'integer'`, ou uma funcao propria. */
  format?: Format;
};

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

export function ChartYAxis({ format, ...props }: ChartYAxisProps) {
  return (
    <YAxis
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      width={56}
      tickFormatter={resolveFormat(format)}
      {...props}
    />
  );
}
