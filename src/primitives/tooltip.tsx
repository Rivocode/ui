"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";

export const Tooltip = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;

export function TooltipContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseTooltip.Popup>) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseTooltip.Portal container={portalContainer ?? undefined}>
      <BaseTooltip.Positioner sideOffset={6} className="z-[var(--rc-z-tooltip)] outline-none">
        <BaseTooltip.Popup
          {...props}
          className={cn(
            "rounded-md border border-border bg-surface-raised px-2.5 py-1.5 shadow-2",
            "font-sans text-sm text-fg",
            "origin-[var(--transform-origin)] transition-[opacity,transform]",
            "duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
            "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
            className,
          )}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
