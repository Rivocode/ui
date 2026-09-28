/**
 * Install recipe guard: what the scaffold writes has to be what
 * `examples/native` runs.
 *
 * An agent built an app from scratch with the published package and did not
 * reach the end by reading the docs: `native/README.md` listed FOUR setup
 * files and hid the two most expensive to diagnose. Without
 * `postcss.config.mjs` Tailwind does not run in metro's CSS pass and the
 * screen comes out unstyled, with no error and no clue; with a
 * `babel.config.js` copied from NativeWind's v4 recipe
 * (`jsxImportSource: "nativewind"`) metro dies looking for
 * `nativewind/jsx-runtime`, which v5 does not have. The agent only finished
 * the app after reading the whole of `examples/native` and rebuilding the
 * recipe by hand.
 *
 * `rivocode-ui-native-init` was born so that reading would not have to happen
 * again. Except it created a SECOND copy of the recipe: the files that need to
 * agree with each other doubled in number, and nothing said when the two
 * halves drifted apart. `examples/native` is the only place where the recipe
 * is MEASURED - it runs -, so it is the source, and this guard demands that
 * the command say the same.
 *
 * It does not compare text: it compares the FACTS each file carries, extracted
 * from both sides by the same reader - the ordered list of `global.css`
 * directives, the PostCSS plugins, the metro wrapper, the
 * `userInterfaceStyle` of `app.json`, the `browserslist` of `package.json`,
 * the type reference of `nativewind-env.d.ts` and the Babel presets. Comparing
 * text would fail on the monorepo's relative path, which is different on
 * purpose.
 *
 * `babel.config.js` is the only fact by ABSENCE, and it was measured: writing
 * one with `presets: ["babel-preset-expo"]` brings down a whole Expo 57 app,
 * because in that SDK the preset lives in `node_modules/expo/node_modules` and
 * does not resolve from the root - the bundle fails with MODULE_NOT_FOUND
 * before the first module, and the message does not mention the preset. With
 * no file at all `@expo/metro-config` loads the same preset by its own path
 * and everything works. So `examples/native` has no Babel file on purpose, the
 * command writes none, and the guard demands the example stay that way: on the
 * day it needs one, the recipe needs one too, and the command is lying.
 *
 * The required peers are the last fact, and the only one that is not a file:
 * `RivoProvider` started carrying the `KeyboardProvider` of
 * `react-native-keyboard-controller` inside, so an app without that package
 * does not mount its first screen. The command reads the list from
 * `native/package.json` itself (every peer that is not `optional`) and demands
 * it of the app; the guard demands the same list of the example, which is
 * where it is measured.
 */
import { existsSync } from "node:fs";
import { countAtLeast } from "./scan";

const EXAMPLE = "examples/native";
const RECIPE = "native/scripts/init.mjs";

const recipe = (await import(`${import.meta.dir}/../${RECIPE}`)) as {
  SPEC: string;
  BABEL_NAMES: string[];
  BABEL_V4: { mark: RegExp; why: string }[];
  POSTCSS_PLUGINS: string[];
  BROWSERSLIST: string[];
  USER_INTERFACE_STYLE: string;
  METRO_WRAPPER: string;
  RECIPE: { name: string }[];
  REQUIRED_PEERS: string[];
  missingPeers: (root: string) => string[];
  globalCss: (spec?: string) => string;
  postcssConfig: () => string;
  metroConfig: () => string;
  nativewindEnv: () => string;
};

const SPEC = recipe.SPEC;

/**
 * `examples/native` lives inside the repository and reaches `native/` by a
 * relative path; an outside app reaches the same by package name. Swapping one
 * for the other makes the two directive lists comparable without loosening
 * anything: each pair is an equivalence, not an exclusion.
 */
const SAME_PLACE: [string, string][] = [
  ["../../native/theme.css", `${SPEC}/theme.css`],
  ["../../native/src", `./node_modules/${SPEC}/src`],
];

function directives(css: string): string[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = [...clean.matchAll(/@(import|source)\b[^;]*;/g)].map((one) =>
    one[0].replace(/\s+/g, " ").trim(),
  );

  return found.map((line) => {
    let out = line;
    for (const [inside, outside] of SAME_PLACE) out = out.replaceAll(inside, outside);
    return out;
  });
}

function plugins(mjs: string): string[] {
  return [...mjs.matchAll(/"([^"]+)":\s*\{\}/g)].map((one) => one[1]!);
}

function wrapper(js: string): string[] {
  return [...js.matchAll(/\b(withNativewind|withNativeWind)\s*\(/g)].map((one) => one[1]!);
}

/**
 * The app's `.d.ts` also carries FACTS, not text: the list of type references
 * and of declared modules. It is the half of the setup the app's `tsc` checks
 * and metro does not - without `nativewind/types`, `className` does not exist
 * in the props of `View`, and since the package publishes SOURCE the error
 * lands in OUR tree.
 */
function typing(dts: string): string[] {
  return [
    ...[...dts.matchAll(/\/\/\/\s*<reference\s+types="([^"]+)"\s*\/>/g)].map(
      (one) => `types ${one[1]!}`,
    ),
    ...[...dts.matchAll(/declare\s+module\s+"([^"]+)"/g)].map((one) => `module ${one[1]!}`),
  ];
}

const problems: string[] = [];

function compare(what: string, mine: unknown, theirs: unknown, hint: string) {
  if (JSON.stringify(mine) === JSON.stringify(theirs)) return;

  problems.push(
    `${what}\n` +
      `    ${EXAMPLE}: ${JSON.stringify(theirs)}\n` +
      `    ${RECIPE}: ${JSON.stringify(mine)}\n` +
      `    ${hint}`,
  );
}

