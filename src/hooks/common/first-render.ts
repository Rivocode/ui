"use client";

import { useEffect, useRef } from "react";

export function useIsFirstRender(): boolean {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return first.current;
}
