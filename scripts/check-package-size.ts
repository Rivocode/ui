/**
 * Package size guard: what the installer downloads, measured in gzip against a
 * written budget.
 *
 * It was born alongside the discovery that importing ONLY the `Button` pulled
 * in almost the whole library. Measured on 24/09/2026, with esbuild and with
 * bun's bundler, in a one-line app - `import { Button } from "@rivocode/ui"` -
 * and the peers left out: 395 KB minified, 129 KB gzipped, against 307 KB
 * gzipped for `import * as everything`. The code of the 121 pieces was mostly
 * dropped, but every top-level `Dialog$1.Root`, `createContext(...)` and
 * `cva(...)` stayed, because the bundler cannot prove that a property read and
 * a call have no side effect - and they held on to 272 KB minified of Base UI,
 * the TanStack table and the rest. esbuild gave the same picture: 122 KB
 * before, 11.7 KB after.
 *
 * The `"sideEffects": ["*.css"]` of package.json already said the right thing,
 * and it did not help: it lets the bundler drop an entire FILE nobody uses, and
 * `tsdown` merged the pieces into a single `dist/index.js`, which is always
 * used. With `unbundle` in `tsdown.config.ts` each module becomes a file, and
 * the same app fell to 37 KB minified, 12.3 KB gzipped. Both halves are
 * necessary, and it was measured: with `unbundle` and WITHOUT `sideEffects`,
 * the `Button` alone goes back to 144 KB gzipped.
 *
 * No test saw this, and none would: the defect does not change behavior, only
 * the weight of the user's screen. That is why the guard measures weight, and
 * not the shape of `dist/`.
 *
 * ## Where it runs, and why inside the gate
 *
 * The gate runs before `bun run build`, and the `dist/` usually sitting there
 * comes from an earlier build. Measuring it would be answering about other
 * code - green or red, both would lie. So the guard builds the JavaScript and
 * the CSS into its own folder, with the same `tsdown.config.ts` and the same
 * Tailwind entry as the build, runs the CSS through the same `compactCss` as
 * `build:css`, and measures what just came out. Without that trim here, the
 * guard would measure a CSS nobody publishes. It costs less than a second,
 * and that is why it fits in `bun run check` instead of sitting in a CI step
 * nobody's machine runs.
 *
 * ## What it measures
 *
 * - Each JavaScript entry of package.json's `exports`, read from the manifest
 *   itself: a new subpath without a budget is an error. The number is the gzip
 *   of everything the entry reaches by relative import - since `unbundle`,
 *   `index.js` is only re-exports, and measuring it alone would be measuring a
 *   list of names.
 * - `styles.css`, which everyone imports whole.
 * - The `Button` alone, bundled by bun with dependencies INSIDE and only the
 *   peers left out - it is the installer's question, and it is the line that
 *   turns red on the day tree-shaking breaks again.
 *
 * The budget lives in `scripts/size-budget.ts`. It has a floor too: a
 * measurement below 80% of the limit is an error, for the same reason as the
 * lists that only shrink - slack left over after a cut becomes room to grow
 * without anyone deciding. And the floor is what keeps this guard from staying
 * green while reading nothing: a reading that gets lost measures almost zero,
 * and almost zero fails.
 */
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";

import { compactCss } from "./compact-css";
import { BUDGET, BUTTON_ALONE } from "./size-budget";

const OUT = "node_modules/.cache/check-size";
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
    console.error(`${command.join(" ")} failed:\n${stderr}`);
    process.exit(1);
  }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

await run(["node_modules/.bin/tsdown", "--no-dts", "-d", OUT, "-l", "error"]);
await run(["node_modules/.bin/tailwindcss", "-i", CSS_ENTRY, "-o", join(OUT, "styles.css")]);
const cssOut = join(OUT, "styles.css");
await Bun.write(cssOut, compactCss(await Bun.file(cssOut).text()));

const inBuild = (path: string) => join(OUT, path.replace(/^\.\/dist\//, ""));

function importsOf(code: string) {
  const found: string[] = [];
  for (const hit of code.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*["'](\.[^"']+)["']/g)) {
    found.push(hit[1]!);
  }
  return found;
}

/** Every file the entry reaches by relative import, in stable order. */
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
        console.error(`${file} imports ${request}, and ${target} did not come out of the build.`);
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
    measures.push({ name: key, bytes: await gzipOf([inBuild(path)]), detail: "1 file" });
    continue;
  }
  if (!path.endsWith(".js")) continue;

  const files = await closure(inBuild(path));
  measures.push({ name: key, bytes: await gzipOf(files), detail: `${files.length} file(s)` });
}

