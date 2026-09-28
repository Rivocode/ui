"use client";

import { Meter as BaseMeter } from "@base-ui/react/meter";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../shared/format";
import type { Slots } from "../lib/slots";

export type MeterProps = Omit<ComponentProps<typeof BaseMeter.Root>, "format"> & {
  label?: ReactNode;
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

export function Meter({
  className,
  label,
  showValue,
  format,
  numberFormat,
  classNames,
  ...props
}: MeterProps) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const shown =
    write &&
    ((current: number | null) =>
      current === null || !Number.isFinite(current)
        ? ""
        : write(Math.min(max, Math.max(min, current))));

  return (
    <BaseMeter.Root
      {...props}
      getAriaValueText={
        props.getAriaValueText ?? (shown ? (_, current) => shown(current) : undefined)
      }
      format={numberFormat}
      className={cn("flex flex-col gap-2", className)}
    >
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && (
            <BaseMeter.Label className={cn("font-sans text-sm text-fg", classNames?.label)}>
              {label}
            </BaseMeter.Label>
          )}
          {showValue && (
            <BaseMeter.Value
              className={cn("font-mono text-xs text-fg-subtle tabular-nums", classNames?.value)}
            >
              {shown ? (_, current) => shown(current) : null}
            </BaseMeter.Value>
          )}
        </div>
      )}

      <BaseMeter.Track
        className={cn("h-1.5 w-full overflow-hidden rounded-pill bg-skeleton", classNames?.track)}
      >
        <BaseMeter.Indicator
          className={cn(
            "h-full origin-left animate-fill rounded-pill bg-accent-text",
            "transition-[width] duration-[var(--rc-duration-base)] ease-rc",
            classNames?.indicator,
          )}
        />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
