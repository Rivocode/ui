"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export type RadioGroupProps = ComponentProps<typeof BaseRadioGroup>;

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <BaseRadioGroup {...props} className={cn("flex flex-col gap-2", className)} />;
}

export type RadioProps = Omit<ComponentProps<typeof BaseRadio.Root>, "children"> & {
  /**
   * O texto ao lado. Com ele, o circulo sai dentro de um `<label>`, entao
   * clicar no texto tambem marca.
   *
   * Sem ele, sai so o circulo, e o arranjo fica com quem monta a tela.
   */
  children?: ReactNode;
  /**
   * Classe do `<label>` de fora, quando ha texto. E o nome antigo de
   * `classNames.label`, e continua valendo.
   */
  labelClassName?: string;
  /** Classe por parte: `circle`, `indicator`, `label`. */
  classNames?: Slots<"circle" | "indicator" | "label">;
};

export function Radio({ className, children, labelClassName, classNames, ...props }: RadioProps) {
  const textId = useId();
  const named = children !== undefined;

  const circle = (
    <BaseRadio.Root
      {...props}
      aria-labelledby={named ? textId : props["aria-labelledby"]}
      className={cn(
        "flex size-[var(--rc-box)] shrink-0 items-center justify-center rounded-pill",
        "border border-border-strong bg-surface",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "data-[checked]:not-data-disabled:border-accent-text data-[checked]:not-data-disabled:bg-accent-text",
        "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-raised",
        "data-[disabled]:border-border-disabled",
        "data-[invalid]:border-danger",
        classNames?.circle,
        className,
      )}
    >
      <BaseRadio.Indicator
        className={cn(
          "size-2 rounded-pill bg-surface-raised",
          "data-[disabled]:bg-fg-disabled",
          classNames?.indicator,
        )}
      />
    </BaseRadio.Root>
  );

  if (children === undefined) return circle;

  return (
    <label
      className={cn(
        "flex w-fit cursor-pointer items-center gap-2 font-sans text-base text-fg",
        "has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-fg-disabled",
        classNames?.label,
        labelClassName,
      )}
    >
      {circle}
      <span id={textId}>{children}</span>
    </label>
  );
}
