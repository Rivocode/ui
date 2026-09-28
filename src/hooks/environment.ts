"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { useMediaQuery } from "../lib/screen";

const REDUCED = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED);
}

export type UseDocumentTitleOptions = {
  /** Devolve o titulo de antes quando o componente desmonta. Desligado por padrao. */
  restoreOnUnmount?: boolean;
};

export function useDocumentTitle(title: string, options: UseDocumentTitleOptions = {}): void {
  const { restoreOnUnmount = false } = options;

  useEffect(() => {
    if (!title.trim()) return;
    const before = document.title;
    document.title = title;
    return () => {
      if (restoreOnUnmount) document.title = before;
    };
  }, [title, restoreOnUnmount]);
}

function subscribeNetwork(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

export function useNetworkStatus(): { online: boolean } {
  const online = useSyncExternalStore(
    subscribeNetwork,
    () => navigator.onLine,
    () => true,
  );
  return { online };
}

export type UseIdleOptions = {
  /** Os eventos que contam como atividade. */
  events?: string[];
  /** O estado antes do primeiro evento. `false` por padrao: quem acabou de abrir a tela nao esta ausente. */
  initialState?: boolean;
};

const ACTIVITY = ["keydown", "pointermove", "pointerdown", "wheel", "touchstart", "scroll"];

export function useIdle(timeout: number, options: UseIdleOptions = {}): boolean {
  const { events = ACTIVITY, initialState = false } = options;
  const [idle, setIdle] = useState(initialState);
  const joined = events.join(" ");

  useEffect(() => {
    const names = joined.split(" ");
    let timer = setTimeout(() => setIdle(true), timeout);

    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), timeout);
    };

    for (const name of names) window.addEventListener(name, wake, { passive: true });
    return () => {
      clearTimeout(timer);
      for (const name of names) window.removeEventListener(name, wake);
    };
  }, [timeout, joined]);

  return idle;
}

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
