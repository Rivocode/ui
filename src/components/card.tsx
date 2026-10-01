"use client";

import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactElement } from "react";

import { cn } from "../lib/cn";

export const cardVariants = cva("rounded-lg border border-border", {
  variants: {
    elevation: {
      flat: "bg-surface",
      raised: "bg-surface-raised shadow-2",
    },
  },
  defaultVariants: { elevation: "flat" },
});

export type CardProps = ComponentPropsWithoutRef<"div"> & VariantProps<typeof cardVariants>;

export function Card({ className, elevation, ...props }: CardProps) {
  return <div {...props} className={cn(cardVariants({ elevation }), className)} />;
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("flex flex-col gap-1 p-[var(--rc-pad-panel)] pb-3", className)} />;
}

export type CardTitleProps = ComponentPropsWithoutRef<"h3"> & {
  /**
   * Troca o nivel do heading mantendo o desenho: `render={<h2 />}` quando o
   * cartao vem logo abaixo do `h1` da pagina. Sem ele, sai `<h3>`.
   */
  render?: ReactElement;
};

export function CardTitle({ className, render, ...props }: CardTitleProps) {
  return useRender({
    render: render ?? <h3 />,
    props: {
      ...props,
      className: cn(
        "font-display font-rc-display text-xl leading-[var(--rc-leading-tight)] tracking-display text-fg",
        className,
      ),
    },
  });
}

export function CardDescription({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-sm text-fg-muted", className)} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("px-[var(--rc-pad-panel)] py-3 text-base text-fg", className)} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={cn("flex items-center gap-3 border-t border-border p-[var(--rc-pad-panel)] pt-3", className)}
    />
  );
}
