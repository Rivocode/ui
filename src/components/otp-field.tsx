"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type OTPFieldProps = ComponentProps<typeof BaseOTPField.Root> & {
  /** Quantas casas o codigo tem. */
  length?: number;
};

/**
 * Codigo de verificacao, uma casa por digito.
 *
 * Colar o codigo inteiro funciona: a Base UI espalha os digitos pelas casas em
 * vez de jogar tudo na primeira. E quase sempre assim que o codigo chega, vindo
 * do SMS ou do email.
 *
 * O teclado de numeros e o preenchimento pelo SMS ja vem da Base UI, num input
 * escondido que guarda o codigo inteiro. As casas visiveis so mostram.
 */
export function OTPField({ className, length = 6, ...props }: OTPFieldProps) {
  return (
    <BaseOTPField.Root
      {...props}
      length={length}
      className={cn("flex items-center gap-2", className)}
    >
      {Array.from({ length }, (_, index) => (
        <BaseOTPField.Input
          key={index}
          // Sem isto, um leitor de tela anuncia campos identicos, e a pessoa
          // nao sabe em qual esta nem quantos faltam.
          //
          // O primeiro fica de fora: a Base UI reserva o rotulo dele para o
          // rotulo do campo, porque e ele que recebe o codigo inteiro colado
          // (`autocomplete="one-time-code"`). Por isso este componente pede um
          // `Field` com `FieldLabel` em volta, e nao e so boa pratica: sem ele
          // aquele primeiro digito fica sem nome nenhum.
          {...(index > 0 ? { "aria-label": `Dígito ${index + 1} de ${length}` } : {})}
          className={cn(
            "size-11 rounded-md border border-border bg-surface text-center",
            "font-mono text-lg text-fg tabular-nums",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
            "outline-none focus-visible:border-accent focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            "data-[invalid]:border-danger",
            "disabled:cursor-not-allowed disabled:text-fg-disabled",
          )}
        />
      ))}
    </BaseOTPField.Root>
  );
}
