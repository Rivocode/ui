import type { ReactNode } from "react";
import { View } from "react-native";

import { tokens } from "../tokens";
import { cn } from "./cn";

export type LayoutGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

export function gapSize(gap: LayoutGap): number {
  return gap === "none" ? 0 : tokens.scales[`gap-${gap}`];
}

const alignClass = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

const justifyClass = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

export type StackProps = {
  /** The children's axis. `column` stacks one below the other; `row` places them side by side. */
  direction?: "column" | "row";
  /**
   * The gap between children, on the house scale: `xs` 4, `sm` 8, `md` 12, `lg`
   * 16 and `xl` 24 points. These are the numbers of the web's comfortable
   * density, which on touch is the only one.
   */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** Alignment on the cross axis. With no value, the children stretch, as on the web. */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /** Distribution on the main axis. `between` pushes the first and last to the ends. */
  justify?: "start" | "center" | "end" | "between";
  /** Lets the children wrap when they do not fit. Makes sense with `direction="row"`. */
  wrap?: boolean;
  children?: ReactNode;
  className?: string;
};

export function Stack({
  direction = "column",
  gap = "md",
  align,
  justify,
  wrap = false,
  children,
  className,
}: StackProps) {
  return (
    <View
      style={{ gap: gapSize(gap) }}
      className={cn(
        direction === "row" ? "flex-row" : "flex-col",
        align && alignClass[align],
        justify && justifyClass[justify],
        wrap && "flex-wrap",
        className,
      )}
    >
      {children}
    </View>
  );
}
