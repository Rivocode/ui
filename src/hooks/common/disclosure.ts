"use client";

import { useMemo, useState } from "react";

export type UseDisclosureOptions = {
  /** Chamado so na passagem de fechado para aberto, e nao a cada `open()`. */
  onOpen?: () => void;
  /** Chamado so na passagem de aberto para fechado, e nao a cada `close()`. */
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
  const { onOpen, onClose } = options;

  const handlers = useMemo<DisclosureHandlers>(() => {
    const open = () => {
      if (opened) return;
      setOpened(true);
      onOpen?.();
    };
    const close = () => {
      if (!opened) return;
      setOpened(false);
      onClose?.();
    };
    return { open, close, toggle: () => (opened ? close() : open()) };
  }, [opened, onOpen, onClose]);

  return [opened, handlers];
}
