"use client";

import { useEffect, useRef, type RefObject } from "react";

import { useLatest } from "./common/latest";

export type UseClickOutsideOptions = {
  /** The events that count as a click. `pointerdown` covers mouse, pen and touch. */
  events?: string[];
  /** Other elements that count as inside, like the trigger that opened the panel. */
  nodes?: Array<HTMLElement | null>;
  /** Turns off listening without unmounting, for example with the panel closed. */
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
