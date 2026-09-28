/* Gerado de src/shared/time.ts por bun run gen:compartilhado. Nao editar. */

const DAY = 24 * 60;

export function applyTimeMask(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function parseTime(text: string): number | undefined {
  const parts = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!parts) return undefined;

  const hours = Number(parts[1]);
  const minutes = Number(parts[2]);
  if (hours > 23 || minutes > 59) return undefined;

  return hours * 60 + minutes;
}

export function formatTime(minutes: number | undefined): string {
  if (minutes === undefined || Number.isNaN(minutes)) return "";

  const inDay = Math.min(Math.max(Math.round(minutes), 0), DAY - 1);
  const hours = String(Math.floor(inDay / 60)).padStart(2, "0");
  return `${hours}:${String(inDay % 60).padStart(2, "0")}`;
}

export function timeWindow(min?: string, max?: string): [number, number] {
  const start = parseTime(min ?? "") ?? 0;
  const end = parseTime(max ?? "") ?? DAY - 1;
  return start <= end ? [start, end] : [0, DAY - 1];
}

export function stepTime(
  from: number | undefined,
  direction: 1 | -1,
  step: number,
  bounds: [number, number],
): number {
  const [start, end] = bounds;
  if (from === undefined) return direction === 1 ? start : end;

  const grid = Math.min(Math.max(Math.round(step), 1), DAY);
  const next =
    direction === 1 ? (Math.floor(from / grid) + 1) * grid : (Math.ceil(from / grid) - 1) * grid;

  return Math.min(Math.max(next, start), end);
}
