/**
 * Confere se o guia de temas cita tudo que um tema pode declarar, e mantem o
 * catalogo de papeis que o `rivocode-ui check-theme` leva no pacote.
 *
 * Sao duas listas. Os papeis de cor, em que faltar um deixa a peca com a cor
 * do tema anterior; e os tokens de forma - canto, duracao, curva, espacamento
 * de letra - que o tema tambem pode redefinir. Se alguem acrescentar um e nao
 * o citar no guia, o texto passa a mentir: no primeiro caso a mentira aparece
 * na tela de um cliente meses depois, como uma cor da RivoCode isolada no meio
 * da marca dele; no segundo ela e uma capacidade que ninguem descobre, que foi
 * o que aconteceu com o raio - sempre funcionou num seletor de tema, e o guia
 * desaconselhava por escrito.
 *
 * A checagem e do guia contra os tokens, e nao ao contrario: o token e a
 * verdade.
 *
 * ## Por que esta guarda tambem escreve um arquivo
 *
 * Porque ela roda do lado errado da fronteira. O `--rc-font-*` virou papel de
 * tema na 0.7.0, e um tema de cliente escrito para a 0.6.x passou a renderizar
 * sem familia de fonte nenhuma: `tsc` verde, build verde, tela errada. Esta
 * guarda pegaria, e ela mora no repositorio da biblioteca - o consumidor nunca
 * a roda. Quem roda no consumidor e o `rivocode-ui check-theme`, e para cobrar
 * papel faltando ele precisa da MESMA lista.
 *
 * Duas listas para a mesma pergunta significam que uma delas esta sempre
 * errada, e este repositorio ja pagou essa conta duas vezes (o catalogo de
 * pecas anunciou 55 tendo 83, e o vocabulario de acentos tinha vinte e duas
 * palavras ao lado de uma lista de duzentas e oitenta e uma). Entao a lista e
 * uma so: o CSS. Esta guarda a extrai e ESCREVE em `src/tokens/theme-roles.ts`,
 * que e codigo gerado, versionado e com cabecalho, como `native/tokens.ts` ja
 * e; `bun run gen:temas` regrava, e o `bun run check:temas` fica vermelho se o
 * comitado divergir da fonte. O CLI importa dali, e o tsdown o empacota dentro
 * de `dist/cli.js`.
 *
 * Por que o arquivo nao foi para `src/shared/`: ele passaria no criterio de
 * pureza e falharia na segunda metade dele, que e "tem que JA estar
 * duplicado". O espelho nativo levaria a lista para dentro do tarball que o
 * metro compila no aparelho de terceiro, para um comando de mesa que o React
 * Native nunca roda. O desenho esta em
 * `docs/2026-08-27-codigo-puro-compartilhado-design.md`.
 *
 * ## A terceira coisa que ela cobra
 *
 * Que todo papel obrigatorio tenha CONSEQUENCIA escrita em
 * `src/lib/theme-check.ts`. "Falta --rc-font-sans" nao conserta nada; "sem ele
 * a pagina inteira cai na fonte do navegador" conserta. Sem esta regra, o
 * papel novo entra na lista pela geracao automatica e chega ao consumidor com
 * uma mensagem vazia - a guarda ficaria verde exibindo o texto inutil.
 */
import { readFileSync } from "node:fs";

import { ARRIVED, OPTIONAL, effectOf, requiredRoles } from "../src/lib/theme-check";

const THEME_FILE = "src/tokens/themes/rivocode-dark.css";
const SHAPE_FILE = "src/tokens/forma.css";
const GUIDE_FILE = "apps/docs/src/content/temas.md";
const CATALOG_FILE = "src/tokens/theme-roles.ts";

const theme = readFileSync(THEME_FILE, "utf8");
const shape = readFileSync(SHAPE_FILE, "utf8");
const guide = readFileSync(GUIDE_FILE, "utf8");

/**
 * Sem repetido: a `@media (prefers-reduced-motion)` do `forma.css` redeclara
 * quatro duracoes, e o mesmo token contado duas vezes viraria linha dobrada no
 * catalogo que o CLI le.
 */
const declaredIn = (css: string) => [
  ...new Set([...css.matchAll(/^\s+(--rc-[a-z0-9-]+):/gm)].map((achado) => achado[1]!)),
];

