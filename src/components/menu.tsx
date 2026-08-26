"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import { useRivoContext } from "../provider/rivo-provider";

export const Menu = BaseMenu.Root;

export function MenuTrigger({ className, ...props }: ComponentProps<typeof BaseMenu.Trigger>) {
  return (
    <BaseMenu.Trigger
      {...props}
      className={cn(
        // Ele sai sem PELE de proposito - o uso comum e `render={<Button />}`, e
        // duas fontes de estilo brigariam. Foco nao e pele: `outline-none`
        // sozinho nao e "sem estilo", e remocao ativa do unico sinal que o
        // navegador da de graca. Quando o gatilho e escrito na mao, como na
        // barra de menus, o anel daqui e o unico que existe; quando ele vem de
        // um Button, o anel e o mesmo e as classes se fundem sem dobrar.
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

/**
 * Casca compartilhada de tudo que flutua: portal com o tema, posicionamento e
 * o painel. Menu, Select e Tooltip usam a mesma linguagem visual de proposito.
 */
export const floatingPanel = cn(
  "min-w-[8rem] max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-surface-raised p-1 shadow-3",
  "font-sans text-fg outline-none",
  "origin-[var(--transform-origin)] transition-[opacity,transform]",
  "duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
  "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
);

export type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> & FloatingPositionProps;

export function MenuContent({
  className,
  children,
  sideOffset = FLOATING_SIDE_OFFSET,
  side,
  align,
  ...props
}: MenuContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseMenu.Portal container={portalContainer ?? undefined}>
      <BaseMenu.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        collisionPadding={8}
        className="z-[var(--rc-z-dropdown)] outline-none"
      >
        <BaseMenu.Popup {...props} className={cn(floatingPanel, className)}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export const menuItemVariants = cva(
  cn(
    "flex cursor-default items-center gap-2 rounded-sm px-2.5 text-base",
    "py-[var(--rc-item-y)]",
    "outline-none select-none",
    "data-[highlighted]:bg-accent-subtle",
    "data-[disabled]:text-fg-disabled data-[disabled]:data-[highlighted]:bg-transparent",
  ),
  {
    variants: {
      tone: {
        neutral: "text-fg",
        danger: "text-danger-text data-[highlighted]:bg-danger-subtle",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type MenuItemProps = ComponentProps<typeof BaseMenu.Item> &
  VariantProps<typeof menuItemVariants>;

export function MenuItem({ className, tone, ...props }: MenuItemProps) {
  return <BaseMenu.Item {...props} className={cn(menuItemVariants({ tone }), className)} />;
}

export function MenuSeparator({ className, ...props }: ComponentProps<typeof BaseMenu.Separator>) {
  return <BaseMenu.Separator {...props} className={cn("my-1 h-px bg-border", className)} />;
}

export type MenuGroupProps = ComponentProps<typeof BaseMenu.Group> & {
  /** Titulo do grupo. Sem ele o grupo apenas agrupa. */
  label?: string;
};

/**
 * Grupo de itens com titulo. O rotulo e o grupo vem juntos de proposito: a
 * Base UI exige que o rotulo viva dentro de um grupo, e expor as duas pecas
 * separadas so criava uma forma de usar errado que quebra na tela, nao no
 * teste de tipo.
 */
export function MenuGroup({ className, label, children, ...props }: MenuGroupProps) {
  return (
    <BaseMenu.Group {...props} className={className}>
      {label && (
        <BaseMenu.GroupLabel className="px-2.5 py-1.5 text-xs font-medium tracking-[0.04em] text-fg-subtle uppercase">
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  );
}
