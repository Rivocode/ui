"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type OTPFieldProps = ComponentProps<typeof BaseOTPField.Root> & {
  /** Quantas casas o codigo tem. */
  length?: number;
};

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
          {...(index > 0 ? { "aria-label": `Dígito ${index + 1} de ${length}` } : {})}
          className={cn(
            "size-11 rounded-md border border-border-strong bg-surface text-center",
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
