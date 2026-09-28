"use client";

import { useEffect } from "react";

import { isApple, isTypingTarget, matchesHotkey, parseHotkey } from "../lib/hotkey";
import { useLatest } from "./common/latest";

export type HotkeyBinding = [combo: string, handler: (event: KeyboardEvent) => void];

export type UseHotkeysOptions = {
  /**
   * Stops firing with focus in a text field, so `k` does not steal the letter from someone typing.
   * On by default.
   */
  ignoreFields?: boolean;
  /**
   * Calls `preventDefault` when the combination matches, so the browser shortcut does not run
   * along. On by default.
   */
  preventDefault?: boolean;
  /** Turns off all the call's shortcuts without unmounting. */
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
