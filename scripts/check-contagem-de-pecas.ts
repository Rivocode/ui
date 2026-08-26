/**
 * Guarda dos numeros de peca escritos a mao fora do site.
 *
 * O site nao erra: a home, o catalogo e o llms.txt leem `ENTRIES` em tempo de
 * build. Erram os textos que ninguem gera - o README, que abria o catalogo com
 * "Cinquenta e cinco pecas" quando ja eram oitenta e tres, e a `description`
 * do package.json, que anunciava sessenta e cinco no proprio registro do npm.
 * Os dois sao a primeira coisa que alguem le antes de instalar, e os dois
 * envelheceram calados porque numero errado nao quebra build.
 *
 * A skill ja tinha guarda desde cedo (`test/indice.test.ts`), e foi por isso
 * que ela ficou certa enquanto estes dois derraparam trinta pecas. Esta guarda
 * so estende a mesma ideia aos dois lugares que faltavam.
 *
 * A contagem sai de onde o site tira a dele: os documentos de
 * `.design-sync/docs/`, menos as partes. Parte nao e peca - `CardHeader` mora
 * na pagina do `Card` -, e quem conta arquivo em vez de peca chega a cento e
 * cinquenta e oito.
 */
import { readdirSync } from "node:fs";

import { findParent } from "../apps/docs/src/parts";

const README = "README.md";
const PACKAGE = "package.json";

const names = readdirSync(".design-sync/docs")
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.replace(/\.md$/, ""));

const pieces = names.filter((name) => !findParent(name, names)).length;

const problems: string[] = [];

/*
 * Em digito, e nao por extenso.
 *
 * "Oitenta e tres pecas" leria melhor no meio da prosa do README, mas nenhuma
 * guarda consegue conferir isso sem carregar uma tabela de numeral escrito -
 * e a guarda que nao confere e a que deixou o numero envelhecer ate aqui.
 */
const readme = await Bun.file(README).text();
const declared = /^(\d+) peças\./m.exec(readme);

if (!declared) {
  problems.push(
    `${README}: nao achei a linha que abre o catalogo, no formato "<numero> peças.".\n` +
      `    Sem ela esta guarda para de conferir sem reclamar.`,
  );
} else if (Number(declared[1]) !== pieces) {
  problems.push(`${README}: diz ${declared[1]} peças, e o catalogo tem ${pieces}.`);
}

const description = (await Bun.file(PACKAGE).json()).description as string;
const inPackage = /(\d+) componentes/.exec(description);

if (!inPackage) {
  problems.push(
    `${PACKAGE}: a description nao diz "<numero> componentes".\n` +
      `    Ela e o texto que o npm mostra na busca; se mudar de forma, ajuste a guarda junto.`,
  );
} else if (Number(inPackage[1]) !== pieces) {
  problems.push(
    `${PACKAGE}: a description diz ${inPackage[1]} componentes, e o catalogo tem ${pieces}.`,
  );
}

if (problems.length) {
  console.error("Numero de pecas errado fora do site:\n");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nO catalogo e a fonte, e ele muda toda vez que uma peca entra. Regrave os\n" +
      "dois lugares acima, que sao os unicos escritos a mao.",
  );
  process.exit(1);
}

console.log(`${pieces} pecas, e e o que o README e o package.json anunciam.`);
