"use client";

import { useMemo, useState } from "react";

import { clampCount } from "../../shared/state";

export type UseCounterOptions = {
  /** O piso. `decrement` e `set` abaixo dele param nele, sem erro. */
  min?: number;
  /** O teto. `increment` e `set` acima dele param nele, sem erro. */
  max?: number;
  /** Quanto `increment` e `decrement` andam por chamada. */
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
