"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";
import { floatingPanel } from "./menu";

/**
 * Passe `items` com `{ label, value }` para o gatilho mostrar o rotulo. Sem
 * isso ele mostra o valor cru, porque so a lista sabe traduzir um pelo outro.
 * E contrato da Base UI, e a armadilha mais facil de cair neste componente.
 */
export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Trigger>) {
  return (
    <BaseSelect.Trigger
      {...props}
      className={cn(
        "flex h-[var(--rc-control-md)] min-w-40 items-center justify-between gap-2",
        "rounded-md border border-border bg-surface px-[var(--rc-control-pad-md)]",
        "font-sans text-base text-fg select-none",
        "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
        "outline-none hover:bg-surface-raised",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "focus-visible:ring-offset-bg",
        "data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled",
        "data-[invalid]:border-danger",
        className,
      )}
    >
      {children}
      <BaseSelect.Icon className="text-fg-subtle">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="currentColor">
          <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
        </svg>
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Popup>) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseSelect.Portal container={portalContainer ?? undefined}>
      <BaseSelect.Positioner sideOffset={6} className="z-[var(--rc-z-dropdown)] outline-none">
        <BaseSelect.Popup
          {...props}
          className={cn(floatingPanel, "min-w-[var(--anchor-width)]", className)}
        >
          <BaseSelect.List className="max-h-[var(--available-height)] overflow-y-auto">
            {children}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      {...props}
      className={cn(
        "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2",
        "rounded-sm py-1.5 pr-3 pl-2 text-base text-fg outline-none select-none",
        "data-[highlighted]:bg-accent-subtle",
        "data-[disabled]:text-fg-disabled",
        className,
      )}
    >
      <BaseSelect.ItemIndicator className="col-start-1 text-accent-text">
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2.5 8.5 4 4 7-9" />
        </svg>
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className="col-start-2">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}
