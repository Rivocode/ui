"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type SwitchProps = ComponentProps<typeof BaseSwitch.Root>;

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
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      {...props}
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
        )}
      />
    </BaseSwitch.Root>
  );
}
