/* Gerado de src/shared/state.ts por bun run gen:compartilhado. Nao editar. */

export function clampCount(value: number, min = -Infinity, max = Infinity): number {
  return Math.min(Math.max(value, min), max);
}

export function nextOption<T>(options: readonly T[], current: T): T {
  if (options.length === 0) return current;
  const index = options.indexOf(current);
  return options[(index + 1) % options.length] as T;
}

export function mergeState<T extends object>(
  current: T,
  patch: Partial<T> | ((current: T) => Partial<T>),
): T {
  const partial = typeof patch === "function" ? patch(current) : patch;
  return { ...current, ...partial };
}
