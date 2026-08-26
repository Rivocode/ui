"use client";

import type { ReactNode } from "react";
import { Tooltip, type TooltipContentProps } from "recharts";

import { cn } from "../lib/cn";
import type { ChartConfig } from "./chart";

export const ChartTooltip = Tooltip;

export type ChartTooltipContentProps = Partial<
  Pick<TooltipContentProps<number, string>, "active" | "payload" | "label">
> & {
  config?: ChartConfig;
  /** Esconde a bolinha de cor de cada linha. */
  hideIndicator?: boolean;
  /** Formata o valor. Use para dinheiro e para porcentagem. */
  formatValue?: (value: number, key: string) => ReactNode;
  className?: string;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  config,
  hideIndicator,
  formatValue,
  className,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface-raised px-2.5 py-2 shadow-3",
        "font-sans text-sm text-fg",
        className,
      )}
    >
      {label !== undefined && <p className="mb-1.5 font-medium text-fg">{label}</p>}

      <ul className="flex flex-col gap-1">
        {payload.map((entry) => {
          const candidates = [entry.dataKey, entry.name].filter((x) => x != null).map(String);
          const key = candidates.find((candidate) => config?.[candidate]) ?? candidates[0] ?? "";
          const name = config?.[key]?.label ?? entry.name ?? key;
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value ?? 0);

          return (
            <li key={key} className="flex items-center gap-2">
              {!hideIndicator && (
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: entry.color ?? `var(--color-${key})` }}
                />
              )}
              <span className="flex-1 text-fg-muted">{name}</span>
              <span className="font-mono tabular-nums text-fg">
                {formatValue ? formatValue(value, key) : value.toLocaleString("pt-BR")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
