import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

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
  return <div {...props} className={cn("flex flex-col gap-1 p-5 pb-3", className)} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      {...props}
      className={cn("font-display text-xl leading-[var(--rc-leading-tight)] tracking-display text-fg", className)}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-sm text-fg-muted", className)} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("px-5 py-3 text-base text-fg", className)} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={cn("flex items-center gap-3 border-t border-border p-5 pt-3", className)}
    />
  );
}
