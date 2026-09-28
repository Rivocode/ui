/**
 * Pure code that crosses between the two packages, and the guard against
 * whoever copies instead of crossing.
 *
 * The TimeField was published with five value functions identical character
 * for character in both packages. The cost is not the repeated byte: it is that
 * one copy can get a fix the other does not, and nothing flags it.
 * `check:parity` does not catch it, because it compares PIECES, and both pieces
 * are there - it would say "translates" while the two `stepTime` diverged. That
 * is how the native `DataList` served unaccented text for versions, with the
 * accented web version right beside it.
 *
 * When first measured, on 27/08/2026, there were TWENTY identical
 * declarations, not five. Fifteen nobody had named, and one crosses different
 * pieces: the `flatten` of `DataTable` is the same as `DataList`'s, so whoever
 * fixes the accent-insensitive search of one has no reason to open the other.
 * The number was not known because nothing counted it.
 *
 * Why a mirror and not a package: the two publish in different ways.
 * `@rivocode/ui` publishes `dist`, and `tsdown` bundles what the graph reaches.
 * `@rivocode/ui-native` publishes SOURCE, and only what is physically inside
 * `native/` goes into the tarball - an import that climbs above the folder
 * resolves here and vanishes there. So the native side gets a generated,
 * versioned copy with a header, exactly as `native/tokens.ts` and
 * `native/theme.css` already get the tokens. The whole design is in
 * `docs/2026-08-27-codigo-puro-compartilhado-design.md`.
 *
 * The trap the first version of the detector fell into: looking for the body
 * at the first `{` after the name matches the parameter DESTRUCTURING, not the
 * body. Because of that `FileUploadItem` and `FormField` showed up as copies
 * while only having a similar signature. Reading by top-level declaration does
 * not have that hole, and it also catches arrow `const` and loose constants.
 */
import { Glob } from "bun";
import { scanAtLeast } from "./scan";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";

const SOURCE = "src/shared";
const MIRROR = "native/src/shared";

/**
 * The second mirror: hooks that depend only on React.
 *
 * The utility hooks that make sense on both sides - `useDisclosure`,
 * `useDebouncedCallback`, `useListState` and the rest of `src/hooks/common/` -
 * do not fit in `src/shared/`, because they import `react`. Leaving them
 * hand-copied would fill `DECLARED_COPIES` with eleven lines at once, and each
 * one is exactly the risk this guard exists to cut: the fix to a
 * `useThrottledCallback` that reaches one package and not the other. So they
 * cross the same way as `src/shared/`, with purity swapped for a closed list
 * of imports: `react`, a file in the same folder, and `../../shared/<file>` -
 * which resolves to the `src/shared/` mirror on both sides, because the two
 * trees have the same shape.
 *
 * The computation stays in `src/shared/`, and the hook is just the binding to
 * React. Platform globals are still forbidden: a hook that needs `window` is
 * web-only, and lives in `src/hooks/`, outside the mirror.
 */
const HOOKS_SOURCE = "src/hooks/common";
const HOOKS_MIRROR = "native/src/hooks/common";

type Pair = { source: string; mirror: string; imports?: RegExp };

const PAIRS: Pair[] = [
  { source: SOURCE, mirror: MIRROR },
  {
    source: HOOKS_SOURCE,
    mirror: HOOKS_MIRROR,
    imports: /^(?:react|\.\/[\w-]+|\.\.\/\.\.\/shared\/[\w-]+)$/,
  },
];

const banner = (source: string, file: string) =>
  `/* Generated from ${source}/${file} by bun run gen:shared. Do not edit. */\n\n`;

/**
 * Globals that compile on both sides and fail on one.
 *
 * `Intl` is not here on purpose: it exists on both, and forbidding it would
 * cost more than it pays. The note that Hermes' locale table depends on how
 * the app was built is in the design document.
 */
const PLATFORM =
  /\b(document|window|navigator|localStorage|sessionStorage|HTMLElement|Element|Node|process)\b/;

/**
 * Copies that stay, and the reason for each.
 *
 * The list ONLY SHRINKS, like the `OUT` of `check:scripts` and the `DEBT` of
 * `check:comments`: an entry that no longer flags anything is an error, and
 * the guard says to delete the line. The criterion for crossing has two
 * halves: pure (no imports) AND already duplicated. The second half exists
 * because on native the file travels in the tarball and metro compiles it
 * inside the installer's app - filling the mirror for symmetry sends dead
 * bytes to a third party's device.
 */
