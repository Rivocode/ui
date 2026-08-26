/**
 * Mask de digitacao guiada por molde.
 *
 * O molde usa `9` para digito, `A` para letra e `*` para os dois. Todo o
 * resto e literal e a mascara poe sozinha: `999.999.999-99` produz
 * `123.456.789-01`.
 *
 * A regra que segura tudo: a mascara nunca guarda o que nao cabe. Digitar
 * demais para no ultimo espaco em vez de embolar o campo, e apagar tira o
 * caractere de verdade junto com a pontuacao dele.
 */

export const MASKS = {
  cpf: "999.999.999-99",
  cnpj: "99.999.999/9999-99",
  cep: "99999-999",
  data: "99/99/9999",
  hora: "99:99",
  placa: "AAA9A99",
  cartao: "9999 9999 9999 9999",
  /** Fixo e celular no mesmo campo: a nona casa so aparece quando existe. */
  telefone: "(99) 99999-9999",
} as const;

export type MaskName = keyof typeof MASKS;

/** Nome de molde pronto, molde escrito na mao, ou `moeda`. */
export type Mask = MaskName | "moeda" | (string & {});

function matches(character: string, mark: string): boolean {
  if (mark === "9") return /\d/.test(character);
  if (mark === "A") return /[a-zA-Z]/.test(character);
  if (mark === "*") return /[a-zA-Z0-9]/.test(character);
  return false;
}

const MARKS = new Set(["9", "A", "*"]);

/** Aplica o molde. O texto pode vir cru ou ja pontuado. */
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

/**
 * Dinheiro em real, preenchido da direita para a esquerda.
 *
 * E o unico que nao usa molde: em dinheiro os centavos vem primeiro e a casa
 * anda para a esquerda a cada digito, o contrario de todo o resto.
 */
export function applyCurrencyMask(text: string): string {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
  if (!digits) return "";

  const cents = digits.padStart(3, "0");
  const whole = cents.slice(0, -2);
  const rest = cents.slice(-2);
  const withDot = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDot},${rest}`;
}

/**
 * O que separa um molde escrito na mao de um nome de molde digitado errado e
 * ter marca dentro: `99h99` e molde, `dinheiro` e `cnjp` nao sao. Sem esta
 * pergunta, o nome errado caia no molde literal e era escrito no campo -
 * quem digitava 248000 com `mask="dinheiro"` via "dinheiro" aparecer.
 */
function looksLikePattern(mask: string): boolean {
  return /[9A*]/.test(mask);
}

/** Aplica a mascara pedida, seja nome de molde, molde cru ou moeda. */
export function applyMask(text: string, mask: Mask): string {
  if (mask === "moeda") return applyCurrencyMask(text);

  // O telefone e o outro molde que depende do que ja foi digitado, e a decisao
  // mora aqui pelo mesmo motivo que a da moeda: fora daqui, ela vira contorno
  // que cada chamador precisa lembrar de repetir. O `MASKS.telefone` guarda um
  // molde so - o do celular -, entao `applyMask("8388112233", "telefone")`
  // devolvia "(83) 88112-233", com o fixo vestindo a pontuacao do celular.
  if (mask === "telefone") return applyPattern(text, phonePatternFor(text));

  const pattern = MASKS[mask as MaskName];
  if (pattern) return applyPattern(text, pattern);

  if (looksLikePattern(mask)) return applyPattern(text, mask);

  // Em producao o campo passa cru, que e menos pior do que escrever o nome do
  // molde no lugar do que a pessoa digitou. Em desenvolvimento o erro fala.
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[rivocode/ui] mask="${mask}" nao e um molde conhecido nem parece um molde. ` +
        `Os prontos sao: ${Object.keys(MASKS).join(", ")}, moeda. ` +
        `Molde escrito na mao usa 9 para digito, A para letra e * para os dois.`,
    );
  }
  return text;
}

/** Tira a pontuacao e devolve so o que o usuario digitou. */
export function unmask(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * O valor em centavos do campo de moeda, para mandar ao servidor sem passar
 * por ponto flutuante. `1.234,56` vira `123456`.
 */
export function toCents(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

/**
 * O telefone brasileiro tem oito ou nove casas depois do DDD, e o molde muda
 * no meio da digitacao. Sem isto, o fixo fica com a pontuacao do celular.
 *
 * O nome diz `patternFor`, e nao `mask`, porque o que volta e o MOLDE - para
 * entregar ao `applyMask` - e nao o texto pronto. As tres funcoes de mascara
 * tinham a assinatura `(text: string) => string`, entao quem chamasse esperando
 * o telefone formatado recebia `(99) 99999-9999` escrito no campo, sem que o
 * TypeScript pudesse acusar. `applyXMask` devolve texto; `patternFor` devolve
 * molde.
 */
export function phonePatternFor(text: string): Mask {
  return unmask(text).length > 10 ? "(99) 99999-9999" : "(99) 9999-9999";
}

/** @deprecated Use `phonePatternFor`: o que volta e molde, e nao texto. */
export const phoneMask = phonePatternFor;
