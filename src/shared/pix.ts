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

const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const PHONE = /^\+55[1-9]{2}9\d{8}$/;
const RANDOM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isValidPixKey(key: string): boolean {
  if (key.length === 0 || key.length > 77) return false;
  if (/^\d{11}$/.test(key)) return isValidCpf(key);
  if (/^[A-Z0-9]{12}\d{2}$/.test(key)) return isValidCnpj(key);
  return EMAIL.test(key) || PHONE.test(key) || RANDOM.test(key);
}

export type PixPayloadInput = {
  /** A chave Pix. CPF, CNPJ e celular podem vir pontuados e saem como o DICT os guarda; chave fora dos cinco tipos lanca `RangeError`. */
  key: string;
  /** O nome do recebedor, ate 25 caracteres depois de tirar o acento. O app do pagador mostra o nome do DICT, e nao este. */
  name: string;
  /** A cidade do recebedor, ate 15 caracteres depois de tirar o acento. */
  city: string;
  /** Em reais, arredondado ao centavo e de um centavo para cima. Sem ele, o app do pagador pergunta quanto. */
  amount?: number;
  /** O identificador para conciliar, ate 25 letras e digitos. Sem ele sai `***`, como manda o manual. */
  txid?: string;
  /** O texto livre que o pagador ve, no campo infoAdicional. Divide 99 caracteres com a chave. */
  description?: string;
};

export type PixPayload = {
  /** A chave Pix. Vazia no QR dinamico, que leva `url` no lugar. */
  key?: string;
  /** A location do QR dinamico, sem protocolo. */
  url?: string;
  /** A location dos parametros de recorrencia do QR composto (ID 80 a 99), sem protocolo. */
  recurrence?: string;
  /** O nome do recebedor gravado no codigo. */
  name: string;
  /** A cidade do recebedor gravada no codigo. */
  city: string;
  /** Em reais. No QR dinamico o valor que vale e o da cobranca, e nao este. */
  amount?: number;
  /** O identificador de conciliacao; ausente quando o codigo diz `***`. */
  txid?: string;
  /** O infoAdicional. */
  description?: string;
  /** `true` quando o codigo so vale para um pagamento (ID 01 igual a 12). */
  unique: boolean;
};

const GUI = "br.gov.bcb.pix";

const LETTERS: Record<string, string> = {
  ø: "o",
  Ø: "O",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  ß: "ss",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  ð: "d",
  Ð: "D",
  þ: "th",
  Þ: "TH",
  ı: "i",
  º: "o",
  ª: "a",
};

