"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import type { Slots } from "../lib/slots";
import { useRivoContext } from "../provider/rivo-provider";

export const Menu = BaseMenu.Root;

export function MenuTrigger({ className, ...props }: ComponentProps<typeof BaseMenu.Trigger>) {
  return (
    <BaseMenu.Trigger
      {...props}
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    />
  );
}

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

export const floatingGroupLabel =
  "px-2.5 py-1.5 text-xs font-medium tracking-[0.04em] text-fg-subtle uppercase";

export type MenuGroupProps = ComponentProps<typeof BaseMenu.Group> & {
  /** Titulo do grupo. Sem ele o grupo apenas agrupa. */
  label?: string;
  /** Classe por parte: `label`, o titulo do grupo. */
  classNames?: Slots<"label">;
};

export function MenuGroup({ className, classNames, label, children, ...props }: MenuGroupProps) {
  return (
    <BaseMenu.Group {...props} className={className}>
      {label && (
        <BaseMenu.GroupLabel className={cn(floatingGroupLabel, classNames?.label)}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  );
}

const markColumn = cn(
  "flex size-4 shrink-0 items-center justify-center text-accent-text",
  "group-data-[disabled]/item:text-fg-disabled",
);

export type MenuCheckboxItemProps = ComponentProps<typeof BaseMenu.CheckboxItem> &
  VariantProps<typeof menuItemVariants> & {
    /** Classe por parte: `indicator`, a coluna que guarda a marca. */
    classNames?: Slots<"indicator">;
  };

export function MenuCheckboxItem({
  className,
  classNames,
  tone,
  children,
  ...props
}: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      {...props}
      className={cn(menuItemVariants({ tone }), "group/item", className)}
    >
      <span className={cn(markColumn, classNames?.indicator)}>
        <BaseMenu.CheckboxItemIndicator>
          <Check size={14} aria-hidden="true" />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </BaseMenu.CheckboxItem>
  );
}

export type MenuRadioGroupProps = ComponentProps<typeof BaseMenu.RadioGroup> & {
  /** Titulo do grupo: "Ordenar por". Sem ele o grupo apenas agrupa. */
  label?: string;
  /** Classe por parte: `label`, o titulo do grupo. */
  classNames?: Slots<"label">;
};

export function MenuRadioGroup({
  className,
  classNames,
  label,
  children,
  ...props
}: MenuRadioGroupProps) {
  return (
    <BaseMenu.RadioGroup {...props} className={className}>
      {label && (
        <BaseMenu.GroupLabel className={cn(floatingGroupLabel, classNames?.label)}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.RadioGroup>
  );
}

export type MenuRadioItemProps = ComponentProps<typeof BaseMenu.RadioItem> &
  VariantProps<typeof menuItemVariants> & {
    /** Classe por parte: `indicator`, a coluna que guarda o ponto. */
    classNames?: Slots<"indicator">;
  };

export function MenuRadioItem({
  className,
  classNames,
  tone,
  children,
  ...props
}: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem
      {...props}
      className={cn(menuItemVariants({ tone }), "group/item", className)}
    >
      <span className={cn(markColumn, classNames?.indicator)}>
        <BaseMenu.RadioItemIndicator
          className={cn(
            "size-1.5 rounded-pill bg-accent-text",
            "group-data-[disabled]/item:bg-fg-disabled",
          )}
        />
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </BaseMenu.RadioItem>
  );
}

export const MenuSubmenu = BaseMenu.SubmenuRoot;

export type MenuSubmenuTriggerProps = ComponentProps<typeof BaseMenu.SubmenuTrigger> & {
  /** Classe por parte: `indicator`, a seta que aponta para o ramo. */
  classNames?: Slots<"indicator">;
};

export function MenuSubmenuTrigger({
  className,
  classNames,
  children,
  ...props
}: MenuSubmenuTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger
      {...props}
      className={cn(menuItemVariants(), "data-[popup-open]:bg-accent-subtle", className)}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronRight
        size={14}
        aria-hidden="true"
        className={cn("shrink-0 text-fg-subtle", classNames?.indicator)}
      />
    </BaseMenu.SubmenuTrigger>
  );
}

export type MenuLinkItemProps = ComponentProps<typeof BaseMenu.LinkItem>;

export function MenuLinkItem({ className, closeOnClick = true, ...props }: MenuLinkItemProps) {
  return (
    <BaseMenu.LinkItem
      {...props}
      closeOnClick={closeOnClick}
      className={cn(menuItemVariants(), "no-underline", className)}
    />
  );
}
