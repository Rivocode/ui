import { afterAll, beforeAll, expect, test } from "bun:test";

import {
  compact,
  compactWords,
  currency,
  currencyShort,
  currencyShortWords,
  dayMonth,
  integer,
  monthShort,
  percent,
} from "../src/chart/format";

test("the real comes out in the country format, with cents", () => {
  // The Intl separator is a narrow space, and not the regular space.
  expect(currency(2480).replace(/ /g, " ")).toBe("R$ 2.480,00");
});

test("the axis abbreviates the magnitude, because a tick has no width for cents", () => {
  expect(compact(340)).toBe("340");
  expect(compact(12_400)).toBe("12,4K");
  expect(compact(1_200_000)).toBe("1,2M");
  expect(compact(3_000_000_000)).toBe("3B");
  expect(currencyShort(12_400)).toBe("R$\u00a012,4K");
});

test("abbreviated money does not break between R$ and the number, like Intl's", () => {
  const symbol = currency(2480).slice(0, 3);
  expect(symbol).toBe("R$\u00a0");
  expect(currencyShort(12_400).startsWith(symbol)).toBe(true);
  expect(currencyShortWords(12_400).startsWith(symbol)).toBe(true);
  expect(currencyShort(12_400)).not.toContain(" ");
  expect(currencyShortWords(12_400)).toBe("R$\u00a012,4\u00a0mil");
});

test("the spelled-out form exists for running text, where it reads better", () => {
  expect(compactWords(12_400)).toBe("12,4\u00a0mil");
  expect(compactWords(1_200_000)).toBe("1,2\u00a0mi");
  expect(compactWords(3_000_000_000)).toBe("3\u00a0bi");
});

test("a negative abbreviates by magnitude, and not by sign", () => {
  expect(compact(-12_400)).toBe("-12,4K");
  expect(compactWords(-12_400)).toBe("-12,4\u00a0mil");
});

test("integer separates thousands and does not invent decimals", () => {
  expect(integer(1240)).toBe("1.240");
  expect(integer(1240.7)).toBe("1.241");
});

test("percent reads the number as it comes in the data", () => {
  expect(percent(62)).toBe("62%");
  expect(percent(62.48, 1)).toBe("62,5%");
});

test("the compact month comes out without the dot the locale adds", () => {
  expect(monthShort(new Date(2026, 2, 15))).toBe("mar");
  expect(dayMonth(new Date(2026, 2, 5))).toBe("05/03");
});

/* ---------------------------------------------------------------------------
 * A date without time is a calendar day, and not an instant.
 *
 * The time zone is pinned here because CI runs in UTC, where the defect does
 * not show: `new Date("2026-08-05")` only goes back a day in a negative
 * offset, which is where the whole country is.
 * ------------------------------------------------------------------------- */

const originalTz = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});
afterAll(() => {
  process.env.TZ = originalTz;
});

test("a date without time does not go back a day in the country time zone", () => {
  expect(dayMonth("2026-08-05")).toBe("05/08");
  expect(monthShort("2026-03-10")).toBe("mar");
});

test("the first day of the month does not fall into the previous month", () => {
  expect(dayMonth("2026-01-01")).toBe("01/01");
  expect(monthShort("2026-01")).toBe("jan");
  expect(monthShort("2026-03")).toBe("mar");
});

test("an instant with time is still read in the local time zone", () => {
  // The guard against the naive fix, which is pinning `timeZone: "UTC"` in the
  // formatting: 01h on the 6th in UTC is still the 5th at 22h in Sao Paulo,
  // and the 5th is the day the person saw it happen.
  expect(dayMonth("2026-08-06T01:00:00Z")).toBe("05/08");
  expect(monthShort("2026-04-01T02:00:00Z")).toBe("mar");
  expect(dayMonth(new Date(2026, 7, 5))).toBe("05/08");
});

test("rounding that reaches a thousand moves up a magnitude, instead of writing 1.000K", () => {
  const plain = (text: string) => text.replace(/ /g, " ");

  expect(compact(999_950)).toBe("1M");
  expect(plain(compactWords(999_999))).toBe("1 mi");
  expect(compact(999_999_999)).toBe("1B");
  expect(compact(999.6)).toBe("1K");
  expect(compact(999.4)).toBe("999");
  expect(compact(1_500)).toBe("1,5K");
});

test("short money follows the currency sign, and a rounded zero has no sign", () => {
  const plain = (text: string) => text.replace(/ /g, " ");

  expect(plain(currencyShort(-1_500))).toBe("-R$ 1,5K");
  expect(plain(currencyShortWords(-2_500_000))).toBe("-R$ 2,5 mi");
  expect(plain(currency(-1_500))).toStartWith("-R$");
  expect(compact(-0.4)).toBe("0");
  expect(plain(currencyShort(-0.4))).toBe("R$ 0");
  expect(compact(-12)).toBe("-12");
});

test("trillion gets its own band, and a billion that rounds to a thousand moves up to it", () => {
  expect(compact(1e12)).toBe("1T");
  expect(compact(999_950_000_000)).toBe("1T");
  expect(compactWords(2.5e12)).toBe("2,5 tri");
  expect(currencyShort(-1e12)).toBe("-R$ 1T");
});
