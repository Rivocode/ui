"use client";

import { useMemo, useRef, useState } from "react";

import { useLatest } from "./latest";

export type UseDisclosureOptions = {
  /** Called only on the transition from closed to open, and not on every `open()`. */
  onOpen?: () => void;
  /** Called only on the transition from open to closed, and not on every `close()`. */
  onClose?: () => void;
};

export type DisclosureHandlers = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export function useDisclosure(
  initial = false,
  options: UseDisclosureOptions = {},
): [boolean, DisclosureHandlers] {
  const [opened, setOpened] = useState(initial);
  const current = useRef(initial);
  const latest = useLatest(options);

  const handlers = useMemo<DisclosureHandlers>(() => {
    const change = (next: boolean) => {
      if (current.current === next) return;
      current.current = next;
      setOpened(next);
      if (next) latest.current.onOpen?.();
      else latest.current.onClose?.();
    };
    return {
      open: () => change(true),
      close: () => change(false),
      toggle: () => change(!current.current),
    };
  }, [latest]);

  return [opened, handlers];
}
