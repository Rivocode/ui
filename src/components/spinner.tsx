"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const spinnerVariants = cva("shrink-0 animate-spin motion-reduce:animate-none", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-8",
    },
  },
  defaultVariants: { size: "md" },
});

export type SpinnerProps = ComponentProps<"svg"> &
  VariantProps<typeof spinnerVariants> & {
    /** O que o leitor de tela anuncia. Vazio esconde o giro da leitura. */
    label?: string;
  };

export function Spinner({ className, size, label = "Carregando", ...props }: SpinnerProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? "status" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn(spinnerVariants({ size }), className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
