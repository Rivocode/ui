/**
 * Guard of the TOOL boundary: what exists for `rivocode-ui` must not get into
 * the bundle of whoever uses the library.
 *
 * `tsdown` has four entries, and `src/cli.ts` is one of them. That means
 * everything the CLI reaches lands in `dist/cli.js`, and none of it weighs on
 * whoever writes `import { Button } from "@rivocode/ui"` - as long as no module
 * reached by the library's indexes imports the same thing. The words "as long
 * as" are the guard: on the day this was measured the separation was true by
 * ACCIDENT, and not by rule. Nothing prevented an
 * `import { contrastRatio } from "../lib/contrast"` inside a component, and
 * from there the table of the 45 roles, the minimums and the prose of each pair
 * would travel to everyone's browser, once per application.
 *
 * The contrast math is the case that made this guard exist. It had just moved
 * out of `scripts/` - which is not in the `files` of either package, and so
 * forced every consumer to port the math by hand - into `src/lib`, which is
 * published. The gain is real and the risk is new: in `scripts/` it was
 * physically impossible for a component to import that, and in `src/lib` it
 * became one line. A change that swaps "impossible" for "nobody would do that"
 * asks for a guard, or today's proof grows stale in silence.
 *
 * ## It reads the graph, not the folder
 *
 * Forbidding the import from `src/components/**` would catch the obvious path
 * and leave the others: an innocent `src/lib/x.ts` importing the math, and a
 * component importing `x`, and the math is in the bundle without anyone having
 * written its name in a component. So the question the guard asks is the same
 * the bundler asks - is the module REACHABLE from `src/index.ts`,
 * `src/form/index.ts` or `src/chart/index.ts`? - and the answer comes with the
 * whole path, so whoever broke it knows where through.
 *
 * The second rule is the opposite of the first, and exists so the guard does
 * not become decoration: the module has to stay reachable from `src/cli.ts`.
 * A module nobody reaches passes this guard with honors, and the easiest way to
 * keep the first rule always green is for the tool to stop using what it should
 * use.
 *
 * ## The third rule measures the artifact
 *
 * The two above read source, which is what the gate has. Since `bun run build`
 * runs after the gate, the `dist/` of an earlier build is usually there - and
 * when it is, the guard searches what `dist/index.js` and the subpaths reach
 * for a phrase that only exists inside the tool module. It is the only one of
 * the three that answers the real question, which is not "who imports whom"
 * but "what does the client download".
 * Without `dist/`, it says it did not run instead of keeping quiet.
 */
/**
 * The tool module, why it is a tool, and the phrase that gives it away inside
 * the artifact.
 *
 * `mark` is a string literal, and not a function name: a name survives
 * bundling with luck, and a literal always survives.
 */
export const TOOL_ONLY: Array<{ file: string; mark: string; why: string }> = [
  {
    file: "src/lib/contrast.ts",
    mark: "checked track, box and circle",
    why: "The WCAG math and the pair tables. They serve `check-theme` and the two contrast guards; no piece measures contrast at runtime, and the table of the 45 roles with the prose of each pair has nothing to do in the browser of whoever uses a Button.",
  },
  {
    file: "src/lib/theme-check.ts",
    mark: "Theme role with no written consequence",
    why: "The written consequences of each missing role - paragraphs of prose, one per role. It is CLI diagnostic material, and what it diagnoses is a theme that has not shipped yet.",
  },
  {
    file: "src/tokens/dtcg.ts",
    mark: "has no type in DTCG 2025.10",
    why: "The translation of the three layers into W3C Design Tokens JSON. It serves `rivocode-ui tokens`, `build:tokens` and the site; the browser of whoever uses the pieces already has the tokens as CSS, and has nothing to do with a CSS parser and a JSON writer.",
  },
  {
    file: "src/tokens/theme-roles.ts",
    mark: "--rc-text-hero",
    why: "The role catalog that `gen:themes` writes from the CSS. At runtime the browser already has the roles: they are the loaded CSS itself. The list exists for the CLI to check the theme of whoever installs.",
  },
];

const LIBRARY = [
  "src/index.ts",
  "src/form/index.ts",
  "src/chart/index.ts",
  "src/ai/index.ts",
  "src/dnd/index.ts",
  "src/editor/index.ts",
];
const TOOL = "src/cli.ts";

function importsOf(code: string) {
  const source = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const found: string[] = [];
  for (const hit of source.matchAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*["']([^"']+)["']/g)) {
    if (hit[1]!.startsWith(".")) found.push(hit[1]!);
  }
  return found;
}

async function resolve(from: string, request: string) {
  const base = new URL(request, `file:///${from}`).pathname.slice(1);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (await Bun.file(candidate).exists()) return candidate;
  }
  return undefined;
}

