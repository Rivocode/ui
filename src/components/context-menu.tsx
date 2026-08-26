"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const ContextMenu = BaseContextMenu.Root;

export function ContextMenuTrigger({
  className,
  ...props
}: ComponentProps<typeof BaseContextMenu.Trigger>) {
  return <BaseContextMenu.Trigger {...props} className={cn("outline-none", className)} />;
}