const DECLARED_COPIES: Record<string, string> = {
  useZodForm:
    "imports react-hook-form, zod and @hookform/resolvers - three OPTIONAL peers, behind the `./form` subpath in both packages. `src/shared/` is core, and `check:chart` exists so the core builds without the peer installed.",
  nameFromConfig:
    "lives behind the chart's optional peer on both sides, and the `ChartConfig` type comes from there. Same reason as useZodForm.",
  leavesOf:
    "same body by chance: the two `TreeNode` are different types (`label` is `ReactNode` on web and `string` on native, and native has no `search`). To cross it would have to become generic over `{ id, children }`, which changes the exported signature of both packages.",
  TONE: "a class map, not a computation. `check:groups` already looks at classes on both sides.",
  SIZE: "a class map, not a computation, like TONE. In `src/shared/` it would fall out of Tailwind's `@source` in the three CSS files that compile the web.",
  WEIGHT: "a class map, not a computation, for the same reason as SIZE.",
  RivoContext: "identical because the React API makes it unavoidable, and its type belongs to each package.",
  normalizeColor:
    "pure and a real copy: ColorPicker queue, together with fromWheel, nameOf, valueOf and HEX.",
  fromWheel: "pure and a real copy: ColorPicker queue.",
  nameOf: "pure and a real copy: ColorPicker queue.",
  valueOf: "pure and a real copy: ColorPicker queue.",
  HEX: "pure and a real copy: ColorPicker queue.",
  counted: "pure and a real copy: FilterBar queue, together with applied.",
  applied: "pure and a real copy: FilterBar queue.",
  blankOf: "pure and a real copy: QueryBoundary queue.",
  flatten:
    "pure and a real copy, and the one that shows the problem best: it crosses DIFFERENT pieces, the web `DataTable` and the native `DataList`.",
};

/** The mirror may not exist yet, and scanning a folder that is not there is an error. */
async function* mirrored(mirror: string) {
  if (!existsSync(mirror)) return;
  for (const file of await scanAtLeast("**/*", 1, { cwd: mirror })) yield file;
}

const problems: string[] = [];

const sources: Array<{ pair: Pair; file: string; code: string }> = [];
for (const pair of PAIRS) {
  for (const file of await scanAtLeast("**/*", 1, { cwd: pair.source })) {
    const code = await Bun.file(`${pair.source}/${file}`).text();
    sources.push({ pair, file, code });
  }
}
sources.sort((one, other) =>
  `${one.pair.source}/${one.file}`.localeCompare(`${other.pair.source}/${other.file}`),
);

/* -------------------------------------------------------------------------
 * Rule 1: purity
 * ---------------------------------------------------------------------- */

const impure: string[] = [];

const hookImpure: string[] = [];

