/* Gerado de src/shared/boleto.ts por bun run gen:compartilhado. Nao editar. */

export type BoletoKind = "bank" | "collection";

export type BoletoData = {
  kind: BoletoKind;
  line: string;
  barcode: string;
  bank: string | null;
  amount: number | null;
  dueDate: Date | null;
  segment: number | null;
};

export type ParseBoletoOptions = {
  today?: Date;
};

const BANK_LENGTH = 47;
const COLLECTION_LENGTH = 48;
const BARCODE_LENGTH = 44;

const onlyDigits = (text: string) => text.replace(/\D/g, "");

function mod10(digits: string): number {
  let sum = 0;
  let factor = 2;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const product = Number(digits[index]) * factor;
    sum += product > 9 ? product - 9 : product;
    factor = factor === 2 ? 1 : 2;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

function weightedMod11(digits: string): number {
  let sum = 0;
  let weight = 2;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    sum += Number(digits[index]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  return sum % 11;
}

function bankMod11(digits: string): number {
  const digit = 11 - weightedMod11(digits);
  return digit === 0 || digit === 10 || digit === 11 ? 1 : digit;
}

function collectionMod11(digits: string): number {
  const remainder = weightedMod11(digits);
  if (remainder === 0 || remainder === 1) return 0;
  return 11 - remainder;
}

function collectionCheck(barcode: string): ((digits: string) => number) | null {
  const reference = barcode[2];
  if (reference === "6" || reference === "7") return mod10;
  if (reference === "8" || reference === "9") return collectionMod11;
  return null;
}

function bankBarcodeIsValid(barcode: string): boolean {
  return bankMod11(barcode.slice(0, 4) + barcode.slice(5)) === Number(barcode[4]);
}

function collectionBarcodeIsValid(barcode: string): boolean {
  const check = collectionCheck(barcode);
  if (!check) return false;
  return check(barcode.slice(0, 3) + barcode.slice(4)) === Number(barcode[3]);
}

function bankLineIsValid(line: string): boolean {
  const fields: Array<[start: number, end: number]> = [
    [0, 9],
    [10, 20],
    [21, 31],
  ];
  for (const [start, end] of fields) {
    if (mod10(line.slice(start, end)) !== Number(line[end])) return false;
  }
  return bankBarcodeIsValid(bankLineToBarcode(line));
}

function collectionLineIsValid(line: string): boolean {
  const barcode = collectionLineToBarcode(line);
  const check = collectionCheck(barcode);
  if (!check) return false;
  for (let block = 0; block < 4; block += 1) {
    const start = block * 12;
    if (check(line.slice(start, start + 11)) !== Number(line[start + 11])) return false;
  }
  return collectionBarcodeIsValid(barcode);
}

function bankLineToBarcode(line: string): string {
  return (
    line.slice(0, 4) +
    line[32] +
    line.slice(33, 47) +
    line.slice(4, 9) +
    line.slice(10, 20) +
    line.slice(21, 31)
  );
}

function collectionLineToBarcode(line: string): string {
  return line.slice(0, 11) + line.slice(12, 23) + line.slice(24, 35) + line.slice(36, 47);
}

function bankBarcodeToLine(barcode: string): string {
  const first = barcode.slice(0, 4) + barcode.slice(19, 24);
  const second = barcode.slice(24, 34);
  const third = barcode.slice(34, 44);
  return (
    first +
    mod10(first) +
    second +
    mod10(second) +
    third +
    mod10(third) +
    barcode[4] +
    barcode.slice(5, 19)
  );
}

function collectionBarcodeToLine(barcode: string, check: (digits: string) => number): string {
  let line = "";
  for (let block = 0; block < 4; block += 1) {
    const part = barcode.slice(block * 11, block * 11 + 11);
    line += part + check(part);
  }
  return line;
}

const isCollection = (digits: string) => digits[0] === "8";

export function isValidBoletoLine(text: string): boolean {
  const line = onlyDigits(text);
  if (isCollection(line)) {
    return line.length === COLLECTION_LENGTH && collectionLineIsValid(line);
  }
  return line.length === BANK_LENGTH && bankLineIsValid(line);
}

export function boletoLineToBarcode(text: string): string | null {
  if (!isValidBoletoLine(text)) return null;
  const line = onlyDigits(text);
  return isCollection(line) ? collectionLineToBarcode(line) : bankLineToBarcode(line);
}

export function boletoPatternFor(text: string, slot = "9"): string {
  const pattern = isCollection(onlyDigits(text))
    ? "99999999999-9 99999999999-9 99999999999-9 99999999999-9"
    : "99999.99999 99999.999999 99999.999999 9 99999999999999";
  return slot === "9" ? pattern : pattern.replace(/9/g, slot);
}

const DAY = 86_400_000;
const FACTOR_CYCLE = 9000;
const FIRST_FACTOR_DAY = Date.UTC(2000, 6, 3);
const ORIGINAL_BASE_DAY = Date.UTC(1997, 9, 7);

const dayNumber = (date: Date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;

export function boletoDueDate(factor: number, today: Date = new Date()): Date | null {
  if (!Number.isInteger(factor) || factor <= 0 || factor > 9999) return null;

  let day: number;
  if (factor < 1000) {
    day = ORIGINAL_BASE_DAY / DAY + factor;
  } else {
    const first = FIRST_FACTOR_DAY / DAY + (factor - 1000);
    const cycle = Math.max(0, Math.round((dayNumber(today) - first) / FACTOR_CYCLE));
    day = first + cycle * FACTOR_CYCLE;
  }

  const utc = new Date(day * DAY);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

export function parseBoleto(text: string, options: ParseBoletoOptions = {}): BoletoData | null {
  const digits = onlyDigits(text);
  let line: string;
  let barcode: string;

  if (digits.length === BARCODE_LENGTH) {
    barcode = digits;
    if (isCollection(barcode)) {
      const check = collectionCheck(barcode);
      if (!check || !collectionBarcodeIsValid(barcode)) return null;
      line = collectionBarcodeToLine(barcode, check);
    } else {
      if (!bankBarcodeIsValid(barcode)) return null;
      line = bankBarcodeToLine(barcode);
    }
  } else {
    const converted = boletoLineToBarcode(digits);
    if (!converted) return null;
    line = digits;
    barcode = converted;
  }

  if (isCollection(barcode)) {
    const reference = barcode[2];
    const amount = reference === "6" || reference === "8" ? Number(barcode.slice(4, 15)) : null;
    return {
      kind: "collection",
      line,
      barcode,
      bank: null,
      amount,
      dueDate: null,
      segment: Number(barcode[1]),
    };
  }

  const amount = Number(barcode.slice(9, 19));
  return {
    kind: "bank",
    line,
    barcode,
    bank: barcode.slice(0, 3),
    amount: amount > 0 ? amount : null,
    dueDate: boletoDueDate(Number(barcode.slice(5, 9)), options.today),
    segment: null,
  };
}
