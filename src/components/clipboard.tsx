"use client";

import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";

import { useClipboard } from "../hooks/clipboard";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";
import { IconButton } from "./icon-button";

export type ClipboardProps = Omit<
  ButtonProps,
  "children" | "onCopy" | "value" | "size" | "aria-label" | "aria-labelledby"
> & {
  /** O que vai para a area de transferencia. */
  value: string;
  /** Texto ao lado do icone. Sem ele, o botao e so o icone, desenhado pelo `IconButton`. */
  children?: ReactNode;
  /** A altura do botao, lida de `--rc-control-*`. Sem texto, e o lado do quadrado. */
  size?: "sm" | "md" | "lg";
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
  danger: "text-danger-fg",
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

  const icon = copied ? (
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
  );

  if (!children) {
    return (
      <IconButton
        {...props}
        type="button"
        variant={variant}
        size={size ?? "sm"}
        onClick={copy}
        label={copied ? copiedLabel : copyLabel}
        className={className}
      >
        {icon}
      </IconButton>
    );
  }

  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      size={size ?? "sm"}
      onClick={copy}
      className={cn("gap-1.5", className)}
    >
      {icon}
      {copied ? copiedLabel : copyLabel}
    </Button>
  );
}
