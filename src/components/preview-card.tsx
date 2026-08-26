"use client";

import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";

export const PreviewCard = BasePreviewCard.Root;
export const PreviewCardTrigger = BasePreviewCard.Trigger;

export function PreviewCardContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BasePreviewCard.Popup>) {
  const { portalContainer } = useRivoContext();

  return (
    <BasePreviewCard.Portal container={portalContainer ?? undefined}>
      <BasePreviewCard.Positioner
        sideOffset={8}
        collisionPadding={8}
        className="z-[var(--rc-z-popover)] outline-none"
      >
        <BasePreviewCard.Popup
          {...props}
          className={cn(
            "w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface-raised",
            "p-[var(--rc-pad-panel-sm)] shadow-3",
            "font-sans text-base text-fg outline-none",
            "origin-[var(--transform-origin)] transition-[opacity,transform]",
            "duration-[var(--rc-duration-fast)] ease-rc",
            "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
            className,
          )}
        >
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
