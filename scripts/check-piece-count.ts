/**
 * Guard of the handwritten piece counts outside the site.
 *
 * The site does not get it wrong: the home page, the catalog and llms.txt read
 * `ENTRIES` at build time. What gets it wrong is the text nobody generates -
 * the README, which opened the catalog with "Fifty-five pieces" when there were
 * already eighty-three, and the package.json `description`, which announced
 * sixty-five in the npm registry itself. Both are the first thing someone reads
 * before installing, and both went stale silently because a wrong number does
 * not break a build.
 *
 * The skill had a guard from early on (`test/root-index.test.ts`), and that is
 * why it stayed right while these two slipped by thirty pieces. This guard only
 * extends the same idea to the places that were missing.
 *
 * The third place came later, and it contradicts the sentence above: the site
 * ALSO gets it wrong, in a single spot. `apps/docs/index.html` is static and
 * does not read `ENTRIES`, so its `description` went stale until it said 55
 * with the catalog at 91 - and since it is what link unfurling shows, the wrong
 * number traveled outside the site, in chat cards, without anyone opening the
 * page.
 *
 * The count comes from where the site takes its own: the documents in
 * `.design-sync/docs/`, minus the parts. A part is not a piece - `CardHeader`
 * lives on the `Card` page -, and whoever counts files instead of pieces gets
 * about DOUBLE the catalog.
 *
 * The ratio is written like this on purpose. The day's file count was hardcoded
 * here twice, and both went stale without anyone noticing - inside the very
 * guard that exists because a handwritten number goes stale silently. Hardcode
 * a digit again and it rots again, and this is the last place in the repository
 * that can afford that luxury.
 */
import { readdirSync } from "node:fs";

import { findParent } from "../apps/docs/src/parts";

const README = "README.md";
const PACKAGE = "package.json";
const INDEX = "apps/docs/index.html";

const names = readdirSync(".design-sync/docs")
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.replace(/\.md$/, ""));

const pieces = names.filter((name) => !findParent(name, names)).length;

const problems: string[] = [];

/*
 * In digits, and not spelled out.
 *
 * "Eighty-three pieces" would read better in the middle of the README's prose,
 * but no guard can check that without carrying a table of written numerals -
 * and the guard that does not check is the one that let the number go stale
 * until now.
 */
const readme = await Bun.file(README).text();
const declared = /^(\d+) pieces\./m.exec(readme);

if (!declared) {
  problems.push(
    `${README}: could not find the line that opens the catalog, in the form "<number> pieces.".\n` +
      `    Without it this guard stops checking without complaining.`,
  );
} else if (Number(declared[1]) !== pieces) {
  problems.push(`${README}: says ${declared[1]} pieces, and the catalog has ${pieces}.`);
}

const description = (await Bun.file(PACKAGE).json()).description as string;
const inPackage = /(\d+) (?:componentes|components)/.exec(description);

if (!inPackage) {
  problems.push(
    `${PACKAGE}: the description does not say "<number> components".\n` +
      `    It is the text npm shows in search; if its shape changes, adjust the guard with it.`,
  );
} else if (Number(inPackage[1]) !== pieces) {
  problems.push(
    `${PACKAGE}: the description says ${inPackage[1]} components, and the catalog has ${pieces}.`,
  );
}

const index = await Bun.file(INDEX).text();
const inIndex = /content="[^"]*?(\d+) (?:componentes|components)/.exec(index);

if (!inIndex) {
  problems.push(
    `${INDEX}: the meta description does not say "<number> components".\n` +
      `    It is what link unfurling shows, so the wrong number leaves the site.`,
  );
} else if (Number(inIndex[1]) !== pieces) {
  problems.push(
    `${INDEX}: the meta description says ${inIndex[1]} components, and the catalog has ${pieces}.`,
  );
}

if (problems.length) {
  console.error("Wrong piece count outside the site:\n");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nThe catalog is the source, and it changes every time a piece comes in. Rewrite\n" +
      "the places above, which are the only handwritten ones.",
  );
  process.exit(1);
}

console.log(`${pieces} pieces, and that is what the README, package.json and the site meta announce.`);
