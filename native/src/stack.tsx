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
  /** O eixo dos filhos. `column` empilha um embaixo do outro; `row` poe lado a lado. */
  direction?: "column" | "row";
  /**
   * O vao entre os filhos, na escala da casa: `xs` 4, `sm` 8, `md` 12, `lg` 16
   * e `xl` 24 pontos. Sao os numeros da densidade confortavel do web, que no
   * toque e a unica.
   */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** O alinhamento no eixo cruzado. Sem valor, os filhos esticam, como no web. */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /** A distribuicao no eixo principal. `between` empurra o primeiro e o ultimo para as pontas. */
  justify?: "start" | "center" | "end" | "between";
  /** Deixa os filhos quebrarem linha quando nao cabem. Faz sentido com `direction="row"`. */
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
