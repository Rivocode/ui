/**
 * Guarda do tamanho do pacote: o que quem instala baixa, medido em gzip contra
 * um orcamento escrito.
 *
 * Nasceu junto com a descoberta de que importar SO o `Button` levava a
 * biblioteca quase inteira. Medido em 24/09/2026, com esbuild e com o bundler do
 * bun, num app de uma linha - `import { Button } from "@rivocode/ui"` - e os
 * peers de fora: 395 KB minificados, 129 KB em gzip, contra 307 KB em gzip de
 * `import * as tudo`. O codigo das 121 pecas saia quase todo, mas cada
 * `Dialog$1.Root`, `createContext(...)` e `cva(...)` de topo de modulo ficava,
 * porque o empacotador nao prova que leitura de propriedade e chamada nao tem
 * efeito - e eles seguravam 272 KB minificados da Base UI, a tabela da TanStack
 * e o resto. O esbuild deu o mesmo desenho: 122 KB antes, 11,7 KB depois.
 *
 * O `"sideEffects": ["*.css"]` do package.json ja dizia a coisa certa, e nao
 * adiantava: ele deixa o empacotador descartar um ARQUIVO inteiro que ninguem
 * usa, e o `tsdown` juntava as pecas num `dist/index.js` so, que e sempre usado.
 * Com `unbundle` no `tsdown.config.ts` cada modulo vira um arquivo, e o mesmo
 * app caiu para 37 KB minificados, 12,3 KB em gzip. As duas metades sao
 * necessarias, e foi medido: com `unbundle` e SEM o `sideEffects`, o `Button`
 * sozinho volta a 144 KB em gzip.
 *
 * Nenhum teste via isso, e nenhum veria: o defeito nao muda comportamento, so
 * o peso da tela de quem usa. Por isso a guarda mede o peso, e nao a forma do
 * `dist/`.
 *
 * ## Onde ela roda, e por que dentro do gate
 *
 * O gate roda antes do `bun run build`, e o `dist/` que costuma estar ali e de
 * uma construcao anterior. Medir ele seria responder sobre outro codigo - verde
 * ou vermelho, os dois mentiriam. Entao a guarda constroi o JavaScript e a CSS
 * numa pasta propria, com o mesmo `tsdown.config.ts` e a mesma entrada do
 * Tailwind do build, e mede o que acabou de sair. Custa menos de um segundo, e
 * por isso cabe no `bun run check` em vez de ficar num passo da CI que a
 * maquina de ninguem roda.
 *
 * ## O que ela mede
 *
 * - Cada entrada JavaScript do `exports` do package.json, lida do proprio
 *   manifesto: subcaminho novo sem orcamento e erro. O numero e o gzip de tudo
 *   que a entrada alcanca por import relativo - desde o `unbundle` o
 *   `index.js` e so reexportacao, e medir so ele seria medir uma lista de nomes.
 * - A `styles.css`, que todo mundo importa inteira.
 * - O `Button` sozinho, empacotado pelo bun com as dependencias DENTRO e so os
 *   peers de fora - e a pergunta de quem instala, e e a linha que fica vermelha
 *   no dia em que o tree-shaking quebrar de novo.
 *
 * O orcamento mora em `scripts/orcamento-de-tamanho.ts`. Ele tem piso tambem:
 * medida abaixo de 80% do limite e erro, pelo mesmo motivo das listas que so
 * encolhem - folga que sobra depois de um corte vira espaco para crescer sem
 * ninguem decidir. E o piso e o que impede esta guarda de ficar verde lendo
 * nada: leitura que se perde mede quase zero, e quase zero reprova.
 */
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";

import { BUDGET, BUTTON_ALONE } from "./orcamento-de-tamanho";

const OUT = "node_modules/.cache/check-tamanho";
const CSS_ENTRY = "src/styles.css";
const CSS_EXPORT = "./styles.css";
const HEADROOM = 1.1;
const FLOOR = 0.8;

type Manifest = {
  exports: Record<string, string | { default?: string }>;
  peerDependencies: Record<string, string>;
};

const manifest = (await Bun.file("package.json").json()) as Manifest;

async function run(command: string[]) {
  const proc = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });
  const [code, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text()]);
  if (code !== 0) {
    console.error(`${command.join(" ")} falhou:\n${stderr}`);
    process.exit(1);
  }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

await run(["node_modules/.bin/tsdown", "--no-dts", "-d", OUT, "-l", "error"]);
await run(["node_modules/.bin/tailwindcss", "-i", CSS_ENTRY, "-o", join(OUT, "styles.css")]);

const inBuild = (path: string) => join(OUT, path.replace(/^\.\/dist\//, ""));

function importsOf(code: string) {
  const found: string[] = [];
  for (const hit of code.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*["'](\.[^"']+)["']/g)) {
    found.push(hit[1]!);
  }
  return found;
}

/** Todo arquivo que a entrada alcanca por import relativo, em ordem estavel. */
async function closure(entry: string) {
  const seen = new Set<string>([entry]);
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.shift()!;
    const code = await Bun.file(file).text();
    for (const request of importsOf(code)) {
      const target = normalize(join(dirname(file), request));
      if (seen.has(target)) continue;
      if (!(await Bun.file(target).exists())) {
        console.error(`${file} importa ${request}, e ${target} nao saiu do build.`);
        process.exit(1);
      }
      seen.add(target);
      queue.push(target);
    }
  }

  return [...seen].sort();
}

