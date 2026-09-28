"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type OTPFieldProps = Omit<ComponentProps<typeof BaseOTPField.Root>, "length"> & {
  /** Quantas casas o codigo tem. */
  length?: number;
  /**
   * Os textos da peca, para trocar o idioma: `digit` e o nome de cada casa
   * depois da primeira, que recebe a posicao contando de 1 e o total. A
   * primeira leva o nome do campo. Passe so os que mudam.
   */
  labels?: Partial<OTPFieldLabels>;
};

export type OTPFieldLabels = {
  digit: (position: number, length: number) => string;
};

const LABELS: OTPFieldLabels = {
  digit: (position, length) => `Dígito ${position} de ${length}`,
};

export function OTPField({ className, length = 6, labels, ...props }: OTPFieldProps) {
  const text = { ...LABELS, ...labels };
  return (
    <BaseOTPField.Root
      {...props}
      length={length}
      className={cn("flex items-center gap-2", className)}
    >
      {Array.from({ length }, (_, index) => (
        <BaseOTPField.Input
          key={index}
          {...(index > 0 ? { "aria-label": text.digit(index + 1, length) } : {})}
          className={cn(
            "size-11 min-w-8 shrink rounded-md border border-border-strong bg-surface text-center",
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
