"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

export type DescriptionListProps = ComponentProps<"dl">;

export function DescriptionList({ className, ...props }: DescriptionListProps) {
  return <dl {...props} className={cn("divide-y divide-border", className)} />;
}

export type DescriptionItemProps = Omit<ComponentProps<"div">, "children"> & {
  label: ReactNode;
  /** O valor. Texto, `Badge`, dinheiro do `currencyShort` - o que a linha pedir. */
  children: ReactNode;
};

export function DescriptionItem({ label, children, className, ...props }: DescriptionItemProps) {
  return (
    <div {...props} className={cn("flex items-center justify-between gap-4 py-2.5", className)}>
      <dt className="shrink-0 text-sm text-fg-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-fg">{children}</dd>
    </div>
  );
}
