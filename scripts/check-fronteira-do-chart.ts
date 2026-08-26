/**
 * Guarda da fronteira do grafico: a recharts fica presa em `src/chart/`.
 *
 * A recharts e peer OPCIONAL (`peerDependenciesMeta.recharts.optional`), e o
 * pacote se divide em dois pontos de entrada por causa disso: quem so quer
 * botao e tabela instala `@rivocode/ui` e nao paga os ~180kB do
 * `@rivocode/ui/chart`. O preco desse arranjo e um invariante: nenhum modulo
 * alcancado por `src/index.ts` pode importar a recharts, nem direto nem por
 * dentro de uma peca de `src/chart/`.
 *
 * O invariante vivia so em prosa - um comentario em `src/components/stat.tsx`
 * explicando por que o Stat nao usa a Sparkline. Um `import { Sparkline } from
 * "../chart/sparkline"` escrito ali compila, passa no `check` inteiro, entra
 * no bundle, e so falha na maquina de quem instalou sem a recharts: modulo nao
 * encontrado, em tempo de execucao, sem erro de build nosso para culpar. E o
 * pior tipo de quebra - a que a nossa suite nao pode sentir, porque aqui a
 * recharts esta instalada como devDependency.
 *
 * Sao duas regras, e a segunda e que fecha a porta de verdade:
 *
 *   1. `recharts` so entra em `src/chart/`.
 *   2. `src/chart/` so e importado de dentro de `src/chart/` - importar a
 *      Sparkline arrasta a recharts junto, e o passo 1 nao veria nada.
 *
 * A guarda le import, e nao texto. `grep -rn recharts src/` acusaria o
 * comentario do Stat, que e justamente quem explica a regra; guarda que acusa
 * a propria documentacao dela morre na primeira semana.
 */
import { Glob } from "bun";

const CORE = "src";
const CHART_DIR = "src/chart/";

/** O que este arquivo importa, ja sem comentario e ja resolvido. */
function importsOf(file: string, code: string) {
  // Comentario e prosa: `stat.tsx` cita a recharts para explicar por que nao a
  // usa, e a citacao nao e import.
  const source = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  const found: { specifier: string; line: number }[] = [];

  // Cobre `import x from "m"`, `import "m"`, `export * from "m"`,
  // `import("m")` e `require("m")` - as cinco formas de um modulo entrar.
  for (const hit of source.matchAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*["']([^"']+)["']/g)) {
    found.push({
      specifier: hit[1]!,
      line: code.slice(0, hit.index!).split("\n").length,
    });
  }

  return found.map((entry) => ({
    ...entry,
    // `../chart/sparkline` a partir de `src/components/stat.tsx` e
    // `src/chart/sparkline`: sem resolver, um `../` a mais passaria batido.
    resolved: entry.specifier.startsWith(".")
      ? new URL(entry.specifier, `file:///${file}`).pathname.slice(1)
      : entry.specifier,
  }));
}

const isRecharts = (specifier: string) => /^recharts(\/|$)/.test(specifier);

/** O ponto de entrada do grafico, pelo caminho ou pelo nome publico. */
const isChartEntry = (resolved: string) =>
  resolved.startsWith(CHART_DIR) || resolved === "@rivocode/ui/chart";

const breaches: string[] = [];

for await (const file of new Glob("**/*.{ts,tsx}").scan(CORE)) {
  const path = `${CORE}/${file}`;
  const inChart = path.startsWith(CHART_DIR);
  const code = await Bun.file(path).text();

  for (const { specifier, resolved, line } of importsOf(path, code)) {
    if (inChart) continue;

    if (isRecharts(specifier)) {
      breaches.push(
        `  ${path}:${line}  importa "${specifier}"\n` +
          "    A recharts e peer opcional: quem instalou so o @rivocode/ui nao a tem.",
      );
      continue;
    }

    if (isChartEntry(resolved)) {
      breaches.push(
        `  ${path}:${line}  importa "${specifier}"\n` +
          "    Tudo em src/chart/ arrasta a recharts junto, mesmo que a peca nao pareca.",
      );
    }
  }
}

if (breaches.length > 0) {
  console.error(`${breaches.length} import(s) atravessando a fronteira do grafico:\n`);
  for (const item of breaches) console.error(item);
  console.error(
    "\nO nucleo tem que continuar montando sem a recharts instalada." +
      "\n\nSe a peca precisa mesmo do grafico, ela pertence a `src/chart/` e sai" +
      "\npelo `@rivocode/ui/chart`. Se e o nucleo que precisa do desenho, copie" +
      "\no SVG - e o que o `Stat` faz, e o comentario dele explica por que." +
      "\n\nNada aqui quebra o build: quebra a instalacao de quem nao tem o peer," +
      "\ncom 'module not found' em producao e nenhum erro nosso para culpar.",
  );
  process.exit(1);
}

console.log(`A recharts nao sai de ${CHART_DIR}, e ninguem de fora entra la.`);
