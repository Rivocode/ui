import { expect, test } from "bun:test";

import { isValidCnpj, isValidCpf } from "../src";

test("o nativo confere cpf e cnpj alfanumerico pela mesma conta do web", () => {
  expect(isValidCpf("529.982.247-25")).toBe(true);
  expect(isValidCpf("529.982.247-24")).toBe(false);
  expect(isValidCnpj("12ABC34501DE35")).toBe(true);
  expect(isValidCnpj("12ABC34501DF35")).toBe(false);
});
