"use client";

import { useCallback, useState } from "react";

import { mergeState } from "../../shared/state";

export function useSetState<T extends object>(
  initial: T,
): [T, (patch: Partial<T> | ((current: T) => Partial<T>)) => void] {
  const [state, setState] = useState<T>(initial);

  const merge = useCallback(
    (patch: Partial<T> | ((current: T) => Partial<T>)) =>
      setState((current) => mergeState(current, patch)),
    [],
  );

  return [state, merge];
}
