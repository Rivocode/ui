"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

/**
 * O menu do botao direito.
 *
 * O conteudo e o mesmo do `Menu`: use `MenuContent`, `MenuItem`, `MenuGroup` e
 * `MenuSeparator` dentro dele. So o gatilho muda, porque aqui quem abre e a
 * area inteira, e nao um botao.
 *
 * Nunca deixe uma acao existir **so** aqui: no celular nao ha botao direito, e
 * quem navega por teclado precisa da tecla de menu, que nem todo teclado tem.
 * Ele acelera o que ja esta em outro lugar.
 */
export const ContextMenu = BaseContextMenu.Root;

export function ContextMenuTrigger({
  className,
  ...props
}: ComponentProps<typeof BaseContextMenu.Trigger>) {
  return <BaseContextMenu.Trigger {...props} className={cn("outline-none", className)} />;
}
