"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

type Area = "localStorage" | "sessionStorage";

const CHANGED = "rivo:storage";

const memory = new Map<string, string | null>();

function areaOf(area: Area): Storage | undefined {
  try {
    return window[area];
  } catch {
    return undefined;
  }
}

function readRaw(area: Area, key: string): string | null {
  const slot = `${area}:${key}`;
  if (memory.has(slot)) return memory.get(slot) ?? null;
  try {
    return areaOf(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeRaw(area: Area, key: string, raw: string | null) {
  const slot = `${area}:${key}`;
  try {
    const storage = areaOf(area);
    if (!storage) throw new Error("storage");
    if (raw === null) storage.removeItem(key);
    else storage.setItem(key, raw);
    memory.delete(slot);
  } catch {
    memory.set(slot, raw);
  }
  window.dispatchEvent(new CustomEvent(CHANGED, { detail: slot }));
}

export type UseStorageOptions<T> = {
  /** A chave no armazenamento. Duas chamadas com a mesma chave andam juntas, inclusive entre abas. */
  key: string;
  /** O valor enquanto nada foi gravado, no servidor e quando o gravado nao se le. */
  defaultValue: T;
  /** Como o valor vira texto. `JSON.stringify` por padrao. */
  serialize?: (value: T) => string;
  /** Como o texto volta a valor. `JSON.parse` por padrao; se lancar, vale o `defaultValue`. */
  deserialize?: (raw: string) => T;
};

export type StorageHandlers<T> = [T, (value: T | ((current: T) => T)) => void, () => void];

function useStorage<T>(area: Area, options: UseStorageOptions<T>): StorageHandlers<T> {
  const { key, defaultValue, serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const subscribe = useCallback(
    (notify: () => void) => {
      const slot = `${area}:${key}`;
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== key) return;
        if (event.storageArea && event.storageArea !== areaOf(area)) return;
        memory.delete(slot);
        notify();
      };
      const onChanged = (event: Event) => {
        if ((event as CustomEvent<string>).detail === slot) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(CHANGED, onChanged);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(CHANGED, onChanged);
      };
    },
    [area, key],
  );

  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(area, key),
    () => null,
  );

  const value = useMemo(() => {
    if (raw === null) return defaultValue;
    try {
      return deserialize(raw) as T;
    } catch {
      return defaultValue;
    }
  }, [raw, defaultValue, deserialize]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const stored = readRaw(area, key);
      let current = defaultValue;
      if (stored !== null) {
        try {
          current = deserialize(stored) as T;
        } catch {
          current = defaultValue;
        }
      }
      const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
      writeRaw(area, key, serialize(resolved));
    },
    [area, key, defaultValue, serialize, deserialize],
  );

  const remove = useCallback(() => writeRaw(area, key, null), [area, key]);

  return [value, setValue, remove];
}

export function useLocalStorage<T>(options: UseStorageOptions<T>): StorageHandlers<T> {
  return useStorage("localStorage", options);
}

export function useSessionStorage<T>(options: UseStorageOptions<T>): StorageHandlers<T> {
  return useStorage("sessionStorage", options);
}
