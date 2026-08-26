"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type ToggleGroupProps = ComponentProps<typeof BaseToggleGroup>;

export function ToggleGroup({ className, ...props }: ToggleGroupProps) {
  return (
    <BaseToggleGroup
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1",
        className,
      )}
    />
  );
}

export type ToggleProps = ComponentProps<typeof BaseToggle>;

export function Toggle({ className, ...props }: ToggleProps) {
  return (
    <BaseToggle
      {...props}
      className={cn(
        "inline-flex h-[var(--rc-control-sm)] min-w-[var(--rc-control-sm)] items-center",
        "justify-center gap-2 rounded-sm px-2 text-sm text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "data-[pressed]:bg-accent-subtle data-[pressed]:text-fg",
        "data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled",
        "data-[disabled]:hover:bg-transparent",
        className,
      )}
    />
  );
}
