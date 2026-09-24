"use client";

import { useState } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const [memory, setMemory] = useState<{ current: T; previous: T | undefined }>({
    current: value,
    previous: undefined,
  });

  if (!Object.is(memory.current, value)) {
    const next = { current: value, previous: memory.current };
    setMemory(next);
    return next.previous;
  }

  return memory.previous;
}
