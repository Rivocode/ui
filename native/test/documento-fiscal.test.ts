import { expect, test } from "bun:test";

import {
  isValidCnh,
  isValidCnpj,
  isValidCpf,
  isValidPis,
  isValidPlate,
  isValidRenavam,
  isValidVoterId,
} from "../src";

test("o nativo confere cpf e cnpj alfanumerico pela mesma conta do web", () => {
  expect(isValidCpf("529.982.247-25")).toBe(true);
  expect(isValidCpf("529.982.247-24")).toBe(false);
  expect(isValidCnpj("12ABC34501DE35")).toBe(true);
  expect(isValidCnpj("12ABC34501DF35")).toBe(false);
});

test("o nativo confere cnh, titulo, pis, renavam e placa pela mesma conta do web", () => {
  expect(isValidCnh("02650306461")).toBe(true);
  expect(isValidCnh("02650306462")).toBe(false);
  expect(isValidVoterId("0043 5687 0906")).toBe(true);
  expect(isValidVoterId("004356870907")).toBe(false);
  expect(isValidPis("120.56874.10-7")).toBe(true);
  expect(isValidPis("120.56874.10-8")).toBe(false);
  expect(isValidRenavam("639884962")).toBe(true);
  expect(isValidRenavam("00639884963")).toBe(false);
  expect(isValidPlate("BRA2E19")).toBe(true);
  expect(isValidPlate("ABC12D3")).toBe(false);
});
