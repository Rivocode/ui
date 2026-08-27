import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export type ButtonGroupProps = ComponentPropsWithoutRef<"div"> & {
  orientation?: "horizontal" | "vertical";
};

export function ButtonGroup({ className, orientation = "horizontal", ...props }: ButtonGroupProps) {
  return (
    <div
      {...props}
      role="group"
      data-orientation={orientation}
      className={cn(
        "inline-flex",
        orientation === "vertical" ? "flex-col" : "flex-row",

        orientation === "vertical"
          ? cn(
              "[&>*:not(:first-child)]:rounded-t-none",
              "[&>*:not(:last-child)]:rounded-b-none",
              "[&>*:not(:first-child)]:-mt-px",
            )
          : cn(
              "[&>*:not(:first-child)]:rounded-l-none",
              "[&>*:not(:last-child)]:rounded-r-none",
              "[&>*:not(:first-child)]:-ml-px",
            ),

        "[&>*:focus-visible]:relative [&>*:focus-visible]:z-[var(--rc-z-sticky)]",
        className,
      )}
    />
  );
}
