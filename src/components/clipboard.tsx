"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";

export type ClipboardProps = Omit<ButtonProps, "children" | "onCopy"> & {
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

  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }

    setCopied(true);
    onCopy?.(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), timeout);
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
        <Check size={14} aria-hidden="true" className="text-success-text" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
      {children ? (copied ? copiedLabel : copyLabel) : null}
    </Button>
  );
}
