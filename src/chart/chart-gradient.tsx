"use client";

import { seriesId, seriesVar } from "./series-var";

export type ChartAreaGradientProps = {
  /**
   * The name of this set of gradients, unique on the page. Usually the chart's
   * subject: `"faturamento"`, `"emissao"`.
   */
  id: string;
  /** The series that get a gradient. The names are the same as in `config`. */
  series: readonly string[];
  /** Opacity at the top of the area. */
  from?: number;
  /** Opacity at the bottom, where it meets the axis. */
  to?: number;
};

export function areaGradient(id: string, name: string) {
  return `url(#rc-grad-${id}-${seriesId(name)})`;
}

export function ChartAreaGradient({ id, series, from = 0.3, to = 0.02 }: ChartAreaGradientProps) {
  return (
    <defs>
      {series.map((name) => (
        <linearGradient
          key={name}
          id={`rc-grad-${id}-${seriesId(name)}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={`var(${seriesVar(name)})`} stopOpacity={from} />
          <stop offset="100%" stopColor={`var(${seriesVar(name)})`} stopOpacity={to} />
        </linearGradient>
      ))}
    </defs>
  );
}
