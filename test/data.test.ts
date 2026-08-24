import { expect, test } from "bun:test";

import { formatarData, lerData, mascararData } from "../src/lib/data";

test("formata a data no padrao brasileiro, com zero a esquerda", () => {
  expect(formatarData(new Date(2026, 2, 3))).toBe("03/03/2026");
  expect(formatarData(new Date(2026, 11, 25))).toBe("25/12/2026");
});

test("sem data, o campo fica vazio em vez de mostrar lixo", () => {
  expect(formatarData(undefined)).toBe("");
  expect(formatarData(new Date("nao e data"))).toBe("");
});

test("le a data completa", () => {
  const data = lerData("03/03/2026")!;
  expect(data.getFullYear()).toBe(2026);
  expect(data.getMonth()).toBe(2);
  expect(data.getDate()).toBe(3);
});

test("texto incompleto ainda nao e data", () => {
  expect(lerData("03/03")).toBeUndefined();
  expect(lerData("03/03/20")).toBeUndefined();
  expect(lerData("")).toBeUndefined();
});

test("dia que nao existe no mes nao vira o mes seguinte", () => {
  expect(lerData("31/02/2026")).toBeUndefined();
  expect(lerData("31/04/2026")).toBeUndefined();
  expect(lerData("29/02/2024")).toBeDefined();
});

test("a mascara poe as barras enquanto se digita", () => {
  expect(mascararData("0")).toBe("0");
  expect(mascararData("03")).toBe("03");
  expect(mascararData("0303")).toBe("03/03");
  expect(mascararData("03032026")).toBe("03/03/2026");
});

test("a mascara ignora letra e para em oito digitos", () => {
  expect(mascararData("03a03b2026")).toBe("03/03/2026");
  expect(mascararData("030320261234")).toBe("03/03/2026");
});

test("apagar a barra apaga o numero junto, sem travar o campo", () => {
  expect(mascararData("03/03/202")).toBe("03/03/202");
  expect(mascararData("03/")).toBe("03");
});
