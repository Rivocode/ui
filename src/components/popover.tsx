"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";
import { floatingPanel } from "./menu";

export const Popover = BasePopover.Root;
export const PopoverClose = BasePopover.Close;

export function PopoverTrigger({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Trigger>) {
  return <BasePopover.Trigger {...props} className={cn("outline-none", className)} />;
}

export type PopoverContentProps = ComponentProps<typeof BasePopover.Popup> & {
  /** Distancia entre o gatilho e o painel. */
  sideOffset?: ComponentProps<typeof BasePopover.Positioner>["sideOffset"];
  /** Lado preferido. A Base UI vira sozinha quando nao cabe. */
  side?: ComponentProps<typeof BasePopover.Positioner>["side"];
  /** Alinhamento no eixo do lado escolhido. */
  align?: ComponentProps<typeof BasePopover.Positioner>["align"];
};

/**
 * O painel flutuante de conteudo livre. Divide a casca do Menu e do Select,
 * mas troca o `p-1` de lista por respiro de leitura: aqui entra texto, campo e
 * botao, nao item de menu.
 *
 * O `side`, o `align` e o `sideOffset` sobem para ca porque quem escreve a tela
 * pensa neles junto com o conteudo, e nao deveria precisar conhecer o
 * `Positioner` para mover o painel um pouco.
 */
export function PopoverContent({
  className,
  children,
  sideOffset = 8,
  side,
  align,
  ...props
}: PopoverContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    // Mesma armadilha do Dialog: `container={null}` some com o painel na
    // primeira renderizacao, antes do efeito que cria o container do tema.
    <BasePopover.Portal container={portalContainer ?? undefined}>
      <BasePopover.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        collisionPadding={8}
        className="z-[var(--rc-z-popover)] outline-none"
      >
        <BasePopover.Popup
          {...props}
          className={cn(floatingPanel, "min-w-[14rem] max-w-[calc(100vw-2rem)] p-[var(--rc-pad-panel-sm)]", className)}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export function PopoverTitle({ className, ...props }: ComponentProps<typeof BasePopover.Title>) {
  return (
    <BasePopover.Title
      {...props}
      className={cn("font-display text-base leading-[var(--rc-leading-tight)] text-fg", className)}
    />
  );
}

export function PopoverDescription({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Description>) {
  return (
    <BasePopover.Description {...props} className={cn("mt-1 text-sm text-fg-muted", className)} />
  );
}
