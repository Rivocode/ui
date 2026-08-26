import { expect, test } from "bun:test";

import {
  applyMask,
  applyCurrencyMask,
  applyPattern,
  toCents,
  phoneMask,
  phonePatternFor,
  unmask,
} from "../src/lib/mask";

test("o molde poe a pontuacao sozinho", () => {
  expect(applyMask("12345678901", "cpf")).toBe("123.456.789-01");
  expect(applyMask("12345678000199", "cnpj")).toBe("12.345.678/0001-99");
  expect(applyMask("58000000", "cep")).toBe("58000-000");
});

test("a mascara para no fim do molde em vez de embolar", () => {
  expect(applyMask("123456789012345", "cpf")).toBe("123.456.789-01");
});

test("letra nao entra onde o molde pede numero", () => {
  expect(applyMask("12a34", "cpf")).toBe("123.4");
});

test("o molde de letra sobe a caixa sozinho", () => {
  expect(applyMask("abc1d23", "placa")).toBe("ABC1D23");
});

test("texto ja pontuado nao duplica a pontuacao", () => {
  expect(applyMask("123.456.789-01", "cpf")).toBe("123.456.789-01");
});

test("apagar devolve o campo pela metade, sem travar", () => {
  expect(applyMask("123.456", "cpf")).toBe("123.456");
  expect(applyMask("123.", "cpf")).toBe("123.");
  expect(applyMask("", "cpf")).toBe("");
});

test("molde escrito na mao tambem vale", () => {
  expect(applyPattern("123456", "99-99-99")).toBe("12-34-56");
});

test("o dinheiro enche da direita para a esquerda", () => {
  expect(applyCurrencyMask("1")).toBe("0,01");
  expect(applyCurrencyMask("123")).toBe("1,23");
  expect(applyCurrencyMask("123456")).toBe("1.234,56");
  expect(applyCurrencyMask("")).toBe("");
});

test("o dinheiro nao guarda zero a esquerda", () => {
  expect(applyCurrencyMask("000123")).toBe("1,23");
});

test("o valor sai em centavos, sem passar por ponto flutuante", () => {
  expect(toCents("1.234,56")).toBe(123456);
  expect(toCents("")).toBe(0);
});

test("o telefone troca de molde entre o fixo e o celular", () => {
  expect(phoneMask("8332211234")).toBe("(99) 9999-9999");
  expect(phoneMask("83988112233")).toBe("(99) 99999-9999");
  expect(applyPattern("8332211234", phoneMask("8332211234"))).toBe("(83) 3221-1234");
  expect(applyPattern("83988112233", phoneMask("83988112233"))).toBe("(83) 98811-2233");
});

test("sem mascara sobra so o que foi digitado", () => {
  expect(unmask("123.456.789-01")).toBe("12345678901");
  expect(unmask("(83) 98811-2233")).toBe("83988112233");
});

test("molde que nao existe nao vira o proprio valor do campo", () => {
  // "dinheiro" e o nome que o JSDoc do MaskedInput anunciava, e "cnjp" e o
  // erro de digitacao de todo dia. Os dois eram escritos no campo: quem
  // digitava 248000 via "dinheiro" aparecer no lugar do numero.
  expect(applyMask("248000", "dinheiro")).toBe("248000");
  expect(applyMask("12345678901", "cnjp")).toBe("12345678901");
});

test("molde escrito na mao com letra literal continua valendo", () => {
  // O que separa molde de nome errado e ter marca dentro - 9, A ou *. Um
  // molde com letra solta no meio ainda e molde.
  expect(applyMask("1430", "99h99")).toBe("14h30");
});

test("o nome diz a natureza do que volta, e nao so o assunto", () => {
  // As tres tinham a mesma assinatura `(text: string) => string`, e uma
  // devolvia coisa de outra natureza: molde, e nao texto pronto. Quem
  // chamava `phoneMask` esperando o telefone formatado recebia o molde
  // literal, e o TypeScript nao tinha como acusar - as assinaturas eram
  // identicas. `applyX` entrega texto; `patternFor` entrega molde.
  expect(phonePatternFor("11987654321")).toBe("(99) 99999-9999");
  expect(phonePatternFor("1132654321")).toBe("(99) 9999-9999");
  expect(applyCurrencyMask("123456")).toBe("1.234,56");
});

test("o nome antigo continua valendo, para quem ja instalou a 0.5.0", () => {
  // Renomear sem deixar o apelido quebraria quem atualizou ontem, e por um
  // motivo que nao muda comportamento nenhum.
  expect(phoneMask("11987654321")).toBe(phonePatternFor("11987654321"));
});
