export type PixPayloadInput = {
  /** A chave Pix como o DICT a guarda: CPF e CNPJ sem pontuacao, telefone com +55. Ate 77 caracteres. */
  key: string;
  /** O nome do recebedor, ate 25 caracteres depois de tirar o acento. O app do pagador mostra o nome do DICT, e nao este. */
  name: string;
  /** A cidade do recebedor, ate 15 caracteres depois de tirar o acento. */
  city: string;
  /** Em reais, maior que zero. Sem ele, o app do pagador pergunta quanto. */
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

const ACCENTS: Record<string, string> = {
  á: "a",
  à: "a",
  â: "a",
  ã: "a",
  ä: "a",
  é: "e",
  è: "e",
  ê: "e",
  ë: "e",
  í: "i",
  ì: "i",
  î: "i",
  ï: "i",
  ó: "o",
  ò: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ú: "u",
  ù: "u",
  û: "u",
  ü: "u",
  ç: "c",
  ñ: "n",
};

function plain(text: string) {
  return [...text.trim()]
    .map((character) => {
      const lower = character.toLowerCase();
      const swap = ACCENTS[lower];
      if (swap === undefined) return character;
      return character === lower ? swap : swap.toUpperCase();
    })
    .join("")
    .replace(/[^\x20-\x7e]/g, "");
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

export function buildPixPayload(input: PixPayloadInput): string {
  const key = limit("a chave", input.key.trim(), 77);
  const name = limit("o nome", plain(input.name), 25);
  const city = limit("a cidade", plain(input.city), 15);
  const description = input.description ? plain(input.description) : "";

  const txid = input.txid?.trim() || "***";
  if (txid !== "***" && !/^[A-Za-z0-9]{1,25}$/.test(txid)) {
    throw new RangeError(`O txid do Pix aceita so letras e digitos, ate 25: "${txid}".`);
  }

  let amount = "";
  if (input.amount !== undefined) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new RangeError(`O valor do Pix tem que ser maior que zero: ${input.amount}.`);
    }
    amount = input.amount.toFixed(2);
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
  const amount = rawAmount !== undefined ? Number(rawAmount) : undefined;
  if (amount !== undefined && !Number.isFinite(amount)) return null;

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
  const [whole = "0", cents = "00"] = Math.abs(value).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${value < 0 ? "-" : ""}R$ ${grouped},${cents}`;
}
