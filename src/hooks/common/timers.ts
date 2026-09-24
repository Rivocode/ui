"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useLatest } from "./latest";

export function useInterval(callback: () => void, delay: number | null): void {
  const latest = useLatest(callback);

  useEffect(() => {
    if (delay === null) return;
    const timer = setInterval(() => latest.current(), delay);
    return () => clearInterval(timer);
  }, [delay, latest]);
}

export type TimeoutHandlers = {
  clear: () => void;
  reset: () => void;
};

export function useTimeout(callback: () => void, delay: number | null): TimeoutHandlers {
  const latest = useLatest(callback);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (delay === null) return;
    timer.current = setTimeout(() => latest.current(), delay);
    return () => clearTimeout(timer.current);
  }, [delay, round, latest]);

  return useMemo(
    () => ({
      clear: () => clearTimeout(timer.current),
      reset: () => setRound((value) => value + 1),
    }),
    [],
  );
}
