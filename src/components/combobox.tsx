"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { createContext, use, useMemo, useRef, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import {
  isChosen,
  keyOnScreen,
  plainText,
  useKeyOnScreenWarning,
  type LabelLookup,
} from "../lib/item-label";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import type { Slots } from "../lib/slots";
import { useRivoContext } from "../provider/rivo-provider";
import { inputVariants } from "./field";
import { floatingGroupLabel, floatingPanel } from "./menu";

type ComboboxLabelSource = {
  chosen: unknown;
  lookup: LabelLookup;
  resolved: { current: boolean };
};

const ComboboxLabels = createContext<ComboboxLabelSource | null>(null);

export function missingComboboxLabelComplaint(key: string, label: string): string {
  return (
    `[rivocode/ui] <Combobox> sem \`itemToStringLabel\`: o campo está mostrando "${key}", que é ` +
    `a chave do item, e não "${label}", que é o texto da lista. Item em objeto sem \`label\` ` +
    "não tem rótulo de onde a Base UI possa ler, e ela escreve a chave crua, sem erro na tela. " +
    "Passe itemToStringLabel={(item) => item.nome} ao <Combobox>, ou dê ao item a forma " +
    "{ value, label }."
  );
}

function comboboxComplaintOf(
  source: ComboboxLabelSource | null,
  value: unknown,
  children: ReactNode,
): string | null {
  if (source === null || source.resolved.current) return null;
  if (!isChosen(source.chosen, value)) return null;

  const key = keyOnScreen(source.chosen, source.lookup);
  if (key === null || key === "") return null;

  const label = plainText(children);
  if (label === null || label === key) return null;

  return missingComboboxLabelComplaint(key, label);
}

export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: BaseCombobox.Root.Props<Value, Multiple>,
) {
  const { value, defaultValue, items, itemToStringLabel, inputValue, defaultInputValue } = props;
  const resolved = useRef(false);

  if (inputValue !== undefined || defaultInputValue !== undefined) resolved.current = true;

  const source = useMemo<ComboboxLabelSource>(
    () => ({
      chosen: value === undefined ? defaultValue : value,
      lookup: { items, itemToStringLabel },
      resolved,
    }),
    [value, defaultValue, items, itemToStringLabel],
  );

  return (
    <ComboboxLabels value={source}>
      <BaseCombobox.Root {...props} />
    </ComboboxLabels>
  );
}

export type ComboboxInputProps = ComponentProps<typeof BaseCombobox.Input> & {
  /** Mostra o botao de limpar quando ha escolha. */
  clearable?: boolean;
  /**
   * Classe por parte: `wrapper`, `input`. O `className` veste a raiz, que aqui
   * e a moldura que segura o campo e os dois botoes - entao vestir o `<input>`
   * de dentro so era possivel por variante de descendente.
   */
  classNames?: Slots<"wrapper" | "input">;
};

export function ComboboxInput({
  className,
  classNames,
  clearable = true,
  ...props
}: ComboboxInputProps) {
  return (
    <BaseCombobox.InputGroup
      className={cn("relative flex w-full items-center", className, classNames?.wrapper)}
    >
      <BaseCombobox.Input {...props} className={cn(inputVariants(), "pr-16", classNames?.input)} />

      <span className="absolute right-1.5 flex items-center gap-0.5">
        {clearable && (
          <BaseCombobox.Clear
            aria-label="Limpar escolha"
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-sm text-fg-subtle",
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
            "inline-flex size-7 items-center justify-center rounded-sm text-fg-subtle",
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

export type ComboboxContentProps = ComponentProps<typeof BaseCombobox.Popup> &
  FloatingPositionProps & {
    /** O que aparece quando a busca nao acha nada. */
    emptyMessage?: ReactNode;
  };

export function ComboboxContent({
  className,
  children,
  emptyMessage = "Nada encontrado.",
  sideOffset = FLOATING_SIDE_OFFSET,
  side,
  align,
  ...props
}: ComboboxContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseCombobox.Portal container={portalContainer ?? undefined}>
      <BaseCombobox.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
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
          <BaseCombobox.Empty>
            <div className="px-2.5 py-6 text-center text-sm text-fg-subtle">{emptyMessage}</div>
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
  useKeyOnScreenWarning(comboboxComplaintOf(use(ComboboxLabels), props.value, children));

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
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </BaseCombobox.Item>
  );
}

export function ComboboxGroup({ className, ...props }: ComponentProps<typeof BaseCombobox.Group>) {
  return <BaseCombobox.Group {...props} className={cn("flex flex-col", className)} />;
}

export function ComboboxGroupLabel({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.GroupLabel>) {
  return <BaseCombobox.GroupLabel {...props} className={cn(floatingGroupLabel, className)} />;
}

export function ComboboxSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Separator>) {
  return <BaseCombobox.Separator {...props} className={cn("my-1 h-px bg-border", className)} />;
}

export function ComboboxValue(props: ComponentProps<typeof BaseCombobox.Value>) {
  const source = use(ComboboxLabels);

  if (source !== null && props.children != null) source.resolved.current = true;

  return <BaseCombobox.Value {...props} />;
}

export type ComboboxChipProps = ComponentProps<typeof BaseCombobox.Chip> & {
  /**
   * O que o leitor de tela ouve no xis. `remove` recebe o texto da ficha, que
   * a peca tira do proprio conteudo quando ele e texto, e do `aria-label`
   * quando nao e.
   */
  labels?: { remove?: (label: string) => string };
};

export function ComboboxChips({ className, ...props }: ComponentProps<typeof BaseCombobox.Chips>) {
  return (
    <BaseCombobox.Chips {...props} className={cn("flex flex-wrap items-center gap-1", className)} />
  );
}

export function ComboboxChip({ className, children, labels = {}, ...props }: ComboboxChipProps) {
  const { remove = (label: string) => (label ? `Remover ${label}` : "Remover") } = labels;

  const text =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : (props["aria-label"] ?? "");

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
        aria-label={remove(text)}
        className={cn(
          "text-fg-subtle transition-colors hover:text-fg",
          "relative after:absolute after:-inset-1.5",
        )}
      >
        <X size={12} aria-hidden="true" />
      </BaseCombobox.ChipRemove>
    </BaseCombobox.Chip>
  );
}
