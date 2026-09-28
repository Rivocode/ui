"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseClipboardOptions = {
  /** Quanto tempo `copied` fica verdadeiro depois de copiar, em ms. */
  timeout?: number;
};

export type ClipboardState = {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
  reset: () => void;
};

export function useClipboard(options: UseClipboardOptions = {}): ClipboardState {
  const { timeout = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (failure) {
        setError(failure instanceof Error ? failure : new Error(String(failure)));
        return false;
      }
      setError(null);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout);
      return true;
    },
    [timeout],
  );

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}