const probe = join(OUT, "button-only.js");
// The Button goes to `globalThis`, and not to an `export { Button }`: bun 1.3
// empties the re-export of a module marked side-effect free and returns
// `export{t as Button}` without the `t` - measured, 21 bytes. The `mark` below caught it.
await Bun.write(probe, 'import { Button } from "./index.js";\nglobalThis.rcButton = Button;\n');

const peers = Object.keys(manifest.peerDependencies).flatMap((name) => [name, `${name}/*`]);
const bundled = await Bun.build({
  entrypoints: [probe],
  minify: true,
  target: "browser",
  external: peers,
});
if (!bundled.success) {
  console.error("Bundling the Button alone failed:");
  for (const log of bundled.logs) console.error(log);
  process.exit(1);
}

const buttonCode = await bundled.outputs[0]!.text();

if (!buttonCode.includes(BUTTON_ALONE.mark)) {
  console.error(
    `The Button-alone bundle does not contain "${BUTTON_ALONE.mark}".\n` +
      "The phrase is the proof that the Button made it into the measured bundle: without it,\n" +
      "the number below would be of an empty file, and would pass with room to spare. Point\n" +
      "`mark` in scripts/size-budget.ts at a class the Button still has.",
  );
  process.exit(1);
}

measures.push({
  name: BUTTON_ALONE.name,
  bytes: gzipSync(buttonCode, { level: 9 }).length,
  detail: `${(buttonCode.length / 1024).toFixed(1)} KB minified`,
});

rmSync(OUT, { recursive: true, force: true });

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
const suggested = (bytes: number) => Math.ceil((bytes * HEADROOM) / 100) * 100;

const problems: string[] = [];

for (const measure of measures) {
  const budget = BUDGET[measure.name];
  if (!budget) {
    problems.push(
      `  ${measure.name} (${kb(measure.bytes)} gzipped, ${measure.detail}) has no budget.\n` +
        `    Write the line in scripts/size-budget.ts with limit ${suggested(measure.bytes)}\n` +
        "    and the reason for the number.",
    );
    continue;
  }

  if (measure.bytes > budget.limit) {
    problems.push(
      `  ${measure.name} weighs ${kb(measure.bytes)} gzipped (${measure.detail}), and the limit is ${kb(budget.limit)}.\n` +
        `    The written reason for the limit: ${budget.why}`,
    );
  } else if (measure.bytes < budget.limit * FLOOR) {
    problems.push(
      `  ${measure.name} weighs ${kb(measure.bytes)} gzipped, below ${FLOOR * 100}% of the ${kb(budget.limit)} limit.\n` +
        `    Lower the limit to ${suggested(measure.bytes)} and rewrite the reason. If nothing\n` +
        "    really shrank, the reading got lost - and that is the guard flagging itself.",
    );
  }
}

for (const name of Object.keys(BUDGET)) {
  if (!measures.some((measure) => measure.name === name)) {
    problems.push(
      `  The budget names ${name}, which is no longer measured. Delete the line, or put the entry back in exports.`,
    );
  }
}

const table = measures
  .map((measure) => {
    const limit = BUDGET[measure.name]?.limit;
    const share = limit ? ` of ${kb(limit)} (${Math.round((measure.bytes / limit) * 100)}%)` : "";
    return `  ${measure.name.padEnd(16)} ${kb(measure.bytes).padStart(9)}${share}  - ${measure.detail}`;
  })
  .join("\n");

if (problems.length > 0) {
  console.error(`${table}\n\n${problems.length} size problem(s):\n\n${problems.join("\n\n")}`);
  console.error(
    "\nRaising the limit is a decision, and it is made in the same commit that grew: replace" +
      "\n`limit` in scripts/size-budget.ts with the suggested number - the measured value plus 10% -" +
      "\nand rewrite `why` saying what came in and why it is worth the weight. A limit" +
      "\nwithout a new reason is the same as having no limit.",
  );
  process.exit(1);
}

console.log(`Gzipped size, within budget:\n${table}`);
