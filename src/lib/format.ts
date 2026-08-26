const LOCALE = "pt-BR";

const cache = new Map<string, Intl.NumberFormat>();

function numberFormat(options: Intl.NumberFormatOptions) {
  const key = JSON.stringify(options);
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, options);
    cache.set(key, formatter);
  }
  return formatter;
}

export function currency(value: number) {
  return numberFormat({ style: "currency", currency: "BRL" }).format(value);
}

const SUFFIXES = {
  symbol: { billion: "B", million: "M", thousand: "K", tight: true },
  word: { billion: "bi", million: "mi", thousand: "mil", tight: false },
} as const;

function abbreviate(value: number, shape: keyof typeof SUFFIXES) {
  const { billion, million, thousand, tight } = SUFFIXES[shape];
  const size = Math.abs(value);
  const space = tight ? "" : " ";

  const write = (divided: number, suffix: string) =>
    `${numberFormat({ maximumFractionDigits: 1 }).format(divided)}${space}${suffix}`;

  if (size >= 1_000_000_000) return write(value / 1_000_000_000, billion);
  if (size >= 1_000_000) return write(value / 1_000_000, million);
  if (size >= 1_000) return write(value / 1_000, thousand);

  return numberFormat({ maximumFractionDigits: 0 }).format(value);
}

export function compact(value: number) {
  return abbreviate(value, "symbol");
}

export function compactWords(value: number) {
  return abbreviate(value, "word");
}

export function currencyShort(value: number) {
  return `R$ ${compact(value)}`;
}

export function currencyShortWords(value: number) {
  return `R$ ${compactWords(value)}`;
}

export function integer(value: number) {
  return numberFormat({ maximumFractionDigits: 0 }).format(value);
}

export function percent(value: number, digits = 0) {
  return `${numberFormat({ maximumFractionDigits: digits }).format(value)}%`;
}

const CALENDAR_DAY = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;

function toDate(date: Date | string | number) {
  if (date instanceof Date) return date;
  if (typeof date === "string") {
    const parts = CALENDAR_DAY.exec(date.trim());
    if (parts) {
      return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3] ?? "1"));
    }
  }
  return new Date(date);
}

export function monthShort(date: Date | string | number) {
  return new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(toDate(date)).replace(".", "");
}

export function dayMonth(date: Date | string | number) {
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit" }).format(toDate(date));
}

export const formatters = {
  currency,
  currencyShort,
  currencyShortWords,
  compact,
  compactWords,
  integer,
  percent,
  monthShort,
  dayMonth,
} as const;

export type FormatName = keyof typeof formatters;

export type Format = FormatName | ((value: never) => string);

export function resolveFormat(format: Format | undefined) {
  if (!format) return undefined;
  if (typeof format === "function") return format as (value: unknown) => string;
  return formatters[format] as (value: unknown) => string;
}
