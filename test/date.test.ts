import { expect, test } from "bun:test";

import { formatDate, parseDate, applyDateMask } from "../src/lib/date";

test("formats the date in the Brazilian pattern, with leading zero", () => {
  expect(formatDate(new Date(2026, 2, 3))).toBe("03/03/2026");
  expect(formatDate(new Date(2026, 11, 25))).toBe("25/12/2026");
});

test("without a date, the field stays empty instead of showing garbage", () => {
  expect(formatDate(undefined)).toBe("");
  expect(formatDate(new Date("nao e data"))).toBe("");
});

test("reads the full date", () => {
  const data = parseDate("03/03/2026")!;
  expect(data.getFullYear()).toBe(2026);
  expect(data.getMonth()).toBe(2);
  expect(data.getDate()).toBe(3);
});

test("incomplete text is not a date yet", () => {
  expect(parseDate("03/03")).toBeUndefined();
  expect(parseDate("03/03/20")).toBeUndefined();
  expect(parseDate("")).toBeUndefined();
});

test("a day that does not exist in the month does not roll into the next month", () => {
  expect(parseDate("31/02/2026")).toBeUndefined();
  expect(parseDate("31/04/2026")).toBeUndefined();
  expect(parseDate("29/02/2024")).toBeDefined();
});

test("the mask inserts the slashes while typing", () => {
  expect(applyDateMask("0")).toBe("0");
  expect(applyDateMask("03")).toBe("03");
  expect(applyDateMask("0303")).toBe("03/03");
  expect(applyDateMask("03032026")).toBe("03/03/2026");
});

test("the mask ignores letters and stops at eight digits", () => {
  expect(applyDateMask("03a03b2026")).toBe("03/03/2026");
  expect(applyDateMask("030320261234")).toBe("03/03/2026");
});

test("deleting the slash deletes the number with it, without locking the field", () => {
  expect(applyDateMask("03/03/202")).toBe("03/03/202");
  expect(applyDateMask("03/")).toBe("03");
});

test("the date mask is named like the currency one, because it does the same thing", () => {
  // Both return ready text, and had names from different families.
  // Now they are the same family: `applyXMask`.
  expect(applyDateMask("31122026")).toBe("31/12/2026");
  expect(applyDateMask("311")).toBe("31/1");
});
