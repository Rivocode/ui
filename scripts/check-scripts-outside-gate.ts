/**
 * Orphan script guard: a file in `scripts/` that `bun run check` never runs.
 *
 * `visual-regression.ts` spent months like that. It only runs through
 * `bun run visual`, nothing calls it in the gate, and the only place where it
 * was written that it exists and why it was left out was the file's own
 * header - the place that whoever does not know it exists never opens. The
 * result was measured on the day this guard was born: on a clean tree,
 * `bun run visual` already flagged three portraits off the committed
 * signature, one of them with 50.2% of the squares changed and a worst case of
 * 237 out of 255. Nobody had noticed, and nothing noticed: the signature grew
 * stale the same way the README's piece count grew stale by thirty pieces
 * before `check:pieces` existed.
 *
 * The way out is not dragging everyone into the gate. Some do not fit:
 * `visual-regression.ts` depends on the PNGs of `bun run shot`, which spends
 * 77s of Chrome on a fixed macOS path, and CI is ubuntu; besides, font
 * rendering changes between machine and system, so a signature taken here does
 * not match there. A guard that requires a binary CI does not have does not
 * enter the gate. (Since 24/09/2026 Chrome is configurable through
 * `RC_CHROME` and the three run on the CI bench, base against head - but they
 * stay out of the gate, which has to run on a clean clone with no browser.)
 *
 * What this guard demands is the DECLARATION. Every `scripts/**\/*.ts` has to
 * be reachable from `bun run check` - by command or by import, including an
 * import a test makes, since `bun test` is in the gate - or have a line in
 * `OUT` saying why it is not. That way the next person finds the script by
 * reading a guard they already run, and not by opening a file nobody opens.
 *
 * `OUT` only shrinks, like the `DEBT` of `check:comments`: an entry that
 * became reachable, or that points to a deleted file, is an error - an
 * exception list that does not shrink becomes the place where dead code lives.
 */
import { Glob } from "bun";
import { scanAtLeast } from "./scan";
import { dirname, join, normalize } from "node:path";

const PACKAGE = "package.json";
const GATE = "check";

/**
 * Who stays out, and the reason in one line.
 *
 * The reason is for whoever decides whether staying out is still worth it -
 * that is why it says what prevents it, and not just that it is out.
 */
const OUT: Record<string, string> = {
  "scripts/visual-regression.ts":
    "Compares portraits with signatures: it needs the PNGs of `bun run shot`, which needs Chrome, and font rendering changes between systems - the committed signature was born on macOS and does not match on linux. On the machine: `bun run shot && bun run visual` before creating the tag. On CI it runs on the bench (`.github/workflows/bancada.yml`) with `--record-to`, base against head on the same runner, and the judge is `scripts/bench-comparison.ts`. What the gate reaches of it is `check:portraits`, which demands the declaration of each section portrait without a browser.",
  "scripts/shot.ts":
    "Photographs the showcase and the sections with the Chrome of `RC_CHROME` (the default is the macOS one), and spends minutes of browser. It runs on the CI bench, over the base and over the head, and not in the gate, which has to run on a clean clone with no browser.",
  "scripts/accessibility.ts":
    "Accessibility bench of the showcase (`bun run a11y`): it runs axe-core, focus after the action, the 24px target and reflow at 320px inside the Chrome of `RC_CHROME`, and reads `demo/dist`, which only exists after `bun run demo`. It flags what the pieces have TODAY, and entering the gate before the list reaches zero would leave `check` red on every tree. On CI it runs on the bench with `--json`, and what fails is a problem the head has that the base does not.",
  "scripts/serve.ts":
    "Static server for the showcase: it checks nothing, it only serves `demo/` to the Chrome of `shot`.",
  "scripts/native-catalog-props.ts":
    "Reads the native package's types, and react and react-native are only installed in `examples/native`, which is not a workspace: `bun install --frozen-lockfile` at the root never brings them. Worse than failing, it would PASS lying - without the peers, `Omit<TextInputProps, ...> & {...}` collapses and ten pieces come out without props. That is why the table is a committed artifact: whoever generates it needs the app installed, and `--check` runs in the CI `nativo` job, next to `check:native:types`. What the gate reaches of it is `check:signature`, which reads the JSON.",
  "scripts/mcp-smoke.ts":
    "Starts `mcp/dist/cli.js` with `node` over stdio, and `mcp/dist` only exists after `bun run build`. It runs in `ci.yml` right after the build, and in `release-mcp.yml` before `npm publish`. What the gate reaches of the server is `test/mcp-server.test.ts`, which starts it in memory.",
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
    `${orphans.length} script(s) that \`bun run check\` never runs:\n` +
      orphans.map((file) => `    ${file}`).join("\n") +
      "\n\n    Either it enters the gate - a `check:something` in `package.json`, chained" +
      "\n    into `check` -, or it gets a line in this guard's `OUT` saying what" +
      "\n    prevents it. A script nobody runs grows stale in silence.",
  );
}

const declared = await Promise.all(
  Object.keys(OUT).map(async (file) => ({ file, exists: await Bun.file(file).exists() })),
);

const rotten = declared
  .filter(({ file, exists }) => !exists || paid.has(file))
  .map(({ file, exists }) =>
    exists
      ? `    "${file}" - the gate already reaches it, and the exception no longer applies.`
      : `    "${file}" - the file no longer exists.`,
  );

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} \`OUT\` line(s) that no longer describe anything:\n` +
      rotten.join("\n") +
      "\n\n    Delete it from `OUT` in scripts/check-scripts-outside-gate.ts. An exception" +
      "\n    list that does not shrink becomes the place where dead code lives.",
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

const names = Object.keys(OUT).map((file) => file.replace(/^scripts\/|\.ts$/g, ""));

console.log(
  `Every script in \`scripts/\` is in the gate. Outside it, by declaration: ${names.join(", ")}` +
    " - the reason for each is in this guard's OUT.",
);
