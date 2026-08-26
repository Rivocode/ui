"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import { useRivoContext } from "../provider/rivo-provider";
import { floatingPanel } from "./menu";

export const Popover = BasePopover.Root;
export const PopoverClose = BasePopover.Close;

export function PopoverTrigger({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Trigger>) {
  return (
    <BasePopover.Trigger
      {...props}
      className={cn(
        // Mesma receita do MenuTrigger, pelo mesmo motivo: ele sai sem PELE de
        // proposito - o uso comum e `render={<Button />}`, e duas fontes de
        // estilo brigariam -, mas foco nao e pele. `outline-none` sozinho nao e
        // "sem estilo", e a remocao ativa do unico sinal que o navegador da de
        // graca. Quando o gatilho e escrito na mao, o anel daqui e o unico que
        // existe; quando ele vem de um Button, e o mesmo anel e as classes se
        // fundem sem dobrar.
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

export type PopoverContentProps = ComponentProps<typeof BasePopover.Popup> & FloatingPositionProps;

/**
 * O painel flutuante de conteudo livre. Divide a casca do Menu e do Select,
 * mas troca o `p-1` de lista por respiro de leitura: aqui entra texto, campo e
 * botao, nao item de menu.
 *
 * O `side`, o `align` e o `sideOffset` moram aqui, e nao no `Positioner`,
 * porque quem escreve a tela pensa neles junto com o conteudo - e as cinco
 * pecas que flutuam falam a mesma lingua, pelo `FloatingPositionProps`.
 */
export function PopoverContent({
  className,
  children,
  sideOffset = FLOATING_SIDE_OFFSET,
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
          className={cn(
            floatingPanel,
            "min-w-[14rem] max-w-[calc(100vw-2rem)] p-[var(--rc-pad-panel-sm)]",
            className,
          )}
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
      className={cn("font-display text-base leading-[var(--rc-leading-tight)] tracking-tight text-fg", className)}
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
