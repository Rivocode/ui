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
  /** O eixo dos filhos. `column` empilha um embaixo do outro; `row` poe lado a lado. */
  direction?: "column" | "row";
  /**
   * O vao entre os filhos, na escala da casa: `xs` 4, `sm` 8, `md` 12, `lg` 16
   * e `xl` 24 pixels na densidade confortavel. Na compacta a escala encolhe
   * junto com os controles (`sm` 6, `md` 8, `lg` 12, `xl` 16); `xs` fica em 4.
   */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * O alinhamento no eixo cruzado. Sem valor, vale o do CSS: os filhos esticam.
   * Numa linha de botao ao lado de texto, `center` e quase sempre o que se quer.
   */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /** A distribuicao no eixo principal. `between` empurra o primeiro e o ultimo para as pontas. */
  justify?: "start" | "center" | "end" | "between";
  /** Deixa os filhos quebrarem linha quando nao cabem. Faz sentido com `direction="row"`. */
  wrap?: boolean;
  /**
   * Troca o elemento renderizado mantendo o arranjo:
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
