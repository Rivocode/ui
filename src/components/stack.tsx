"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactElement } from "react";

import { cn } from "../lib/cn";

export type LayoutGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

export const gapClass: Record<LayoutGap, string> = {
  none: "gap-0",
  xs: "gap-[var(--rc-gap-xs)]",
  sm: "gap-[var(--rc-gap-sm)]",
  md: "gap-[var(--rc-gap-md)]",
  lg: "gap-[var(--rc-gap-lg)]",
  xl: "gap-[var(--rc-gap-xl)]",
};

type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
type StackJustify = "start" | "center" | "end" | "between";

const alignClass: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClass: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export type StackProps = ComponentProps<"div"> & {
  /** The children's axis. `column` stacks one below the other; `row` places them side by side. */
  direction?: "column" | "row";
  /**
   * The gap between children, on the house scale: `xs` 4, `sm` 8, `md` 12, `lg` 16
   * and `xl` 24 pixels in the comfortable density. In the compact one the scale shrinks
   * along with the controls (`sm` 6, `md` 8, `lg` 12, `xl` 16); `xs` stays at 4.
   */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Alignment on the cross axis. Without a value, the CSS one applies: the children stretch.
   * In a row with a button beside text, `center` is almost always what you want.
   */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /** Distribution on the main axis. `between` pushes the first and the last to the ends. */
  justify?: "start" | "center" | "end" | "between";
  /** Lets the children wrap when they do not fit. Makes sense with `direction="row"`. */
  wrap?: boolean;
  /**
   * Swaps the rendered element while keeping the arrangement:
   * `<Stack render={<ul />}>`, `<Stack render={<nav />}>`.
   */
  render?: ReactElement;
};

export function Stack({
  direction = "column",
  gap = "md",
  align,
  justify,
  wrap = false,
  render,
  className,
  ...props
}: StackProps) {
  return useRender({
    render: render ?? <div />,
    props: {
      ...props,
      className: cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapClass[gap],
        align && alignClass[align],
        justify && justifyClass[justify],
        wrap && "flex-wrap",
        className,
      ),
    },
  });
}
