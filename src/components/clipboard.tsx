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

/**
 * Copiar um dado para levar a outro lugar: chave de acesso, CNPJ, id de
 * rastro, codigo Pix, numero da nota.
 *
 * A confirmacao e parte da peca, e nao enfeite. Copiar e uma acao sem
 * resultado visivel - nada muda na tela - entao sem a confirmacao a pessoa
 * clica de novo por duvida, e quem nao ve o icone mudar nao soube que
 * aconteceu. Por isso o proprio nome acessivel do botao muda: o leitor de tela
 * anuncia "Copiado" onde antes anunciava "Copiar".
 *
 * A confirmacao volta sozinha depois de `timeout`, senao o botao fica preso
 * num estado que ja passou.
 */
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
  // Cada nome tem o proprio padrao, e nao o objeto inteiro: trocar so o verbo
  // obrigava a reescrever a confirmacao junto, e quem esquecia perdia o
  // "Copiado" sem o TypeScript acusar.
  const { copy: copyLabel = "Copiar", copied: copiedLabel = "Copiado" } = labels;

  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // O timer nao pode sobreviver ao componente: um clique seguido de navegacao
  // deixaria um setState em pe atras de uma tela que ja saiu.
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Sem permissao ou fora de contexto seguro, copiar nao acontece. Mentir
      // que aconteceu e pior do que nao confirmar: a pessoa cola o que tinha
      // antes e so descobre no destino.
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
