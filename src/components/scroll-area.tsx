"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type ScrollAreaProps = ComponentProps<typeof BaseScrollArea.Root> & {
  /** Rolagem de lado tambem. Use com tabela e com fila de cartoes. */
  horizontal?: boolean;
};

/**
 * Area de rolagem com barra propria.
 *
 * Serve para quando a barra do sistema atrapalha o desenho: no Windows ela
 * ocupa largura e empurra o conteudo, e a diferenca entre plataformas aparece
 * na tela. Para rolagem comum de pagina, `overflow-y-auto` continua sendo mais
 * barato.
 */
export function ScrollArea({ className, horizontal, children, ...props }: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root {...props} className={cn("relative", className)}>
      <BaseScrollArea.Viewport className="size-full overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>

      <BaseScrollArea.Scrollbar
        orientation="vertical"
        className={cn(
          "flex w-2 justify-center p-0.5 opacity-0",
          "transition-opacity duration-[var(--rc-duration-base)] ease-rc",
          "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
        )}
      >
        <BaseScrollArea.Thumb className="w-full rounded-pill bg-border-strong" />
      </BaseScrollArea.Scrollbar>

      {horizontal && (
        <BaseScrollArea.Scrollbar
          orientation="horizontal"
          className={cn(
            "flex h-2 items-center p-0.5 opacity-0",
            "transition-opacity duration-[var(--rc-duration-base)] ease-rc",
            "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
          )}
        >
          <BaseScrollArea.Thumb className="h-full rounded-pill bg-border-strong" />
        </BaseScrollArea.Scrollbar>
      )}
    </BaseScrollArea.Root>
  );
}
