"use client";

import { useEffect } from "react";

import { isApple, isTypingTarget, matchesHotkey, parseHotkey } from "../lib/hotkey";
import { useLatest } from "./common/latest";

export type HotkeyBinding = [combo: string, handler: (event: KeyboardEvent) => void];

export type UseHotkeysOptions = {
  /** Deixa de disparar com o foco num campo de texto, para `k` nao roubar a letra de quem digita. Ligado por padrao. */
  ignoreFields?: boolean;
  /** Chama `preventDefault` quando a combinacao casa, para o atalho do navegador nao correr junto. Ligado por padrao. */
  preventDefault?: boolean;
  /** Desliga todos os atalhos da chamada sem desmontar. */
  enabled?: boolean;
};

function platform(): string {
  const agent = navigator as Navigator & { userAgentData?: { platform?: string } };
  return agent.userAgentData?.platform || navigator.platform || navigator.userAgent;
}

export function useHotkeys(bindings: HotkeyBinding[], options: UseHotkeysOptions = {}): void {
  const { ignoreFields = true, preventDefault = true, enabled = true } = options;
  const latest = useLatest(bindings);

  useEffect(() => {
    if (!enabled) return;
    const apple = isApple(platform());

    const listener = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (ignoreFields && isTypingTarget(event.target)) return;
      for (const [combo, handler] of latest.current) {
        if (!matchesHotkey(parseHotkey(combo, apple), event)) continue;
        if (preventDefault) event.preventDefault();
        handler(event);
      }
    };

    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [enabled, ignoreFields, preventDefault, latest]);
}
