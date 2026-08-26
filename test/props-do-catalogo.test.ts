import { expect, test } from "bun:test";

/*
 * As tabelas de props do site e dos .md que um agente le saem deste JSON, e o
 * JSON sai do compilador - nao de um snapshot de .d.ts escrito a mao.
 *
 * O defeito que estes testes guardam: o gerador antigo lia texto de um bundle
 * do 0.1.0 e perdia toda prop de callback, entao metade das pecas controladas
 * ficava documentada sem a metade que as controla. E 36 paginas diziam "nao tem
 * prop propria" tendo.
 */

const catalogo = await Bun.file("apps/docs/src/component-props.json").json();

const nomes = (peca: string) => (catalogo[peca]?.props ?? []).map((p: { name: string }) => p.name);

test("a peca controlada leva os callbacks que a controlam", () => {
  expect(nomes("Select")).toContain("onValueChange");
  expect(nomes("Select")).toContain("onOpenChange");
  expect(nomes("Dialog")).toContain("onOpenChange");
  expect(nomes("Checkbox")).toContain("onCheckedChange");
});

test("a peca cuja prop e a razao de existir nao aparece sem prop", () => {
  expect(nomes("Breadcrumb")).toEqual(expect.arrayContaining(["items", "maxItems"]));
  expect(nomes("Pagination")).toEqual(
    expect.arrayContaining(["page", "pageCount", "onPageChange", "siblings"]),
  );
  expect(nomes("Progress")).toEqual(expect.arrayContaining(["value", "label", "showValue"]));
  expect(nomes("MaskedInput")).toEqual(expect.arrayContaining(["mask", "onValueChange"]));
});

test("quem so repassa o elemento raiz continua sem prop propria", () => {
  // CardHeader e um <div> com classe: dizer "nao tem prop propria" ali e
  // verdade, e a tabela precisa saber a diferenca entre isso e um buraco.
  expect(nomes("CardHeader")).toEqual([]);
  expect(catalogo.CardHeader.forwardsRoot).toBe(true);
});

test("a prop obrigatoria vem antes da opcional", () => {
  const props = catalogo.DataTable.props as Array<{ name: string; required: boolean }>;
  const primeiraOpcional = props.findIndex((p) => !p.required);
  const ultimaObrigatoria = props.map((p) => p.required).lastIndexOf(true);

  expect(ultimaObrigatoria).toBeLessThan(primeiraOpcional);
});

test("a nota da prop vem do JSDoc, e nao de uma copia na doc", () => {
  const props = catalogo.DataTable.props as Array<{ name: string; note?: string }>;
  const rowKey = props.find((p) => p.name === "rowKey");

  expect(rowKey?.note).toContain("Identidade da linha");
});
