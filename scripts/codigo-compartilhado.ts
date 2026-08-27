/**
 * Codigo puro que atravessa os dois pacotes, e a guarda de quem copia em vez
 * de atravessar.
 *
 * O TimeField foi publicado com cinco funcoes de valor identicas caractere a
 * caractere nos dois pacotes. O custo disso nao e o byte repetido: e que uma
 * copia pode ganhar conserto que a outra nao ganha, e nada acusa. O
 * `check:paridade` nao pega, porque ele compara PECAS, e as duas pecas estao
 * la - ele diria "traduz" enquanto os dois `stepTime` divergiam. Foi assim que
 * o `DataList` nativo serviu texto sem acento por versoes, com a versao web
 * acentuada do lado.
 *
 * Ao medir pela primeira vez, em 27/08/2026, eram VINTE declaracoes identicas,
 * e nao cinco. Quinze ninguem tinha nomeado, e uma atravessa pecas diferentes:
 * o `flatten` do `DataTable` e o mesmo do `DataList`, entao quem for consertar
 * a busca sem acento de uma nao tem por que abrir a outra. O numero nao era
 * conhecido porque nada o contava.
 *
 * Por que espelho e nao pacote: os dois publicam de formas diferentes. O
 * `@rivocode/ui` publica `dist`, e o `tsdown` empacota o que o grafo alcanca.
 * O `@rivocode/ui-native` publica FONTE, e so sai no tarball o que esta
 * fisicamente dentro de `native/` - um import que suba acima da pasta resolve
 * aqui e some la. Entao o nativo recebe copia gerada, versionada, com
 * cabecalho, exatamente como `native/tokens.ts` e `native/theme.css` ja
 * recebem os tokens. O desenho inteiro esta em
 * `docs/2026-08-27-codigo-puro-compartilhado-design.md`.
 *
 * A armadilha que a primeira versao do detector pegou: procurar o corpo pela
 * primeira `{` depois do nome casa a DESESTRUTURACAO do parametro, e nao o
 * corpo. Com isso `FileUploadItem` e `FormField` apareceram como copia sendo
 * so assinatura parecida. Ler por declaracao de primeiro nivel nao tem esse
 * furo, e ainda pega `const` de seta e constante solta.
 */
import { Glob } from "bun";
import { scanAtLeast } from "./varredura";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";

const SOURCE = "src/shared";
const MIRROR = "native/src/shared";

const banner = (file: string) =>
  `/* Gerado de ${SOURCE}/${file} por bun run gen:compartilhado. Nao editar. */\n\n`;

/**
 * Globais que compilam nos dois lados e falham num.
 *
 * `Intl` nao esta aqui de proposito: ele existe nos dois, e proibi-lo custaria
 * mais do que paga. O registro de que a tabela de locale do Hermes depende de
 * como o app foi montado esta no documento de desenho.
 */
const PLATFORM =
  /\b(document|window|navigator|localStorage|sessionStorage|HTMLElement|Element|Node|process)\b/;

/**
 * Copia que fica, e o motivo de cada uma.
 *
 * A lista SO ENCOLHE, como o `OUT` do `check:scripts` e o `DEBT` do
 * `check:comentarios`: entrada que nao acusa mais e erro, e a guarda manda
 * apagar a linha. O criterio para atravessar tem duas metades: puro (nenhum
 * import) E ja duplicado. A segunda metade existe porque no nativo o arquivo
 * viaja no tarball e o metro o compila dentro do app de quem instala - encher
 * o espelho por simetria e mandar byte morto para aparelho de terceiro.
 */
const COPIA_DECLARADA: Record<string, string> = {
  useZodForm:
    "importa react-hook-form, zod e @hookform/resolvers - tres peers OPCIONAIS, atras do subcaminho `./form` nos dois pacotes. `src/shared/` e nucleo, e o `check:chart` existe para que o nucleo monte sem o peer instalado.",
  nameFromConfig:
    "mora atras do peer opcional do grafico nos dois lados, e o tipo `ChartConfig` e de la. Mesmo motivo do useZodForm.",
  leavesOf:
    "corpo igual por acaso: os dois `TreeNode` sao tipos diferentes (`label` e `ReactNode` no web e `string` no nativo, e o nativo nao tem `search`). Para atravessar teria que virar generica sobre `{ id, children }`, o que muda a assinatura exportada dos dois pacotes.",
  TONE: "mapa de classe, e nao calculo. O `check:grupos` ja olha classe nos dois lados.",
  RivoContext: "identico por inevitabilidade da API do React, e o tipo dele e de cada pacote.",
  normalizeColor:
    "puro e copia de verdade: fila do ColorPicker, junto com fromWheel, nameOf, valueOf e HEX.",
  fromWheel: "puro e copia de verdade: fila do ColorPicker.",
  nameOf: "puro e copia de verdade: fila do ColorPicker.",
  valueOf: "puro e copia de verdade: fila do ColorPicker.",
  HEX: "puro e copia de verdade: fila do ColorPicker.",
  counted: "puro e copia de verdade: fila da FilterBar, junto com applied.",
  applied: "puro e copia de verdade: fila da FilterBar.",
  blankOf: "puro e copia de verdade: fila do QueryBoundary.",
  flatten:
    "puro e copia de verdade, e a que mais mostra o problema: atravessa PECAS diferentes, o `DataTable` do web e o `DataList` do nativo.",
};

