/**
 * Mascara de digitacao guiada por molde.
 *
 * O molde usa `9` para digito, `A` para letra e `*` para os dois. Todo o
 * resto e literal e a mascara poe sozinha: `999.999.999-99` produz
 * `123.456.789-01`.
 *
 * A regra que segura tudo: a mascara nunca guarda o que nao cabe. Digitar
 * demais para no ultimo espaco em vez de embolar o campo, e apagar tira o
 * caractere de verdade junto com a pontuacao dele.
 */

export const MOLDES = {
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

export type NomeDeMolde = keyof typeof MOLDES;

/** Nome de molde pronto, molde escrito na mao, ou `moeda`. */
export type Mascara = NomeDeMolde | "moeda" | (string & {});

function combina(caractere: string, marca: string): boolean {
  if (marca === "9") return /\d/.test(caractere);
  if (marca === "A") return /[a-zA-Z]/.test(caractere);
  if (marca === "*") return /[a-zA-Z0-9]/.test(caractere);
  return false;
}

const MARCAS = new Set(["9", "A", "*"]);

/** Aplica o molde. O texto pode vir cru ou ja pontuado. */
export function aplicarMolde(texto: string, molde: string): string {
  let saida = "";
  let posicao = 0;

  for (const caractere of texto) {
    while (posicao < molde.length && !MARCAS.has(molde[posicao]!)) {
      saida += molde[posicao];
      posicao += 1;
    }
    if (posicao >= molde.length) break;

    if (combina(caractere, molde[posicao]!)) {
      saida += molde[posicao] === "A" ? caractere.toUpperCase() : caractere;
      posicao += 1;
    }
  }

  return saida;
}

/**
 * Dinheiro em real, preenchido da direita para a esquerda.
 *
 * E o unico que nao usa molde: em dinheiro os centavos vem primeiro e a casa
 * anda para a esquerda a cada digito, o contrario de todo o resto.
 */
export function aplicarMoeda(texto: string): string {
  const digitos = texto.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
  if (!digitos) return "";

  const centavos = digitos.padStart(3, "0");
  const inteiro = centavos.slice(0, -2);
  const resto = centavos.slice(-2);
  const comPonto = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${comPonto},${resto}`;
}

/** Aplica a mascara pedida, seja nome de molde, molde cru ou moeda. */
export function aplicarMascara(texto: string, mascara: Mascara): string {
  if (mascara === "moeda") return aplicarMoeda(texto);
  const molde = MOLDES[mascara as NomeDeMolde] ?? mascara;
  return aplicarMolde(texto, molde);
}

/** Tira a pontuacao e devolve so o que o usuario digitou. */
export function semMascara(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * O valor em centavos do campo de moeda, para mandar ao servidor sem passar
 * por ponto flutuante. `1.234,56` vira `123456`.
 */
export function emCentavos(texto: string): number {
  const digitos = texto.replace(/\D/g, "");
  return digitos ? Number(digitos) : 0;
}

/**
 * O telefone brasileiro tem oito ou nove casas depois do DDD, e o molde muda
 * no meio da digitacao. Sem isto, o fixo fica com a pontuacao do celular.
 */
export function moldeDeTelefone(texto: string): string {
  return semMascara(texto).length > 10 ? "(99) 99999-9999" : "(99) 9999-9999";
}
