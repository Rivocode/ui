/**
 * The guard's guard: a scan without a count floor.
 *
 * On 27/08/2026 four checks were found passing without measuring anything,
 * and the cheapest to repeat was this one: the file list comes back empty and
 * the check on top of it stays green. `test/accents.test.ts` was widened to
 * both packages with `{src/**\/*.{ts,tsx},native/src/**\/*.{ts,tsx}}` - a
 * NESTED brace, which bun's Glob does not expand. Zero files, zero accents
 * checked, green.
 *
 * Measuring the rest of the tree the same day, breaking each pattern on
 * purpose to see who turned red: eleven scans in `scripts/` exited with code
 * 0 reading ZERO files, among them `check:contrast`, which announced
 * contrast was ok in every theme without having opened a theme. In the
 * tests, six blocks passed with an empty list.
 *
 * One case is worse than the others and deserves naming: `check:comments`
 * declared `.design-sync/previews/*.tsx` in its list of areas and had scanned
 * zero files there since forever - bun's Glob skips a hidden folder when it
 * appears in the pattern, unless you ask for `dot`. The area was written and
 * never read, and nothing flagged it because zero files have no comment in
 * English.
 *
 * ## What this guard demands
 *
 * 1. **In `scripts/`**: `new Glob(` only in `scripts/scan.ts`. Whoever scans
 *    calls `scanAtLeast(pattern, floor)`, which demands the floor in the same
 *    call - you cannot ask for the files without saying how many you expect.
 *    It is the only form that survives the next script written in a hurry.
 *
 * 2. **In `test/` and `native/test/`**: every `new Glob(` or `readdirSync(`
 *    inside a `test(...)` block needs a floor IN THE SAME block. Outside a
 *    block - a top-of-file scan, a shared helper - the floor can be anywhere
 *    in the file.
 *
 * `readdirSync(` in `scripts/` is left out on purpose, and the reason was
 * measured: the five uses today compare the count with a number written by
 * hand - the README digit, the skill's, the showcase list -, and an empty list
 * there already comes out red. Demanding ceremony from whoever is already
 * right is how a noisy guard begins, and a noisy guard gets switched off the
 * second time.
 */
import { scanAtLeast } from "./scan";

const SCAN = /new Glob\(|\breaddirSync\(/g;
const FLOOR = /toBeGreaterThan(?:OrEqual)?\(|\bscanAtLeast\(|\bcountAtLeast\(/;

const HELPER = "scripts/scan.ts";

/**
 * The code without the prose lines.
 *
 * The cleanup is by LINE, and not by a comment regular expression, and the
 * reason was measured: `new Glob("src/components/*.tsx")` has `/*` inside the
 * quotes, and `"native/src/**\/*.{ts,tsx}"` has `*\/`. A cleaner that matches
 * `/* ... *\/` before the quotes deletes everything between the two - it was
 * 130 lines of `test/tokens.test.ts`, with the floorless scan this guard came
 * to catch right in the middle. The guard came out green hiding its own case.
 *
 * A line that starts with `//`, `*` or `/*` is prose. Since the call we look
 * for is code, not text, that is enough - and it has no way of swallowing
 * code by mistake.
 */
const withoutProse = (code: string) =>
  code
    .split("\n")
    .map((line) => (/^\s*(\/\/|\*|\/\*)/.test(line) ? "" : line))
    .join("\n");

/**
 * Who still writes `new Glob(` by hand in `scripts/`, and what prevents it.
 *
 * The list only shrinks, like the `OUT` of `check:scripts`: an entry that no
 * longer flags anything is an error, and the guard says to delete the line.
 */
const OUT: Record<string, string> = {};

type Problem = string;

const problems: Problem[] = [];

const paid = new Set<string>();

for (const file of await scanAtLeast("scripts/**/*.ts", 20)) {
  if (file === HELPER) continue;

  const code = withoutProse(await Bun.file(file).text());
  const bare = [...code.matchAll(/new Glob\(/g)];

  if (bare.length === 0) continue;

  if (file in OUT) {
    paid.add(file);
    continue;
  }

  problems.push(
    `${file}  ${bare.length} raw call(s) to Glob, without a count floor.\n` +
      "    Replace with `scanAtLeast(pattern, floor)` from `./scan`, which returns the\n" +
      "    same list and refuses a scan that is too short. If a floor makes no\n" +
      "    sense for this script, the line explaining why goes in the `OUT` of this\n" +
      "    guard - and not in a comment only whoever already opened the file reads.",
  );
}

const rotten = Object.keys(OUT).filter((file) => !paid.has(file));

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} \`OUT\` line(s) that no longer describe anything:\n` +
      rotten.map((file) => `    ${file}`).join("\n") +
      "\n\n    Either the file vanished, or it already switched to `scanAtLeast`. Delete the\n" +
      "    line in scripts/check-scan-floor.ts.",
  );
}

/**
 * Where the floor applies to a scan, by position and not by brace.
 *
 * Matching `{` with `}` looked obvious and does not work: a regular expression
 * with a brace inside throws off the count, and the swallowed block becomes the
 * whole file - where there is almost always a floor from another test. The
 * guard would stay green over the scan it came to catch, which is the same
 * family of defect it guards.
 *
 * The lexical cut does not have that flaw: from the previous `test(` to the
 * next one. What comes before the first test - a top-of-file scan, a shared
 * helper - answers for the whole file, because that is where its floor can be.
 */
function regionOf(code: string, at: number) {
  const starts = [...code.matchAll(/\b(?:test|it)(?:\.\w+)?\(\s*["'`]/g)].map((hit) => hit.index);

  const opened = starts.filter((start) => start < at).pop();
  if (opened === undefined) return code;

  const next = starts.find((start) => start > at) ?? code.length;
  return code.slice(opened, next);
}

for (const area of [
  ["test/**/*.{ts,tsx}", 60],
  ["native/test/**/*.{ts,tsx}", 20],
] as [area: string, floor: number][]) {
  for (const file of await scanAtLeast(area[0], area[1])) {
    const code = withoutProse(await Bun.file(file).text());

    for (const hit of code.matchAll(SCAN)) {
      const region = regionOf(code, hit.index);
      if (FLOOR.test(region)) continue;

      const line = code.slice(0, hit.index).split("\n").length;

      problems.push(
        `${file}:${line}  scan \`${hit[0].slice(0, -1)}\` without a count floor` +
          `${region === code ? " in the file" : " in the test block that uses it"}.\n` +
          "    Add `expect(files.length).toBeGreaterThan(n)` before\n" +
          "    walking the list. Without it, a pattern that stopped matching leaves the\n" +
          "    assertion green without it having opened a single file.",
      );
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} scan(s) without a count floor:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "A floor is a loose number, not today's count: it separates 'the tree" +
      "\nshrank a little' from 'the pattern stopped matching'. A floor glued to the count" +
      "\nturns red every time someone deletes a file, and a guard that complains" +
      "\nfor nothing gets switched off the second time.",
  );
  process.exit(1);
}

const excused = Object.keys(OUT)
  .map((file) => file.replace(/^scripts\/|\.ts$/g, ""))
  .join(", ");

console.log(
  "Every scan in `scripts/`, `test/` and `native/test/` declares how much it expects to find." +
    (excused
      ? ` Outside that, by declaration: ${excused} - the reason for each is in this guard's OUT.`
      : " This guard's OUT is empty."),
);