async function gzipOf(files: string[]) {
  const texts = await Promise.all(files.map((file) => Bun.file(file).text()));
  return gzipSync(texts.join("\n"), { level: 9 }).length;
}

type Measure = { name: string; bytes: number; detail: string };

const measures: Measure[] = [];

for (const [key, target] of Object.entries(manifest.exports)) {
  const path = typeof target === "string" ? target : target.default;
  if (!path) continue;

  if (key === CSS_EXPORT) {
    measures.push({ name: key, bytes: await gzipOf([inBuild(path)]), detail: "1 arquivo" });
    continue;
  }
  if (!path.endsWith(".js")) continue;

  const files = await closure(inBuild(path));
  measures.push({ name: key, bytes: await gzipOf(files), detail: `${files.length} arquivo(s)` });
}

const probe = join(OUT, "so-o-button.js");
// O Button vai para o `globalThis`, e nao para um `export { Button }`: o bun
// 1.3 esvazia a reexportacao de modulo marcado sem efeito colateral e devolve
// `export{t as Button}` sem o `t` - medido, 21 bytes. A `mark` abaixo pegou.
await Bun.write(probe, 'import { Button } from "./index.js";\nglobalThis.rcButton = Button;\n');

const peers = Object.keys(manifest.peerDependencies).flatMap((name) => [name, `${name}/*`]);
const bundled = await Bun.build({
  entrypoints: [probe],
  minify: true,
  target: "browser",
  external: peers,
});
if (!bundled.success) {
  console.error("O empacotamento do Button sozinho falhou:");
  for (const log of bundled.logs) console.error(log);
  process.exit(1);
}

const buttonCode = await bundled.outputs[0]!.text();

if (!buttonCode.includes(BUTTON_ALONE.mark)) {
  console.error(
    `O pacote do Button sozinho nao contem "${BUTTON_ALONE.mark}".\n` +
      "A frase e a prova de que o Button entrou no pacote medido: sem ela, o numero\n" +
      "abaixo seria de um arquivo vazio, e passaria com folga. Aponte `mark` em\n" +
      "scripts/orcamento-de-tamanho.ts para uma classe que o Button ainda tenha.",
  );
  process.exit(1);
}

measures.push({
  name: BUTTON_ALONE.name,
  bytes: gzipSync(buttonCode, { level: 9 }).length,
  detail: `${(buttonCode.length / 1024).toFixed(1)} KB minificado`,
});

rmSync(OUT, { recursive: true, force: true });

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
const suggested = (bytes: number) => Math.ceil((bytes * HEADROOM) / 100) * 100;

const problems: string[] = [];

for (const measure of measures) {
  const budget = BUDGET[measure.name];
  if (!budget) {
    problems.push(
      `  ${measure.name} (${kb(measure.bytes)} em gzip, ${measure.detail}) nao tem orcamento.\n` +
        `    Escreva a linha em scripts/orcamento-de-tamanho.ts com limite ${suggested(measure.bytes)}\n` +
        "    e o motivo do numero.",
    );
    continue;
  }

  if (measure.bytes > budget.limit) {
    problems.push(
      `  ${measure.name} pesa ${kb(measure.bytes)} em gzip (${measure.detail}), e o limite e ${kb(budget.limit)}.\n` +
        `    O motivo escrito do limite: ${budget.why}`,
    );
  } else if (measure.bytes < budget.limit * FLOOR) {
    problems.push(
      `  ${measure.name} pesa ${kb(measure.bytes)} em gzip, abaixo de ${FLOOR * 100}% do limite de ${kb(budget.limit)}.\n` +
        `    Desca o limite para ${suggested(measure.bytes)} e reescreva o motivo. Se nada\n` +
        "    encolheu de verdade, a leitura se perdeu - e isso e a guarda acusando a si mesma.",
    );
  }
}

for (const name of Object.keys(BUDGET)) {
  if (!measures.some((measure) => measure.name === name)) {
    problems.push(
      `  O orcamento cita ${name}, que nao e mais medido. Apague a linha, ou devolva a entrada ao exports.`,
    );
  }
}

const table = measures
  .map((measure) => {
    const limit = BUDGET[measure.name]?.limit;
    const share = limit ? ` de ${kb(limit)} (${Math.round((measure.bytes / limit) * 100)}%)` : "";
    return `  ${measure.name.padEnd(16)} ${kb(measure.bytes).padStart(9)}${share}  - ${measure.detail}`;
  })
  .join("\n");

if (problems.length > 0) {
  console.error(`${table}\n\n${problems.length} problema(s) de tamanho:\n\n${problems.join("\n\n")}`);
  console.error(
    "\nSubir o limite e decisao, e se faz no mesmo commit que cresceu: troque o `limit`" +
      "\nem scripts/orcamento-de-tamanho.ts pelo numero sugerido - o medido mais 10% -" +
      "\ne reescreva o `why` dizendo o que entrou e por que vale o peso. Um limite" +
      "\nsem motivo novo e o mesmo que nao ter limite.",
  );
  process.exit(1);
}

console.log(`Tamanho em gzip, dentro do orcamento:\n${table}`);
