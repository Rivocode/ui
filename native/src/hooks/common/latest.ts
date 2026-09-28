/* Generated from src/hooks/common/latest.ts by bun run gen:shared. Do not edit. */

"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
