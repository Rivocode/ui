const cleanTaxId = (text: string) => text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const checkDigit = (values: number[], weights: number[]) => {
  const sum = values.reduce((total, value, index) => total + value * weights[index]!, 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
};

const repeated = (text: string) => /^(.)\1*$/.test(text);

export function isValidCpf(text: string): boolean {
  const clean = cleanTaxId(text);
  if (!/^\d{11}$/.test(clean) || repeated(clean)) return false;

  const values = [...clean].map(Number);
  const first = checkDigit(values.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(values.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === values[9] && second === values[10];
}

export function isValidCnpj(text: string): boolean {
  const clean = cleanTaxId(text);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(clean) || repeated(clean)) return false;

  const values = [...clean].map((character) => character.charCodeAt(0) - 48);
  const first = checkDigit(values.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(values.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === values[12] && second === values[13];
}
