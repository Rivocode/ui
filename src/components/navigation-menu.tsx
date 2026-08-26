"use client";

import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";

export const NavigationMenu = BaseNavigationMenu.Root;
export const NavigationMenuItem = BaseNavigationMenu.Item;

export function NavigationMenuList({
  className,
  ...props
}: ComponentProps<typeof BaseNavigationMenu.List>) {
  return (
    <BaseNavigationMenu.List {...props} className={cn("flex items-center gap-1", className)} />
  );
}

export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseNavigationMenu.Trigger>) {
  return (
    <BaseNavigationMenu.Trigger
      {...props}
      className={cn(
        "flex h-[var(--rc-control-md)] items-center gap-1.5 rounded-md px-3",
        "font-sans text-base text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "data-[popup-open]:bg-accent-subtle data-[popup-open]:text-fg",
        className,
      )}
    >
      {children}
      <BaseNavigationMenu.Icon
        className={cn(
          "transition-transform duration-[var(--rc-duration-base)] ease-rc",
          "data-[popup-open]:rotate-180",
        )}
      >
        <ChevronDown size={14} aria-hidden="true" />
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  );
}

export function NavigationMenuLink({
  className,
  ...props
}: ComponentProps<typeof BaseNavigationMenu.Link>) {
  return (
    <BaseNavigationMenu.Link
      {...props}
      className={cn(
        "block rounded-md px-3 py-2 font-sans text-base text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

export function NavigationMenuContent({
  className,
  ...props
}: ComponentProps<typeof BaseNavigationMenu.Content>) {
  return <BaseNavigationMenu.Content {...props} className={cn("w-64 p-2", className)} />;
}

export function NavigationMenuViewport({ className }: { className?: string }) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseNavigationMenu.Portal container={portalContainer ?? undefined}>
      <BaseNavigationMenu.Positioner
        sideOffset={6}
        collisionPadding={8}
        className="z-[var(--rc-z-dropdown)] outline-none"
      >
        <BaseNavigationMenu.Popup
          className={cn(
            "rounded-lg border border-border bg-surface-raised shadow-3",
            "font-sans text-fg outline-none",
            "h-[var(--popup-height)] w-[var(--popup-width)] overflow-hidden",
            "origin-[var(--transform-origin)]",
            "transition-[opacity,transform,width,height] duration-[var(--rc-duration-base)] ease-rc",
            "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
            className,
          )}
        >
          <BaseNavigationMenu.Viewport className="relative size-full overflow-hidden" />
        </BaseNavigationMenu.Popup>
      </BaseNavigationMenu.Positioner>
    </BaseNavigationMenu.Portal>
  );
}
