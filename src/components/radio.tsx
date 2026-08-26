"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export type RadioGroupProps = ComponentProps<typeof BaseRadioGroup>;

/**
 * Grupo de escolha unica. Use quando as opcoes cabem na tela e comparar entre
 * elas importa; passando de umas cinco, o `Select` gasta menos espaco.
 */
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
  /** Classe por parte: `indicator`, `label`. */
  classNames?: Slots<"indicator" | "label">;
};

/**
 * Uma opcao de escolha unica. Sempre dentro de um `RadioGroup`, que e quem
 * guarda o valor e liga a navegacao por seta.
 */
export function Radio({
  className,
  children,
  labelClassName,
  classNames,
  ...props
}: RadioProps) {
  const circle = (
    <BaseRadio.Root
      {...props}
      className={cn(
        "flex size-[var(--rc-box)] shrink-0 items-center justify-center rounded-pill",
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
      <BaseRadio.Indicator className={cn("size-2 rounded-pill bg-accent-fg", classNames?.indicator)} />
    </BaseRadio.Root>
  );

  if (children === undefined) return circle;

  return (
    <label
      className={cn(
        // `flex` e nao `inline-flex`: tres opcoes empilhadas num `space-y`
        // caiam todas na mesma linha, porque elemento inline nao ocupa a
        // linha. `w-fit` impede o outro extremo, que e o rotulo esticar ate a
        // borda e fazer o clique valer a dez centimetros do texto.
        "flex w-fit cursor-pointer items-center gap-3 font-sans text-base text-fg",
        "has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-fg-disabled",
        classNames?.label,
        labelClassName,
      )}
    >
      {circle}
      {children}
    </label>
  );
}
