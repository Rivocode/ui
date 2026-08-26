"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const Collapsible = BaseCollapsible.Root;

export function CollapsibleTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseCollapsible.Trigger>) {
  return (
    <BaseCollapsible.Trigger
      {...props}
      className={cn(
        "group flex items-center gap-2 rounded-md py-1 font-sans text-base text-fg",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:text-accent-text",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <ChevronDown
        size={16}
        aria-hidden="true"
        className={cn(
          "shrink-0 text-fg-subtle",
          "transition-transform duration-[var(--rc-duration-base)] ease-rc",
          "-rotate-90 group-data-[panel-open]:rotate-0",
        )}
      />
      {children}
    </BaseCollapsible.Trigger>
  );
}

export function CollapsiblePanel({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseCollapsible.Panel>) {
  return (
    <BaseCollapsible.Panel
      {...props}
      className={cn(
        "h-[var(--collapsible-panel-height)] overflow-hidden",
        "transition-[height] duration-[var(--rc-duration-base)] ease-rc",
        "data-[starting-style]:h-0 data-[ending-style]:h-0",
        className,
      )}
    >
      <div className="pt-2 text-base text-fg-muted">{children}</div>
    </BaseCollapsible.Panel>
  );
}
