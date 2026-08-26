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

/**
 * Chave de liga e desliga. Vale para o que muda na hora, sem confirmar.
 *
 * Nao e Checkbox de outro formato: o Checkbox responde uma pergunta que so
 * conta quando o formulario for enviado, e a chave age no clique. Trocar um
 * pelo outro faz o usuario clicar e nao saber se ja valeu.
 *
 * O alvo tem 44px de altura mesmo com o trilho de 24, pelo respiro invisivel:
 * e a medida do dedo, e sem ela a chave so funciona bem no mouse.
 */
export function Switch({
  className,
  children,
  labelClassName,
  classNames,
  ...props
}: SwitchProps) {
  /*
   * O `Field` passa o proprio rotulo a todo controle que mora dentro dele, e
   * quando o controle ja tem texto proprio os dois se somam: o leitor de tela
   * anunciava "Impostos" no lugar de "ISS retido na fonte". Com texto proprio,
   * o texto e que nomeia.
   */
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
        "data-[checked]:border-accent data-[checked]:bg-accent",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
        "data-[invalid]:border-danger",
        "before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-['']",
        className,
      )}
    >
      <BaseSwitch.Thumb
        className={cn(
          "size-4 rounded-pill bg-fg-muted",
          "transition-[transform,background-color] duration-[var(--rc-duration-base)] ease-rc",
          "data-[checked]:translate-x-5 data-[checked]:bg-accent-fg",
          classNames?.thumb,
        )}
      />
    </BaseSwitch.Root>
  );

  if (children === undefined) return key;

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
      {key}
      {/* O texto ganha id proprio, e e ele que nomeia a chave. */}
      <span id={textId}>{children}</span>
    </label>
  );
}
