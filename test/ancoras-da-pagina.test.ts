import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";

import { anchor } from "../apps/docs/src/anchor";
import { findParent } from "../apps/docs/src/parts";
import { renderMarkdown } from "../apps/docs/src/render-markdown";

/*
 * Uma pagina, um id por secao.
 *
 * O indice da direita e montado lendo os `h2[id]` da pagina, e o React
 * identifica cada linha dele pelo id. Dois titulos iguais na mesma pagina
 * viravam duas chaves iguais, e a lista parava de se reconciliar: a peca que
 * repetia o titulo deixava linhas orfas no indice, que sobreviviam a
 * navegacao e se acumulavam nas pecas seguintes ate a pagina ser recarregada.
 *
 * `Button` era a peca que disparava: o doc dela e o do `ButtonGroup`, mostrado
 * na mesma pagina, escrevem os dois `## No React Native`. O endereco `#`
 * tambem so podia levar a um dos dois.
 */

const ROOT = ".design-sync";

const names = readdirSync(`${ROOT}/docs`)
  .filter((arquivo) => arquivo.endsWith(".md"))
  .map((arquivo) => arquivo.replace(/\.md$/, ""));

const bodyOf = async (name: string) => {
  const raw = await Bun.file(`${ROOT}/docs/${name}.md`).text();
  // Fora o frontmatter e o `# Nome`, que a pagina imprime por conta dela.
  return raw.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/^\s*#\s+\S.*\n+/, "");
};

const idsOf = (html: string) => [...html.matchAll(/<h\d id="([^"]+)"/g)].map((match) => match[1]);

test("dois titulos iguais no mesmo documento nao disputam o mesmo id", () => {
  const html = renderMarkdown("## Quando usar\n\ntexto\n\n## Quando usar\n");

  expect(idsOf(html)).toEqual(["quando-usar", "quando-usar-2"]);
});

test("o documento de uma parte assina o id com o nome da parte", () => {
  const html = renderMarkdown("## No React Native\n", { idPrefix: "button-group" });

  expect(idsOf(html)).toEqual(["button-group-no-react-native"]);
});

test("o titulo de uma parte desce um nivel, porque mora dentro do h3 dela", () => {
  const html = renderMarkdown("## No React Native\n", { headingOffset: 2 });

  expect(html).toContain("<h4 ");
});

test("sem a assinatura, a pagina de Button escreveria o mesmo id duas vezes", async () => {
  // O caso que quebrou, guardado: os dois docs que a pagina de `Button`
  // mostra escrevem `## No React Native`, e sem prefixo os dois pedem o
  // mesmo endereco.
  const button = idsOf(renderMarkdown(await bodyOf("Button")));
  const group = idsOf(renderMarkdown(await bodyOf("ButtonGroup")));

  expect(button.filter((id) => group.includes(id))).toEqual(["no-react-native"]);
});

test("nenhuma pagina de peca repete um id de heading", async () => {
  const repetidos: string[] = [];

  expect(names.length).toBeGreaterThan(150);

  for (const name of names) {
    if (findParent(name, names)) continue;

    const parts = names.filter((other) => findParent(other, names) === name);
    const ids = [
      // As secoes que a pagina escreve por conta dela.
      "quando-usar",
      ...idsOf(renderMarkdown(await bodyOf(name))),
      "api",
      ...(parts.length ? ["partes"] : []),
      ...(
        await Promise.all(
          parts.map(async (part) => [
            anchor(part),
            ...idsOf(
              renderMarkdown(await bodyOf(part), {
                idPrefix: anchor(part),
                headingOffset: 2,
              }),
            ),
          ]),
        )
      ).flat(),
    ];

    const vistos = new Set<string>();
    for (const id of ids) {
      if (vistos.has(id)) repetidos.push(`${name}#${id}`);
      vistos.add(id);
    }
  }

  expect(repetidos).toEqual([]);
});
