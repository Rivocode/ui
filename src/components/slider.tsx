"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../shared/format";
import type { Slots } from "../lib/slots";

export type SliderProps = Omit<ComponentProps<typeof BaseSlider.Root>, "format"> & {
  /**
   * Text above the control, and the name the screen reader reads on the thumb. Without
   * it, the name has to come from `thumbLabel`.
   */
  label?: ReactNode;
  /** Shows the value beside the label. */
  showValue?: boolean;
  /**
   * How the number is written: the name of a house formatter or your own function, the
   * same vocabulary as the chart axis. In a two-value range, it
   * writes each end.
   */
  format?: Format;
  /** The `Intl.NumberFormat` options, for those who need them. */
  numberFormat?: Intl.NumberFormatOptions;
  /**
   * What the screen reader calls the thumb, in place of `label`. In a range,
   * pass one per thumb: the two need different names for the reader to
   * know which is which, and `label` alone would name both the same.
   */
  thumbLabel?: string | string[];
  /** Class per part: `label`, `value`, `control`, `track`, `indicator`, `thumb`. */
  classNames?: Slots<"label" | "value" | "control" | "track" | "indicator" | "thumb">;
};

export function Slider({
  className,
  label,
  showValue,
  thumbLabel,
  format,
  numberFormat,
  classNames,
  ...props
}: SliderProps) {
  const labelId = useId();
  const write = resolveFormat(format) as ((value: number) => string) | undefined;

  const values = props.value ?? props.defaultValue;
  const count = Array.isArray(values) ? values.length : 1;
  const labels = Array.from({ length: count }, (_, index) =>
    Array.isArray(thumbLabel) ? thumbLabel[index] : thumbLabel,
  );

  return (
    <BaseSlider.Root
      {...props}
      format={numberFormat}
      className={cn("flex flex-col gap-2", className)}
    >
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && (
            <span id={labelId} className={cn("font-sans text-sm text-fg", classNames?.label)}>
              {label}
            </span>
          )}
          {showValue && (
            <BaseSlider.Value
              className={cn("font-mono text-xs text-fg-subtle tabular-nums", classNames?.value)}
            >
              {write ? (_, values) => values.map(write).join(" – ") : null}
            </BaseSlider.Value>
          )}
        </div>
      )}

      <BaseSlider.Control
        className={cn("flex touch-none items-center py-2 select-none", classNames?.control)}
      >
        <BaseSlider.Track
          className={cn("h-1.5 w-full rounded-pill bg-skeleton select-none", classNames?.track)}
        >
          <BaseSlider.Indicator
            className={cn("rounded-pill bg-accent-text select-none", classNames?.indicator)}
          />
          {labels.map((thumbName, index) => (
            <BaseSlider.Thumb
              key={index}
              index={index}
              aria-label={thumbName}
              getAriaValueText={write ? (_, value) => write(value) : undefined}
              aria-labelledby={!thumbName && label ? labelId : undefined}
              className={cn(
                "size-4 rounded-pill border border-accent-text bg-surface-raised select-none",
                "relative after:absolute after:-inset-1.5",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                "has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg",
                classNames?.thumb,
              )}
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