const themeRoles = declaredIn(theme);
const shapeTokens = declaredIn(shape);
const roles = [...themeRoles, ...shapeTokens];

const list = (names: string[]) => names.map((name) => `  "${name}",\n`).join("");

const catalog =
  `/* Gerado de ${THEME_FILE} e ${SHAPE_FILE} por bun run gen:temas. Nao editar. */\n\n` +
  `export const THEME_ROLES = [\n${list(themeRoles)}] as const;\n\n` +
  `export const SHAPE_TOKENS = [\n${list(shapeTokens)}] as const;\n`;

const problems: string[] = [];

/**
 * O guia escreve familia por padrao: `--rc-<estado>-fg` cobre os quatro
 * estados, e `--rc-chart-1` a `--rc-chart-8` cobre as oito series. Expandir a
 * abreviacao aqui e mais honesto do que obrigar o texto a listar vinte e quatro
 * linhas quase iguais.
 */
function documented(role: string) {
  if (guide.includes(role)) return true;

  const state = /^--rc-(success|warning|danger|info)(-fg|-text|-subtle)?$/.exec(role);
  if (state) return guide.includes(`--rc-<estado>${state[2] ?? ""}`);

  const series = /^--rc-chart-([1-8])$/.exec(role);
  if (series) return guide.includes("--rc-chart-1` a `--rc-chart-8");

  const shadow = /^--rc-shadow-([1-3])$/.exec(role);
  if (shadow) return guide.includes("--rc-shadow-1` a `--rc-shadow-3");

  const radius = /^--rc-radius-(sm|md|lg|xl)$/.exec(role);
  if (radius) return guide.includes("--rc-radius-sm` a `--rc-radius-xl");

  return false;
}

const missing = roles.filter((role) => !documented(role));

if (missing.length > 0) {
  problems.push(
    `${missing.length} token(s) que o tema pode declarar e fora do guia:\n` +
      missing.map((role) => `    ${role}`).join("\n") +
      `\n\n    Documente em ${GUIDE_FILE}, ou o guia passa a mentir em silencio.`,
  );
}

const mute = requiredRoles(themeRoles).filter((role) => !effectOf(role));

if (mute.length > 0) {
  problems.push(
    `${mute.length} papel(is) obrigatorio(s) sem consequencia escrita:\n` +
      mute.map((role) => `    ${role}`).join("\n") +
      `\n\n    Escreva o que acontece NA TELA sem ele, em EFFECTS de\n` +
      `    src/lib/theme-check.ts, e diga se a quebra e calada ou visivel. E o\n` +
      `    texto que o \`rivocode-ui check-theme\` mostra para quem esqueceu o\n` +
      `    papel, e "falta tal token" nao faz ninguem consertar nada.`,
  );
}

const known = new Set(themeRoles);
const rotten = [...Object.keys(OPTIONAL), ...Object.keys(ARRIVED)].filter(
  (role) => !known.has(role),
);

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} papel(is) citado(s) em src/lib/theme-check.ts que o tema nao declara mais:\n` +
      rotten.map((role) => `    ${role}`).join("\n") +
      `\n\n    Apague de OPTIONAL ou de ARRIVED. Lista que nao encolhe vira o\n` +
      `    lugar onde o papel morto mora, e o CLI passa a falar de token que\n` +
      `    nao existe.`,
  );
}

if (process.argv.includes("--write")) {
  await Bun.write(CATALOG_FILE, catalog);
  console.log(
    `${themeRoles.length} papeis de tema e ${shapeTokens.length} tokens de forma escritos em ${CATALOG_FILE}.`,
  );
} else if (
  (await Bun.file(CATALOG_FILE)
    .text()
    .catch(() => undefined)) !== catalog
) {
  problems.unshift(
    `${CATALOG_FILE} divergiu de ${THEME_FILE}.\n` +
      `\n    Rode: bun run gen:temas\n` +
      `    E o arquivo que viaja no \`dist/cli.js\` e diz ao consumidor quais\n` +
      `    papeis um tema tem que declarar. Divergente, o comando que ele roda\n` +
      `    cobra a lista da versao passada.`,
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`${problem}\n`);
  process.exit(1);
}

console.log(
  `${roles.length} tokens de tema e forma, todos citados no guia. ` +
    `${requiredRoles(themeRoles).length} papeis obrigatorios, cada um com o que acontece na tela sem ele.`,
);
