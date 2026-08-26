/**
 * Confere se o guia de temas cita tudo que um tema pode declarar.
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
 */
import { readFileSync } from "node:fs";

const THEME_FILE = "src/tokens/themes/rivocode-dark.css";
const SHAPE_FILE = "src/tokens/forma.css";
const GUIDE_FILE = "apps/docs/src/content/temas.md";

const theme = readFileSync(THEME_FILE, "utf8");
const shape = readFileSync(SHAPE_FILE, "utf8");
const guide = readFileSync(GUIDE_FILE, "utf8");

const declaredIn = (css: string) =>
  [...css.matchAll(/^\s+(--rc-[a-z0-9-]+):/gm)].map((achado) => achado[1]!);

const roles = [...declaredIn(theme), ...declaredIn(shape)];

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
  console.error(`${missing.length} token(s) que o tema pode declarar e fora do guia:\n`);
  for (const role of missing) console.error(`  ${role}`);
  console.error(`\nDocumente em ${GUIDE_FILE}, ou o guia passa a mentir em silencio.`);
  process.exit(1);
}

console.log(`${roles.length} tokens de tema e forma, todos citados no guia.`);
