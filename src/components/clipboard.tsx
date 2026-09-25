"use client";

import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";

import { useClipboard } from "../hooks/clipboard";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";

export type ClipboardProps = Omit<ButtonProps, "children" | "onCopy" | "value"> & {
  /** O que vai para a area de transferencia. */
  value: string;
  /** Texto ao lado do icone. Sem ele, o botao e so o icone. */
  children?: ReactNode;
  /** Quanto tempo a confirmacao fica na tela, em ms. */
  timeout?: number;
  /** O que o leitor de tela chama o botao antes e depois de copiar. */
  labels?: { copy?: string; copied?: string };
  /** Chamado depois de copiar, para quem quer disparar um aviso proprio. */
  onCopy?: (value: string) => void;
};

const CHECK: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "text-accent-fg",
  secondary: "text-success-text",
  ghost: "text-success-text",
  outline: "text-success-text",
  destructive: "text-danger-fg",
};

export function Clipboard({
  value,
  children,
  timeout = 2000,
  labels = {},
  onCopy,
  variant = "secondary",
  size,
  className,
  ...props
}: ClipboardProps) {
  const { copy: copyLabel = "Copiar", copied: copiedLabel = "Copiado" } = labels;

  const clipboard = useClipboard({ timeout });
  const { copied } = clipboard;

  async function copy() {
    if (await clipboard.copy(value)) onCopy?.(value);
  }

  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      size={size ?? (children ? "sm" : "iconSm")}
      onClick={copy}
      aria-label={children ? undefined : copied ? copiedLabel : copyLabel}
      className={cn("gap-1.5", className)}
    >
      {copied ? (
        <Check
          size={14}
          aria-hidden="true"
          className={cn(
            "animate-[rc-fade_var(--rc-duration-base)_var(--rc-ease)_both]",
            CHECK[variant ?? "secondary"],
          )}
        />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
      {children ? (copied ? copiedLabel : copyLabel) : null}
    </Button>
  );
}
