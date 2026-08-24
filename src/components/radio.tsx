"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type RadioGroupProps = ComponentProps<typeof BaseRadioGroup>;

/**
 * Grupo de escolha unica. Use quando as opcoes cabem na tela e comparar entre
 * elas importa; passando de umas cinco, o `Select` gasta menos espaco.
 */
export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <BaseRadioGroup {...props} className={cn("flex flex-col gap-2", className)} />;
}

export type RadioProps = ComponentProps<typeof BaseRadio.Root>;

/**
 * O circulo, sem rotulo. O texto fica por fora, num `<label>` que envolve os
 * dois, igual ao Checkbox: assim o clique no texto tambem marca, e quem monta
 * a tela decide o arranjo.
 */
export function Radio({ className, ...props }: RadioProps) {
  return (
    <BaseRadio.Root
      {...props}
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-pill",
        "border border-border-strong bg-surface",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "data-[checked]:border-accent data-[checked]:bg-accent",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
        "data-[invalid]:border-danger",
        className,
      )}
    >
      <BaseRadio.Indicator className="size-2 rounded-pill bg-accent-fg" />
    </BaseRadio.Root>
  );
}
