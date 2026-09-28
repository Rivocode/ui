"use client";

import { cva } from "class-variance-authority";
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react";

import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "../components/popover";
import { cn } from "../lib/cn";

export const aiLabelVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center rounded-sm border font-sans font-rc-strong",
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
  /** The badge text. Without it, "IA". Keep it short: it is a badge, not a sentence. */
  text?: string;
  /**
   * What the screen reader hears in place of the badge, which on its own would be spelled out.
   * Without it, "Conteúdo gerado por IA". With `explanation`, it becomes the button's name.
   */
  label?: string;
  tone?: "accent" | "neutral";
  size?: "sm" | "md";
  /**
   * The explanation: who generated it, with what data, what the person should check. With
   * it the badge becomes a button and opens an anchored panel; without it, it is just the badge.
   */
  explanation?: ReactNode;
  /** The title of the explanation panel. Without it, "Gerado por IA". */
  title?: ReactNode;
  /** The side the panel opens on. Without it, below. */
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
        <PopoverTitle className="text-sm font-rc-medium">{title}</PopoverTitle>
        <div className="mt-1.5 text-sm text-fg-muted">{explanation}</div>
      </PopoverContent>
    </Popover>
  );
}
