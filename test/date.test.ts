import { expect, test } from "bun:test";

import { formatDate, parseDate, maskDate } from "../src/lib/date";

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
  expect(maskDate("0")).toBe("0");
  expect(maskDate("03")).toBe("03");
  expect(maskDate("0303")).toBe("03/03");
  expect(maskDate("03032026")).toBe("03/03/2026");
});

test("a mascara ignora letra e para em oito digitos", () => {
  expect(maskDate("03a03b2026")).toBe("03/03/2026");
  expect(maskDate("030320261234")).toBe("03/03/2026");
});

test("apagar a barra apaga o numero junto, sem travar o campo", () => {
  expect(maskDate("03/03/202")).toBe("03/03/202");
  expect(maskDate("03/")).toBe("03");
});