/** Where each reached file was reached from, so the path comes out whole. */
async function reach(entries: string[]) {
  const from = new Map<string, string | undefined>();
  const queue: string[] = [];

  for (const entry of entries) {
    if (from.has(entry)) continue;
    from.set(entry, undefined);
    queue.push(entry);
  }

  while (queue.length > 0) {
    const file = queue.shift()!;
    const code = await Bun.file(file)
      .text()
      .catch(() => "");

    for (const request of importsOf(code)) {
      const target = await resolve(file, request);
      if (!target || from.has(target)) continue;
      from.set(target, file);
      queue.push(target);
    }
  }

  return from;
}

// The guard only makes sense if the entries exist: a wrong path here would
// leave all three rules green over nothing.
for (const entry of [...LIBRARY, TOOL]) {
  if (!(await Bun.file(entry).exists())) {
    console.error(
      `${entry} does not exist. The entries of this guard have to be the same as` +
        " tsdown.config.ts, or it stays green over nothing.",
    );
    process.exit(1);
  }
}

const library = await reach(LIBRARY);
const tool = await reach([TOOL]);

const problems: string[] = [];

for (const item of TOOL_ONLY) {
  if (!(await Bun.file(item.file).exists())) {
    problems.push(
      `  ${item.file} no longer exists.\n` +
        "    Delete the `TOOL_ONLY` line of this guard, or point it to the new\n" +
        "    address. An exception list that does not shrink becomes the place where\n" +
        "    dead code lives.",
    );
    continue;
  }

  if (library.has(item.file)) {
    const path: string[] = [];
    for (let at: string | undefined = item.file; at; at = library.get(at)) path.unshift(at);
    problems.push(
      `  ${item.file} got into the library bundle:\n` +
        path.map((step, index) => `    ${"  ".repeat(index)}${step}`).join("\n") +
        `\n    ${item.why}`,
    );
  }

  if (!(await Bun.file(item.file).text()).includes(item.mark)) {
    problems.push(
      `  ${item.file} no longer contains "${item.mark}".\n` +
        "    `mark` is what this guard looks for in dist/. A phrase that\n" +
        "    left the source never shows up in the bundle, and the line stays green without\n" +
        "    looking at anything. Point it at a phrase the file still has.",
    );
  }

  if (!tool.has(item.file)) {
    problems.push(
      `  ${item.file} is not reached by ${TOOL}.\n` +
        "    Either the tool stopped using the module - and it is dead code -, or\n" +
        "    the `TOOL_ONLY` line is stale. A module nobody reaches passes\n" +
        "    this guard without it having looked at anything.",
    );
  }
}

/**
 * The text of everything a set of `dist/` entries reaches.
 *
 * Since `tsdown` started emitting one file per module (`unbundle`),
 * `dist/index.js` is just a list of re-exports: searching it for the phrase
 * would stay green without reading a byte of any piece. The reading follows
 * relative imports, which is the same path the installer's bundler walks.
 */
async function artifactOf(entries: string[]) {
  const present: string[] = [];
  for (const entry of entries) if (await Bun.file(entry).exists()) present.push(entry);
  if (present.length === 0) return undefined;

  const files = [...(await reach(present)).keys()];
  const texts = await Promise.all(files.map((file) => Bun.file(file).text()));
  return { files: files.length, text: texts.join("\n") };
}

const toDist = (entry: string) => entry.replace(/^src\//, "dist/").replace(/\.tsx?$/, ".js");

const bundle = await artifactOf(LIBRARY.map(toDist));
const toolBundle = await artifactOf([toDist(TOOL)]);

if (bundle) {
  for (const item of TOOL_ONLY) {
    if (bundle.text.includes(item.mark)) {
      problems.push(
        `  the library dist/ carries "${item.mark}", which only exists in ${item.file}.\n` +
          `    ${item.why}`,
      );
    }
    if (toolBundle && !toolBundle.text.includes(item.mark)) {
      problems.push(
        `  dist/cli.js, with what it imports, does not carry "${item.mark}".\n` +
          "    The phrase exists in the source and the tool reaches the module, so it is the\n" +
          "    artifact reading that stopped finding it: a search that does not find the phrase\n" +
          "    even where it MUST be would not find it where it must not be either.",
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    `${problems.length} leak(s) of tool code into the library:\n\n` +
      problems.join("\n\n"),
  );
  console.error(
    "\n`tsdown` has `src/cli.ts` as a separate entry: what only the CLI reaches" +
      "\nlands in dist/cli.js and weighs on nobody. One import from a module the" +
      "\nindexes reach is enough to undo that, and the only symptom is" +
      "\nthe bundle size of whoever installed.",
  );
  process.exit(1);
}

const names = TOOL_ONLY.map((item) => item.file).join(", ");
const measured = bundle
  ? `and none of their phrases is in the ${bundle.files} dist/ file(s) the library entries reach`
  : "and dist/index.js does not exist now, so the artifact measurement did not run - the graph reading above already answers the same from source";

console.log(`Outside the library bundle, and inside ${TOOL}: ${names} - ${measured}.`);
