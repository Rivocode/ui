"use client";

import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type SeparatorProps = ComponentProps<typeof BaseSeparator>;

export function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      {...props}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "h-full w-px" : "h-px w-full",
        className,
      )}
    />
  );
}
