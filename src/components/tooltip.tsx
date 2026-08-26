"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import {
  createContext,
  use,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type RefAttributes,
} from "react";

import { cn } from "../lib/cn";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import { useRivoContext } from "../provider/rivo-provider";

const DescriptionContext = createContext<{ id: string; open: boolean } | null>(null);

export type TooltipProps<Payload = unknown> = BaseTooltip.Root.Props<Payload>;

export function Tooltip<Payload = unknown>({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: TooltipProps<Payload>) {
  const id = useId();
  const [selfOpen, setSelfOpen] = useState(defaultOpen ?? false);
  const isOpen = open ?? selfOpen;

  const description = useMemo(() => ({ id, open: isOpen }), [id, isOpen]);

  return (
    <DescriptionContext value={description}>
      <BaseTooltip.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next, details) => {
          setSelfOpen(next);
          onOpenChange?.(next, details);
        }}
        {...props}
      >
        {children}
      </BaseTooltip.Root>
    </DescriptionContext>
  );
}

export type TooltipTriggerProps<Payload = unknown> = BaseTooltip.Trigger.Props<Payload> &
  RefAttributes<HTMLElement>;

export function TooltipTrigger<Payload = unknown>({
  "aria-describedby": describedBy,
  ...props
}: TooltipTriggerProps<Payload>) {
  const description = use(DescriptionContext);
  const ids = [describedBy, description?.open ? description.id : undefined]
    .filter(Boolean)
    .join(" ");

  return <BaseTooltip.Trigger aria-describedby={ids || undefined} {...props} />;
}

export type TooltipContentProps = ComponentProps<typeof BaseTooltip.Popup> & FloatingPositionProps;

export function TooltipContent({
  className,
  children,
  sideOffset = FLOATING_SIDE_OFFSET,
  side,
  align,
  ...props
}: TooltipContentProps) {
  const { portalContainer } = useRivoContext();
  const description = use(DescriptionContext);
  const fallbackId = useId();

  return (
    <BaseTooltip.Portal container={portalContainer ?? undefined}>
      <BaseTooltip.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        collisionPadding={8}
        className="z-[var(--rc-z-tooltip)] outline-none"
      >
        <BaseTooltip.Popup
          role="tooltip"
          id={description?.id ?? fallbackId}
          {...props}
          className={cn(
            "max-w-[calc(100vw-1rem)] rounded-md border border-border bg-surface-raised",
            "px-2.5 py-1.5 shadow-2",
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
