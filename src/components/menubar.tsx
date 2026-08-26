"use client";

import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { MenuTrigger } from "./menu";

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

/**
 * O gatilho de um menu dentro da barra: "Arquivo", "Editar", "Exibir".
 *
 * Existe separado do `MenuTrigger` porque os dois tem trabalhos diferentes. O
 * MenuTrigger sai sem estilo de proposito - o uso comum dele e
 * `render={<Button />}`, e duas fontes de estilo brigariam. Quem pagava por
 * isso era a barra: o exemplo da documentacao repetia as mesmas cinco classes
 * em cada item, e toda barra da organizacao ia repetir de novo.
 */
export function MenubarTrigger({
  className,
  ...props
}: ComponentProps<typeof MenuTrigger>) {
  return (
    <MenuTrigger
      {...props}
      className={cn(
        "rounded-sm px-2.5 py-1 font-sans text-base text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "data-[popup-open]:bg-accent-subtle data-[popup-open]:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}
