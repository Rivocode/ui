"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useSyncExternalStore, type ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export const kbdVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center gap-0.5",
    "rounded-sm border border-border bg-surface-raised",
    "font-mono font-rc-medium text-fg-muted",
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
};

export type KbdLabels = {
  plus: string;
  up: string;
  down: string;
  left: string;
  right: string;
};

const LABELS: KbdLabels = {
  plus: "mais",
  up: "seta para cima",
  down: "seta para baixo",
  left: "seta para a esquerda",
  right: "seta para a direita",
};

const ARROWS = ["up", "down", "left", "right"] as const;

const isArrow = (token: string): token is (typeof ARROWS)[number] =>
  (ARROWS as readonly string[]).includes(token);

function detectMac() {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
  );
}

const subscribeNothing = () => () => {};
const onServer = () => false;

function useMac() {
  return useSyncExternalStore(subscribeNothing, detectMac, onServer);
}

function nameOn(key: string, mac: boolean) {
  const token = key.toLowerCase();
  const table = mac ? MAC : OTHERS;
  return table[token] ?? (key.length === 1 ? key.toUpperCase() : key);
}

export function keyName(key: string) {
  return nameOn(key, detectMac());
}

function spokenName(key: string, labels: KbdLabels, mac: boolean) {
  const token = key.toLowerCase();
  if (isArrow(token)) return labels[token];
  const platform = mac ? SPOKEN_MAC : SPOKEN_OTHERS;
  return platform[token] ?? SPOKEN[token] ?? (key.length === 1 ? key.toUpperCase() : key);
}

export type KbdProps = ComponentPropsWithoutRef<"kbd"> &
  VariantProps<typeof kbdVariants> & {
    /**
     * O atalho, como `"mod+k"`. Cada parte vira uma tecla, e `mod` sai como
     * `⌘` no Mac e `Ctrl` no resto.
     */
    keys?: string;
    /**
     * O que o leitor de tela ouve no atalho de `keys`, para trocar o idioma:
     * `plus` e a palavra entre as teclas, e `up`, `down`, `left` e `right` os
     * nomes das setas. Passe so os que mudam.
     */
    labels?: Partial<KbdLabels>;
  };

export function Kbd({ className, size, keys, labels: labelsProp, children, ...props }: KbdProps) {
  const mac = useMac();
  if (keys) {
    const labels = { ...LABELS, ...labelsProp };
    const parts = keys.split("+").map((part) => part.trim());

    return (
      <span
        role="img"
        aria-label={parts.map((part) => spokenName(part, labels, mac)).join(` ${labels.plus} `)}
        className="inline-flex items-center gap-1"
      >
        {parts.map((part, index) => (
          <kbd
            key={`${part}-${index}`}
            {...props}
            aria-hidden="true"
            className={cn(kbdVariants({ size }), className)}
          >
            {nameOn(part, mac)}
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
