"use client";

import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";

export const PreviewCard = BasePreviewCard.Root;
export const PreviewCardTrigger = BasePreviewCard.Trigger;

/**
 * O cartao que aparece ao pousar sobre um link: quem e o cliente, o que e
 * aquela nota, o resumo do termo.
 *
 * Nao e `Tooltip`. A dica explica um botao em poucas palavras e some ao sair; o
 * cartao mostra conteudo que da para ler com calma, e por isso ele espera antes
 * de abrir e demora a fechar, para o ponteiro chegar ate ele.
 *
 * Nada que so exista aqui e alcancavel por toque, entao o cartao nunca pode ser
 * o unico caminho para uma informacao.
 */
export function PreviewCardContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BasePreviewCard.Popup>) {
  const { portalContainer } = useRivoContext();

  return (
    <BasePreviewCard.Portal container={portalContainer ?? undefined}>
      <BasePreviewCard.Positioner
        sideOffset={8}
        collisionPadding={8}
        className="z-[var(--rc-z-popover)] outline-none"
      >
        <BasePreviewCard.Popup
          {...props}
          className={cn(
            "w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface-raised",
            "p-[var(--rc-pad-panel-sm)] shadow-3",
            "font-sans text-base text-fg outline-none",
            "origin-[var(--transform-origin)] transition-[opacity,transform]",
            "duration-[var(--rc-duration-fast)] ease-rc",
            "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
            className,
          )}
        >
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
