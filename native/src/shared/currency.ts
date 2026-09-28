/* Gerado de src/shared/currency.ts por bun run gen:compartilhado. Nao editar. */

export const CURRENCY_MAX_DIGITS = 12;

const grouping = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0, useGrouping: true });

export function formatCents(cents: number | null): string {
  if (cents === null || !Number.isFinite(cents)) return "";
  const whole = Math.trunc(Math.abs(cents));
  const reais = grouping.format(Math.floor(whole / 100));
  const rest = String(whole % 100).padStart(2, "0");
  return `${cents < 0 ? "-" : ""}${reais},${rest}`;
}

const capped = (digits: string) => digits.replace(/^0+(?=\d)/, "").slice(0, CURRENCY_MAX_DIGITS);

const PASTED =
  /^(\()?([-\u2212])?(?:R\$)?([-\u2212])?([\d.,]*\d[\d.,]*)([-\u2212])?(\))?$/i;

export function parseCurrencyText(text: string): number | null {
  const match = PASTED.exec(text.replace(/\s/g, ""));
  if (!match) return null;

  const [, open, before, after, clean, trailing, close] = match;
  const signs = [before, after, trailing].filter(Boolean).length;
  if (Boolean(open) !== Boolean(close) || signs > 1 || (open && signs > 0)) return null;
  const negative = Boolean(open) || signs === 1;

  const decimal = /[.,](\d{1,2})$/.exec(clean!);
  const whole = (decimal ? clean!.slice(0, decimal.index) : clean!).replace(/\D/g, "");
  const fraction = decimal ? decimal[1]!.padEnd(2, "0") : "00";

  const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, "");
  if (digits.length > CURRENCY_MAX_DIGITS) return null;
  const cents = Number(digits);
  return negative && cents !== 0 ? -cents : cents;
}

export type TextSelection = { start: number; end: number };

function edit(previous: string, next: string, selection?: TextSelection) {
  if (selection) {
    const { start, end } = selection;
    const kept = previous.length - end;
    if (
      start <= end &&
      end <= previous.length &&
      next.length >= start + kept &&
      next.startsWith(previous.slice(0, start)) &&
      next.endsWith(previous.slice(end))
    ) {
      return {
        added: next.slice(start, next.length - kept),
        removed: end > start,
        known: true,
      };
    }
  }

  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) {
    start += 1;
  }
  let end = 0;
  while (
    end < previous.length - start &&
    end < next.length - start &&
    previous[previous.length - 1 - end] === next[next.length - 1 - end]
  ) {
    end += 1;
  }
  return {
    added: next.slice(start, next.length - end),
    removed: previous.length - start - end > 0,
    known: false,
  };
}

export function readPastedCurrency(text: string, allowNegative: boolean): number | null {
  const pasted = parseCurrencyText(text);
  return pasted !== null && !allowNegative ? Math.abs(pasted) : pasted;
}

export type CurrencyReading = {
  cents: number | null;
  minus: boolean;
};

export function readCurrencyInput(
  next: string,
  previous: string,
  allowNegative: boolean,
  selection?: TextSelection,
  pasteEvent = true,
): CurrencyReading {
  const { added, removed, known } = edit(previous, next, selection);

  const lostComma =
    !pasteEvent &&
    !known &&
    (added !== "" || previous.length - next.length > 1) &&
    previous.includes(",") &&
    !next.includes(",") &&
    next.replace(/\D/g, "").length > 1;

  if (lostComma || added.replace(/\s/g, "").length > 1) {
    const pasted = readPastedCurrency(lostComma || removed ? next : added, allowNegative);
    if (pasted === null) return { cents: parseCurrencyText(previous), minus: previous === "-" };
    return { cents: pasted, minus: false };
  }

  const minus = allowNegative && (next.match(/-/g)?.length ?? 0) % 2 === 1;
  const typed = next.replace(/\D/g, "");

  if (!typed) return { cents: null, minus };

  const digits = capped(typed);
  const magnitude = Number(digits);
  if (magnitude === 0 && next.length < previous.length) return { cents: null, minus };

  return { cents: minus && magnitude !== 0 ? -magnitude : magnitude, minus };
}

export function outsideCents(cents: number | null, min?: number, max?: number): boolean {
  if (cents === null) return false;
  return (min !== undefined && cents < min) || (max !== undefined && cents > max);
}
