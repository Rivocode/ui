"use client";

import { useEffect } from "react";

export type LabelLookup = {
  items?: unknown;
  itemToStringLabel?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function serialize(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function flatten(items: readonly unknown[]): unknown[] {
  const first = items[0];
  if (isRecord(first) && Array.isArray(first.items)) {
    return items.flatMap((group) =>
      isRecord(group) && Array.isArray(group.items) ? group.items : [],
    );
  }
  return [...items];
}

function labelOf(item: unknown): unknown {
  return isRecord(item) ? item.label : undefined;
}

export function keyOnScreen(value: unknown, lookup: LabelLookup): string | null {
  if (typeof lookup.itemToStringLabel === "function") return null;
  if (value == null) return null;

  const { items } = lookup;

  if (isRecord(value)) {
    if (labelOf(value) != null) return null;
    if (Array.isArray(items) && "value" in value) {
      const twin = flatten(items).find((item) => isRecord(item) && item.value === value.value);
      if (labelOf(twin) != null) return null;
    }
    return "value" in value ? serialize(value.value) : serialize(value);
  }

  if (Array.isArray(items)) {
    const twin = flatten(items).find((item) => isRecord(item) && item.value === value);
    if (labelOf(twin) != null) return null;
    return serialize(value);
  }

  if (isRecord(items)) {
    return items[serialize(value)] != null ? null : serialize(value);
  }

  return serialize(value);
}

export function isChosen(chosen: unknown, value: unknown): boolean {
  if (value === undefined || chosen == null) return false;
  if (Array.isArray(chosen)) return chosen.some((one) => Object.is(one, value));
  return Object.is(chosen, value);
}

export function plainText(children: unknown): string | null {
  if (typeof children === "string") return children.trim() || null;
  if (typeof children === "number") return String(children);
  return null;
}

export function useKeyOnScreenWarning(complaint: string | null) {
  useEffect(() => {
    if (complaint === null || process.env.NODE_ENV === "production") return;

    console.error(complaint);
  }, [complaint]);
}
