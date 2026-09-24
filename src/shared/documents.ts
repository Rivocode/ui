const digitsOf = (text: string) => text.replace(/[^a-zA-Z0-9]/g, "");

const sameDigit = (text: string) => /^(.)\1*$/.test(text);

const weighted = (digits: string, weights: number[]) =>
  weights.reduce((total, weight, index) => total + weight * Number(digits[index]), 0);

export function isValidCnh(text: string): boolean {
  const clean = digitsOf(text);
  if (!/^\d{11}$/.test(clean) || sameDigit(clean)) return false;

  const firstRemainder = weighted(clean, [9, 8, 7, 6, 5, 4, 3, 2, 1]) % 11;
  const first = firstRemainder >= 10 ? 0 : firstRemainder;
  const discount = firstRemainder >= 10 ? 2 : 0;

  const secondRemainder =
    ((weighted(clean, [1, 2, 3, 4, 5, 6, 7, 8, 9]) % 11) - discount + 11) % 11;
  const second = secondRemainder >= 10 ? 0 : secondRemainder;

  return first === Number(clean[9]) && second === Number(clean[10]);
}

const VOTER_STATE_ZERO_IS_ONE = new Set(["01", "02"]);

const voterDigit = (sum: number, state: string) => {
  const remainder = sum % 11;
  if (remainder === 0 && VOTER_STATE_ZERO_IS_ONE.has(state)) return 1;
  return remainder === 10 ? 0 : remainder;
};

export function isValidVoterId(text: string): boolean {
  const clean = digitsOf(text);
  if (!/^\d{12}$/.test(clean) || sameDigit(clean)) return false;

  const state = clean.slice(8, 10);
  const stateNumber = Number(state);
  if (stateNumber < 1 || stateNumber > 28) return false;

  const first = voterDigit(weighted(clean, [2, 3, 4, 5, 6, 7, 8, 9]), state);
  const second = voterDigit(Number(state[0]) * 7 + Number(state[1]) * 8 + first * 9, state);

  return first === Number(clean[10]) && second === Number(clean[11]);
}

export function isValidPis(text: string): boolean {
  const clean = digitsOf(text);
  if (!/^\d{11}$/.test(clean) || sameDigit(clean)) return false;

  const digit = 11 - (weighted(clean, [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11);
  return (digit >= 10 ? 0 : digit) === Number(clean[10]);
}

export function isValidRenavam(text: string): boolean {
  const typed = digitsOf(text);
  if (!/^(\d{9}|\d{11})$/.test(typed)) return false;

  const clean = typed.padStart(11, "0");
  if (sameDigit(clean)) return false;

  const digit = (weighted(clean, [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) * 10) % 11;
  return (digit === 10 ? 0 : digit) === Number(clean[10]);
}

export function isValidPlate(text: string): boolean {
  const clean = text.replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z]{3}\d{4}$/.test(clean) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(clean);
}
