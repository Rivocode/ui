/* Gerado de src/hooks/common/latest.ts por bun run gen:compartilhado. Nao editar. */

"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
