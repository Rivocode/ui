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

test("a prop que nasceu nesta versao carrega esta versao", () => {
  // `classNames` nasceu no 0.5.0, e o carimbo do lancamento a alcancou. O que
  // este teste guarda e a diferenca entre as duas: uma prop antiga nao pode
  // ser recarimbada com a versao de hoje, senao o marcador vira ruido.
  const slider = catalog.Slider.props.find((prop: { name: string }) => prop.name === "classNames");

  expect(slider.since).toBe("0.5.0");
});

test("toda prop carimbada aponta para uma versao que o CHANGELOG conta", async () => {
  const changelog = await Bun.file("CHANGELOG.md").text();
  const versions = new Set(
    Object.values<any>(catalog).flatMap((piece) =>
      piece.props.map((prop: { since?: string }) => prop.since).filter(Boolean),
    ),
  );

  expect(versions.size).toBeGreaterThan(1);
  for (const version of versions) {
    expect(`${version} no CHANGELOG: ${changelog.includes(`## ${version}`)}`).toBe(
      `${version} no CHANGELOG: true`,
    );
  }
});
