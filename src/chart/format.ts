/* ---------------------------------------------------------------------------
 * Axis and tooltip formatters.
 *
 * Every Brazilian dashboard repeats the same four: currency, percentage,
 * abbreviated number and short month. Without them each screen writes its own
 * `tickFormatter`, and one page's axis reads differently from the next:
 * R$ 12.400 here, 12400 there, 12,4k on the third.
 *
 * `Intl` does the heavy lifting; what lives here is the choice of how a number
 * looks on an axis, which is not how it looks in a sentence: on an axis the
 * space is short and the precision gets in the way.
 * ------------------------------------------------------------------------- */

const LOCALE = "pt-BR";

/** Keeps every `Intl` built: instantiating per tick is expensive on an axis. */
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

/**
 * `R$ 2.480,00`. For an axis prefer `currencyShort`: cents on a tick only take
 * width, and an axis is read for order of magnitude.
 */
export function currency(value: number) {
  return numberFormat({ style: "currency", currency: "BRL" }).format(value);
}

/** `R$ 2,5 mil`, `R$ 1,2 mi`. What fits on an axis. */
export function currencyShort(value: number) {
  return `R$ ${compact(value)}`;
}

/** `12,4 mil`, `1,2 mi`, `340`. */
export function compact(value: number) {
  const size = Math.abs(value);

  if (size >= 1_000_000_000) return `${numberFormat({ maximumFractionDigits: 1 }).format(value / 1_000_000_000)} bi`;
  if (size >= 1_000_000) return `${numberFormat({ maximumFractionDigits: 1 }).format(value / 1_000_000)} mi`;
  if (size >= 1_000) return `${numberFormat({ maximumFractionDigits: 1 }).format(value / 1_000)} mil`;

  return numberFormat({ maximumFractionDigits: 0 }).format(value);
}

/** `1.240`, thousands separator, no decimal. */
export function integer(value: number) {
  return numberFormat({ maximumFractionDigits: 0 }).format(value);
}

/**
 * `62%`. Takes the number as it appears in the data: `62` becomes `62%`.
 *
 * If your data comes as a fraction, multiply first, the alternative would be
 * the formatter guessing from magnitude, and guessing gets 0.8 wrong.
 */
export function percent(value: number, digits = 0) {
  return `${numberFormat({ maximumFractionDigits: digits }).format(value)}%`;
}

/** `mar`, `abr`. The most common time axis on a monthly dashboard. */
export function monthShort(date: Date | string | number) {
  const when = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(when).replace(".", "");
}

/** `12/03`. For a daily series, where the year is the same throughout. */
export function dayMonth(date: Date | string | number) {
  const when = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit" }).format(when);
}

export const formatters = {
  currency,
  currencyShort,
  compact,
  integer,
  percent,
  monthShort,
  dayMonth,
} as const;

/** The name of a built-in formatter, for whoever prefers passing a string. */
export type FormatName = keyof typeof formatters;

/** Takes the name of a built-in formatter or a function of your own. */
export type Format = FormatName | ((value: never) => string);

export function resolveFormat(format: Format | undefined) {
  if (!format) return undefined;
  if (typeof format === "function") return format as (value: unknown) => string;
  return formatters[format] as (value: unknown) => string;
}
