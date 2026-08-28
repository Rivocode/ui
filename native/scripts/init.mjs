#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = JSON.parse(readFileSync(resolve(HERE, "..", "package.json"), "utf8"));

export const SPEC = PACKAGE.name;

/**
 * Os nomes de arquivo de configuração do Babel que o Expo procura na raiz do
 * app, na mesma ordem do `loadBabelConfig` do `@expo/metro-config`. Achado
 * nenhum, ele cai no `babel-preset-expo` sozinho, e é assim que o app tem que
 * ficar: no SDK 57 esse preset mora em `node_modules/expo/node_modules` e NÃO
 * resolve da raiz do app, então um `babel.config.js` escrito à mão com
 * `presets: ["babel-preset-expo"]` derruba o bundle inteiro com
 * `MODULE_NOT_FOUND` antes do primeiro módulo. Por isso este comando não
 * escreve arquivo de Babel nenhum: ele olha se existe um e diz o que fazer.
 */
export const BABEL_NAMES = [
  ".babelrc",
  ".babelrc.js",
  ".babelrc.cjs",
  ".babelrc.mjs",
  ".babelrc.json",
  ".babelrc.cts",
  "babel.config.js",
  "babel.config.cjs",
  "babel.config.mjs",
  "babel.config.json",
  "babel.config.cts",
  "babel.config.ts",
  "babel.config.mts",
];

/**
 * Os dois trechos da receita v4 do NativeWind, que continuam sendo o primeiro
 * resultado de busca e não valem mais: `jsxImportSource` faz o JSX sair como
 * `require("nativewind/jsx-runtime")`, que a v5 não tem, e o preset
 * `nativewind/babel` adiciona o plugin de worklets que o `babel-preset-expo`
 * já adiciona sozinho quando acha o reanimated instalado.
 */
