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

const OTHERS: Record<string, string> = {
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
 * Como o leitor de tela pronuncia cada tecla.
 *
 * Nem o simbolo desenhado nem o token servem. `⌘` sai como o nome Unicode dele
 * - "place of interest sign" -, e o token cru saia pior ainda: o rotulo do
 * atalho era "mod mais k", e `mod` nao e o nome de tecla nenhuma. Quem ouve
 * precisa da tecla que existe no teclado dele, entao a tabela segue a mesma
 * bifurcacao do desenho.
 */
const SPOKEN_MAC: Record<string, string> = {
  mod: "Command",
  cmd: "Command",
  meta: "Command",
  ctrl: "Control",
  alt: "Option",
  option: "Option",
};

const SPOKEN_OTHERS: Record<string, string> = {
  mod: "Control",
  cmd: "Control",
  meta: "Control",
  ctrl: "Control",
  alt: "Alt",
  option: "Alt",
};

const SPOKEN: Record<string, string> = {
  shift: "Shift",
  enter: "Enter",
  backspace: "Backspace",
  esc: "Esc",
  tab: "Tab",
  up: "seta para cima",
  down: "seta para baixo",
  left: "seta para a esquerda",
  right: "seta para a direita",
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
export function keyName(key: string) {
  const token = key.toLowerCase();
  const table = NO_MAC ? MAC : OTHERS;
  return table[token] ?? (key.length === 1 ? key.toUpperCase() : key);
}

/** O mesmo nome, dito em voz alta. */
function spokenName(key: string) {
  const token = key.toLowerCase();
  const platform = NO_MAC ? SPOKEN_MAC : SPOKEN_OTHERS;
  return platform[token] ?? SPOKEN[token] ?? (key.length === 1 ? key.toUpperCase() : key);
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
    const parts = keys.split("+").map((part) => part.trim());

    return (
      /*
       * `role="img"`: um `span` cru e generico, e o ARIA proibe dar nome a
       * generico - o rotulo era simplesmente descartado por parte dos leitores,
       * e o atalho saia mudo, ja que cada tecla esta escondida. A auditoria de
       * navegacao agentica do Lighthouse 13 reprovava a pagina por isto.
       * `img` e o que o grupo e: um desenho unico, que se le de uma vez.
       */
      <span
        role="img"
        aria-label={parts.map(spokenName).join(" mais ")}
        className="inline-flex items-center gap-1"
      >
        {parts.map((part, index) => (
          <kbd
            key={`${part}-${index}`}
            {...props}
            aria-hidden="true"
            className={cn(kbdVariants({ size }), className)}
          >
            {keyName(part)}
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
