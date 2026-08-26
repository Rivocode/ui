/* ---------------------------------------------------------------------------
 * Formatadores: eixo, tooltip, e todo numero que uma tela imprime.
 *
 * Todo painel brasileiro repete os mesmos quatro: moeda, porcentagem, numero
 * abreviado e mes curto. Sem eles cada tela escreve o proprio `tickFormatter`,
 * e o eixo de uma pagina le diferente do eixo da seguinte: R$ 12.400 aqui,
 * 12400 ali, 12,4k na terceira.
 *
 * O `Intl` faz o trabalho pesado; o que mora aqui e a escolha de como um numero
 * fica num eixo, que nao e como ele fica numa frase: no eixo o espaco e curto e
 * a precisao atrapalha.
 * ------------------------------------------------------------------------- */

const LOCALE = "pt-BR";

/** Guarda cada `Intl` montado: instanciar por tick sai caro num eixo. */
const cache = new Map<string, Intl.NumberFormat>();

function numberFormat(options: Intl.NumberFormatOptions) {
  const key = JSON.stringify(options);
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, options);
    cache.set(key, formatter);
  }
  return formatter;
}

/**
 * `R$ 2.480,00`. Num eixo prefira `currencyShort`: centavo em tick so ocupa
 * largura, e eixo se le por ordem de grandeza.
 */
export function currency(value: number) {
  return numberFormat({ style: "currency", currency: "BRL" }).format(value);
}

/**
 * As duas maneiras de abreviar uma grandeza.
 *
 * `K` e a convencao de painel, e cabe em menos pixel, que num eixo e o que
 * decide. `mil` e o que a lingua escreve, e le melhor num paragrafo. Nenhuma
 * das duas e errada; misturar as duas na mesma tela e.
 */
const SUFFIXES = {
  symbol: { billion: "B", million: "M", thousand: "K", tight: true },
  word: { billion: "bi", million: "mi", thousand: "mil", tight: false },
} as const;

function abbreviate(value: number, shape: keyof typeof SUFFIXES) {
  const { billion, million, thousand, tight } = SUFFIXES[shape];
  const size = Math.abs(value);
  const space = tight ? "" : " ";

  const write = (divided: number, suffix: string) =>
    `${numberFormat({ maximumFractionDigits: 1 }).format(divided)}${space}${suffix}`;

  if (size >= 1_000_000_000) return write(value / 1_000_000_000, billion);
  if (size >= 1_000_000) return write(value / 1_000_000, million);
  if (size >= 1_000) return write(value / 1_000, thousand);

  return numberFormat({ maximumFractionDigits: 0 }).format(value);
}

/** `12,4K`, `1,2M`, `340`. */
export function compact(value: number) {
  return abbreviate(value, "symbol");
}

/**
 * `12,4 mil`, `1,2 mi`, `340`.
 *
 * A forma por extenso. Prefira em texto corrido, onde ela le melhor; num eixo
 * ela custa o dobro da largura, e largura de eixo e espaco tirado do grafico.
 */
export function compactWords(value: number) {
  return abbreviate(value, "word");
}

/** `R$ 2,5K`, `R$ 1,2M`. O que cabe num eixo. */
export function currencyShort(value: number) {
  return `R$ ${compact(value)}`;
}

/** `R$ 2,5 mil`, `R$ 1,2 mi`. A mesma coisa, por extenso. */
export function currencyShortWords(value: number) {
  return `R$ ${compactWords(value)}`;
}

/** `1.240`, separador de milhar, sem decimal. */
export function integer(value: number) {
  return numberFormat({ maximumFractionDigits: 0 }).format(value);
}

/**
 * `62%`. Recebe o numero como ele esta no dado: `62` vira `62%`.
 *
 * Se o dado vem como fracao, multiplique antes; a alternativa seria o
 * formatador adivinhar pela grandeza, e adivinhar erra o 0,8.
 */
export function percent(value: number, digits = 0) {
  return `${numberFormat({ maximumFractionDigits: digits }).format(value)}%`;
}

/**
 * `2026-08-05` e `2026-08` sao dia do calendario, e nao instante.
 *
 * O `new Date` le a string sem hora como meia-noite em UTC e depois o `Intl`
 * imprime no fuso da tela: em fuso negativo, que e o do pais inteiro, isso
 * volta um dia - e quando o dia e o primeiro do mes, volta o mes junto.
 * Entao a data sem hora e montada como data local, do mesmo jeito que o
 * `parseDate` do nucleo faz. Quem passa hora, ou um `Date`, esta falando de
 * instante, e instante continua sendo lido no fuso local.
 */
const CALENDAR_DAY = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;

function toDate(date: Date | string | number) {
  if (date instanceof Date) return date;
  if (typeof date === "string") {
    const parts = CALENDAR_DAY.exec(date.trim());
    if (parts) {
      return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3] ?? "1"));
    }
  }
  return new Date(date);
}

/** `mar`, `abr`. O eixo de tempo mais comum num painel mensal. */
export function monthShort(date: Date | string | number) {
  return new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(toDate(date)).replace(".", "");
}

/** `12/03`. Para serie diaria, onde o ano e o mesmo do primeiro ao ultimo. */
export function dayMonth(date: Date | string | number) {
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit" }).format(toDate(date));
}

export const formatters = {
  currency,
  currencyShort,
  currencyShortWords,
  compact,
  compactWords,
  integer,
  percent,
  monthShort,
  dayMonth,
} as const;

/** O nome de um formatador da casa, para quem prefere passar uma string. */
export type FormatName = keyof typeof formatters;

/** Recebe o nome de um formatador da casa ou uma funcao propria. */
export type Format = FormatName | ((value: never) => string);

export function resolveFormat(format: Format | undefined) {
  if (!format) return undefined;
  if (typeof format === "function") return format as (value: unknown) => string;
  return formatters[format] as (value: unknown) => string;
}
