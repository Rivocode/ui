"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import {
  createContext,
  use,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type RefAttributes,
} from "react";

import { cn } from "../lib/cn";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import { useRivoContext } from "../provider/rivo-provider";

/**
 * O `id` do popup e se ele esta aberto agora, para o gatilho poder apontar.
 *
 * A Base UI 1.7.0 nao faz essa fiacao: nem `role`, nem `aria-describedby`. Nao
 * e esquecimento dela - a documentacao dela trata a dica como elemento visual
 * e manda rotular o gatilho por fora. Aqui a decisao e outra, porque a dica
 * carrega coisa que so existe nela: o `hint` do `Stat` explica o numero, e a
 * barra lateral encolhida diz por ela o nome de cada destino. Sem a fiacao, o
 * popup aparece no DOM com o texto dentro e sem papel nenhum, e quem usa
 * leitor de tela nunca fica sabendo que a explicacao existe.
 */
const DescriptionContext = createContext<{ id: string; open: boolean } | null>(null);

export type TooltipProps<Payload = unknown> = BaseTooltip.Root.Props<Payload>;

/**
 * A dica curta que aparece ao passar o mouse ou ao focar o gatilho.
 *
 * A raiz acompanha o estado aberto por conta propria, em espelho ao da Base
 * UI, porque so o gatilho aberto deve apontar para o popup: apontar sempre
 * deixaria um `aria-describedby` pendurado num `id` que nao existe no DOM
 * enquanto a dica esta fechada.
 */
export function Tooltip<Payload = unknown>({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: TooltipProps<Payload>) {
  const id = useId();
  const [selfOpen, setSelfOpen] = useState(defaultOpen ?? false);
  const isOpen = open ?? selfOpen;

  const description = useMemo(() => ({ id, open: isOpen }), [id, isOpen]);

  return (
    <DescriptionContext value={description}>
      <BaseTooltip.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next, details) => {
          setSelfOpen(next);
          onOpenChange?.(next, details);
        }}
        {...props}
      >
        {children}
      </BaseTooltip.Root>
    </DescriptionContext>
  );
}

export type TooltipTriggerProps<Payload = unknown> = BaseTooltip.Trigger.Props<Payload> &
  RefAttributes<HTMLElement>;

/**
 * O que a dica explica. Continua precisando de nome proprio: a dica descreve,
 * e descricao nao substitui rotulo em botao de icone.
 *
 * O `aria-describedby` de quem chama nao e trocado, e sim acompanhado - um
 * campo pode ter texto de apoio na pagina e uma dica ao mesmo tempo, e trocar
 * um pelo outro calaria metade da explicacao.
 */
export function TooltipTrigger<Payload = unknown>({
  "aria-describedby": describedBy,
  ...props
}: TooltipTriggerProps<Payload>) {
  const description = use(DescriptionContext);
  const ids = [describedBy, description?.open ? description.id : undefined]
    .filter(Boolean)
    .join(" ");

  return <BaseTooltip.Trigger aria-describedby={ids || undefined} {...props} />;
}

export type TooltipContentProps = ComponentProps<typeof BaseTooltip.Popup> & FloatingPositionProps;

export function TooltipContent({
  className,
  children,
  sideOffset = FLOATING_SIDE_OFFSET,
  side,
  align,
  ...props
}: TooltipContentProps) {
  const { portalContainer } = useRivoContext();
  const description = use(DescriptionContext);
  // A dica montada fora de uma raiz nossa continua tendo papel e `id`; o que
  // ela nao tem e quem aponte para ela.
  const fallbackId = useId();

  return (
    <BaseTooltip.Portal container={portalContainer ?? undefined}>
      <BaseTooltip.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        collisionPadding={8}
        className="z-[var(--rc-z-tooltip)] outline-none"
      >
        <BaseTooltip.Popup
          role="tooltip"
          id={description?.id ?? fallbackId}
          {...props}
          className={cn(
            "max-w-[calc(100vw-1rem)] rounded-md border border-border bg-surface-raised",
            "px-2.5 py-1.5 shadow-2",
            "font-sans text-sm text-fg",
            "origin-[var(--transform-origin)] transition-[opacity,transform]",
            "duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
            "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
            className,
          )}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
