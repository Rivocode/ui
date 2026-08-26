import { afterAll, beforeAll, expect, test } from "bun:test";

import {
  compact,
  compactWords,
  currency,
  currencyShort,
  dayMonth,
  integer,
  monthShort,
  percent,
} from "../src/chart/format";

test("o real sai no formato do pais, com centavo", () => {
  // O separador do Intl e um espaco estreito, e nao o espaco comum.
  expect(currency(2480).replace(/ /g, " ")).toBe("R$ 2.480,00");
});

test("o eixo abrevia a grandeza, porque tick nao tem largura para centavo", () => {
  expect(compact(340)).toBe("340");
  expect(compact(12_400)).toBe("12,4K");
  expect(compact(1_200_000)).toBe("1,2M");
  expect(compact(3_000_000_000)).toBe("3B");
  expect(currencyShort(12_400)).toBe("R$ 12,4K");
});

test("a forma por extenso existe para texto corrido, onde ela le melhor", () => {
  expect(compactWords(12_400)).toBe("12,4 mil");
  expect(compactWords(1_200_000)).toBe("1,2 mi");
  expect(compactWords(3_000_000_000)).toBe("3 bi");
});

test("o negativo abrevia pelo tamanho, e nao pelo sinal", () => {
  expect(compact(-12_400)).toBe("-12,4K");
  expect(compactWords(-12_400)).toBe("-12,4 mil");
});

test("o integer separa milhar e nao inventa decimal", () => {
  expect(integer(1240)).toBe("1.240");
  expect(integer(1240.7)).toBe("1.241");
});

test("a percent le o numero como ele vem no dado", () => {
  expect(percent(62)).toBe("62%");
  expect(percent(62.48, 1)).toBe("62,5%");
});

test("o mes compact sai sem o ponto que o locale poe", () => {
  expect(monthShort(new Date(2026, 2, 15))).toBe("mar");
  expect(dayMonth(new Date(2026, 2, 5))).toBe("05/03");
});

/* ---------------------------------------------------------------------------
 * A data sem hora e um dia do calendario, e nao um instante.
 *
 * O fuso fica cravado aqui porque o CI roda em UTC, onde o defeito nao
 * aparece: `new Date("2026-08-05")` so volta um dia em fuso negativo, que e
 * onde o pais inteiro esta.
 * ------------------------------------------------------------------------- */

const fusoOriginal = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});
afterAll(() => {
  process.env.TZ = fusoOriginal;
});

test("a data sem hora nao volta um dia no fuso do pais", () => {
  expect(dayMonth("2026-08-05")).toBe("05/08");
  expect(monthShort("2026-03-10")).toBe("mar");
});

test("o primeiro dia do mes nao cai no mes anterior", () => {
  expect(dayMonth("2026-01-01")).toBe("01/01");
  expect(monthShort("2026-01")).toBe("jan");
  expect(monthShort("2026-03")).toBe("mar");
});

test("o instante com hora continua sendo lido no fuso local", () => {
  // A guarda contra o conserto ingenuo, que e cravar `timeZone: "UTC"` na
  // formatacao: 01h de 6 em UTC ainda e dia 5 as 22h em Sao Paulo, e e o dia
  // 5 que a pessoa viu acontecer.
  expect(dayMonth("2026-08-06T01:00:00Z")).toBe("05/08");
  expect(monthShort("2026-04-01T02:00:00Z")).toBe("mar");
  expect(dayMonth(new Date(2026, 7, 5))).toBe("05/08");
});
