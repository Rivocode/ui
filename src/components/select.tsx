"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import { useRivoContext } from "../provider/rivo-provider";
import { floatingGroupLabel, floatingPanel } from "./menu";

/**
 * Passe `items` com `{ label, value }` para o gatilho mostrar o rotulo. Sem
 * isso ele mostra o valor cru, porque so a lista sabe traduzir um pelo outro.
 * E contrato da Base UI, e a armadilha mais facil de cair neste componente.
 */
export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Trigger>) {
  return (
    <BaseSelect.Trigger
      {...props}
      className={cn(
        "flex h-[var(--rc-control-md)] min-w-40 items-center justify-between gap-2",
        "rounded-md border border-border-strong bg-surface px-[var(--rc-control-pad-md)]",
        "font-sans text-base text-fg select-none",
        "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
        "outline-none hover:bg-surface-raised",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "focus-visible:ring-offset-bg",
        "data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled",
        "data-[invalid]:border-danger",
        className,
      )}
    >
      {children}
      <BaseSelect.Icon className="text-fg-subtle">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="currentColor">
          <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
        </svg>
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export type SelectContentProps = ComponentProps<typeof BaseSelect.Popup> & FloatingPositionProps;

/**
 * A lista flutuante, com o mesmo vocabulario de posicionamento das outras
 * quatro pecas que flutuam.
 *
 * Pedir lado, alinhamento ou distancia desliga o `alignItemWithTrigger` da
 * Base UI, que por padrao sobrepoe o painel ao gatilho para casar o item
 * escolhido com o texto dele. Os dois nao cabem juntos: naquele modo o
 * posicionador responde `data-side="none"` e ignora a folga, entao expor as
 * props sem desligar o modo seria entregar tres props que nao fazem nada. Quem
 * nao pede nada continua com o comportamento de sempre.
 */
export function SelectContent({
  className,
  children,
  sideOffset,
  side,
  align,
  ...props
}: SelectContentProps) {
  const { portalContainer } = useRivoContext();
  const positioned = side !== undefined || align !== undefined || sideOffset !== undefined;

  return (
    <BaseSelect.Portal container={portalContainer ?? undefined}>
      <BaseSelect.Positioner
        sideOffset={sideOffset ?? FLOATING_SIDE_OFFSET}
        side={side}
        align={align}
        alignItemWithTrigger={positioned ? false : undefined}
        collisionPadding={8}
        className="z-[var(--rc-z-dropdown)] outline-none"
      >
        <BaseSelect.Popup
          {...props}
          className={cn(floatingPanel, "min-w-[var(--anchor-width)]", className)}
        >
          <BaseSelect.List className="max-h-[var(--available-height)] overflow-y-auto">
            {children}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      {...props}
      className={cn(
        "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2",
        "rounded-sm py-1.5 pr-3 pl-2 text-base text-fg outline-none select-none",
        "data-[highlighted]:bg-accent-subtle",
        "data-[disabled]:text-fg-disabled",
        className,
      )}
    >
      <BaseSelect.ItemIndicator className="col-start-1 text-accent-text">
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2.5 8.5 4 4 7-9" />
        </svg>
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className="col-start-2">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

/**
 * Uma familia dentro da lista, com o `SelectGroupLabel` de cabecalho.
 *
 * O desenho e o do `ComboboxGroup`, e nao o do `MenuGroup`, porque a irma e
 * ela: as duas listam opcoes de formulario, e quem troca uma pela outra ao
 * descobrir que a lista cresceu nao deveria ter que reescrever a arvore.
 *
 * Agrupar so paga quando as familias sao de verdade - natureza de operacao por
 * tipo, UF por regiao, plano de contas. Grupo de dois itens acrescenta um
 * cabecalho e nao tira trabalho nenhum de quem procura.
 */
export function SelectGroup({ className, ...props }: ComponentProps<typeof BaseSelect.Group>) {
  return <BaseSelect.Group {...props} className={cn("flex flex-col", className)} />;
}

/**
 * O cabecalho de um `SelectGroup`. Vive dentro dele: e o grupo que aponta o
 * `aria-labelledby` para ca, e um titulo escrito por fora nao nomeia nada.
 */
export function SelectGroupLabel({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.GroupLabel>) {
  return <BaseSelect.GroupLabel {...props} className={cn(floatingGroupLabel, className)} />;
}

/**
 * A linha entre dois grupos da lista.
 *
 * Ela sai com `role="presentation"`, e nao com o `role="separator"` do
 * `MenuSeparator`: dentro de uma lista de opcoes, um no com papel proprio
 * entra na contagem que o leitor de tela anuncia ("opcao 3 de 12") e quebra a
 * conta. Quem ouve recebe a fronteira pelo nome do grupo.
 */
export function SelectSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Separator>) {
  return <BaseSelect.Separator {...props} className={cn("my-1 h-px bg-border", className)} />;
}
