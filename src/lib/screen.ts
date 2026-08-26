"use client";

import { useSyncExternalStore } from "react";

const PHONE = "(max-width: 639px)";

function subscribe(query: string) {
  return (notify: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", notify);
    return () => media.removeEventListener("change", notify);
  };
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useMobile(): boolean {
  return useMediaQuery(PHONE);
}
