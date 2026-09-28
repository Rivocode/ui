"use client";

import { useRender } from "@base-ui/react/use-render";
import type { CSSProperties, ComponentProps, ReactElement } from "react";

import { cn } from "../lib/cn";
import { gapClass } from "./stack";

export type GridProps = ComponentProps<"div"> & {
  /**
   * How many columns, fixed and of equal width. For a grid that changes with the
   * screen, use `minItemWidth` instead: the two together do not combine, and
   * `minItemWidth` wins.
   */
  columns?: number;
  /**
   * The minimum width of each item: a number in pixels or a CSS measure (`"16rem"`).
   * The grid places as many columns as fit and splits the leftover among them, with no media
   * query. On a screen narrower than the minimum, the item takes the whole row
   * instead of overflowing.
   */
  minItemWidth?: number | string;
  /** The gap between rows and columns, on the same scale and with the same density as `Stack`. */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Swaps the rendered element while keeping the arrangement:
   * `<Grid render={<ul />}>`.
   */
  render?: ReactElement;
};

function templateOf(columns?: number, minItemWidth?: number | string): string | undefined {
  if (minItemWidth !== undefined) {
    const min = typeof minItemWidth === "number" ? `${minItemWidth}px` : minItemWidth;
    return `repeat(auto-fill, minmax(min(${min}, 100%), 1fr))`;
  }
  if (columns !== undefined && columns >= 1) {
    return `repeat(${Math.floor(columns)}, minmax(0, 1fr))`;
  }
  return undefined;
}

export function Grid({
  columns,
  minItemWidth,
  gap = "md",
  render,
  className,
  style,
  ...props
}: GridProps) {
  const template = templateOf(columns, minItemWidth);
  const merged: CSSProperties | undefined = template
    ? { gridTemplateColumns: template, ...style }
    : style;

  return useRender({
    render: render ?? <div />,
    props: {
      ...props,
      style: merged,
      className: cn("grid", gapClass[gap], className),
    },
  });
}
