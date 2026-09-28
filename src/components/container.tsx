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
   * A largura maxima. `sm` (36rem) para formulario curto e tela de entrada;
   * `md` (48rem) para cadastro, configuracao e texto corrido; `lg` (72rem) para
   * pagina com colunas; `xl` (80rem) para painel largo; `full` so da o respiro
   * lateral, sem teto.
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /**
   * Troca o elemento renderizado mantendo a largura:
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
