import { expect, test } from "bun:test";

import { formatDate, parseDate, applyDateMask } from "../src/lib/date";

test("formata a data no padrao brasileiro, com zero a esquerda", () => {
  expect(formatDate(new Date(2026, 2, 3))).toBe("03/03/2026");
  expect(formatDate(new Date(2026, 11, 25))).toBe("25/12/2026");
});

test("sem data, o campo fica vazio em vez de mostrar lixo", () => {
  expect(formatDate(undefined)).toBe("");
  expect(formatDate(new Date("nao e data"))).toBe("");
});

test("le a data completa", () => {
  const data = parseDate("03/03/2026")!;
  expect(data.getFullYear()).toBe(2026);
  expect(data.getMonth()).toBe(2);
  expect(data.getDate()).toBe(3);
});

test("texto incompleto ainda nao e data", () => {
  expect(parseDate("03/03")).toBeUndefined();
  expect(parseDate("03/03/20")).toBeUndefined();
  expect(parseDate("")).toBeUndefined();
});

test("dia que nao existe no mes nao vira o mes seguinte", () => {
  expect(parseDate("31/02/2026")).toBeUndefined();
  expect(parseDate("31/04/2026")).toBeUndefined();
  expect(parseDate("29/02/2024")).toBeDefined();
});

test("a mascara poe as barras enquanto se digita", () => {
  expect(applyDateMask("0")).toBe("0");
  expect(applyDateMask("03")).toBe("03");
  expect(applyDateMask("0303")).toBe("03/03");
  expect(applyDateMask("03032026")).toBe("03/03/2026");
});

test("a mascara ignora letra e para em oito digitos", () => {
  expect(applyDateMask("03a03b2026")).toBe("03/03/2026");
  expect(applyDateMask("030320261234")).toBe("03/03/2026");
});

test("apagar a barra apaga o numero junto, sem travar o campo", () => {
  expect(applyDateMask("03/03/202")).toBe("03/03/202");
  expect(applyDateMask("03/")).toBe("03");
});

test("a mascara de data se chama como a de moeda, porque faz a mesma coisa", () => {
  // As duas devolvem texto pronto, e tinham nomes de familias diferentes.
  // Agora sao a mesma familia: `applyXMask`.
  expect(applyDateMask("31122026")).toBe("31/12/2026");
  expect(applyDateMask("311")).toBe("31/1");
});
