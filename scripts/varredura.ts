/**
 * Piso de varredura: a guarda que varre lista vazia e verde sem ter olhado nada.
 *
 * Em 27/08/2026 quatro verificacoes foram encontradas passando sem medir, e
 * duas delas eram desta forma. O `test/acentos.test.ts` foi ampliado para os
 * dois pacotes com `{src/**\/*.{ts,tsx},native/src/**\/*.{ts,tsx}}` - chave
 * ANINHADA, que o Glob do bun nao expande: o teste varria zero arquivo e
 * passava. O mesmo formato foi medido nas guardas de `scripts/`, quebrando o
 * padrao de proposito para ver quem ficava vermelho: `check:contrast` anunciou
 * "Contraste ok em todos os temas" tendo lido ZERO tema, e `check:colors`,
 * `check:grupos`, `check:classes`, `check:nomes`, `check:comentarios`,
 * `check:chart`, `check:skill`, `check:scripts` e `check:compartilhado`
 * sairam com codigo 0 do mesmo jeito.
 *
 * O defeito nao e o padrao errado - e a varredura poder devolver vazio sem
 * ninguem reclamar. O caminho seguro so vira o caminho unico se ele for mais
 * facil de escrever do que o inseguro, e por isso este modulo devolve a lista
 * e cobra o piso na MESMA chamada: nao da para pedir os arquivos sem dizer
 * quantos se espera.
 *
 * O piso e um numero folgado, e nao a contagem exata. Ele existe para separar
 * "a arvore encolheu um pouco" de "o padrao parou de casar", e piso colado na
 * contagem de hoje vira vermelho toda vez que alguem apaga um arquivo.
 *
 * Quem varre sem Glob - contagem de tema medido, de arquivo espelhado - cobra
 * o mesmo piso com `countAtLeast`.
 */
import { Glob } from "bun";

type ScanOptions = { cwd?: string; dot?: boolean; followSymlinks?: boolean };

function refuse(what: string, counted: number, floor: number): never {
  console.error(
    `A varredura de ${what} achou ${counted} item(ns), e o piso declarado e ${floor}.\n`,
  );
  console.error(
    "Isto nao e a guarda acusando o que ela guarda: e ela acusando a si mesma." +
      "\nCom a lista vazia, a verificacao abaixo passaria verde sem ter lido nada." +
      "\n\nOu o padrao parou de casar - chave aninhada, pasta oculta sem `dot`," +
      "\npasta renomeada -, ou a arvore encolheu de verdade e o piso desceu junto," +
      "\nno mesmo commit que a encolheu.",
  );
  process.exit(1);
}

/**
 * Os arquivos que casam com o padrao, em ordem estavel, ou o processo morre.
 *
 * `dot` liga a varredura de pasta oculta - `.design-sync/`, `.claude/` -, que
 * o Glob do bun pula em silencio quando ela aparece no padrao.
 *
 * Com uma LISTA de padroes, o piso vale para a soma, e a ordem dos padroes e
 * preservada. E o que serve a quem procura a mesma coisa em dois lugares e nao
 * sabe em qual delas ela esta: as fontes moram em `node_modules/@fontsource*`
 * ou em `node_modules/.bun`, conforme a forma da instalacao, e cobrar piso de
 * cada padrao ali reprovaria toda arvore que tem so um dos dois.
 */
export async function scanAtLeast(
  pattern: string | string[],
  floor: number,
  options: ScanOptions = {},
): Promise<string[]> {
  const patterns = typeof pattern === "string" ? [pattern] : pattern;
  const found: string[] = [];

  for (const one of patterns) {
    const batch = await Array.fromAsync(
      new Glob(one).scan({
        cwd: options.cwd ?? ".",
        dot: options.dot ?? false,
        followSymlinks: options.followSymlinks ?? false,
      }),
    );

    found.push(...batch.sort());
  }

  if (found.length < floor) {
    refuse(patterns.map((one) => `\`${one}\``).join(" mais "), found.length, floor);
  }

  return found;
}

/** O mesmo piso, para a contagem que nao sai de um Glob. */
export function countAtLeast(what: string, counted: number, floor: number): number {
  if (counted < floor) refuse(what, counted, floor);

  return counted;
}
