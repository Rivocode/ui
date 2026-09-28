"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";
import { Tooltip, TooltipContent } from "./tooltip";

const SQUARE = {
  sm: "size-[var(--rc-control-sm)] p-0 [&_svg]:size-4",
  md: "size-[var(--rc-control-md)] p-0 [&_svg]:size-4",
  lg: "size-[var(--rc-control-lg)] p-0 [&_svg]:size-5",
} as const;

export type IconButtonProps = Omit<
  ButtonProps,
  "size" | "children" | "aria-label" | "aria-labelledby"
> & {
  /**
   * O nome do botao, obrigatorio: e o que o leitor de tela anuncia, e o texto
   * da dica quando `tooltip` esta ligado. Diga a acao ("Excluir nota"), e nao o
   * desenho ("Lixeira").
   */
  label: string;
  /** Recusado pelo tipo: o nome acessivel tem um caminho so, que e o `label`. */
  "aria-label"?: never;
  /** Recusado pelo tipo, pelo mesmo motivo do `aria-label`. */
  "aria-labelledby"?: never;
  /** O icone, sozinho. Ele sai `aria-hidden`, porque quem nomeia e o `label`. */
  children: ReactNode;
  /** O lado do quadrado, lido de `--rc-control-*`: encolhe com a densidade. */
  size?: "sm" | "md" | "lg";
  /**
   * Mostra o `label` numa dica ao pousar o ponteiro ou focar pelo teclado.
   * Ligue quando o icone nao for universal; a dica nao entra no nome, que ja
   * e o `label`, entao o leitor de tela nao ouve a mesma frase duas vezes.
   */
  tooltip?: boolean;
  /** O lado em que a dica abre, quando `tooltip` esta ligado. Sem ele, em cima. */
  tooltipSide?: "top" | "bottom" | "left" | "right";
};

export function IconButton({
  label,
  children,
  size = "md",
  tooltip = false,
  tooltipSide,
  loading = false,
  className,
  ...props
}: IconButtonProps) {
  const button: ReactElement = (
    <Button
      {...props}
      size={null}
      loading={loading}
      aria-label={label}
      className={cn(SQUARE[size], "[&_svg]:shrink-0", className)}
    >
      {loading ? null : (
        <span aria-hidden="true" className="contents">
          {children}
        </span>
      )}
    </Button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <BaseTooltip.Trigger render={button} />
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
