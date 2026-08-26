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

const TEMA = "src/tokens/themes/rivocode-dark.css";
const FORMA = "src/tokens/forma.css";
const GUIA = "apps/docs/src/content/temas.md";

const tema = readFileSync(TEMA, "utf8");
const forma = readFileSync(FORMA, "utf8");
const guia = readFileSync(GUIA, "utf8");

const declarados = (css: string) =>
  [...css.matchAll(/^\s+(--rc-[a-z0-9-]+):/gm)].map((achado) => achado[1]!);

const papeis = [...declarados(tema), ...declarados(forma)];

/**
 * O guia escreve familia por padrao: `--rc-<estado>-fg` cobre os quatro
 * estados, e `--rc-chart-1` a `--rc-chart-8` cobre as oito series. Expandir a
 * abreviacao aqui e mais honesto do que obrigar o texto a listar vinte e quatro
 * linhas quase iguais.
 */
function citado(papel: string) {
  if (guia.includes(papel)) return true;

  const state = /^--rc-(success|warning|danger|info)(-fg|-text|-subtle)?$/.exec(papel);
  if (state) return guia.includes(`--rc-<estado>${state[2] ?? ""}`);

  const serie = /^--rc-chart-([1-8])$/.exec(papel);
  if (serie) return guia.includes("--rc-chart-1` a `--rc-chart-8");

  const sombra = /^--rc-shadow-([1-3])$/.exec(papel);
  if (sombra) return guia.includes("--rc-shadow-1` a `--rc-shadow-3");

  const raio = /^--rc-radius-(sm|md|lg|xl)$/.exec(papel);
  if (raio) return guia.includes("--rc-radius-sm` a `--rc-radius-xl");

  return false;
}

const faltando = papeis.filter((papel) => !citado(papel));

if (faltando.length > 0) {
  console.error(`${faltando.length} token(s) que o tema pode declarar e fora do guia:\n`);
  for (const papel of faltando) console.error(`  ${papel}`);
  console.error(`\nDocumente em ${GUIA}, ou o guia passa a mentir em silencio.`);
  process.exit(1);
}

console.log(`${papeis.length} tokens de tema e forma, todos citados no guia.`);
