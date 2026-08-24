"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";
import { inputVariants } from "./field";
import { floatingPanel } from "./menu";

export const Combobox = BaseCombobox.Root;
export const ComboboxGroupLabel = BaseCombobox.GroupLabel;

export type ComboboxInputProps = ComponentProps<typeof BaseCombobox.Input> & {
  /** Mostra o botao de limpar quando ha escolha. */
  clearable?: boolean;
};

/**
 * O campo de busca com a seta e o limpar encostados.
 *
 * Combobox nao e Select com busca por acaso: use quando a lista e longa
 * demais para caber na cabeca de quem escolhe, ou quando ela vem do servidor.
 * Com cinco opcoes fixas, o `Select` custa menos e nao pede digitacao.
 */
export function ComboboxInput({ className, clearable = true, ...props }: ComboboxInputProps) {
  return (
    <BaseCombobox.InputGroup className={cn("relative flex w-full items-center", className)}>
      {/* O texto para antes dos botoes, senao ele passa por baixo deles. */}
      <BaseCombobox.Input {...props} className={cn(inputVariants(), "pr-16")} />

      <span className="absolute right-1.5 flex items-center gap-0.5">
        {clearable && (
          <BaseCombobox.Clear
            aria-label="Limpar escolha"
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md text-fg-subtle",
              "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
              "hover:bg-accent-subtle hover:text-fg",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X size={14} aria-hidden="true" />
          </BaseCombobox.Clear>
        )}

        <BaseCombobox.Trigger
          aria-label="Abrir lista"
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md text-fg-subtle",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
            "hover:bg-accent-subtle hover:text-fg",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <ChevronDown size={14} aria-hidden="true" />
        </BaseCombobox.Trigger>
      </span>
    </BaseCombobox.InputGroup>
  );
}

export type ComboboxContentProps = ComponentProps<typeof BaseCombobox.Popup> & {
  /** O que aparece quando a busca nao acha nada. */
  emptyMessage?: ReactNode;
};

export function ComboboxContent({
  className,
  children,
  emptyMessage = "Nada encontrado.",
  ...props
}: ComboboxContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseCombobox.Portal container={portalContainer ?? undefined}>
      <BaseCombobox.Positioner
        sideOffset={6}
        collisionPadding={8}
        className="z-[var(--rc-z-dropdown)] outline-none"
      >
        <BaseCombobox.Popup
          {...props}
          className={cn(
            floatingPanel,
            "max-h-72 w-[var(--anchor-width)] overflow-y-auto",
            className,
          )}
        >
          <BaseCombobox.Empty className="px-2.5 py-6 text-center text-sm text-fg-subtle">
            {emptyMessage}
          </BaseCombobox.Empty>
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

export function ComboboxList({ className, ...props }: ComponentProps<typeof BaseCombobox.List>) {
  return <BaseCombobox.List {...props} className={cn("flex flex-col", className)} />;
}

export function ComboboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseCombobox.Item>) {
  return (
    <BaseCombobox.Item
      {...props}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2.5 text-base text-fg",
        "py-[var(--rc-item-y)] outline-none select-none",
        "data-[highlighted]:bg-accent-subtle",
        "data-[disabled]:text-fg-disabled",
        className,
      )}
    >
      <BaseCombobox.ItemIndicator className="flex size-4 shrink-0 items-center justify-center text-accent-text">
        <Check size={14} aria-hidden="true" />
      </BaseCombobox.ItemIndicator>
      <span className="flex-1 truncate">{children}</span>
    </BaseCombobox.Item>
  );
}

export function ComboboxGroup({ className, ...props }: ComponentProps<typeof BaseCombobox.Group>) {
  return <BaseCombobox.Group {...props} className={cn("flex flex-col", className)} />;
}

/** As fichas da escolha multipla, dentro do proprio campo. */
export function ComboboxChips({ className, ...props }: ComponentProps<typeof BaseCombobox.Chips>) {
  return (
    <BaseCombobox.Chips {...props} className={cn("flex flex-wrap items-center gap-1", className)} />
  );
}

export function ComboboxChip({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseCombobox.Chip>) {
  return (
    <BaseCombobox.Chip
      {...props}
      className={cn(
        "flex items-center gap-1 rounded-sm bg-accent-subtle px-1.5 py-0.5 text-sm text-fg",
        className,
      )}
    >
      {children}
      <BaseCombobox.ChipRemove
        aria-label="Remover"
        className="text-fg-subtle transition-colors hover:text-fg"
      >
        <X size={12} aria-hidden="true" />
      </BaseCombobox.ChipRemove>
    </BaseCombobox.Chip>
  );
}
