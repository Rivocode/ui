"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { inputVariants } from "./field";

export type NumberFieldProps = Omit<ComponentProps<typeof BaseNumberField.Root>, "format"> & {
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  /**
   * The `Intl.NumberFormat` options. It was `format`, and was renamed because
   * `format` came to mean "the name of a house formatter, or a function" in the
   * other pieces that write numbers.
   *
   * Here the formatter name is not accepted, and the reason is that the field is editable: a
   * formatter only writes, and what the person types has to be read back.
   * `Intl` knows how to do both.
   */
  numberFormat?: Intl.NumberFormatOptions;
  /**
   * The piece's texts, to change the language: `decrement` and `increment` are the
   * names of the two step buttons. Pass only the ones that change.
   */
  labels?: Partial<NumberFieldLabels>;
};

export type NumberFieldLabels = {
  decrement: string;
  increment: string;
};

const HEIGHT = {
  sm: "h-[var(--rc-control-sm)]",
  md: "h-[var(--rc-control-md)]",
  lg: "h-[var(--rc-control-lg)]",
} as const;

const STEP = cn(
  "flex w-9 shrink-0 items-center justify-center text-fg-muted",
  "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
  "hover:bg-accent-subtle hover:text-fg",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:-outline-offset-2",
  "data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled",
  "data-[disabled]:hover:bg-transparent",
);

export function NumberField({
  className,
  placeholder,
  size = "md",
  numberFormat,
  labels,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: NumberFieldProps) {
  return (
    <BaseNumberField.Root {...props} format={numberFormat} className={cn("w-full", className)}>
      <BaseNumberField.Group
        className={cn(
          "flex w-full items-stretch overflow-hidden rounded-md border border-border-strong bg-surface",
          HEIGHT[size],
          "font-sans text-base text-fg",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "focus-within:ring-offset-bg",
          "has-[[data-invalid]]:border-danger",
        )}
      >
        <BaseNumberField.Decrement
          aria-label={labels?.decrement ?? "Diminuir"}
          className={cn(STEP, "border-r border-border")}
        >
          <Minus size={14} aria-hidden="true" />
        </BaseNumberField.Decrement>

        <BaseNumberField.Input
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            inputVariants({ size }),
            "h-full rounded-none border-0 text-center tabular-nums",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
          )}
        />

        <BaseNumberField.Increment
          aria-label={labels?.increment ?? "Aumentar"}
          className={cn(STEP, "border-l border-border")}
        >
          <Plus size={14} aria-hidden="true" />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
