import { expect, test } from "bun:test";

import {
  aplicarMascara,
  aplicarMoeda,
  aplicarMolde,
  emCentavos,
  moldeDeTelefone,
  semMascara,
} from "../src/lib/mascara";

test("o molde poe a pontuacao sozinho", () => {
  expect(aplicarMascara("12345678901", "cpf")).toBe("123.456.789-01");
  expect(aplicarMascara("12345678000199", "cnpj")).toBe("12.345.678/0001-99");
  expect(aplicarMascara("58000000", "cep")).toBe("58000-000");
});

test("a mascara para no fim do molde em vez de embolar", () => {
  expect(aplicarMascara("123456789012345", "cpf")).toBe("123.456.789-01");
});

test("letra nao entra onde o molde pede numero", () => {
  expect(aplicarMascara("12a34", "cpf")).toBe("123.4");
});

test("o molde de letra sobe a caixa sozinho", () => {
  expect(aplicarMascara("abc1d23", "placa")).toBe("ABC1D23");
});

test("texto ja pontuado nao duplica a pontuacao", () => {
  expect(aplicarMascara("123.456.789-01", "cpf")).toBe("123.456.789-01");
});

test("apagar devolve o campo pela metade, sem travar", () => {
  expect(aplicarMascara("123.456", "cpf")).toBe("123.456");
  expect(aplicarMascara("123.", "cpf")).toBe("123.");
  expect(aplicarMascara("", "cpf")).toBe("");
});

test("molde escrito na mao tambem vale", () => {
  expect(aplicarMolde("123456", "99-99-99")).toBe("12-34-56");
});

test("o dinheiro enche da direita para a esquerda", () => {
  expect(aplicarMoeda("1")).toBe("0,01");
  expect(aplicarMoeda("123")).toBe("1,23");
  expect(aplicarMoeda("123456")).toBe("1.234,56");
  expect(aplicarMoeda("")).toBe("");
});

test("o dinheiro nao guarda zero a esquerda", () => {
  expect(aplicarMoeda("000123")).toBe("1,23");
});

test("o valor sai em centavos, sem passar por ponto flutuante", () => {
  expect(emCentavos("1.234,56")).toBe(123456);
  expect(emCentavos("")).toBe(0);
});

test("o telefone troca de molde entre o fixo e o celular", () => {
  expect(moldeDeTelefone("8332211234")).toBe("(99) 9999-9999");
  expect(moldeDeTelefone("83988112233")).toBe("(99) 99999-9999");
  expect(aplicarMolde("8332211234", moldeDeTelefone("8332211234"))).toBe("(83) 3221-1234");
  expect(aplicarMolde("83988112233", moldeDeTelefone("83988112233"))).toBe("(83) 98811-2233");
});

test("sem mascara sobra so o que foi digitado", () => {
  expect(semMascara("123.456.789-01")).toBe("12345678901");
  expect(semMascara("(83) 98811-2233")).toBe("83988112233");
});
