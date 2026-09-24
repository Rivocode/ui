/* Gerado de src/shared/list.ts por bun run gen:compartilhado. Nao editar. */

export function appendItems<T>(list: readonly T[], items: readonly T[]): T[] {
  return [...list, ...items];
}

export function prependItems<T>(list: readonly T[], items: readonly T[]): T[] {
  return [...items, ...list];
}

export function insertItems<T>(list: readonly T[], index: number, items: readonly T[]): T[] {
  const at = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, at), ...items, ...list.slice(at)];
}

export function removeItems<T>(list: readonly T[], indices: readonly number[]): T[] {
  const dropped = new Set(indices);
  return list.filter((_, index) => !dropped.has(index));
}

const inside = (list: readonly unknown[], index: number) => index >= 0 && index < list.length;

export function reorderItems<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (!inside(list, from) || !inside(list, to)) return next;
  const [moved] = next.splice(from, 1) as [T];
  next.splice(to, 0, moved);
  return next;
}

export function swapItems<T>(list: readonly T[], first: number, second: number): T[] {
  const next = [...list];
  if (!inside(list, first) || !inside(list, second)) return next;
  const held = next[first] as T;
  next[first] = next[second] as T;
  next[second] = held;
  return next;
}

export function replaceItem<T>(list: readonly T[], index: number, item: T): T[] {
  return list.map((current, position) => (position === index ? item : current));
}

export function updateItems<T>(
  list: readonly T[],
  update: (item: T, index: number) => T,
  when: (item: T, index: number) => boolean = () => true,
): T[] {
  return list.map((item, index) => (when(item, index) ? update(item, index) : item));
}