export const BABEL_V4 = [
  { mark: /["']?jsxImportSource["']?\s*:\s*["']nativewind["']/, why: 'o JSX passa a exigir `nativewind/jsx-runtime`, que a v5 nao tem: o metro morre em resolucao, longe do arquivo que causou' },
  { mark: /["']nativewind\/babel["']/, why: "o `babel-preset-expo` ja liga o plugin de worklets sozinho quando acha o reanimated: aqui ele entra duas vezes" },
];

export const POSTCSS_PLUGINS = ["@tailwindcss/postcss"];

export const BROWSERSLIST = ["chrome 130", "safari 18", "firefox 130"];

export const USER_INTERFACE_STYLE = "automatic";

export const METRO_WRAPPER = "withNativewind";

/**
 * As quatro palavras que o scanner do Tailwind encontra no código das peças e
 * confunde com utilitário: `shadow` vem da chave do `cn.ts`, `invert` e
 * `filter` de props do Stat e do DataList, `transform` do estilo do sparkline.
 * `.shadow` redeclara `--tw-shadow` e derruba o compilador nativo.
 */
export const BLOCKED = ["shadow", "invert", "filter", "transform"];

export function globalCss(spec = SPEC) {
  return [
    `@import "tailwindcss/theme.css" layer(theme);`,
    `@import "${spec}/theme.css";`,
    `@import "tailwindcss/utilities.css";`,
    ``,
    `@source "./App.tsx";`,
    `@source "./node_modules/${spec}/src";`,
    ``,
    ...BLOCKED.map((word) => `@source not inline("${word}");`),
    ``,
  ].join("\n");
}

export function metroConfig() {
  return [
    `const { getDefaultConfig } = require("expo/metro-config");`,
    `const { ${METRO_WRAPPER} } = require("nativewind/metro");`,
    ``,
    `module.exports = ${METRO_WRAPPER}(getDefaultConfig(__dirname));`,
    ``,
  ].join("\n");
}

export function postcssConfig() {
  return [
    `export default {`,
    `  plugins: {`,
    ...POSTCSS_PLUGINS.map((name) => `    "${name}": {},`),
    `  },`,
    `};`,
    ``,
  ].join("\n");
}

/**
 * A receita inteira, na ordem em que o comando a escreve. `kind` separa o
 * arquivo que nasce inteiro do JSON do app, que só recebe uma chave: app.json
 * e package.json já existem em todo projeto do Expo, e reescrevê-los apaga o
 * projeto de quem rodou o comando.
 */
export const RECIPE = [
  { name: "babel.config.js", kind: "babel" },
  { name: "postcss.config.mjs", kind: "file", body: postcssConfig },
  { name: "metro.config.js", kind: "file", body: metroConfig },
  { name: "global.css", kind: "file", body: globalCss },
  { name: "app.json", kind: "json", path: ["expo", "userInterfaceStyle"], value: USER_INTERFACE_STYLE },
  { name: "package.json", kind: "json", path: ["browserslist"], value: BROWSERSLIST },
];

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function at(object, path) {
  let node = object;
  for (const key of path) {
    if (node === null || typeof node !== "object") return undefined;
    node = node[key];
  }
  return node;
}

function put(object, path, value) {
  let node = object;
  for (const key of path.slice(0, -1)) {
    if (node[key] === null || typeof node[key] !== "object") node[key] = {};
    node = node[key];
  }
  node[path.at(-1)] = value;
}

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function indentOf(text) {
  const found = /\n(\s+)"/.exec(text);
  return found ? found[1].length : 2;
}

/**
 * O que o comando FARIA, arquivo por arquivo, sem escrever nada. Cada item sai
 * com `action` em `escreve`, `mantem`, `conflito` ou `sobrescreve`, e uma
 * linha de relatório pronta.
 *
 * A assimetria entre os dois `kind` é a regra de segurança: arquivo que nasce
 * inteiro e já existe com outro conteúdo vira `conflito` e só cede a
 * `--force`, porque reescrever um babel.config.js apaga a configuração de
 * outra biblioteca e o app quebra longe daqui. Chave de JSON é uma linha
 * nomeada, e vira `sobrescreve` com o valor antigo e o novo no relatório.
 */
export function plan(root, { force = false, spec = SPEC } = {}) {
  const steps = [];

  for (const item of RECIPE) {
    const file = resolve(root, item.name);

    if (item.kind === "babel") {
      const found = BABEL_NAMES.filter((name) => existsSync(resolve(root, name)));

      if (found.length === 0) {
        steps.push({
          name: item.name,
          action: "mantem",
          note: "nao existe, e e assim que tem que ser",
        });
        continue;
      }

      const stale = [];
      for (const name of found) {
        const text = readFileSync(resolve(root, name), "utf8");
        for (const { mark, why } of BABEL_V4) if (mark.test(text)) stale.push({ name, why });
      }

      if (stale.length === 0) {
        steps.push({
          name: found.join(", "),
          action: "mantem",
          note: "existe e nao traz a receita v4",
        });
        continue;
      }

      steps.push({
        name: found.join(", "),
        action: "conflito",
        babel: stale,
        note: stale
          .map(({ name, why }) => (found.length === 1 ? why : `${name}: ${why}`))
          .join("; "),
      });
      continue;
    }

    if (item.kind === "file") {
      const body = item.body(spec);

      if (!existsSync(file)) {
        steps.push({ name: item.name, action: "escreve", body, note: "criado" });
        continue;
      }

      const current = readFileSync(file, "utf8");
      if (current === body) {
        steps.push({ name: item.name, action: "mantem", note: "ja esta na receita" });
      } else if (force) {
        steps.push({ name: item.name, action: "sobrescreve", body, note: "reescrito por --force" });
      } else {
        steps.push({
          name: item.name,
          action: "conflito",
          note: "ja existe e o conteudo difere",
        });
      }
      continue;
    }

    if (!existsSync(file)) {
      steps.push({
        name: item.name,
        action: "conflito",
        note: "nao existe: rode o comando na raiz de um app do Expo",
      });
      continue;
    }

    const text = readFileSync(file, "utf8");
    const json = readJson(file);
    const current = at(json, item.path);
    const key = item.path.join(".");

    if (same(current, item.value)) {
      steps.push({ name: item.name, action: "mantem", note: `${key} ja esta na receita` });
      continue;
    }

    put(json, item.path, item.value);
    const body = `${JSON.stringify(json, null, indentOf(text))}\n`;

    if (current === undefined) {
      steps.push({ name: item.name, action: "escreve", body, note: `${key} adicionado` });
    } else {
      steps.push({
        name: item.name,
        action: "sobrescreve",
        body,
        note: `${key}: ${JSON.stringify(current)} -> ${JSON.stringify(item.value)}`,
      });
    }
  }

  return steps;
}

const WHY = {
  "postcss.config.mjs":
    "sem ele o Tailwind nao roda no passe de CSS do metro: o arquivo entra cru no bundle, com as vars do tema e nenhum utilitario, e a tela renderiza sem estilo, sem erro e sem pista.",
  "metro.config.js": "`withNativewind(config)`, que troca o transformador do metro pelo do react-native-css.",
  "global.css":
    "a fonte do CSS. O app nao a importa: importa o `generated.css` que o `rivocode-ui-native-css` escreve a partir dela.",
  "app.json": "`userInterfaceStyle` em `automatic`, senao o iOS prende a aparencia no claro e o tema escuro nunca chega.",
  "package.json":
    "`browserslist` moderno, senao o passe web do Expo reescreve o `light-dark()` dos tokens num polyfill de vars orfas e a compilacao morre com \"Specifier, found ()\".",
};

const MARKS = { escreve: "+", sobrescreve: "~", mantem: "=", conflito: "!" };

function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const dry = argv.includes("--dry-run");
  const root = resolve(argv.find((one) => !one.startsWith("--")) ?? ".");

  if (!existsSync(root)) {
    console.error(`${root} nao existe.`);
    process.exit(1);
  }

  const steps = plan(root, { force });

  console.log(`Receita do ${SPEC} em ${basename(root)}/:\n`);

  for (const step of steps) {
    if (step.body !== undefined && !dry) writeFileSync(resolve(root, step.name), step.body);
    console.log(`  ${MARKS[step.action]} ${step.name.padEnd(19)} ${step.note}`);
  }

  const stale = steps.filter((step) => step.babel);

  if (stale.length > 0) {
    console.error(
      "\nO arquivo de Babel do app traz a receita v4 do NativeWind, que na v5" +
        "\nquebra longe daqui:\n" +
        stale
          .flatMap((step) => step.babel)
          .map(({ name, why }) => `    ${name}: ${why}.`)
          .join("\n") +
        "\n\n    Um app do Expo 57 nao precisa de arquivo de Babel: sem nenhum, o" +
        "\n    `@expo/metro-config` cai no `babel-preset-expo` e liga o plugin de" +
        "\n    worklets sozinho. Apague as linhas da v4; se nao sobrar mais nada," +
        "\n    apague o arquivo. Nao o troque por um `presets: [\"babel-preset-expo\"]`" +
        "\n    escrito a mao: no SDK 57 esse preset nao resolve da raiz do app, e o" +
        "\n    bundle morre com MODULE_NOT_FOUND antes do primeiro modulo.",
    );
  }

  const clashes = steps.filter((step) => step.action === "conflito" && !step.babel);

  if (clashes.length > 0) {
    console.error(
      `\n${clashes.length} arquivo(s) intocado(s), porque o app ja diz outra coisa ali:\n` +
        clashes.map((step) => `    ${step.name}: ${WHY[step.name]}`).join("\n\n") +
        "\n\n    Concilie a mao, ou rode de novo com `--force` para a receita" +
        "\n    vencer. `--force` reescreve o arquivo inteiro: em babel.config.js" +
        "\n    e postcss.config.mjs isso apaga config de outra biblioteca, e o" +
        "\n    app quebra num lugar que nao parece ter relacao com este comando.",
    );
  }

  if (clashes.length + stale.length > 0) process.exit(1);

  if (dry) {
    console.log("\n`--dry-run`: nada foi escrito.");
    return;
  }

  console.log(
    "\nFalta o CSS pre-compilado, e ele nao sai daqui porque depende do seu\n" +
      "codigo: rode `npx rivocode-ui-native-css` e importe o `generated.css`\n" +
      "no topo do App.tsx, acima do provider.",
  );
}

const entry = process.argv[1] ? pathToFileURL(realpathSync(process.argv[1])).href : undefined;

if (entry === import.meta.url) {
  main();
}
