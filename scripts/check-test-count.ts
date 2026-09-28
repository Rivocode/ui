/**
 * Guard for the test count the home page displays.
 *
 * Of the four showcase numbers, three come from the catalog at build time and
 * age on their own; the test one was the only one hard-coded by hand, and so the
 * only one that lied. It has lied twice already: it stayed at 292 after the
 * suite went past 292, and at 348 while it was reaching 552. Nobody saw it
 * because a wrong number does not break a build - it just sits there, on the
 * first screen someone reads before deciding to adopt the library, claiming
 * less assurance than there is.
 *
 * The obvious route - counting in the site build - does not work: the count only
 * exists after the suite runs, and for one digit the Vercel deploy would pay for
 * the whole suite on every push. So the number stays versioned in the home page
 * itself, and what keeps it honest is this guard, which runs in `bun run check`
 * with the others.
 *
 * What the number means: the whole root suite, `test/` (web) and
 * `native/test/`. It is the same `bun test` the check runs at the end, and that
 * is why the label on the home page speaks of both halves.
 */
import { $ } from "bun";

/**
 * The suite's two folders, and only them.
 *
 * Without the scope, the guard counted the WORKING TREE: any scratch folder at
 * the root with a `*.test.tsx` entered the count. On 27/08 an audit bench with
 * three files made the guard ask for `TESTS = 1081` when the tracked suite had
 * 1074, and whoever obeyed would have written on the home page a number made up
 * by a directory that is not even in git. It is the incident this guard exists
 * to prevent, committed by the guard itself.
 *
 * The two folders are the ones the top JSDoc always declared as the meaning of
 * the number. It was the code that did not say so.
 */
const SUITES = ["test/", "native/test/"];

const HOME_FILE = "apps/docs/src/pages/home.tsx";
const HOME_CONST = "TESTS";

/**
 * Counts without running.
 *
 * `-t` with a pattern that matches nothing makes bun walk the files, declare
 * each test and skip them all - it answers "skipping N tests", which is exactly
 * the N we want, for a fraction of the suite's time (~2s against ~9s). It
 * matters because this guard sits in a chain that already ends in `bun test`:
 * charging for the suite twice would be paying dearly to check one digit.
 *
 * bun exits with an error code when the filter does not match - which here is
 * the expected case, and not a failure - and writes the line to stderr.
 */
async function countSkipping() {
  const run = await $`bun test ${SUITES} -t ___no-match___`.nothrow().quiet();
  const output = run.stderr.toString() + run.stdout.toString();

  const tests = /skipping (\d+) tests?/.exec(output);
  const files = /Searched (\d+) files?/.exec(output);
  if (!tests || !files) return undefined;

  return { tests: Number(tests[1]), files: Number(files[1]) };
}

/**
 * Plan B: run the suite for real and read its footer.
 *
 * The sentence the mode above reads is from the report of an empty filter, and
 * not a bun contract - a new version may rewrite it. If that happens, the guard
 * gets slow before it gets wrong, which is the right order: a guard that stops
 * finding what it looks for is worse than one that takes a while.
 */
async function countRunning() {
  const run = await $`bun test ${SUITES}`.nothrow().quiet();
  const output = run.stderr.toString() + run.stdout.toString();

  const total = /Ran (\d+) tests? across (\d+) files?/.exec(output);
  if (!total) return undefined;

  return { tests: Number(total[1]), files: Number(total[2]) };
}

const counted = (await countSkipping()) ?? (await countRunning());

if (!counted) {
  console.error("Could not count the tests: `bun test` changed its report format.");
  console.error(
    "\nAdjust the two expressions in scripts/check-test-count.ts to the" +
      "\nnew text. Meanwhile, the home page number has nobody checking it.",
  );
  process.exit(1);
}

const home = await Bun.file(HOME_FILE).text();
const declared = new RegExp(`^const ${HOME_CONST} = (\\d+)$`, "m").exec(home);

if (!declared) {
  console.error(`Did not find \`const ${HOME_CONST} = <number>\` in ${HOME_FILE}.`);
  console.error(
    "\nThe guard finds the number by that exact line. If it changed name or" +
      "\nshape, the guard stops checking without complaining - which is how the old" +
      "\ndigit survived before.",
  );
  process.exit(1);
}

const written = Number(declared[1]);

if (written !== counted.tests) {
  console.error(
    `The home page announces ${written} tests, and the root suite has ${counted.tests}` +
      ` in ${counted.files} files.\n`,
  );
  console.error(`Rewrite in ${HOME_FILE}:\n\n  const ${HOME_CONST} = ${counted.tests}\n`);
  console.error(
    "It is the first thing someone reads about how well the library is tested:" +
      "\nleaving the old digit is promising less - or more - than there is.",
  );
  process.exit(1);
}

console.log(`${counted.tests} tests in ${counted.files} files, and that is the number the home page displays.`);
