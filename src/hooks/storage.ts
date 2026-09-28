"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { useLatest } from "./common/latest";

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
  /** The key in storage. Two calls with the same key move together, including across tabs. */
  key: string;
  /**
   * The value while nothing has been stored, on the server and when the stored value cannot be
   * read. The first render's value for each key applies: a new literal on every render does not
   * change the returned value.
   */
  defaultValue: T;
  /** How the value becomes text. `JSON.stringify` by default. */
  serialize?: (value: T) => string;
  /**
   * How the text turns back into a value. `JSON.parse` by default; if it throws, `defaultValue`
   * applies.
   */
  deserialize?: (raw: string) => T;
};

export type StorageHandlers<T> = [T, (value: T | ((current: T) => T)) => void, () => void];

function useStorage<T>(area: Area, options: UseStorageOptions<T>): StorageHandlers<T> {
  const { key, serialize = JSON.stringify, deserialize = JSON.parse } = options;
  const initial = options.defaultValue;
  const fallback = useMemo(() => ({ current: initial }), [area, key]);
  const codec = useLatest({ serialize, deserialize });

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
    if (raw === null) return fallback.current;
    try {
      return codec.current.deserialize(raw) as T;
    } catch {
      return fallback.current;
    }
  }, [raw, codec, fallback]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const stored = readRaw(area, key);
      let current = fallback.current;
      if (stored !== null) {
        try {
          current = codec.current.deserialize(stored) as T;
        } catch {
          current = fallback.current;
        }
      }
      const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
      writeRaw(area, key, codec.current.serialize(resolved));
    },
    [area, key, fallback, codec],
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