const exampleCss = await Bun.file(`${EXAMPLE}/global.css`).text();
const exampleDirectives = directives(exampleCss);
const mineDirectives = directives(recipe.globalCss(SPEC));

countAtLeast(`directive of \`${EXAMPLE}/global.css\``, exampleDirectives.length, 6);
countAtLeast("directive of the recipe global.css", mineDirectives.length, 6);

compare(
  "global.css: the directives do not match.",
  mineDirectives,
  exampleDirectives,
  "The missing `@source not inline(...)` is a class Tailwind's scanner" +
    "\n    invents from the pieces' code, and `.shadow` brings down the native" +
    "\n    compiler. Order counts too: `utilities.css` after the theme.",
);

compare(
  "postcss.config.mjs: the plugin list does not match.",
  plugins(recipe.postcssConfig()),
  plugins(await Bun.file(`${EXAMPLE}/postcss.config.mjs`).text()),
  "Without the Tailwind plugin the screen renders unstyled, with no error and no clue.",
);

compare(
  "metro.config.js: the wrapper does not match.",
  wrapper(recipe.metroConfig()),
  wrapper(await Bun.file(`${EXAMPLE}/metro.config.js`).text()),
  "It is `withNativewind` that swaps metro's transformer for react-native-css's.",
);

const exampleTyping = typing(await Bun.file(`${EXAMPLE}/nativewind-env.d.ts`).text());
const mineTyping = typing(recipe.nativewindEnv());

countAtLeast(`fact of \`${EXAMPLE}/nativewind-env.d.ts\``, exampleTyping.length, 2);
countAtLeast("fact of the recipe nativewind-env.d.ts", mineTyping.length, 2);

compare(
  "nativewind-env.d.ts: the type declarations do not match.",
  mineTyping,
  exampleTyping,
  "Without `nativewind/types`, `className` does not exist in the props of View, Text and" +
    "\n    Pressable, and the app's tsc fails our whole source over an error that" +
    "\n    is not the app's - its skipLibCheck does not save it, because it only skips .d.ts. The" +
    '\n    `declare module "*.css"` is for the `generated.css` that App.tsx imports.',
);

const exampleApp = (await Bun.file(`${EXAMPLE}/app.json`).json()) as {
  expo: { userInterfaceStyle?: string };
};

compare(
  "app.json: `userInterfaceStyle` does not match.",
  recipe.USER_INTERFACE_STYLE,
  exampleApp.expo.userInterfaceStyle,
  "Other than `automatic`, iOS locks the appearance to light and the dark theme never arrives.",
);

const examplePkg = (await Bun.file(`${EXAMPLE}/package.json`).json()) as {
  browserslist?: string[];
};

compare(
  "package.json: `browserslist` does not match.",
  recipe.BROWSERSLIST,
  examplePkg.browserslist,
  "Without a modern browser, Expo's web pass rewrites the tokens' `light-dark()`" +
    "\n    into a polyfill of orphan vars, and compilation dies with" +
    '\n    "Specifier, found ()".',
);

countAtLeast("required peer of the recipe", recipe.REQUIRED_PEERS.length, 5);

compare(
  "package.json: the example is missing required peers.",
  [],
  recipe.missingPeers(EXAMPLE),
  "The command demands of the app every peer `native/package.json` does not mark as" +
    "\n    optional; an example without them does not run what the recipe promises." +
    "\n    `react-native-keyboard-controller` is the new case: `RivoProvider` carries its" +
    "\n    `KeyboardProvider` inside, and without the package the provider does not mount.",
);

const strayBabel = recipe.BABEL_NAMES.filter((name) => existsSync(`${EXAMPLE}/${name}`));

countAtLeast("Babel file name searched for", recipe.BABEL_NAMES.length, 10);

if (strayBabel.length > 0) {
  problems.push(
    `babel.config.js: ${EXAMPLE} now has a Babel file (${strayBabel.join(", ")}).\n` +
      "    The command writes none, and tells the user that having none is right,\n" +
      "    because it is what the example measures. If the example now needs one, the\n" +
      "    recipe needs the same, and this guard has to start comparing\n" +
      "    content instead of absence.",
  );
}

if (recipe.BABEL_V4.length === 0) {
  problems.push(
    "babel.config.js: the recipe stopped recognizing NativeWind v4.\n" +
      "    `BABEL_V4` is empty, so the command silently accepts the file the\n" +
      "    old recipe says to write - and that is the one that breaks the bundle.",
  );
}

if (problems.length > 0) {
  console.error(
    `${problems.length} divergence(s) between the \`rivocode-ui-native-init\` recipe and ${EXAMPLE}:\n`,
  );
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    `  ${EXAMPLE} is the source, because it is the only one of the two that runs. Fix\n` +
      `  ${RECIPE} to say the same, and \`native/README.md\` along with it.`,
  );
  process.exit(1);
}

console.log(
  `The ${recipe.RECIPE.length}-file recipe of \`rivocode-ui-native-init\` says the same as ` +
    `${EXAMPLE}: ${mineDirectives.length} CSS directives, ${recipe.POSTCSS_PLUGINS.length} PostCSS plugin(s), ` +
    `${recipe.METRO_WRAPPER}, userInterfaceStyle ${recipe.USER_INTERFACE_STYLE}, ` +
    `browserslist with ${recipe.BROWSERSLIST.length}, ${mineTyping.length} typing facts, ` +
    `${recipe.REQUIRED_PEERS.length} required peers installed, ` +
    `and no Babel file in either ` +
    `(${recipe.BABEL_V4.length} v4 mark(s) refused across ${recipe.BABEL_NAMES.length} names).`,
);
