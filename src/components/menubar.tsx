"use client";

import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { MenuTrigger } from "./menu";

export type MenubarProps = ComponentProps<typeof BaseMenubar>;

export function Menubar({ className, ...props }: MenubarProps) {
  return (
    <BaseMenubar
      {...props}
      className={cn(
        "flex items-center gap-0.5 rounded-md border border-border bg-surface p-1",
        className,
      )}
    />
  );
}

export function MenubarTrigger({ className, ...props }: ComponentProps<typeof MenuTrigger>) {
  return (
    <MenuTrigger
      {...props}
      className={cn(
        "rounded-sm px-2.5 py-1 font-sans text-base text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "data-[popup-open]:bg-accent-subtle data-[popup-open]:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}
