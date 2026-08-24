import { expect, test } from "bun:test";

import { contrastRatio, readTokens } from "../scripts/check-contrast";

test("branco sobre preto da o maximo de 21 para 1", () => {
  expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
});

test("a lima sobre o fundo escuro da 15,06 para 1", () => {
  expect(contrastRatio("#d4f34a", "#0f1113")).toBeCloseTo(15.06, 1);
});

test("a cor de texto desabilitado fica abaixo do minimo", () => {
  expect(contrastRatio("#6c737b", "#0f1113")).toBeLessThan(4.5);
});

test("resolve um token de tema que aponta para a paleta", () => {
  const tokens = readTokens(
    ":root { --rc-p-lima-500: #d4f34a; }\n" +
      "[data-rc-theme='x'] { --rc-accent: var(--rc-p-lima-500); }",
  );
  expect(tokens["--rc-accent"]).toBe("#d4f34a");
});

test("a ordem das cores nao muda a razao", () => {
  expect(contrastRatio("#d4f34a", "#0f1113")).toBeCloseTo(contrastRatio("#0f1113", "#d4f34a"), 5);
});
