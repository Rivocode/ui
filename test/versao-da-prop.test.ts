import { expect, test } from "bun:test";

/*
 * DOC-09: nenhuma pagina dizia em que versao a prop apareceu.
 *
 * Numa biblioteca pre-1.0 que ja trocou nome publico duas vezes, quem tem uma
 * versao velha instalada nao tem como saber se a prop que esta lendo existe
 * para ele - e descobre pelo erro de tipo, ou pior, pelo atributo solto no DOM.
 *
 * O marcador nao e escrito a mao: ele e carimbado no lancamento, sobre o que
 * ainda nao tem carimbo. Assim a primeira versao em que a prop aparece no
 * catalogo e a que fica registrada, e ninguem precisa lembrar de anotar.
 */

const catalog = await Bun.file("apps/docs/src/component-props.json").json();

test("a prop carimbada guarda a versao em que apareceu", () => {
  const button = catalog.Button.props.find((prop: { name: string }) => prop.name === "loading");

  expect(button.since).toBe("0.4.0");
});

test("a prop nova ainda nao tem carimbo, e e isso que o lancamento carimba", () => {
  // `classNames` nasceu nesta versao, que ainda nao saiu.
  const slider = catalog.Slider.props.find((prop: { name: string }) => prop.name === "classNames");

  expect(slider.since).toBeUndefined();
});
