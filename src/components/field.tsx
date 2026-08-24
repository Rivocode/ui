"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const inputVariants = cva(
  cn(
    "w-full rounded-md border border-border bg-surface text-fg",
    "placeholder:text-fg-subtle",
    "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:cursor-not-allowed disabled:text-fg-disabled",
    "data-[invalid]:border-danger",
  ),
  {
    variants: {
      size: {
        sm: "h-[var(--rc-control-sm)] px-[var(--rc-control-pad-sm)] text-sm",
        md: "h-[var(--rc-control-md)] px-[var(--rc-control-pad-md)] text-base",
        lg: "h-[var(--rc-control-lg)] px-[var(--rc-control-pad-lg)] text-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type FieldProps = ComponentProps<typeof BaseField.Root>;

export function Field({ className, ...props }: FieldProps) {
  return <BaseField.Root {...props} className={cn("flex flex-col gap-1.5", className)} />;
}

export function FieldLabel({ className, ...props }: ComponentProps<typeof BaseField.Label>) {
  return (
    <BaseField.Label
      {...props}
      className={cn("font-sans text-sm font-medium text-fg", className)}
    />
  );
}

/**
 * O input nativo tem um atributo `size` que e numero, e ele colidiria com a
 * variante de tamanho. O nativo sai, porque ninguem usa e a variante e a que
 * carrega o significado aqui.
 */
export type InputProps = Omit<ComponentProps<typeof BaseField.Control>, "size"> &
  VariantProps<typeof inputVariants>;

export function Input({ className, size, ...props }: InputProps) {
  return <BaseField.Control {...props} className={cn(inputVariants({ size }), className)} />;
}

export type TextareaProps = Omit<ComponentProps<typeof BaseField.Control>, "size"> & {
  /** Quantas linhas o campo mostra antes de rolar. */
  rows?: number;
};

/**
 * Campo de varias linhas. Passa pelo `Field.Control` como o `Input`, e nao
 * como `<textarea>` solto, para o rotulo, a ajuda e o erro se ligarem sozinhos
 * quando ele estiver dentro de um `Field`.
 *
 * Nao tem variante de tamanho: altura aqui e numero de linhas, e mistura-la
 * com a escala de controle so criaria um `lg` que nao quer dizer nada.
 */
export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <BaseField.Control
      {...props}
      render={<textarea rows={rows} />}
      className={cn(
        inputVariants(),
        "h-auto min-h-[calc(var(--rc-control-md)*2)] resize-y py-2 leading-[var(--rc-leading-normal)]",
        className,
      )}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: ComponentProps<typeof BaseField.Description>) {
  return <BaseField.Description {...props} className={cn("text-xs text-fg-subtle", className)} />;
}

export function FieldError({ className, ...props }: ComponentProps<typeof BaseField.Error>) {
  return <BaseField.Error {...props} className={cn("text-xs text-danger-text", className)} />;
}
