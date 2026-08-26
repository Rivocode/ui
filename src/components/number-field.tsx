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
   * As opcoes do `Intl.NumberFormat`. Era `format`, e mudou de nome porque
   * `format` passou a significar "nome de formatador da casa, ou funcao" nas
   * outras pecas que escrevem numero.
   *
   * Aqui o nome de formatador nao entra, e a razao e o campo ser editavel: um
   * formatador so escreve, e o que a pessoa digita precisa ser lido de volta.
   * O `Intl` sabe fazer as duas coisas.
   */
  numberFormat?: Intl.NumberFormatOptions;
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
          aria-label="Diminuir"
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
          aria-label="Aumentar"
          className={cn(STEP, "border-l border-border")}
        >
          <Plus size={14} aria-hidden="true" />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
