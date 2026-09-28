import { expect, test } from "bun:test";

import {
  isValidCnh,
  isValidPis,
  isValidPlate,
  isValidRenavam,
  isValidVoterId,
} from "../src/index";

test("the cnh checks both check digits, with or without punctuation", () => {
  expect(isValidCnh("02650306461")).toBe(true);
  expect(isValidCnh("583.167.945-34")).toBe(true);
  expect(isValidCnh("02650306462")).toBe(false);
  expect(isValidCnh("02650306451")).toBe(false);
  expect(isValidCnh("12650306461")).toBe(false);
});

test("the cnh subtracts 2 from the second check digit when the first yields 10", () => {
  expect(isValidCnh("10000000108")).toBe(true);
  expect(isValidCnh("10000000100")).toBe(false);
});

test("the cnh rejects wrong length, letters and repeated sequences", () => {
  expect(isValidCnh("0265030646")).toBe(false);
  expect(isValidCnh("026503064611")).toBe(false);
  expect(isValidCnh("0265030646A")).toBe(false);
  expect(isValidCnh("11111111111")).toBe(false);
  expect(isValidCnh("")).toBe(false);
});

test("the voter id checks the state and both check digits", () => {
  expect(isValidVoterId("004356870906")).toBe(true);
  expect(isValidVoterId("0043 5687 0906")).toBe(true);
  expect(isValidVoterId("102385010671")).toBe(true);
  expect(isValidVoterId("004356870907")).toBe(false);
  expect(isValidVoterId("004356870916")).toBe(false);
  expect(isValidVoterId("104356870906")).toBe(false);
});

test("Sao Paulo and Minas replace remainder zero with 1, and the other states do not", () => {
  expect(isValidVoterId("123456770116")).toBe(true);
  expect(isValidVoterId("123456770213")).toBe(true);
  expect(isValidVoterId("123456770302")).toBe(true);
  expect(isValidVoterId("123456770106")).toBe(false);
  expect(isValidVoterId("123456770312")).toBe(false);
});

test("the voter id rejects a state outside 01 to 28, wrong length and repetition", () => {
  expect(isValidVoterId("123456780094")).toBe(false);
  expect(isValidVoterId("123456782992")).toBe(false);
  expect(isValidVoterId("00435687090")).toBe(false);
  expect(isValidVoterId("0043568709066")).toBe(false);
  expect(isValidVoterId("111111111111")).toBe(false);
});

test("the pis checks the check digit, and holds for pasep, nit and nis", () => {
  expect(isValidPis("120.56874.10-7")).toBe(true);
  expect(isValidPis("12056874107")).toBe(true);
  expect(isValidPis("268.27649.96-0")).toBe(true);
  expect(isValidPis("120.56874.10-8")).toBe(false);
  expect(isValidPis("120.56874.01-7")).toBe(false);
});

test("the pis rejects wrong length, letters and repeated sequences", () => {
  expect(isValidPis("1205687410")).toBe(false);
  expect(isValidPis("1205687410A")).toBe(false);
  expect(isValidPis("00000000000")).toBe(false);
});

test("the renavam checks the check digit, and the old nine-digit one is still valid", () => {
  expect(isValidRenavam("00639884962")).toBe(true);
  expect(isValidRenavam("639884962")).toBe(true);
  expect(isValidRenavam("0063988496-2")).toBe(true);
  expect(isValidRenavam("00639884963")).toBe(false);
  expect(isValidRenavam("00639884692")).toBe(false);
});

test("the renavam rejects ten digits, letters and repeated sequences", () => {
  expect(isValidRenavam("0639884962")).toBe(false);
  expect(isValidRenavam("0063988496A")).toBe(false);
  expect(isValidRenavam("00000000000")).toBe(false);
});

test("the plate accepts the old and the Mercosul format, with hyphen and in any case", () => {
  expect(isValidPlate("ABC1234")).toBe(true);
  expect(isValidPlate("ABC-1234")).toBe(true);
  expect(isValidPlate("BRA2E19")).toBe(true);
  expect(isValidPlate("bra2e19")).toBe(true);
  expect(isValidPlate("BRA 2E19")).toBe(true);
});

test("the plate rejects a letter in the wrong place and the wrong length", () => {
  expect(isValidPlate("ABC12D3")).toBe(false);
  expect(isValidPlate("AB12345")).toBe(false);
  expect(isValidPlate("ABC123")).toBe(false);
  expect(isValidPlate("ABC12345")).toBe(false);
  expect(isValidPlate("ABC.1234")).toBe(false);
});
