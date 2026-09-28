import { expect, test } from "bun:test";

import {
  applyMask,
  applyCurrencyMask,
  applyPattern,
  toCents,
  phonePatternFor,
  unmask,
} from "../src/lib/mask";

test("the pattern adds the punctuation by itself", () => {
  expect(applyMask("12345678901", "cpf")).toBe("123.456.789-01");
  expect(applyMask("12345678000199", "cnpj")).toBe("12.345.678/0001-99");
  expect(applyMask("58000000", "cep")).toBe("58000-000");
});

test("the alphanumeric CNPJ is accepted, with letters uppercased and the check digits digits only", () => {
  expect(applyMask("12abc34501de35", "cnpj")).toBe("12.ABC.345/01DE-35");
  expect(applyMask("00000000E08G12", "cnpj")).toBe("00.000.000/E08G-12");
  expect(applyMask("12ABC34501DEX5", "cnpj")).toBe("12.ABC.345/01DE-5");
  expect(unmask(applyMask("12.abc.345/01de-35", "cnpj"))).toBe("12ABC34501DE35");
});

test("the mask stops at the end of the pattern instead of garbling", () => {
  expect(applyMask("123456789012345", "cpf")).toBe("123.456.789-01");
});

test("a letter is not accepted where the pattern asks for a digit", () => {
  expect(applyMask("12a34", "cpf")).toBe("123.4");
});

test("a letter pattern uppercases by itself", () => {
  expect(applyMask("abc1d23", "placa")).toBe("ABC1D23");
});

test("already punctuated text does not duplicate the punctuation", () => {
  expect(applyMask("123.456.789-01", "cpf")).toBe("123.456.789-01");
});

test("deleting returns the half-filled field, without getting stuck", () => {
  expect(applyMask("123.456", "cpf")).toBe("123.456");
  expect(applyMask("123.", "cpf")).toBe("123.");
  expect(applyMask("", "cpf")).toBe("");
});

test("deleting the phone space does not bring back the closing parenthesis with a space", () => {
  expect(applyMask("(11)", "telefone")).toBe("(11)");
  expect(applyMask("(11", "telefone")).toBe("(11");
  expect(applyPattern("(11)", "(99) 9999")).toBe("(11)");
  expect(applyPattern("11", "(99) 9999")).toBe("(11");
  expect(applyPattern("115", "(99) 9999")).toBe("(11) 5");
});

test("a hand-written pattern also works", () => {
  expect(applyPattern("123456", "99-99-99")).toBe("12-34-56");
});

test("money fills from right to left", () => {
  expect(applyCurrencyMask("1")).toBe("0,01");
  expect(applyCurrencyMask("123")).toBe("1,23");
  expect(applyCurrencyMask("123456")).toBe("1.234,56");
  expect(applyCurrencyMask("")).toBe("");
});

test("money keeps no leading zero", () => {
  expect(applyCurrencyMask("000123")).toBe("1,23");
});

test("the value comes out in cents, without going through floating point", () => {
  expect(toCents("1.234,56")).toBe(123456);
  expect(toCents("")).toBe(0);
});

test("the phone switches pattern between landline and mobile", () => {
  expect(phonePatternFor("8332211234")).toBe("(99) 9999-9999");
  expect(phonePatternFor("83988112233")).toBe("(99) 99999-9999");
  expect(applyPattern("8332211234", phonePatternFor("8332211234"))).toBe("(83) 3221-1234");
  expect(applyPattern("83988112233", phonePatternFor("83988112233"))).toBe("(83) 98811-2233");
});

test("without the mask only what was typed remains", () => {
  expect(unmask("123.456.789-01")).toBe("12345678901");
  expect(unmask("(83) 98811-2233")).toBe("83988112233");
});

test("a pattern that does not exist does not become the field value itself", () => {
  // "dinheiro" is the name the MaskedInput JSDoc advertised, and "cnjp" is the
  // everyday typo. Both were written into the field: whoever typed 248000 saw
  // "dinheiro" appear in place of the number.
  expect(applyMask("248000", "dinheiro")).toBe("248000");
  expect(applyMask("12345678901", "cnjp")).toBe("12345678901");
});

test("a hand-written pattern with a literal letter still works", () => {
  // What separates a pattern from a wrong name is having a marker inside - 9, A
  // or *. A pattern with a loose letter in the middle is still a pattern.
  expect(applyMask("1430", "99h99")).toBe("14h30");
});

test("the name says the nature of what comes back, and not just the subject", () => {
  // The three had the same signature `(text: string) => string`, and one
  // returned something of another nature: a pattern, and not finished text.
  // Whoever called it expecting the formatted phone got the literal pattern
  // written into the field, and TypeScript had no way to flag it - the
  // signatures were identical. `applyX` returns text; `patternFor` returns a
  // pattern.
  expect(phonePatternFor("11987654321")).toBe("(99) 99999-9999");
  expect(phonePatternFor("1132654321")).toBe("(99) 9999-9999");
  expect(applyCurrencyMask("123456")).toBe("1.234,56");
});

test("a landline does not get mobile punctuation when applyMask is called directly", () => {
  // The phone pattern changes mid-typing, and MASKS holds only one - the
  // mobile one. MaskedInput worked around it from outside, picking the pattern
  // before applying; whoever called `applyMask` directly got a garbled
  // landline, breaking the promise of MASKS.telefone itself ("the ninth digit
  // only appears when it exists"). `moeda` was already decided in here for the
  // same reason.
  expect(applyMask("8388112233", "telefone")).toBe("(83) 8811-2233");
  expect(applyMask("83988112233", "telefone")).toBe("(83) 98811-2233");
});
