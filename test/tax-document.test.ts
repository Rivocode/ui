import { expect, test } from "bun:test";

import { isValidCnpj, isValidCpf } from "../src/index";

test("o cpf confere os dois verificadores, com ou sem pontuacao", () => {
  expect(isValidCpf("529.982.247-25")).toBe(true);
  expect(isValidCpf("52998224725")).toBe(true);
  expect(isValidCpf("529.982.247-24")).toBe(false);
  expect(isValidCpf("529.982.247-15")).toBe(false);
});

test("o cpf recusa tamanho errado, letra e sequencia repetida", () => {
  expect(isValidCpf("5299822472")).toBe(false);
  expect(isValidCpf("5299822472A")).toBe(false);
  expect(isValidCpf("111.111.111-11")).toBe(false);
  expect(isValidCpf("")).toBe(false);
});

test("o cnpj numerico continua valendo", () => {
  expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  expect(isValidCnpj("11222333000181")).toBe(true);
  expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
});

test("o cnpj alfanumerico confere pela tabela da Receita, em qualquer caixa", () => {
  expect(isValidCnpj("12.ABC.345/01DE-35")).toBe(true);
  expect(isValidCnpj("00.000.000/E08G-12")).toBe(true);
  expect(isValidCnpj("12.abc.345/01de-35")).toBe(true);
  expect(isValidCnpj("12.ABC.345/01DF-35")).toBe(false);
});

test("o cnpj recusa letra no verificador, tamanho errado e sequencia repetida", () => {
  expect(isValidCnpj("12ABC34501DE3A")).toBe(false);
  expect(isValidCnpj("12ABC34501DE3")).toBe(false);
  expect(isValidCnpj("00000000000000")).toBe(false);
});
