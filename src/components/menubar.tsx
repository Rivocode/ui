"use client";

import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type MenubarProps = ComponentProps<typeof BaseMenubar>;

/**
 * A barra de menus de aplicativo: Arquivo, Editar, Exibir.
 *
 * Coordena varios `Menu` lado a lado: com um aberto, passar o mouse sobre o
 * vizinho ja troca, sem novo clique, e as setas andam entre eles.
 *
 * Em tela de web isso quase nunca e o certo. Barra de menus e vocabulario de
 * programa de mesa; num painel, `Sidebar` e `Tabs` dizem mais. Ela existe para
 * editor e ferramenta, onde o usuario ja espera esse arranjo.
 */
export function Menubar({ className, ...props }: MenubarProps) {
  return (
    <BaseMenubar
      {...props}
      className={cn(
        "flex items-center gap-0.5 rounded-md border border-border bg-surface p-1",
        className,
      )}
    />
  );
}
