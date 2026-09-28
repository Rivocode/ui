#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = JSON.parse(readFileSync(resolve(HERE, "..", "package.json"), "utf8"));

export const SPEC = PACKAGE.name;

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

export const BABEL_V4 = [
  { mark: /["']?jsxImportSource["']?\s*:\s*["']nativewind["']/, why: 'JSX starts requiring `nativewind/jsx-runtime`, which v5 does not have: metro dies at resolution, far from the file that caused it' },
  { mark: /["']nativewind\/babel["']/, why: "`babel-preset-expo` already turns on the worklets plugin by itself when it finds reanimated: here it goes in twice" },
];

export const REQUIRED_PEERS = Object.keys(PACKAGE.peerDependencies ?? {}).filter(
  (name) => !PACKAGE.peerDependenciesMeta?.[name]?.optional,
);

export function missingPeers(root) {
  const file = resolve(root, "package.json");
  if (!existsSync(file)) return [...REQUIRED_PEERS];
  const json = JSON.parse(readFileSync(file, "utf8"));
  const installed = { ...json.devDependencies, ...json.dependencies };
  return REQUIRED_PEERS.filter((name) => installed[name] === undefined);
}

export const POSTCSS_PLUGINS = ["@tailwindcss/postcss"];

export const BROWSERSLIST = ["chrome 130", "safari 18", "firefox 130"];

export const USER_INTERFACE_STYLE = "automatic";

export const METRO_WRAPPER = "withNativewind";

export const BLOCKED = ["shadow", "invert", "filter", "transform"];

export const TYPES_REFERENCE = "nativewind/types";

export const CSS_MODULE = "*.css";

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

export function nativewindEnv() {
  return [
    `/// <reference types="${TYPES_REFERENCE}" />`,
    ``,
    `declare module "${CSS_MODULE}";`,
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

export const RECIPE = [
  { name: "babel.config.js", kind: "babel" },
  { name: "postcss.config.mjs", kind: "file", body: postcssConfig },
  { name: "metro.config.js", kind: "file", body: metroConfig },
  { name: "global.css", kind: "file", body: globalCss },
  { name: "nativewind-env.d.ts", kind: "file", body: nativewindEnv },
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
          note: "does not exist, and that is how it has to be",
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
          note: "exists and does not carry the v4 recipe",
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
        steps.push({ name: item.name, action: "escreve", body, note: "created" });
        continue;
      }

      const current = readFileSync(file, "utf8");
      if (current === body) {
        steps.push({ name: item.name, action: "mantem", note: "already matches the recipe" });
      } else if (force) {
        steps.push({ name: item.name, action: "sobrescreve", body, note: "rewritten by --force" });
      } else {
        steps.push({
          name: item.name,
          action: "conflito",
          note: "already exists and the content differs",
        });
      }
      continue;
    }

    if (!existsSync(file)) {
      steps.push({
        name: item.name,
        action: "conflito",
        note: "does not exist: run the command at the root of an Expo app",
      });
      continue;
    }

    const text = readFileSync(file, "utf8");
    const json = readJson(file);
    const current = at(json, item.path);
    const key = item.path.join(".");

    if (same(current, item.value)) {
      steps.push({ name: item.name, action: "mantem", note: `${key} already matches the recipe` });
      continue;
    }

    put(json, item.path, item.value);
    const body = `${JSON.stringify(json, null, indentOf(text))}\n`;

    if (current === undefined) {
      steps.push({ name: item.name, action: "escreve", body, note: `${key} added` });
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
    "without it Tailwind does not run in metro's CSS pass: the file goes into the bundle raw, with the theme vars and no utility, and the screen renders unstyled, with no error and no clue.",
  "metro.config.js": "`withNativewind(config)`, which swaps metro's transformer for the react-native-css one.",
  "global.css":
    "the CSS source. The app does not import it: it imports the `generated.css` that `rivocode-ui-native-css` writes from it.",
  "nativewind-env.d.ts":
    '`/// <reference types="nativewind/types" />`, otherwise `className` does not exist in the props of View, Text and Pressable and the app\'s tsc fails our whole source - and its skipLibCheck does not help, because it only skips .d.ts.',
  "app.json": "`userInterfaceStyle` set to `automatic`, otherwise iOS locks the appearance to light and the dark theme never arrives.",
  "package.json":
    "a modern `browserslist`, otherwise Expo's web pass rewrites the tokens' `light-dark()` into a polyfill of orphan vars and compilation dies with \"Specifier, found ()\".",
};

const MARKS = { escreve: "+", sobrescreve: "~", mantem: "=", conflito: "!" };

function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const dry = argv.includes("--dry-run");
  const root = resolve(argv.find((one) => !one.startsWith("--")) ?? ".");

  if (!existsSync(root)) {
    console.error(`${root} does not exist.`);
    process.exit(1);
  }

  const steps = plan(root, { force });

  console.log(`${SPEC} recipe in ${basename(root)}/:\n`);

  for (const step of steps) {
    if (step.body !== undefined && !dry) writeFileSync(resolve(root, step.name), step.body);
    console.log(`  ${MARKS[step.action]} ${step.name.padEnd(21)} ${step.note}`);
  }

  const stale = steps.filter((step) => step.babel);

  if (stale.length > 0) {
    console.error(
      "\nThe app's Babel file carries the NativeWind v4 recipe, which on v5" +
        "\nbreaks far from here:\n" +
        stale
          .flatMap((step) => step.babel)
          .map(({ name, why }) => `    ${name}: ${why}.`)
          .join("\n") +
        "\n\n    An Expo 57 app does not need a Babel file: with none," +
        "\n    `@expo/metro-config` falls back to `babel-preset-expo` and turns on the" +
        "\n    worklets plugin by itself. Delete the v4 lines; if nothing else is left," +
        "\n    delete the file. Do not replace it with a hand-written" +
        "\n    `presets: [\"babel-preset-expo\"]`: on SDK 57 that preset does not resolve" +
        "\n    from the app root, and the bundle dies with MODULE_NOT_FOUND before the first module.",
    );
  }

  const clashes = steps.filter((step) => step.action === "conflito" && !step.babel);

  if (clashes.length > 0) {
    console.error(
      `\n${clashes.length} file(s) left untouched, because the app already says something else there:\n` +
        clashes.map((step) => `    ${step.name}: ${WHY[step.name]}`).join("\n\n") +
        "\n\n    Reconcile by hand, or run again with `--force` for the recipe" +
        "\n    to win. `--force` rewrites the whole file: in babel.config.js" +
        "\n    and postcss.config.mjs that erases another library's config, and the" +
        "\n    app breaks somewhere that does not seem related to this command.",
    );
  }

  const missing = missingPeers(root);

  if (missing.length > 0) {
    console.error(
      `\n${missing.length} required peer(s) missing from package.json:\n` +
        missing.map((name) => `    ${name}`).join("\n") +
        `\n\n    npx expo install ${missing.join(" ")}\n` +
        "\n    `expo install` picks the version for your SDK. Without" +
        "\n    react-native-keyboard-controller the RivoProvider does not mount: the" +
        "\n    KeyboardProvider the provider carries inside comes from it.",
    );
  } else {
    console.log(`\n  = required peers       all ${REQUIRED_PEERS.length} are in package.json`);
  }

  if (clashes.length + stale.length + missing.length > 0) process.exit(1);

  if (dry) {
    console.log("\n`--dry-run`: nothing was written.");
    return;
  }

  console.log(
    "\nThe precompiled CSS is still missing, and it does not come from here because it\n" +
      "depends on your code: run `npx rivocode-ui-native-css` and import `generated.css`\n" +
      "at the top of App.tsx, above the provider.",
  );
}

const entry = process.argv[1] ? pathToFileURL(realpathSync(process.argv[1])).href : undefined;

if (entry === import.meta.url) {
  main();
}
