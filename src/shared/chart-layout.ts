export const HEAT_ALPHAS = [0.14, 0.32, 0.5, 0.72, 1] as const;

export const TREEMAP_TINT = 0.3;

export const chartName = (series: string[]) =>
  series.length > 0 ? `Gráfico de ${series.join(", ")}` : "Gráfico";

export const GAUGE_REACH = 38;
export const GAUGE_RING = 46;
export const GAUGE_GAP = 1.5;

export function cellNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function axisOrder(written: readonly string[] | undefined, seen: string[]): string[] {
  if (!written) return seen;
  return [...written, ...seen.filter((name) => !written.includes(name))];
}

export type TreemapBox = { x: number; y: number; width: number; height: number };

const NOWHERE: TreemapBox = { x: 0, y: 0, width: 0, height: 0 };

type Piece = { area: number; index: number };

function worst(row: readonly Piece[], side: number): number {
  let sum = 0;
  let largest = 0;
  let smallest = Number.POSITIVE_INFINITY;
  for (const piece of row) {
    sum += piece.area;
    largest = Math.max(largest, piece.area);
    smallest = Math.min(smallest, piece.area);
  }
  const squared = sum * sum;
  const edge = side * side;
  return Math.max((edge * largest) / squared, squared / (edge * smallest));
}

export function squarify(values: readonly number[], width: number, height: number): TreemapBox[] {
  const boxes: TreemapBox[] = values.map(() => ({ ...NOWHERE }));
  const positive = values
    .map((value, index) => ({ value: Number.isFinite(value) ? Math.max(0, value) : 0, index }))
    .filter((entry) => entry.value > 0)
    .sort((one, other) => other.value - one.value || one.index - other.index);

  const total = positive.reduce((sum, entry) => sum + entry.value, 0);
  if (total <= 0 || width <= 0 || height <= 0) return boxes;

  const scale = (width * height) / total;
  const queue: Piece[] = positive.map((entry) => ({
    area: entry.value * scale,
    index: entry.index,
  }));

  let left = 0;
  let top = 0;
  let free = { width, height };

  const place = (row: readonly Piece[]) => {
    const sum = row.reduce((total, piece) => total + piece.area, 0);

    if (free.width >= free.height) {
      const thickness = sum / free.height;
      let offset = top;
      for (const piece of row) {
        const size = piece.area / thickness;
        boxes[piece.index] = { x: left, y: offset, width: thickness, height: size };
        offset += size;
      }
      left += thickness;
      free = { width: Math.max(0, free.width - thickness), height: free.height };
    } else {
      const thickness = sum / free.width;
      let offset = left;
      for (const piece of row) {
        const size = piece.area / thickness;
        boxes[piece.index] = { x: offset, y: top, width: size, height: thickness };
        offset += size;
      }
      top += thickness;
      free = { width: free.width, height: Math.max(0, free.height - thickness) };
    }
  };

  let row: Piece[] = [];
  while (queue.length > 0) {
    const side = Math.min(free.width, free.height);
    const next = queue[0]!;
    if (row.length === 0 || worst([...row, next], side) <= worst(row, side)) {
      row.push(next);
      queue.shift();
      continue;
    }
    place(row);
    row = [];
  }
  if (row.length > 0) place(row);

  return boxes;
}

export function heatStep(value: number, low: number, high: number, steps: number): number {
  if (steps <= 1) return 0;
  if (!(high > low)) return 0;
  const share = (value - low) / (high - low);
  return Math.min(steps - 1, Math.max(0, Math.floor(share * steps)));
}

export function heatBreaks(low: number, high: number, steps: number): Array<[number, number]> {
  const span = high > low ? (high - low) / steps : 0;
  return Array.from({ length: steps }, (_, step) => [low + span * step, low + span * (step + 1)]);
}

export type FunnelRates = {
  fromPrevious: Array<number | null>;
  overall: number | null;
};

export function funnelRates(values: readonly number[]): FunnelRates {
  const fromPrevious = values.map((value, index) => {
    if (index === 0) return null;
    const before = values[index - 1]!;
    return before > 0 ? (value / before) * 100 : null;
  });
  const first = values[0];
  const last = values.at(-1);
  const overall =
    values.length > 1 && first !== undefined && last !== undefined && first > 0
      ? (last / first) * 100
      : null;
  return { fromPrevious, overall };
}

export function bandAt<Band extends { until: number }>(
  bands: readonly Band[],
  value: number,
): Band | undefined {
  return bands.find((band) => value <= band.until) ?? bands.at(-1);
}

const CHARACTER = 8;
const PADDING = 24;
const ONE_LINE = 40;
const TWO_LINES = 56;

export type LabelFit = "both" | "name" | "none";

export function labelFit(name: string, value: string, width: number, height: number): LabelFit {
  const needs = (text: string) => text.length * CHARACTER + PADDING;
  if (width < needs(name)) return "none";
  if (height >= TWO_LINES && width >= needs(value)) return "both";
  return height >= ONE_LINE ? "name" : "none";
}
