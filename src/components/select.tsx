"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
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
import { useRivoContext } from "../provider/rivo-provider";
import { floatingGroupLabel, floatingPanel } from "./menu";

type SelectLabelSource = {
  chosen: unknown;
  lookup: LabelLookup;
  resolved: { current: boolean };
};

const SelectLabels = createContext<SelectLabelSource | null>(null);

export function missingSelectItemsComplaint(key: string, label: string): string {
  return (
    `[rivocode/ui] <Select> sem \`items\`: o gatilho está mostrando "${key}", que é o valor do ` +
    `item, e não "${label}", que é o texto da lista. Sem \`items\` a Base UI não tem de onde ler ` +
    "o rótulo e escreve a chave crua, sem erro na tela. Passe " +
    `items={[{ label: "${label}", value: "${key}" }]} ao <Select>, ou resolva o rótulo você ` +
    "mesmo em <SelectValue>{(escolha) => ...}</SelectValue>."
  );
}

function selectComplaintOf(
  source: SelectLabelSource | null,
  value: unknown,
  children: ReactNode,
): string | null {
  if (source === null || source.resolved.current) return null;
  if (!isChosen(source.chosen, value)) return null;

  const key = keyOnScreen(source.chosen, source.lookup);
  if (key === null || key === "") return null;

  const label = plainText(children);
  if (label === null || label === key) return null;

  return missingSelectItemsComplaint(key, label);
}

export function Select<Value, Multiple extends boolean | undefined = false>(
  props: BaseSelect.Root.Props<Value, Multiple>,
) {
  const { value, defaultValue, items, itemToStringLabel } = props;
  const resolved = useRef(false);

  const source = useMemo<SelectLabelSource>(
    () => ({
      chosen: value === undefined ? defaultValue : value,
      lookup: { items, itemToStringLabel },
      resolved,
    }),
    [value, defaultValue, items, itemToStringLabel],
  );

  return (
    <SelectLabels value={source}>
      <BaseSelect.Root {...props} />
    </SelectLabels>
  );
}

export function SelectValue(props: ComponentProps<typeof BaseSelect.Value>) {
  const source = use(SelectLabels);

  if (source !== null && props.children != null) source.resolved.current = true;

  return <BaseSelect.Value {...props} />;
}

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
  useKeyOnScreenWarning(selectComplaintOf(use(SelectLabels), props.value, children));

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

export function SelectGroup({ className, ...props }: ComponentProps<typeof BaseSelect.Group>) {
  return <BaseSelect.Group {...props} className={cn("flex flex-col", className)} />;
}

export function SelectGroupLabel({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.GroupLabel>) {
  return <BaseSelect.GroupLabel {...props} className={cn(floatingGroupLabel, className)} />;
}

export function SelectSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Separator>) {
  return <BaseSelect.Separator {...props} className={cn("my-1 h-px bg-border", className)} />;
}
