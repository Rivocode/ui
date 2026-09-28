"use client";

import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../shared/format";
import { Card, CardContent } from "./card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type StatProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** What the number measures: "Faturado em agosto". */
  label: string;
  /** The number, already formatted: `currencyShort(246_700)`. */
  value: ReactNode;
  /**
   * The change. Positive goes up, negative goes down, and zero is neutral: no arrow and in
   * `text-fg-muted`.
   *
   * The unit belongs to `deltaFormat`, not to the number: without it the default is still
   * a percentage.
   */
  delta?: number;
  /** What it is compared against: "sobre julho". Without it, only the change. */
  deltaLabel?: string;
  /** A short explanation behind an info button. */
  hint?: string;
  /**
   * The piece's texts, to change the language: `about` is the name of the `hint`
   * info button, and receives the `label`. Pass only the ones that change.
   */
  labels?: Partial<StatLabels>;
  /**
   * Going up is bad here: overdue items, cost, defaults. The arrow still
   * points where the number went; what inverts is the color's judgment.
   */
  invert?: boolean;
  /**
   * The trend below the number. Pass the `Sparkline` from
   * `@rivocode/ui/chart`; the core does not import it because it brings recharts
   * along, and a dashboard without a chart should not pay for it.
   */
  chart?: ReactNode;
  /**
   * The boxed icon, to the left of the label. It is the dashboard convention, and without a
   * slot every screen rebuilt the whole card to have it.
   */
  icon?: ReactNode;
  /** The card's right corner: the three-dot menu, an action button. */
  actions?: ReactNode;
  /** The bottom strip: target with a bar, comparison, supporting text. */
  footer?: ReactNode;
  /**
   * How the change is written: the name of a house formatter (`percent`,
   * `currencyShort`, `integer`...) or your own function. It is the same vocabulary as
   * `Progress`, `Meter` and `Slider`, and the same as the chart axis.
   *
   * Without it, `percent` - which was the only path that existed, hardcoded in the JSX.
   * A delta in reais or in basis points came out with a `%` that was not true, and the
   * only number piece in the house outside the formatting vocabulary was this one.
   *
   * The house `percent` rounds to an integer; for a decimal place, pass the
   * function: `deltaFormat={(value) => percent(value, 1)}`.
   *
   * What reaches the formatter is the absolute value of `delta`: the sign is carried by the
   * arrow, and by the text the screen reader hears before it.
   */
  deltaFormat?: Format;
  /**
   * The change as a filled pill, which is the dominant dashboard convention,
   * or as text with an arrow, which is the default here.
   */
  deltaVariant?: "text" | "pill";
  className?: string;
};

export type StatLabels = {
  about: (label: string) => string;
};

const LABELS: StatLabels = { about: (label) => `Sobre ${label.toLowerCase()}` };

export function Stat({
  labels,
  label,
  value,
  delta,
  deltaLabel,
  hint,
  invert,
  chart,
  icon,
  actions,
  footer,
  deltaFormat = "percent",
  deltaVariant = "text",
  className,
  ...rest
}: StatProps) {
  const text = { ...LABELS, ...labels };
  const writeDelta = resolveFormat(deltaFormat) as (value: number) => string;
  const flat = delta === 0 || (delta !== undefined && writeDelta(Math.abs(delta)) === writeDelta(0));
  const rose = (delta ?? 0) > 0;
  const good = invert ? !rose : rose;

  return (
    <Card {...rest} className={className}>
      <CardContent className="animate-appear py-4">
        <div className="flex items-start justify-between gap-3">
          {icon && (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md",
                "bg-accent-subtle text-accent-text",
              )}
            >
              {icon}
            </span>
          )}
          {actions && <span className="-mt-1 -mr-1 ml-auto shrink-0">{actions}</span>}
        </div>

        <div className={cn("flex items-center gap-1.5", (icon || actions) && "mt-2")}>
          <p className="text-sm text-fg-muted">{label}</p>
          {hint && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={text.about(label)}
                    className={cn(
                      "-my-1 flex size-6 items-center justify-center rounded-sm text-fg-subtle",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  />
                }
              >
                <Info size={13} aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>{hint}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <p className="mt-1 font-display font-rc-display text-2xl tracking-tight text-fg">{value}</p>

        {delta !== undefined && (
          <p
            className={cn(
              "mt-1 flex w-fit items-center gap-1 text-xs",
              deltaVariant === "pill"
                ? cn(
                    "rounded-pill px-1.5 py-0.5 font-rc-medium",
                    flat
                      ? "bg-surface-raised text-fg-muted"
                      : good
                        ? "bg-success-subtle text-success-text"
                        : "bg-danger-subtle text-danger-text",
                  )
                : flat
                  ? "text-fg-muted"
                  : good
                    ? "text-success-text"
                    : "text-danger-text",
            )}
          >
            {flat ? null : rose ? (
              <ArrowUpRight size={13} aria-hidden="true" />
            ) : (
              <ArrowDownRight size={13} aria-hidden="true" />
            )}
            {!flat && <span className="sr-only">{rose ? "alta de" : "queda de"} </span>}
            {writeDelta(Math.abs(delta))}
            {deltaLabel ? ` ${deltaLabel}` : ""}
          </p>
        )}

        {chart && <div className="mt-3">{chart}</div>}

        {footer && (
          <div className="mt-3 border-t border-border pt-3 text-xs text-fg-muted">{footer}</div>
        )}
      </CardContent>
    </Card>
  );
}
