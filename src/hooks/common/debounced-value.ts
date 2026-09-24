"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(value: T, wait: number): [T, () => void] {
  const [settled, setSettled] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timer.current = setTimeout(() => setSettled(value), wait);
    return () => clearTimeout(timer.current);
  }, [value, wait]);

  const cancel = useCallback(() => clearTimeout(timer.current), []);

  return [settled, cancel];
}
