/**
 * Guarda de script orfao: arquivo em `scripts/` que o `bun run check` nunca roda.
 *
 * O `regressao-visual.ts` passou meses assim. Ele so roda por `bun run visual`,
 * nada o chama no gate, e o unico lugar onde estava escrito que ele existe e
 * por que ficou de fora era o cabecalho do proprio arquivo - o lugar que quem
 * nao sabe que ele existe jamais abre. O resultado foi medido no dia em que
 * esta guarda nasceu: numa arvore limpa, `bun run visual` ja acusava tres
 * retratos fora da assinatura comitada, um deles com 50,2% dos quadrados
 * mudados e pior caso de 237 em 255. Ninguem tinha reparado, e nada reparava:
 * a assinatura envelheceu do mesmo jeito que o numero de pecas do README
 * envelheceu trinta pecas antes de o `check:pecas` existir.
 *
 * A saida nao e arrastar todo mundo para o gate. Uns nao cabem: o
 * `regressao-visual.ts` depende dos PNG do `bun run shot`, que gasta 77s de
 * Chrome num caminho fixo do macOS, e a CI e ubuntu; alem disso a renderizacao
 * de fonte muda entre maquina e sistema, entao assinatura tirada aqui nao bate
 * la. Guarda que exige binario que a CI nao tem nao entra no gate. (Desde
 * 24/09/2026 o Chrome e configuravel por `RC_CHROME` e os tres rodam na
 * bancada da CI, base contra cabeca - mas continuam fora do gate, que tem que
 * rodar em clone limpo e sem navegador.)
 *
 * O que esta guarda cobra e a DECLARACAO. Todo `scripts/**\/*.ts` tem que ser
 * alcancavel pelo `bun run check` - por comando ou por import, inclusive o
 * import que um teste faz, ja que `bun test` esta no gate - ou ter uma linha
 * no `OUT` dizendo por que nao esta. Assim a proxima pessoa descobre o script
 * lendo uma guarda que ela ja roda, e nao abrindo um arquivo que ninguem abre.
 *
 * O `OUT` so encolhe, como o `DEBT` do `check:comentarios`: entrada que virou
 * alcancavel, ou que aponta para arquivo apagado, e erro - lista de excecao que
 * nao encolhe vira o lugar onde o codigo morto mora.
 */
import { Glob } from "bun";
import { scanAtLeast } from "./varredura";
import { dirname, join, normalize } from "node:path";

const PACKAGE = "package.json";
const GATE = "check";

/**
 * Quem fica de fora, e a razao em uma linha.
 *
 * A razao e para quem for decidir se ainda vale ficar de fora - por isso diz o
 * que impede, e nao apenas que esta fora.
 */
const OUT: Record<string, string> = {
  "scripts/regressao-visual.ts":
    "Compara retrato com assinatura: precisa dos PNG do `bun run shot`, que precisa de Chrome, e a renderizacao de fonte muda entre sistemas - a assinatura comitada nasceu no macOS e nao bate no linux. Na maquina: `bun run shot && bun run visual` antes de criar a tag. Na CI roda na bancada (`.github/workflows/bancada.yml`) com `--gravar-em`, base contra cabeca no mesmo runner, e quem julga e o `scripts/comparacao-da-bancada.ts`. O que o gate alcanca dela e o `check:retratos`, que cobra a declaracao de cada retrato de secao sem navegador.",
  "scripts/shot.ts":
    "Fotografa a vitrine e as secoes com o Chrome de `RC_CHROME` (o padrao e o do macOS), e gasta minutos de navegador. Roda na bancada da CI, sobre a base e sobre a cabeca, e nao no gate, que tem que rodar em clone limpo sem navegador.",
  "scripts/acessibilidade.ts":
    "Bancada de acessibilidade da vitrine (`bun run a11y`): roda o axe-core, o foco depois da acao, o alvo de 24px e o reflow a 320px dentro do Chrome de `RC_CHROME`, e le o `demo/dist` que so existe depois do `bun run demo`. Ela acusa o que as pecas tem HOJE, e entrar no gate antes de a lista zerar deixaria o `check` vermelho em toda arvore. Na CI roda na bancada com `--json`, e o que reprova e problema que a cabeca tem a mais que a base.",
  "scripts/serve.ts":
    "Servidor estatico da vitrine: nao confere nada, so serve `demo/` para o Chrome do `shot`.",
  "scripts/props-do-catalogo-nativo.ts":
    "Le os tipos do pacote nativo, e react e react-native so estao instalados em `examples/native`, que nao e workspace: `bun install --frozen-lockfile` na raiz nunca os traz. Pior do que falhar, ele PASSARIA mentindo - sem os peers, `Omit<TextInputProps, ...> & {...}` colapsa e dez pecas saem sem props. Por isso a tabela e artefato comitado: quem gera precisa do app instalado, e o `--check` roda no job `nativo` da CI, ao lado do `check:native:types`. O que o gate alcanca dela e o `check:assinatura`, que le o JSON.",
  "scripts/fumaca-do-mcp.ts":
    "Sobe o `mcp/dist/cli.js` com `node` pelo stdio, e o `mcp/dist` so existe depois do `bun run build`. Roda no `ci.yml` logo depois do build, e no `release-mcp.yml` antes do `npm publish`. O que o gate alcanca do servidor e o `test/servidor-mcp.test.ts`, que o sobe em memoria.",
};

