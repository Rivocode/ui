"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

/** Traco do estado misto: alguns selecionados, nem todos. */
function TracoMisto() {
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

function Visto() {
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

export type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      {...props}
      className={cn(
        "inline-flex size-[var(--rc-box)] shrink-0 items-center justify-center",
        "rounded-sm border border-border-strong bg-surface",
        "data-[invalid]:border-danger",
        "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "data-[checked]:border-accent data-[checked]:bg-accent data-[checked]:text-accent-fg",
        "data-[indeterminate]:border-accent data-[indeterminate]:bg-accent",
        "data-[indeterminate]:text-accent-fg",
        "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-raised",
        "data-[disabled]:text-fg-disabled",
        className,
      )}
    >
      <BaseCheckbox.Indicator
        render={(indicatorProps, state) => (
          <span
            {...indicatorProps}
            data-rc-check={state.indeterminate ? "indeterminate" : "checked"}
            className="flex items-center justify-center"
          >
            {state.indeterminate ? <TracoMisto /> : <Visto />}
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );
}
