import { Children, useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { cn } from "./cn";
import { gapSize } from "./stack";

export type GridProps = {
  /**
   * How many columns, fixed and of equal width. For a grid that changes with
   * the width, use `minItemWidth` instead: the two together do not combine, and
   * `minItemWidth` wins.
   */
  columns?: number;
  /**
   * The minimum width of each item, in points. The grid measures its own width
   * and fits as many columns as it can; the last row keeps the place of the
   * missing ones, so a lone item does not stretch to the edge. Before the first
   * measurement, there is one column.
   */
  minItemWidth?: number;
  /** The gap between rows and columns, on the same scale as `Stack`. */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  children?: ReactNode;
  className?: string;
};

function countOf(width: number, space: number, columns?: number, minItemWidth?: number) {
  if (minItemWidth !== undefined && minItemWidth > 0) {
    if (width <= 0) return 1;
    return Math.max(1, Math.floor((width + space) / (minItemWidth + space)));
  }
  return Math.max(1, Math.floor(columns ?? 1));
}

export function Grid({ columns, minItemWidth, gap = "md", children, className }: GridProps) {
  const [width, setWidth] = useState(0);
  const space = gapSize(gap);
  const count = countOf(width, space, columns, minItemWidth);
  const items = Children.toArray(children);

  const rows: ReactNode[][] = [];
  for (let start = 0; start < items.length; start += count) {
    rows.push(items.slice(start, start + count));
  }

  const measure =
    minItemWidth !== undefined
      ? (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)
      : undefined;

  return (
    <View onLayout={measure} style={{ gap: space }} className={cn("w-full", className)}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ gap: space }} className="flex-row">
          {row.map((item, index) => (
            <View key={index} className="min-w-0 flex-1">
              {item}
            </View>
          ))}
          {Array.from({ length: count - row.length }, (_, index) => (
            <View key={`vazio-${index}`} className="flex-1" />
          ))}
        </View>
      ))}
    </View>
  );
}
