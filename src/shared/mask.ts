export const MASKS = {
  cpf: "999.999.999-99",
  cnpj: "**.***.***/****-99",
  cep: "99999-999",
  data: "99/99/9999",
  hora: "99:99",
  placa: "AAA9A99",
  cartao: "9999 9999 9999 9999",
  telefone: "(99) 99999-9999",
  boleto: "99999.99999 99999.999999 99999.999999 9 99999999999999",
} as const;

export type MaskName = keyof typeof MASKS;

export type Mask = MaskName | "moeda" | (string & {});

function matches(character: string, mark: string): boolean {
  if (mark === "9") return /\d/.test(character);
  if (mark === "A") return /[a-zA-Z]/.test(character);
  if (mark === "*") return /[a-zA-Z0-9]/.test(character);
  return false;
}

const MARKS = new Set(["9", "A", "*"]);

export function applyPattern(text: string, pattern: string): string {
  let output = "";
  let position = 0;

  for (const character of text) {
    while (position < pattern.length && !MARKS.has(pattern[position]!)) {
      output += pattern[position];
      position += 1;
    }
    if (position >= pattern.length) break;

    if (matches(character, pattern[position]!)) {
      output += pattern[position] === "A" ? character.toUpperCase() : character;
      position += 1;
    }
  }

  return output;
}

export function applyCurrencyMask(text: string): string {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
  if (!digits) return "";

  const cents = digits.padStart(3, "0");
  const whole = cents.slice(0, -2);
  const rest = cents.slice(-2);
  const withDot = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDot},${rest}`;
}

export function unmask(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, "");
}

export function phonePatternFor(text: string): Mask {
  return unmask(text).length > 10 ? "(99) 99999-9999" : "(99) 9999-9999";
}

function looksLikePattern(mask: string): boolean {
  return /[9A*]/.test(mask);
}

export function isKnownMask(mask: Mask): boolean {
  return mask === "moeda" || mask in MASKS || looksLikePattern(mask);
}

export function maskText(text: string, mask: Mask): string {
  if (mask === "moeda") return applyCurrencyMask(text);
  if (mask === "telefone") return applyPattern(text, phonePatternFor(text));
  if (mask === "cnpj") return applyPattern(text.toUpperCase(), MASKS.cnpj);

  const pattern = MASKS[mask as MaskName];
  if (pattern) return applyPattern(text, pattern);
  if (looksLikePattern(mask)) return applyPattern(text, mask);
  return text;
}

const NUMERIC_NAMES = new Set<string>(["cpf", "cep", "data", "hora", "cartao", "telefone", "boleto"]);

export function isNumericMask(mask: Mask): boolean {
  return (
    mask === "moeda" ||
    NUMERIC_NAMES.has(mask) ||
    (/^[9\W]+$/.test(mask) && !mask.includes("*"))
  );
}
