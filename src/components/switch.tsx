"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export type SwitchProps = Omit<ComponentProps<typeof BaseSwitch.Root>, "children"> & {
  /**
   * O texto ao lado. Com ele, a chave sai dentro de um `<label>`, entao clicar
   * no texto tambem liga e desliga.
   */
  children?: ReactNode;
  /**
   * Classe do `<label>` de fora, quando ha texto. E o nome antigo de
   * `classNames.label`, e continua valendo.
   */
  labelClassName?: string;
  /** Classe por parte: `thumb`, `label`. */
  classNames?: Slots<"thumb" | "label">;
};

export function Switch({
  className,
  children,
  labelClassName,
  classNames,
  ...props
}: SwitchProps) {
  const textId = useId();
  const named = children !== undefined;

  const key = (
    <BaseSwitch.Root
      {...props}
      aria-labelledby={named ? textId : props["aria-labelledby"]}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill p-0.5",
        "border border-border-strong bg-surface-raised",
        "transition-colors duration-[var(--rc-duration-base)] ease-rc",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "data-[checked]:not-data-disabled:border-accent data-[checked]:not-data-disabled:bg-accent",
        "data-[disabled]:cursor-not-allowed data-[disabled]:border-border-disabled",
        "data-[invalid]:border-danger",
        "before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-['']",
        className,
      )}
    >
      <BaseSwitch.Thumb
        className={cn(
          "size-4 rounded-pill bg-fg-muted",
          "transition-[transform,background-color] duration-[var(--rc-duration-base)] ease-rc",
          "data-[checked]:translate-x-5",
          "data-[checked]:not-data-disabled:bg-accent-fg",
          "data-[disabled]:bg-fg-disabled",
          classNames?.thumb,
        )}
      />
    </BaseSwitch.Root>
  );

  if (children === undefined) return key;

  return (
    <label
      className={cn(
        "flex w-fit cursor-pointer items-center gap-2 font-sans text-base text-fg",
        "has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-fg-disabled",
        classNames?.label,
        labelClassName,
      )}
    >
      {key}
      <span id={textId}>{children}</span>
    </label>
  );
}
