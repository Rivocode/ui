/* Gerado de src/shared/date.ts por bun run gen:compartilhado. Nao editar. */

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isoFromDate(date: Date): string {
  return toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dateFromIso(iso: string): Date | undefined {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!parts) return undefined;

  const year = Number(parts[1]);
  const month = Number(parts[2]) - 1;
  const day = Number(parts[3]);

  const date = new Date(year, month, day);
  const exists = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  return exists ? date : undefined;
}

export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
