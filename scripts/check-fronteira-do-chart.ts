/**
 * Guarda da fronteira do grafico, nos DOIS pacotes.
 *
 * O desenho de dado tem peer OPCIONAL - a recharts no web, o react-native-svg
 * no nativo -, e por isso cada pacote se divide em dois pontos de entrada:
 * quem so quer botao e tabela instala `@rivocode/ui` e nao paga os ~180kB do
 * `@rivocode/ui/chart`; quem so quer um `Button` no celular instala
 * `@rivocode/ui-native` e nao precisa ligar o react-native-svg ao projeto
 * nativo, que la custa build e nao so bytes. O preco desse arranjo e um
 * invariante: nenhum modulo alcancado pelo indice da raiz pode importar o
 * peer, nem direto nem por dentro de uma peca do subcaminho.
 *
 * O invariante vivia so em prosa - um comentario em `src/components/stat.tsx`
 * explicando por que o Stat nao usa a Sparkline. Um `import { Sparkline } from
 * "../chart/sparkline"` escrito ali compila, passa no `check` inteiro, entra
 * no bundle, e so falha na maquina de quem instalou sem a recharts: modulo nao
 * encontrado, em tempo de execucao, sem erro de build nosso para culpar. E o
 * pior tipo de quebra - a que a nossa suite nao pode sentir, porque aqui a
 * recharts esta instalada como devDependency.
 *
 * Sao duas regras por pacote, e a segunda e que fecha a porta de verdade:
 *
 *   1. O peer so entra no diretorio do grafico.
 *   2. O diretorio do grafico so e importado de dentro dele mesmo - importar a
 *      Sparkline arrasta a recharts junto, e o passo 1 nao veria nada.
 *
 * A guarda le import, e nao texto. `grep -rn recharts src/` acusaria o
 * comentario do Stat, que e justamente quem explica a regra; guarda que acusa
 * a propria documentacao dela morre na primeira semana.
 *
 * O nativo entrou depois, e nao ganhou script proprio de proposito: o
 * invariante e o mesmo, a leitura de import e a mesma, e duas guardas iguais
 * divergem na primeira correcao que so uma delas recebe. A prova disso e o
 * furo que a versao anterior tinha e que a tabela abaixo fechou nos dois de
 * uma vez - veja `inside()`.
 */
import { Glob } from "bun";

type Frontier = {
  /** O nome publicado, para a mensagem dizer de quem se fala. */
  pkg: string;
  /** A raiz do codigo do pacote. */
  core: string;
  /** O diretorio do grafico, com barra no fim. */
  chart: string;
  /** O especificador publico do subcaminho. */
  entry: string;
  /** O peer opcional que nao pode vazar. */
  peer: RegExp;
  /** Por que ele nao pode vazar, em uma linha. */
  why: string;
};

const FRONTIERS: Frontier[] = [
  {
    pkg: "@rivocode/ui",
    core: "src",
    chart: "src/chart/",
    entry: "@rivocode/ui/chart",
    peer: /^recharts(\/|$)/,
    why: "A recharts e peer opcional: quem instalou so o @rivocode/ui nao a tem.",
  },
  {
    pkg: "@rivocode/ui-native",
    core: "native/src",
    chart: "native/src/chart/",
    entry: "@rivocode/ui-native/chart",
    peer: /^react-native-svg(\/|$)/,
    why:
      "O react-native-svg e peer opcional, e no celular ele nao e so bytes: e\n" +
      "    modulo nativo, que o app precisa ligar e reconstruir.",
  },
];

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

/**
 * O caminho cai dentro do diretorio do grafico?
 *
 * O `startsWith(chart)` sozinho tem um furo, e e o furo do import mais natural
 * que existe: `import { ChartDonut } from "./chart"` a partir do indice da
 * raiz resolve para `src/chart` - sem a barra final, porque o especificador
 * aponta o DIRETORIO e quem poe o `/index` e o resolvedor de modulos, nao nos.
 * `"src/chart".startsWith("src/chart/")` e falso, entao a forma que qualquer
 * um escreveria primeiro era a unica que passava.
 */
const inside = (resolved: string, dir: string) =>
  resolved === dir.slice(0, -1) || resolved.startsWith(dir);

const breaches: string[] = [];

for (const frontier of FRONTIERS) {
  for await (const file of new Glob("**/*.{ts,tsx}").scan(frontier.core)) {
    const path = `${frontier.core}/${file}`;
    if (inside(path, frontier.chart)) continue;

    const code = await Bun.file(path).text();

    for (const { specifier, resolved, line } of importsOf(path, code)) {
      if (frontier.peer.test(specifier)) {
        breaches.push(`  ${path}:${line}  importa "${specifier}"\n    ${frontier.why}`);
        continue;
      }

      if (inside(resolved, frontier.chart) || resolved === frontier.entry) {
        breaches.push(
          `  ${path}:${line}  importa "${specifier}"\n` +
            `    Tudo em ${frontier.chart} arrasta o peer junto, mesmo que a peca nao pareca.`,
        );
      }
    }
  }
}

if (breaches.length > 0) {
  console.error(`${breaches.length} import(s) atravessando a fronteira do grafico:\n`);
  for (const item of breaches) console.error(item);
  console.error(
    "\nO nucleo dos dois pacotes tem que continuar montando sem o peer instalado." +
      "\n\nSe a peca precisa mesmo do grafico, ela pertence ao diretorio do grafico" +
      "\ne sai pelo subcaminho. Se e o nucleo que precisa do desenho, copie o SVG -" +
      "\ne o que o `Stat` faz no web, e o que a `Sparkline` nativa faz com `View`;" +
      "\nos comentarios das duas explicam por que." +
      "\n\nNada aqui quebra o build: quebra a instalacao de quem nao tem o peer," +
      "\ncom 'module not found' em producao e nenhum erro nosso para culpar.",
  );
  process.exit(1);
}

console.log(
  FRONTIERS.map((frontier) => `${frontier.pkg}: o peer nao sai de ${frontier.chart}`).join(
    ", e ninguem de fora entra la.\n",
  ) + ", e ninguem de fora entra la.",
);
