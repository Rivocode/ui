"use client";

import { useCallback, useState } from "react";

import { nextOption } from "../../shared/state";

const BOOLEAN: readonly boolean[] = [false, true];

export function useToggle<T = boolean>(
  options: readonly T[] = BOOLEAN as unknown as readonly T[],
): [T, (value?: T) => void] {
  const [value, setValue] = useState<T>(options[0] as T);

  const toggle = useCallback(
    (wanted?: T) => {
      setValue((current) =>
        wanted !== undefined && options.includes(wanted) ? wanted : nextOption(options, current),
      );
    },
    [options],
  );

  return [value, toggle];
}
