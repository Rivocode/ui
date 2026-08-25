"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { inputVariants } from "./field";

export type NumberFieldProps = ComponentProps<typeof BaseNumberField.Root> & {
  placeholder?: string;
  size?: "sm" | "md" | "lg";
};

const STEP = cn(
  "flex w-9 shrink-0 items-center justify-center text-fg-muted",
  "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
  "hover:bg-accent-subtle hover:text-fg",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:-outline-offset-2",
  "data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled",
  "data-[disabled]:hover:bg-transparent",
);

/**
 * Campo de numero com mais e menos.
 *
 * Use quando o valor tem passo e limite conhecidos: quantidade, parcelas, dias
 * de prazo. Para dinheiro, o `MaskedInput` com molde de moeda diz mais, porque
 * ali o que importa e a pontuacao e nao o passo.
 *
 * O `Input` cru continua servindo para numero solto. A diferenca aqui e que
 * seta do teclado, rolagem e os botoes respeitam `min`, `max` e `step`, e o
 * campo nunca chega num valor que o formulario rejeita depois.
 */
export function NumberField({
  className,
  placeholder,
  size,
  // O nome pertence ao campo, e nao a caixa em volta dele. Espalhado no
  // `Root`, que e um `div`, o `aria-label` nao rotulava nada e o input ficava
  // sem nome: nao dava para rotular um NumberField sem embrulhar num `Field`.
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: NumberFieldProps) {
  return (
    <BaseNumberField.Root {...props} className={cn("w-full", className)}>
      <BaseNumberField.Group
        className={cn(
          "flex w-full items-stretch overflow-hidden rounded-md border border-border bg-surface",
          "h-[var(--rc-control-md)] font-sans text-base text-fg",
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
