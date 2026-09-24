"use client";

import { useRender } from "@base-ui/react/use-render";
import type { CSSProperties, ComponentProps, ReactElement } from "react";

import { cn } from "../lib/cn";
import { gapClass } from "./stack";

export type GridProps = ComponentProps<"div"> & {
  /**
   * Quantas colunas, fixas e de largura igual. Para a grade que muda com a
   * tela, use `minItemWidth` no lugar: as duas juntas nao combinam, e
   * `minItemWidth` vence.
   */
  columns?: number;
  /**
   * A largura minima de cada item: numero em pixels ou medida CSS (`"16rem"`).
   * A grade poe quantas colunas couberem e divide a sobra entre elas, sem media
   * query. Numa tela mais estreita que o minimo, o item ocupa a linha inteira
   * em vez de vazar.
   */
  minItemWidth?: number | string;
  /** O vao entre linhas e colunas, na mesma escala e com a mesma densidade do `Stack`. */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Troca o elemento renderizado mantendo o arranjo:
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