/** O espelho pode nao existir ainda, e varrer pasta que nao ha e erro. */
async function* mirrored() {
  if (!existsSync(MIRROR)) return;
  for (const file of await scanAtLeast("**/*", 1, { cwd: MIRROR })) yield file;
}

const problems: string[] = [];

const sources: Array<{ file: string; code: string }> = [];
for (const file of await scanAtLeast("**/*", 1, { cwd: SOURCE })) {
  const code = await Bun.file(`${SOURCE}/${file}`).text();
  sources.push({ file, code });
}
sources.sort((one, other) => one.file.localeCompare(other.file));

/* -------------------------------------------------------------------------
 * Regra 1: pureza
 * ---------------------------------------------------------------------- */

const impure: string[] = [];

for (const { file, code } of sources) {
  if (!file.endsWith(".ts") || file.endsWith(".d.ts")) {
    impure.push(`  ${SOURCE}/${file}  nao e .ts: JSX e superficie, e as duas superficies diferem.`);
    continue;
  }

  code.split("\n").forEach((line, index) => {
    const at = `  ${SOURCE}/${file}:${index + 1}`;

    if (/^\s*import\s/.test(line) || /\bimport\s*\(/.test(line) || /\brequire\s*\(/.test(line)) {
      impure.push(`${at}  importa alguma coisa. Codigo puro compila com zero imports.`);
    }

    const platform = PLATFORM.exec(line.replace(/\/\/.*$/, ""));
    if (platform) {
      impure.push(`${at}  usa \`${platform[1]}\`, que existe num lado so.`);
    }
  });
}

if (impure.length > 0) {
  problems.push(
    `${impure.length} quebra(s) de pureza em ${SOURCE}/:\n` +
      impure.join("\n") +
      `\n\n    O criterio e binario de proposito: puro e o que compila sem\n` +
      `    nenhum import. "Nao toca o DOM" e descricao, e descricao se\n` +
      `    discute na revisao. Se a funcao precisa de um import, ela\n` +
      `    pertence a peca, e nao a ${SOURCE}/.`,
  );
}

/* -------------------------------------------------------------------------
 * Regra 2: espelho em dia
 * ---------------------------------------------------------------------- */

const wanted = new Map(sources.map(({ file, code }) => [file, banner(file) + code]));

const stale: string[] = [];

for (const [file, content] of wanted) {
  const committed = await Bun.file(`${MIRROR}/${file}`)
    .text()
    .catch(() => undefined);

  if (committed === undefined) stale.push(`  ${MIRROR}/${file}  nao existe.`);
  else if (committed !== content) stale.push(`  ${MIRROR}/${file}  divergiu da fonte.`);
}

for await (const file of mirrored()) {
  if (!wanted.has(file)) stale.push(`  ${MIRROR}/${file}  sobrou: nao ha fonte para ele.`);
}

/* -------------------------------------------------------------------------
 * Regra 3: copia nova
 * ---------------------------------------------------------------------- */

const STARTS = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class)\s/;

function withoutComments(code: string) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => (line.trim().startsWith("//") ? "" : line))
    .join("\n");
}

/**
 * Quebra o arquivo em declaracoes de primeiro nivel.
 *
 * Uma declaracao comeca numa linha que abre na coluna zero com profundidade
 * de parenteses e chaves zerada, e termina onde a proxima comeca. E o recorte
 * que pega ao mesmo tempo `function f() {}`, `const f = () => {}` e
 * `const HEX = /.../` sem precisar entender nenhum dos tres.
 */
