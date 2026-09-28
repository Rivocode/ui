/* Generated from src/hooks/common/counter.ts by bun run gen:shared. Do not edit. */

"use client";

import { useMemo, useState } from "react";

import { clampCount } from "../../shared/state";

export type UseCounterOptions = {
  /** The floor. `decrement` and `set` below it stop at it, without error. */
  min?: number;
  /** The ceiling. `increment` and `set` above it stop at it, without error. */
  max?: number;
  /** How much `increment` and `decrement` move per call. */
  step?: number;
};

export type CounterHandlers = {
  increment: () => void;
  decrement: () => void;
  set: (value: number) => void;
  reset: () => void;
};

export function useCounter(
  initial = 0,
  options: UseCounterOptions = {},
): [number, CounterHandlers] {
  const { min, max, step = 1 } = options;
  const [count, setCount] = useState(() => clampCount(initial, min, max));

  const handlers = useMemo<CounterHandlers>(
    () => ({
      increment: () => setCount((current) => clampCount(current + step, min, max)),
      decrement: () => setCount((current) => clampCount(current - step, min, max)),
      set: (value) => setCount(clampCount(value, min, max)),
      reset: () => setCount(clampCount(initial, min, max)),
    }),
    [initial, min, max, step],
  );

  return [count, handlers];
}
