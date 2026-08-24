"use client";

import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const Toolbar = BaseToolbar.Root;

export type ToolbarProps = ComponentProps<typeof BaseToolbar.Root>;

/**
 * Barra de ferramentas: os controles ficam numa parada de tabulacao so, e as
 * setas andam entre eles.
 *
 * E isso que a diferencia de uma `div` com botoes: dez botoes soltos sao dez
 * paradas de Tab entre o campo anterior e o proximo. Numa barra, e uma.
 *
 * Use `ToolbarButton` com `render` para vestir `Button`, `Toggle` ou `Select`
 * sem perder essa navegacao.
 */
export function ToolbarRoot({ className, ...props }: ToolbarProps) {
  return (
    <BaseToolbar.Root
      {...props}
      className={cn(
        "flex items-center gap-1 rounded-md border border-border bg-surface p-1",
        className,
      )}
    />
  );
}

export function ToolbarButton({ className, ...props }: ComponentProps<typeof BaseToolbar.Button>) {
  return (
    <BaseToolbar.Button
      {...props}
      className={cn(
        "inline-flex h-[var(--rc-control-sm)] min-w-[var(--rc-control-sm)] items-center",
        "justify-center gap-2 rounded-sm px-2 text-sm text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "data-[pressed]:bg-accent-subtle data-[pressed]:text-fg",
        "data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled",
        className,
      )}
    />
  );
}

export function ToolbarSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseToolbar.Separator>) {
  return <BaseToolbar.Separator {...props} className={cn("mx-1 h-5 w-px bg-border", className)} />;
}

export function ToolbarGroup({ className, ...props }: ComponentProps<typeof BaseToolbar.Group>) {
  return <BaseToolbar.Group {...props} className={cn("flex items-center gap-0.5", className)} />;
}
