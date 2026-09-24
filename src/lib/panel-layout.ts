export type PanelConstraints = {
  minSize: number;
  maxSize: number;
  collapsible: boolean;
  collapsedSize: number;
};

export type Snap = "half" | "eager";

const EPSILON = 0.001;

export const near = (a: number, b: number) => Math.abs(a - b) < EPSILON;

const total = (sizes: number[]) => sizes.reduce((sum, size) => sum + size, 0);

const lowest = (c: PanelConstraints) =>
  c.collapsible ? Math.min(c.collapsedSize, c.minSize) : c.minSize;

export function isCollapsed(c: PanelConstraints, size: number) {
  return c.collapsible && near(size, c.collapsedSize);
}

export function fits(c: PanelConstraints, size: number) {
  return (size >= c.minSize - EPSILON && size <= c.maxSize + EPSILON) || isCollapsed(c, size);
}

function settle(c: PanelConstraints, proposed: number, from: number, snap: Snap) {
  if (proposed > c.maxSize) return c.maxSize;
  if (proposed >= c.minSize) return proposed;
  if (!c.collapsible) return c.minSize;
  if (proposed <= c.collapsedSize) return c.collapsedSize;
  if (snap === "eager") return proposed < from && near(from, c.minSize) ? c.collapsedSize : c.minSize;
  return proposed < (c.collapsedSize + c.minSize) / 2 ? c.collapsedSize : c.minSize;
}

export function adjust(
  base: number[],
  constraints: PanelConstraints[],
  pivot: number,
  delta: number,
  snap: Snap,
): number[] {
  if (Math.abs(delta) < EPSILON || pivot < 0 || pivot + 1 >= base.length) return base;

  const growing = delta > 0 ? pivot : pivot + 1;
  const step = delta > 0 ? 1 : -1;
  const first = delta > 0 ? pivot + 1 : pivot;
  const next = base.slice();

  const target = settle(
    constraints[growing]!,
    base[growing]! + Math.abs(delta),
    base[growing]!,
    snap,
  );
  const wanted = target - base[growing]!;
  if (wanted <= EPSILON) return base;

  let remaining = wanted;
  for (let index = first; index >= 0 && index < base.length && remaining > EPSILON; index += step) {
    const size = base[index]!;
    const settled = Math.min(size, settle(constraints[index]!, size - remaining, size, snap));
    next[index] = settled;
    remaining -= size - settled;
  }

  next[growing] = base[growing]! + (wanted - remaining);
  if (!fits(constraints[growing]!, next[growing]!)) return base;

  return next;
}

export function boundsAt(sizes: number[], constraints: PanelConstraints[], pivot: number) {
  const left = sizes[pivot]!;
  const right = sizes[pivot + 1]!;

  let capacity = 0;
  for (let index = pivot + 1; index < sizes.length; index++) {
    capacity += Math.max(0, sizes[index]! - lowest(constraints[index]!));
  }

  const min = Math.max(
    lowest(constraints[pivot]!),
    left - Math.max(0, constraints[pivot + 1]!.maxSize - right),
  );
  const max = Math.min(constraints[pivot]!.maxSize, left + capacity);

  return { min: Math.min(min, left), max: Math.max(max, left) };
}

export function normalize(sizes: number[], constraints: PanelConstraints[]): number[] {
  const next = sizes.map((size, index) => {
    const c = constraints[index]!;
    return fits(c, size) ? size : Math.min(c.maxSize, Math.max(c.minSize, size));
  });

  let diff = 100 - total(next);
  for (let index = next.length - 1; index >= 0 && Math.abs(diff) > EPSILON; index--) {
    const c = constraints[index]!;
    if (isCollapsed(c, next[index]!)) continue;

    const room = diff > 0 ? c.maxSize - next[index]! : c.minSize - next[index]!;
    const change = diff > 0 ? Math.min(diff, room) : Math.max(diff, room);
    next[index]! += change;
    diff -= change;
  }

  return next;
}

export function initialLayout(
  defaults: (number | undefined)[],
  constraints: PanelConstraints[],
): number[] {
  const known = total(defaults.map((size) => size ?? 0));
  const unknown = defaults.filter((size) => size === undefined).length;
  const share = unknown ? Math.max(0, 100 - known) / unknown : 0;

  return normalize(
    defaults.map((size) => size ?? share),
    constraints,
  );
}

export function isValidLayout(sizes: unknown, constraints: PanelConstraints[]): sizes is number[] {
  return (
    Array.isArray(sizes) &&
    sizes.length === constraints.length &&
    sizes.every((size, index) => typeof size === "number" && fits(constraints[index]!, size)) &&
    Math.abs(total(sizes as number[]) - 100) < 0.5
  );
}

export function resizeAt(
  sizes: number[],
  constraints: PanelConstraints[],
  index: number,
  target: number,
  snap: Snap,
): number[] {
  const delta = target - sizes[index]!;
  const after = index + 1 < sizes.length ? adjust(sizes, constraints, index, delta, snap) : sizes;
  if (near(after[index]!, target) || index === 0) return after;

  const before = adjust(sizes, constraints, index - 1, -delta, snap);
  return Math.abs(before[index]! - target) < Math.abs(after[index]! - target) ? before : after;
}
