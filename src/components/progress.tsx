"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../shared/format";
import type { Slots } from "../lib/slots";

export type ProgressProps = Omit<
  ComponentProps<typeof BaseProgress.Root>,
  "children" | "format"
> & {
  /** Text above the bar. Without it, pass `aria-label`. */
  label?: ReactNode;
  /** Shows the percentage beside the label. */
  showValue?: boolean;
  /**
   * How the number is written: the name of a house formatter (`percent`,
   * `currencyShort`, `integer`...) or your own function. It is the same vocabulary as the
   * chart axis - `format` meant three different things in the same
   * library, and the one that gave no type error was the worst: `{ style: "percent" }`
   * on a 0 to 100 meter prints 8.200% next to a bar at 82%.
   */
  format?: Format;
  /** The `Intl.NumberFormat` options, for those who need them. */
  numberFormat?: Intl.NumberFormatOptions;
  /** Class per part: `label`, `value`, `track`, `indicator`. */
  classNames?: Slots<"label" | "value" | "track" | "indicator">;
};

export function Progress({
  className,
  label,
  showValue,
  format,
  numberFormat,
  classNames,
  ...props
}: ProgressProps) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const value =
    typeof props.value === "number" && Number.isFinite(props.value) ? props.value : null;
  const shown =
    write &&
    ((current: number | null) =>
      current === null || !Number.isFinite(current)
        ? ""
        : write(Math.min(max, Math.max(min, current))));

  return (
    <BaseProgress.Root
      {...props}
      value={value}
      getAriaValueText={
        props.getAriaValueText ??
        (shown && value !== null ? (_, current) => shown(current) : undefined)
      }
      format={numberFormat}
      className={cn("flex flex-col gap-2", className)}
    >
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && (
            <BaseProgress.Label className={cn("font-sans text-sm text-fg", classNames?.label)}>
              {label}
            </BaseProgress.Label>
          )}
          {showValue && (
            <BaseProgress.Value
              className={cn("font-mono text-xs text-fg-subtle tabular-nums", classNames?.value)}
            >
              {shown ? (_, current) => shown(current) : null}
            </BaseProgress.Value>
          )}
        </div>
      )}

      <BaseProgress.Track
        className={cn("h-1.5 w-full overflow-hidden rounded-pill bg-skeleton", classNames?.track)}
      >
        <BaseProgress.Indicator
          className={cn(
            "h-full origin-left animate-fill rounded-pill bg-accent-text",
            "transition-[width] duration-[var(--rc-duration-base)] ease-rc",
            "data-[indeterminate]:w-1/5 data-[indeterminate]:animate-indeterminate",
            "motion-reduce:data-[indeterminate]:animate-none",
            "motion-reduce:data-[indeterminate]:w-full",
            "motion-reduce:data-[indeterminate]:bg-[image:repeating-linear-gradient(115deg,var(--rc-accent-text)_0_0.5rem,var(--rc-accent-active)_0.5rem_1rem)]",
            classNames?.indicator,
          )}
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
