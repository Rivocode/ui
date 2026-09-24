"use client";

import { useEffect, useRef, type RefObject } from "react";

import { useLatest } from "./common/latest";

export type UseClickOutsideOptions = {
  /** Os eventos que contam como clique. `pointerdown` cobre mouse, caneta e toque. */
  events?: string[];
  /** Outros elementos que contam como dentro, como o gatilho que abriu o painel. */
  nodes?: Array<HTMLElement | null>;
  /** Desliga a escuta sem desmontar, por exemplo com o painel fechado. */
  enabled?: boolean;
};

const EVENTS = ["pointerdown"];

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: Event) => void,
  options: UseClickOutsideOptions = {},
): RefObject<T | null> {
  const { events = EVENTS, nodes = [], enabled = true } = options;
  const ref = useRef<T>(null);
  const latest = useLatest({ handler, nodes });
  const joined = events.join(" ");

  useEffect(() => {
    if (!enabled) return;
    const names = joined.split(" ");

    const listener = (event: Event) => {
      const target = event.target as Node | null;
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      const inside = [ref.current, ...latest.current.nodes].some(
        (node) => node && (path.includes(node) || (target !== null && node.contains(target))),
      );
      if (!inside) latest.current.handler(event);
    };

    for (const name of names) document.addEventListener(name, listener);
    return () => {
      for (const name of names) document.removeEventListener(name, listener);
    };
  }, [enabled, joined, latest]);

  return ref;
}
