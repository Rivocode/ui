import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export const kbdVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center gap-0.5",
    "rounded-sm border border-border bg-surface-raised",
    "font-mono font-medium text-fg-muted",
    // A sombra de baixo e o que faz parecer tecla e nao codigo em linha. Sem
    // ela, `Ctrl` num paragrafo vira o mesmo cinza de um nome de variavel.
    "shadow-[inset_0_-1px_0_var(--rc-border)]",
  ),
  {
    variants: {
      size: {
        sm: "h-4 min-w-4 px-1 text-[0.65rem]",
        md: "h-5 min-w-5 px-1.5 text-xs",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** O que o Mac escreve com simbolo e o resto do mundo escreve por extenso. */
const MAC: Record<string, string> = {
  mod: "⌘",
  cmd: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧",
  enter: "↵",
  backspace: "⌫",
  esc: "⎋",
  tab: "⇥",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const OUTROS: Record<string, string> = {
  mod: "Ctrl",
  cmd: "Ctrl",
  meta: "Ctrl",
  ctrl: "Ctrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  enter: "Enter",
  backspace: "Backspace",
  esc: "Esc",
  tab: "Tab",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

/**
 * Verdadeiro num Mac.
 *
 * Le a plataforma uma vez, no modulo, e nao por render: ela nao muda no meio
 * da sessao. No servidor devolve falso, que e a escrita mais longa, entao a
 * troca na hidratacao encolhe a tecla em vez de estourar a linha.
 */
const NO_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Traduz o nome de uma tecla para a escrita da plataforma. */
export function keyName(tecla: string) {
  const chave = tecla.toLowerCase();
  const tabela = NO_MAC ? MAC : OUTROS;
  return tabela[chave] ?? (tecla.length === 1 ? tecla.toUpperCase() : tecla);
}

export type KbdProps = ComponentPropsWithoutRef<"kbd"> &
  VariantProps<typeof kbdVariants> & {
    /**
     * O atalho, como `"mod+k"`. Cada parte vira uma tecla, e `mod` sai como
     * `⌘` no Mac e `Ctrl` no resto.
     */
    keys?: string;
  };

/**
 * Uma tecla, ou um atalho inteiro.
 *
 * ```tsx
 * <Kbd keys="mod+k" />
 * <Kbd>Esc</Kbd>
 * ```
 *
 * O `mod` existe porque a alternativa e cada tela decidir sozinha se escreve
 * Ctrl ou Cmd, e metade delas escreve Ctrl para todo mundo. Quem usa Mac ve o
 * simbolo errado e conclui que o atalho nao existe.
 */
export function Kbd({ className, size, keys, children, ...props }: KbdProps) {
  if (keys) {
    const partes = keys.split("+").map((parte) => parte.trim());

    return (
      <span className="inline-flex items-center gap-1" aria-label={partes.join(" mais ")}>
        {partes.map((parte, indice) => (
          <kbd
            key={`${parte}-${indice}`}
            {...props}
            aria-hidden="true"
            className={cn(kbdVariants({ size }), className)}
          >
            {keyName(parte)}
          </kbd>
        ))}
      </span>
    );
  }

  return (
    <kbd {...props} className={cn(kbdVariants({ size }), className)}>
      {children}
    </kbd>
  );
}