function plain(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, (character) => LETTERS[character] ?? " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function pixCrc(text: string) {
  let crc = 0xffff;
  for (let index = 0; index < text.length; index++) {
    crc ^= text.charCodeAt(index) << 8;
    for (let step = 0; step < 8; step++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function field(id: string, value: string) {
  if (value.length > 99) {
    throw new RangeError(`O campo ${id} do Pix passa de 99 caracteres.`);
  }
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function limit(label: string, value: string, max: number) {
  if (value.length === 0) throw new RangeError(`O Pix precisa de ${label}.`);
  if (value.length > max) {
    throw new RangeError(`${label} do Pix passa de ${max} caracteres: "${value}".`);
  }
  return value;
}

const CPF_SHAPE = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const CNPJ_SHAPE = /^[A-Za-z0-9]{2}\.?[A-Za-z0-9]{3}\.?[A-Za-z0-9]{3}\/?[A-Za-z0-9]{4}-?\d{2}$/;
const PHONE_SHAPE = /^\+?[\d\s()-]+$/;

function pixKeyOf(raw: string) {
  const text = raw.trim();
  if (CPF_SHAPE.test(text)) return text.replace(/\D/g, "");
  if (CNPJ_SHAPE.test(text) && /\d/.test(text)) return cleanTaxId(text);
  if (PHONE_SHAPE.test(text) && /[\s()+-]/.test(text)) {
    const digits = text.replace(/\D/g, "");
    if (digits.length === 11) return `+55${digits}`;
    if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;
  }
  if (text.includes("@") || RANDOM.test(text.toLowerCase())) return text.toLowerCase();
  return text;
}

function toCents(value: number) {
  if (!Number.isFinite(value)) return Number.NaN;
  const shifted = Number(`${value}e2`);
  return Math.round(Number.isFinite(shifted) ? shifted : value * 100);
}

export function buildPixPayload(input: PixPayloadInput): string {
  const key = limit("a chave", pixKeyOf(input.key), 77);
  if (!isValidPixKey(key)) {
    throw new RangeError(
      `A chave do Pix nao e CPF, CNPJ, e-mail, celular com +55 nem chave aleatoria: "${input.key}".`,
    );
  }
  const name = limit("o nome", plain(input.name), 25);
  const city = limit("a cidade", plain(input.city), 15);
  const description = input.description ? plain(input.description) : "";

  const txid = input.txid?.trim() || "***";
  if (txid !== "***" && !/^[A-Za-z0-9]{1,25}$/.test(txid)) {
    throw new RangeError(`O txid do Pix aceita so letras e digitos, ate 25: "${txid}".`);
  }

  let amount = "";
  if (input.amount !== undefined) {
    const cents = toCents(input.amount);
    if (!Number.isSafeInteger(cents) || cents <= 0) {
      throw new RangeError(`O valor do Pix tem que ser de um centavo para cima: ${input.amount}.`);
    }
    amount = `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
    if (amount.length > 13) throw new RangeError(`O valor do Pix passa de 13 caracteres: ${amount}.`);
  }

  const account =
    field("00", GUI) + field("01", key) + (description ? field("02", description) : "");

  const body =
    field("00", "01") +
    field("26", account) +
    field("52", "0000") +
    field("53", "986") +
    (amount ? field("54", amount) : "") +
    field("58", "BR") +
    field("59", name) +
    field("60", city) +
    field("62", field("05", txid)) +
    "6304";

  return body + pixCrc(body);
}

function fields(text: string) {
  const found = new Map<string, string>();
  let at = 0;
  while (at < text.length) {
    const id = text.slice(at, at + 2);
    const size = text.slice(at + 2, at + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(size)) return null;
    const value = text.slice(at + 4, at + 4 + Number(size));
    if (value.length !== Number(size)) return null;
    found.set(id, value);
    at += 4 + Number(size);
  }
  return found;
}

export function parsePixPayload(text: string): PixPayload | null {
  const code = text.trim();
  if (code.length < 8 || code.slice(-8, -4) !== "6304") return null;
  if (pixCrc(code.slice(0, -4)) !== code.slice(-4).toUpperCase()) return null;

  const top = fields(code);
  if (!top || top.get("00") !== "01") return null;

  const template = (from: number, to: number) => {
    for (let id = from; id <= to; id++) {
      const value = top.get(String(id));
      const inner = value ? fields(value) : null;
      if (inner?.get("00")?.toLowerCase() === GUI) return inner;
    }
    return null;
  };

  const account = template(26, 51);
  if (!account) return null;

  const key = account.get("01");
  const url = account.get("25");
  const recurrence = template(80, 99)?.get("25");
  if (!key && !url && !recurrence) return null;

  const name = top.get("59");
  const city = top.get("60");
  if (!name || !city || top.get("53") !== "986") return null;

  const rawAmount = top.get("54");
  if (rawAmount !== undefined && !/^\d{1,10}(\.\d{1,2})?$/.test(rawAmount)) return null;
  const amount = rawAmount !== undefined ? Number(rawAmount) : undefined;
  if (amount !== undefined && amount <= 0) return null;

  const extra = top.get("62");
  const txid = extra ? fields(extra)?.get("05") : undefined;

  return {
    key,
    url,
    recurrence,
    name,
    city,
    amount,
    txid: txid && txid !== "***" ? txid : undefined,
    description: account.get("02"),
    unique: top.get("01") === "12",
  };
}

export function formatBrl(value: number) {
  const cents = toCents(Math.abs(value));
  if (!Number.isSafeInteger(cents)) return "-";
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const rest = String(cents % 100).padStart(2, "0");
  return `${value < 0 && cents > 0 ? "-" : ""}R$ ${whole},${rest}`;
}
