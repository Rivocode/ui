import { expect, test } from "bun:test";

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