function declarations(code: string) {
  const lines = withoutComments(code).split("\n");
  const found: Array<{ text: string; line: number }> = [];

  let current: string[] = [];
  let at = 0;
  let depth = 0;

  const flush = () => {
    const text = current.join("\n").trim();
    if (text && STARTS.test(text)) found.push({ text, line: at });
    current = [];
  };

  lines.forEach((line, index) => {
    if (depth === 0 && /^\S/.test(line) && (STARTS.test(line) || current.length > 0)) {
      flush();
      at = index + 1;
    }
    current.push(line);

    for (const char of line) {
      if (char === "{" || char === "(" || char === "[") depth++;
      else if (char === "}" || char === ")" || char === "]") depth--;
    }
  });
  flush();

  return found;
}

const nameOfDeclaration = (text: string) =>
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/.exec(
    text,
  )?.[1] ?? "?";

const flat = (text: string) => text.replace(/\s+/g, " ").trim();

async function collect(pattern: string, skip: string) {
  const map = new Map<string, { file: string; line: number; name: string }>();

  for (const file of await scanAtLeast(pattern, 40)) {
    if (file.startsWith(skip)) continue;

    for (const found of declarations(await Bun.file(file).text())) {
      const key = flat(found.text);
      if (!map.has(key)) {
        map.set(key, { file, line: found.line, name: nameOfDeclaration(key) });
      }
    }
  }

  return map;
}

const web = await collect("src/**/*.{ts,tsx}", `${SOURCE}/`);
const native = await collect("native/src/**/*.{ts,tsx}", `${MIRROR}/`);

const copies: Array<{ name: string; here: string; there: string }> = [];

for (const [key, here] of web) {
  const there = native.get(key);
  if (!there) continue;

  copies.push({
    name: here.name,
    here: `${here.file}:${here.line}`,
    there: `${there.file}:${there.line}`,
  });
}

const undeclared = copies.filter(({ name }) => !(name in COPIA_DECLARADA));
const named = new Set(copies.map(({ name }) => name));
const rotten = Object.keys(COPIA_DECLARADA).filter((name) => !named.has(name));

if (undeclared.length > 0) {
  problems.push(
    `${undeclared.length} declaracao(oes) copiada(s) entre os dois pacotes:\n` +
      undeclared
        .map(({ name, here, there }) => `    ${name}\n      ${here}\n      ${there}`)
        .join("\n") +
      `\n\n    Se a declaracao e pura - zero imports -, ela atravessa: mova\n` +
      `    para ${SOURCE}/, re-exporte do lugar antigo para nao mexer na API\n` +
      `    publica, e rode \`bun run gen:compartilhado\`.\n\n` +
      `    Se ela nao pode atravessar, ganha linha no \`COPIA_DECLARADA\`\n` +
      `    desta guarda com o motivo. O motivo e para quem for decidir se\n` +
      `    ainda vale ficar copiada.`,
  );
}

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} linha(s) do \`COPIA_DECLARADA\` que nao descrevem mais nada:\n` +
      rotten.map((name) => `    "${name}" - nao ha mais copia com esse nome.`).join("\n") +
      `\n\n    Apague de scripts/codigo-compartilhado.ts. Lista de excecao que\n` +
      `    nao encolhe vira o lugar onde o codigo morto mora.`,
  );
}

/* -------------------------------------------------------------------------
 * Escrever, ou conferir
 * ---------------------------------------------------------------------- */

if (process.argv.includes("--check")) {
  if (stale.length > 0) {
    problems.unshift(
      `${stale.length} arquivo(s) do espelho fora de dia:\n` +
        stale.join("\n") +
        `\n\n    Rode: bun run gen:compartilhado\n` +
        `    O espelho e versionado porque o pacote nativo publica FONTE, e so\n` +
        `    sai no tarball o que esta dentro de native/.`,
    );
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`${problem}\n`);
    process.exit(1);
  }

  console.log(
    `${wanted.size} arquivo(s) de ${SOURCE}/ espelhado(s) em ${MIRROR}/, sem import e sem global de plataforma.` +
      ` Copia declarada: ${Object.keys(COPIA_DECLARADA).length}.`,
  );
  process.exit(0);
}

for await (const file of mirrored()) {
  if (!wanted.has(file)) await rm(`${MIRROR}/${file}`);
}

for (const [file, content] of wanted) await Bun.write(`${MIRROR}/${file}`, content);

if (problems.length > 0) {
  for (const problem of problems) console.error(`${problem}\n`);
  process.exit(1);
}

console.log(`${wanted.size} arquivo(s) escrito(s) em ${MIRROR}/ a partir de ${SOURCE}/.`);
