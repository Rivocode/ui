"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

function MixedMark() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3">
      <line
        x1="2.5"
        y1="6"
        x2="9.5"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3">
      <path
        d="M2.5 6.3 4.8 8.6 9.5 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type CheckboxProps = Omit<ComponentProps<typeof BaseCheckbox.Root>, "children"> & {
  /**
   * O texto ao lado. Com ele, a caixa sai dentro de um `<label>`, entao clicar
   * no texto tambem marca.
   *
   * Sem ele, sai so a caixa, e o arranjo fica com quem monta a tela. Use assim
   * quando o rotulo tiver estrutura: um `<strong>` com descricao embaixo, um
   * link no meio da frase.
   */
  children?: ReactNode;
  /**
   * Classe do `<label>` de fora, quando ha texto. E o nome antigo de
   * `classNames.label`, e continua valendo.
   */
  labelClassName?: string;
  /** Classe por parte: `box`, `indicator`, `label`. */
  classNames?: Slots<"box" | "indicator" | "label">;
};

export function Checkbox({
  className,
  children,
  labelClassName,
  classNames,
  ...props
}: CheckboxProps) {
  const textId = useId();
  const named = children !== undefined;

  const box = (
    <BaseCheckbox.Root
      {...props}
      aria-labelledby={named ? textId : props["aria-labelledby"]}
      className={cn(
        "inline-flex size-[var(--rc-box)] shrink-0 items-center justify-center",
        "rounded-sm border border-border-strong bg-surface",
        "data-[invalid]:border-danger",
        "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "data-[checked]:not-data-disabled:border-accent data-[checked]:not-data-disabled:bg-accent",
        "data-[checked]:not-data-disabled:text-accent-fg",
        "data-[indeterminate]:not-data-disabled:border-accent",
        "data-[indeterminate]:not-data-disabled:bg-accent",
        "data-[indeterminate]:not-data-disabled:text-accent-fg",
        "data-[disabled]:cursor-not-allowed data-[disabled]:border-border-disabled",
        "data-[disabled]:bg-surface-raised data-[disabled]:text-fg-disabled",
        children === undefined && "relative after:absolute after:-inset-1.5",
        classNames?.box,
        className,
      )}
    >
      <BaseCheckbox.Indicator
        render={(indicatorProps, state) => (
          <span
            {...indicatorProps}
            data-rc-check={state.indeterminate ? "indeterminate" : "checked"}
            className={cn("flex items-center justify-center", classNames?.indicator)}
          >
            {state.indeterminate ? <MixedMark /> : <CheckMark />}
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );

  if (children === undefined) return box;

  return (
    <label
      className={cn(
        "flex w-fit cursor-pointer items-center gap-2 font-sans text-base text-fg",
        "has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-fg-disabled",
        classNames?.label,
        labelClassName,
      )}
    >
      {box}
      <span id={textId}>{children}</span>
    </label>
  );
}