const pkg = (await Bun.file(PACKAGE).json()) as { scripts: Record<string, string> };

const commands: string[] = [];
const seen = new Set<string>();

function expand(name: string) {
  if (seen.has(name)) return;
  seen.add(name);

  const command = pkg.scripts[name];
  if (!command) return;
  commands.push(command);

  for (const [, next] of command.matchAll(/bun run ([\w:-]+)/g)) {
    if (next! in pkg.scripts) expand(next!);
  }
}

expand(GATE);

const queue: string[] = [];

for (const command of commands) {
  for (const [, path] of command.matchAll(/bun run (scripts\/[\w./-]+\.ts)/g)) queue.push(path!);

  if (/(^|&&\s*)bun test\b/.test(command)) {
    for (const file of await scanAtLeast("test/**/*.{ts,tsx}", 60)) queue.push(file);
  }
}

const reached = new Set<string>(queue);

async function resolve(from: string, request: string) {
  const base = normalize(join(dirname(from), request));
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (await Bun.file(candidate).exists()) return candidate;
  }
  return undefined;
}

while (queue.length > 0) {
  const file = queue.pop()!;
  const text = await Bun.file(file)
    .text()
    .catch(() => "");

  for (const [, request] of text.matchAll(/from\s+"(\.[^"]+)"/g)) {
    const target = await resolve(file, request!);
    if (target && !reached.has(target)) {
      reached.add(target);
      queue.push(target);
    }
  }
}

const orphans: string[] = [];
const paid = new Set<string>();

for (const file of await scanAtLeast("scripts/**/*.ts", 20)) {
  if (reached.has(file)) {
    if (file in OUT) paid.add(file);
    continue;
  }
  if (file in OUT) continue;
  orphans.push(file);
}

const problems: string[] = [];

if (orphans.length > 0) {
  problems.push(
    `${orphans.length} script(s) que o \`bun run check\` nunca roda:\n` +
      orphans.map((file) => `    ${file}`).join("\n") +
      "\n\n    Ou entra no gate - um `check:algo` no `package.json`, encadeado" +
      "\n    no `check` -, ou ganha uma linha no `OUT` desta guarda dizendo o" +
      "\n    que impede. Script que ninguem roda envelhece calado.",
  );
}

const declared = await Promise.all(
  Object.keys(OUT).map(async (file) => ({ file, exists: await Bun.file(file).exists() })),
);

const rotten = declared
  .filter(({ file, exists }) => !exists || paid.has(file))
  .map(({ file, exists }) =>
    exists
      ? `    "${file}" - o gate ja alcanca, e a excecao nao vale mais.`
      : `    "${file}" - o arquivo nao existe mais.`,
  );

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} linha(s) do \`OUT\` que nao descrevem mais nada:\n` +
      rotten.join("\n") +
      "\n\n    Apague do `OUT` em scripts/check-scripts-fora-do-gate.ts. Lista de" +
      "\n    excecao que nao encolhe vira o lugar onde o codigo morto mora.",
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

const names = Object.keys(OUT).map((file) => file.replace(/^scripts\/|\.ts$/g, ""));

console.log(
  `Todo script de \`scripts/\` esta no gate. Fora dele, por declaracao: ${names.join(", ")}` +
    " - a razao de cada um esta no OUT desta guarda.",
);
