import { Children, useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { cn } from "./cn";
import { gapSize } from "./stack";

export type GridProps = {
  /**
   * Quantas colunas, fixas e de largura igual. Para a grade que muda com a
   * largura, use `minItemWidth` no lugar: as duas juntas nao combinam, e
   * `minItemWidth` vence.
   */
  columns?: number;
  /**
   * A largura minima de cada item, em pontos. A grade mede a propria largura e
   * poe quantas colunas couberem; a ultima linha guarda o lugar das que
   * faltam, para o item solto nao esticar ate a borda. Antes da primeira
   * medida, sai uma coluna.
   */
  minItemWidth?: number;
  /** O vao entre linhas e colunas, na mesma escala do `Stack`. */
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
