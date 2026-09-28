"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactElement } from "react";

import { cn } from "../lib/cn";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClass: Record<ContainerSize, string> = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export type ContainerProps = ComponentProps<"div"> & {
  /**
   * The max width. `sm` (36rem) for a short form and a sign-in screen;
   * `md` (48rem) for registration, settings and running text; `lg` (72rem) for a
   * page with columns; `xl` (80rem) for a wide dashboard; `full` only gives the
   * side padding, with no cap.
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /**
   * Swaps the rendered element while keeping the width:
   * `<Container render={<main />}>`, `<Container render={<section />}>`.
   */
  render?: ReactElement;
};

export function Container({ size = "lg", render, className, ...props }: ContainerProps) {
  return useRender({
    render: render ?? <div />,
    props: {
      ...props,
      className: cn(
        "mx-auto w-full px-[var(--rc-pad-panel-sm)] sm:px-[var(--rc-pad-panel)]",
        sizeClass[size],
        className,
      ),
    },
  });
}
