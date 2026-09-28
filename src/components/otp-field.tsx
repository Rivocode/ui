"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type OTPFieldProps = Omit<ComponentProps<typeof BaseOTPField.Root>, "length"> & {
  /** How many slots the code has. */
  length?: number;
  /**
   * The piece's texts, to change the language: `digit` is the name of each slot
   * after the first, which receives the position counting from 1 and the total. The
   * first one takes the field's name. Pass only the ones that change.
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
