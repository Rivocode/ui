"use client";

import type { ComponentProps, ReactNode } from "react";

import { EmptyState } from "../components/empty-state";

import { cn } from "../lib/cn";
import { percent, resolveFormat, type Format } from "../shared/format";
import type { Slots } from "../lib/slots";
import { funnelRates } from "../shared/chart-layout";

export type ChartFunnelProps<Stage> = Omit<ComponentProps<"div">, "children" | "color"> & {
  /**
   * The stages, in the order the person goes through them: the first is the mouth of the funnel.
   */
  data: Stage[];
  /** Where each stage's number comes from. */
  valueKey: keyof Stage & string;
  /** Where each stage's name comes from. */
  nameKey: keyof Stage & string;
  /** The color of the bars. Without it, `var(--rc-chart-1)`. */
  color?: string;
  /** How each stage's number is written. */
  format?: Format;
  /**
   * How the rate is written, receiving 0 to 100. Without it, a percentage with one
   * decimal: `38,5%`.
   */
  formatRate?: (rate: number) => string;
  /**
   * `center` draws a real funnel, each bar centered under the previous one;
   * `start` aligns the bars to the left, which reads better when the names are
   * long and the eye compares length.
   */
  align?: "center" | "start";
  /** The list's name for the screen reader: "Funil de emissao do mes". */
  label?: string;
  /** Shows the end-to-end conversion line, at the bottom. Without it, shows it. */
  showOverall?: boolean;
  /**
   * The piece's texts, to change the language: `rate` is what comes after the
   * rate between two stages, "da etapa anterior" without it, and `overall` the sentence
   * of the end-to-end conversion, "do inicio ao fim" without it. Pass only the ones
   * that change.
   */
  labels?: Partial<ChartFunnelLabels>;
  /** Class per part: `stage`, `bar`, `rate`. */
  classNames?: Slots<"stage" | "bar" | "rate">;
  /**
   * What appears in place of the drawing when the list comes empty or all stages sum to zero. The
   * same shape as
   * `ChartContainer` and `DataTable`.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
};

function valueOf(raw: unknown): number {
  const number = Number(raw);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export type ChartFunnelLabels = {
  rate: string;
  overall: string;
};

export function ChartFunnel<Stage extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  color = "var(--rc-chart-1)",
  format,
  formatRate = (rate) => percent(rate, 1),
  align = "center",
  label,
  showOverall = true,
  labels,
  classNames,
  className,
  empty,
  ...props
}: ChartFunnelProps<Stage>) {
  const rateLabel = labels?.rate ?? "da etapa anterior";
  const overallLabel = labels?.overall ?? "do início ao fim";
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (value: number) => (write ? write(value) : value.toLocaleString("pt-BR"));

  const values = data.map((stage) => valueOf(stage[valueKey]));
  const widest = Math.max(0, ...values);
  const rates = funnelRates(values);

  if (widest === 0 && empty) {
    return (
      <div {...props} className={cn("w-full", className)}>
        <EmptyState
          title={empty.title}
          description={empty.description}
          icon={empty.icon}
          action={empty.action}
        />
      </div>
    );
  }

  return (
    <div {...props} className={cn("flex w-full flex-col gap-3", className)}>
      <ol aria-label={label} className="flex flex-col gap-1">
        {data.map((stage, index) => {
          const value = values[index]!;
          const rate = rates.fromPrevious[index];
          const width = widest > 0 ? (value / widest) * 100 : 0;

          return (
            <li
              key={`${index}-${String(stage[nameKey])}`}
              data-rc-funnel-stage=""
              className={cn("flex flex-col gap-1", classNames?.stage)}
            >
              {index > 0 && (
                <p
                  data-rc-funnel-rate=""
                  className={cn(
                    "flex items-center gap-1 text-xs text-fg-subtle",
                    align === "center" && "justify-center",
                    classNames?.rate,
                  )}
                >
                  <span aria-hidden="true">↓</span>
                  <span className="font-mono text-fg-muted">
                    {rate === null || rate === undefined ? "—" : formatRate(rate)}
                  </span>
                  <span>{rateLabel}</span>
                </p>
              )}

              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 wrap-anywhere text-fg-muted">
                  {String(stage[nameKey])}
                </span>
                <span className="shrink-0 font-mono text-fg">{say(value)}</span>
              </div>

              <div
                aria-hidden="true"
                className={cn(
                  "flex h-6 w-full",
                  align === "center" ? "justify-center" : "justify-start",
                )}
              >
                <div
                  data-rc-funnel-bar=""
                  style={{ width: `${width}%`, backgroundColor: color }}
                  className={cn(
                    "h-full animate-fill rounded-sm",
                    align === "center" ? "origin-center" : "origin-left",
                    "transition-[width] duration-[var(--rc-duration-slow)] ease-rc",
                    classNames?.bar,
                  )}
                />
              </div>
            </li>
          );
        })}
      </ol>

      {showOverall && rates.overall !== null && (
        <p className="flex items-baseline gap-1 border-t border-border pt-2 text-xs text-fg-subtle">
          <span className="font-mono text-sm text-fg">{formatRate(rates.overall)}</span>
          <span>{overallLabel}</span>
        </p>
      )}
    </div>
  );
}
