/**
 * Confere se o guia de temas cita todos os papeis que um tema precisa declarar.
 *
 * O guia lista cinquenta tokens e diz que faltar um deixa a peca com a cor do
 * tema anterior. Se alguem acrescentar um papel novo ao tema e nao ao guia, o
 * texto passa a mentir, e a mentira so aparece na tela de um cliente meses
 * depois, como uma cor da RivoCode isolada no meio da marca dele.
 *
 * A checagem e do guia contra o tema, e nao ao contrario: o tema e a verdade.
 */
import { readFileSync } from "node:fs";

const TEMA = "src/tokens/themes/rivocode-dark.css";
const GUIA = "apps/docs/src/content/temas.md";

const tema = readFileSync(TEMA, "utf8");
const guia = readFileSync(GUIA, "utf8");

const papeis = [...tema.matchAll(/^\s+(--rc-[a-z0-9-]+):/gm)].map((achado) => achado[1]);

/**
 * O guia escreve familia por padrao: `--rc-<estado>-fg` cobre os quatro
 * estados, e `--rc-chart-1` a `--rc-chart-8` cobre as oito series. Expandir a
 * abreviacao aqui e mais honesto do que obrigar o texto a listar vinte e quatro
 * linhas quase iguais.
 */
function citado(papel: string) {
  if (guia.includes(papel)) return true;

  const estado = /^--rc-(success|warning|danger|info)(-fg|-text|-subtle)?$/.exec(papel);
  if (estado) return guia.includes(`--rc-<estado>${estado[2] ?? ""}`);

  const serie = /^--rc-chart-([1-8])$/.exec(papel);
  if (serie) return guia.includes("--rc-chart-1` a `--rc-chart-8");

  const sombra = /^--rc-shadow-([1-3])$/.exec(papel);
  if (sombra) return guia.includes("--rc-shadow-1` a `--rc-shadow-3");

  return false;
}

const faltando = papeis.filter((papel) => !citado(papel));

if (faltando.length > 0) {
  console.error(`${faltando.length} papel(eis) no tema e fora do guia:\n`);
  for (const papel of faltando) console.error(`  ${papel}`);
  console.error(`\nDocumente em ${GUIA}, ou o guia passa a mentir em silencio.`);
  process.exit(1);
}

console.log(`${papeis.length} papeis do tema, todos citados no guia.`);