for (const { pair, file, code } of sources) {
  if (!file.endsWith(".ts") || file.endsWith(".d.ts")) {
    impure.push(
      `  ${pair.source}/${file}  is not .ts: JSX is surface, and the two surfaces differ.`,
    );
    continue;
  }

  if (pair.imports) {
    for (const found of code.matchAll(
      /^\s*(?:import|export)\s[^;]*?\sfrom\s+"([^"]+)"|^\s*import\s+"([^"]+)"/gm,
    )) {
      const specifier = found[1] ?? found[2] ?? "";
      if (pair.imports.test(specifier)) continue;
      const line = code.slice(0, found.index).split("\n").length;
      hookImpure.push(
        `  ${pair.source}/${file}:${line}  imports "${specifier}", which does not cross to native.`,
      );
    }
  }

  code.split("\n").forEach((line, index) => {
    const at = `  ${pair.source}/${file}:${index + 1}`;

    if (/\bimport\s*\(/.test(line) || /\brequire\s*\(/.test(line)) {
      impure.push(`${at}  imports at runtime, and the mirror does not follow.`);
    } else if (!pair.imports && /^\s*import\s/.test(line)) {
      impure.push(`${at}  imports something. Pure code compiles with zero imports.`);
    }

    const platform = PLATFORM.exec(line.replace(/\/\/.*$/, ""));
    if (platform) {
      impure.push(`${at}  usa \`${platform[1]}\`, which exists on one side only.`);
    }
  });
}

if (impure.length > 0) {
  problems.push(
    `${impure.length} purity break(s) in what crosses to native/:\n` +
      impure.join("\n") +
      `\n\n    The criterion is binary on purpose: pure is what compiles with\n` +
      `    no imports at all. "Does not touch the DOM" is a description, and\n` +
      `    descriptions get argued in review. If the function needs an import,\n` +
      `    it belongs to the piece, not to ${SOURCE}/.`,
  );
}

if (hookImpure.length > 0) {
  problems.push(
    `${hookImpure.length} import(s) outside the list in ${HOOKS_SOURCE}/:\n` +
      hookImpure.join("\n") +
      `\n\n    A mirrored hook only imports \`react\`, a file in its own folder and\n` +
      `    \`../../shared/<file>\`. Anything else does not exist inside native/\n` +
      `    the same way, and the hook belongs in src/hooks/, outside the mirror.`,
  );
}

/* -------------------------------------------------------------------------
 * Rule 2: mirror up to date
 * ---------------------------------------------------------------------- */

const wanted = new Map(
  sources.map(({ pair, file, code }) => [
    `${pair.mirror}/${file}`,
    banner(pair.source, file) + code,
  ]),
);

const stale: string[] = [];

for (const [path, content] of wanted) {
  const committed = await Bun.file(path)
    .text()
    .catch(() => undefined);

  if (committed === undefined) stale.push(`  ${path}  does not exist.`);
  else if (committed !== content) stale.push(`  ${path}  diverged from the source.`);
}

for (const { mirror } of PAIRS) {
  for await (const file of mirrored(mirror)) {
    const path = `${mirror}/${file}`;
    if (!wanted.has(path)) stale.push(`  ${path}  left over: there is no source for it.`);
  }
}

/* -------------------------------------------------------------------------
 * Rule 3: new copy
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
 * Splits the file into top-level declarations.
 *
 * A declaration starts on a line that opens at column zero with parenthesis
 * and brace depth at zero, and ends where the next one starts. It is the cut
 * that catches `function f() {}`, `const f = () => {}` and `const HEX = /.../`
 * at once without having to understand any of the three.
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

async function collect(pattern: string, skip: string[]) {
  const map = new Map<string, { file: string; line: number; name: string }>();

  for (const file of await scanAtLeast(pattern, 40)) {
    if (skip.some((prefix) => file.startsWith(prefix))) continue;

    for (const found of declarations(await Bun.file(file).text())) {
      const key = flat(found.text);
      if (!map.has(key)) {
        map.set(key, { file, line: found.line, name: nameOfDeclaration(key) });
      }
    }
  }

  return map;
}

const web = await collect(
  "src/**/*.{ts,tsx}",
  PAIRS.map(({ source }) => `${source}/`),
);
const native = await collect(
  "native/src/**/*.{ts,tsx}",
  PAIRS.map(({ mirror }) => `${mirror}/`),
);

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

const undeclared = copies.filter(({ name }) => !(name in DECLARED_COPIES));
const named = new Set(copies.map(({ name }) => name));
const rotten = Object.keys(DECLARED_COPIES).filter((name) => !named.has(name));

if (undeclared.length > 0) {
  problems.push(
    `${undeclared.length} declaration(s) copied between the two packages:\n` +
      undeclared
        .map(({ name, here, there }) => `    ${name}\n      ${here}\n      ${there}`)
        .join("\n") +
      `\n\n    If the declaration is pure - zero imports -, it crosses: move it\n` +
      `    to ${SOURCE}/, re-export it from the old place so the public API\n` +
      `    does not change, and run \`bun run gen:shared\`.\n\n` +
      `    If it cannot cross, it gets a line in this guard's\n` +
      `    \`DECLARED_COPIES\` with the reason. The reason is for whoever\n` +
      `    decides whether it is still worth keeping copied.`,
  );
}

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} line(s) of \`DECLARED_COPIES\` that no longer describe anything:\n` +
      rotten.map((name) => `    "${name}" - there is no copy with that name anymore.`).join("\n") +
      `\n\n    Delete it from scripts/shared-code.ts. An exception list that\n` +
      `    does not shrink becomes the place where dead code lives.`,
  );
}

/* -------------------------------------------------------------------------
 * Write, or check
 * ---------------------------------------------------------------------- */

if (process.argv.includes("--check")) {
  if (stale.length > 0) {
    problems.unshift(
      `${stale.length} mirror file(s) out of date:\n` +
        stale.join("\n") +
        `\n\n    Run: bun run gen:shared\n` +
        `    The mirror is versioned because the native package publishes SOURCE,\n` +
        `    and only what is inside native/ goes into the tarball.`,
    );
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`${problem}\n`);
    process.exit(1);
  }

  console.log(
    `${wanted.size} file(s) mirrored from ${PAIRS.map(({ source }) => `${source}/`).join(" and ")}` +
      ` into native/, with no platform global and no import outside the list.` +
      ` Declared copies: ${Object.keys(DECLARED_COPIES).length}.`,
  );
  process.exit(0);
}

for (const { mirror } of PAIRS) {
  for await (const file of mirrored(mirror)) {
    if (!wanted.has(`${mirror}/${file}`)) await rm(`${mirror}/${file}`);
  }
}

for (const [path, content] of wanted) await Bun.write(path, content);

if (problems.length > 0) {
  for (const problem of problems) console.error(`${problem}\n`);
  process.exit(1);
}

console.log(
  `${wanted.size} file(s) written into native/ from ${PAIRS.length} source(s).`,
);
