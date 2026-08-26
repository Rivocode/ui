"use client";

import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const Fieldset = BaseFieldset.Root;

export function FieldsetRoot({ className, ...props }: ComponentProps<typeof BaseFieldset.Root>) {
  return <BaseFieldset.Root {...props} className={cn("flex flex-col gap-4", className)} />;
}

export function FieldsetLegend({
  className,
  ...props
}: ComponentProps<typeof BaseFieldset.Legend>) {
  return (
    <BaseFieldset.Legend
      {...props}
      className={cn("font-display text-md leading-[var(--rc-leading-tight)] tracking-tight text-fg", className)}
    />
  );
}
