"use client";

import { cva } from "class-variance-authority";
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react";

import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "../components/popover";
import { cn } from "../lib/cn";

export const aiLabelVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center rounded-sm border font-sans font-semibold",
    "tracking-wide whitespace-nowrap select-none",
  ),
  {
    variants: {
      tone: {
        accent: "border-border-strong bg-accent-subtle text-accent-text",
        neutral: "border-border-strong bg-surface-raised text-fg-muted",
      },
      size: {
        sm: "h-5 min-w-5 px-1 text-xs",
        md: "h-6 min-w-6 px-1.5 text-sm",
      },
    },
    defaultVariants: { tone: "accent", size: "sm" },
  },
);

export type AILabelProps = Omit<ComponentPropsWithoutRef<"span">, "children" | "title"> & {
  /** O texto do selo. Sem ele, "IA". Curto: e um selo, e nao uma frase. */
  text?: string;
  /**
   * O que o leitor de tela ouve no lugar do selo, que sozinho seria soletrado.
   * Sem ele, "Conteúdo gerado por IA". Com `explanation`, vira o nome do botao.
   */
  label?: string;
  tone?: "accent" | "neutral";
  size?: "sm" | "md";
  /**
   * A explicacao: quem gerou, com que dados, o que a pessoa deve conferir. Com
   * ela o selo vira botao e abre um painel ancorado; sem ela, e so o selo.
   */
  explanation?: ReactNode;
  /** O titulo do painel da explicacao. Sem ele, "Gerado por IA". */
  title?: ReactNode;
  /** O lado em que o painel abre. Sem ele, embaixo. */
  side?: "top" | "bottom" | "left" | "right";
};

export function AILabel({
  text = "IA",
  label = "Conteúdo gerado por IA",
  tone,
  size,
  explanation,
  title = "Gerado por IA",
  side = "bottom",
  className,
  ...props
}: AILabelProps) {
  const classes = cn(aiLabelVariants({ tone, size }), className);

  if (!explanation) {
    return (
      <span {...props} className={classes}>
        <span aria-hidden="true">{text}</span>
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        {...(props as ComponentProps<typeof PopoverTrigger>)}
        aria-label={label}
        className={cn(
          classes,
          "relative cursor-pointer after:absolute after:-inset-2",
          "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
          "hover:border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        )}
      >
        <span aria-hidden="true">{text}</span>
      </PopoverTrigger>
      <PopoverContent side={side} className="max-w-xs">
        <PopoverTitle className="text-sm font-medium">{title}</PopoverTitle>
        <div className="mt-1.5 text-sm text-fg-muted">{explanation}</div>
      </PopoverContent>
    </Popover>
  );
}
