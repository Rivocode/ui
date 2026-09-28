/**
 * Guard of the README's promise: a piece the catalog has and the README does not cite.
 *
 * `check:pieces` already checks the DIGIT - the README opens the catalog saying
 * "90 pieces." and fails if the number goes stale. The digit was right and the
 * list below it was not: of the 90 pieces, 49 appeared somewhere in the file and
 * 41 appeared nowhere. A true number on top of a list that covers little more
 * than half is worse than a wrong number, because nothing flags it and the
 * reader trusts both.
 *
 * This is the first guard of a new family here. The others check number, path,
 * color, contrast, export; none checked whether a handwritten list covers what
 * it promises to cover.
 *
 * ## The decision, because it is not obvious
 *
 * The README table is not the index, and that is a choice, not a delay. The
 * README is the page npm shows: its job is to get someone installed and to tell
 * apart the pieces that look alike - `Switch` versus `Checkbox`, `Progress`
 * versus `Meter`, `Accordion` versus `Collapsible`. Each piece gets ONE short
 * line in its family's table, and not its page: the line says what it is told
 * apart from, and that is all. The real index is generated, lives in
 * `/llms.txt` and never goes stale, and duplicating it by hand would create the
 * second handwritten catalog of this repository - the first one announced 55
 * pieces when there were already 83.
 *
 * So the guard demands two different things, and both come from the same
 * decision:
 *
 *   1. **The sentence.** The paragraph that opens the catalog has to say the
 *      table is NOT the index, and point to where the index is. While the
 *      sentence lies, the list below has no way of being right.
 *   2. **The coverage.** Every catalog piece is cited in the README, or has a
 *      line in `OUT_OF_README` saying WHY it is not. Both answers are valid;
 *      silence is not. It is the same agreement as `check:demo` and
 *      `check:scripts`: the guard cannot judge whether the piece deserves a
 *      line, but it can demand that someone has judged.
 *
 * `OUT_OF_README` **only shrinks**, like the showcase's `SEM_VITRINE` and the
 * scripts' `OUT`: a piece that became cited is an error, and the guard says to
 * delete the line. An exception list that does not shrink becomes the place
 * where debt lives without bothering anyone.
 *
 * The search is by word boundary, for the same reason as `check:demo`: `Card`
 * is inside `CardHeader` and `Button` is inside `ButtonGroup`. Without the
 * boundary, `ButtonGroup` - which is in fact not cited - would pass green
 * forever because of the eight occurrences of `Button`.
 *
 * Cited means anywhere in the file, and not only in the table. `RivoProvider`
 * and `MaskedInput` have their own section and no table line, and demanding the
 * table would force the guard to understand the README's layout - which changes
 * - instead of what it knows how to check: whether the name shows up for the
 * reader.
 */
import { readdirSync } from "node:fs";

import { findParent } from "../apps/docs/src/parts";

const DOCS = ".design-sync/docs";
const README = "README.md";

/**
 * What the catalog's opening sentence has to say.
 *
 * Two pieces because there are two promises: one says what the table is NOT,
 * the other says where the thing it is not lives. Missing either, the reader
 * walks away thinking they read the whole catalog.
 */
const HONEST = [
  { text: "is not the index", why: "the table has to say it is not the whole catalog" },
  {
    text: "https://ds.rivocode.com.br/llms.txt",
    why: "it is where whoever wants the full list goes, and it is generated",
  },
];

/**
 * The same source as `check:pieces` and `check:demo`.
 *
 * `.design-sync/docs/` minus the parts, and `findParent` from
 * `apps/docs/src/parts.ts` decides what a part is - the same one the site's
 * sidebar uses. Three guards count pieces, and counting differently is the
 * start of every wrong count in this repository.
 */
function catalogPieces() {
  const names = readdirSync(DOCS)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""))
    .sort();

  return names.filter((name) => !findParent(name, names));
}

/**
 * The pieces the README does not cite, and the reason for each.
 *
 * The reason is for whoever decides whether it is still worth leaving out, so
 * it says what PREVENTS it, not that it is missing. The list once had 37 lines
 * - pieces a sibling covered, charts, niche and real debt - and reached zero on
 * 25/09/2026, when each one got a line in its family's table. Reaching zero
 * showed the "niche" argument did not hold: a short table line costs less than
 * the paragraph that justified the absence.
 */
const OUT_OF_README: Record<string, string> = {};

const pieces = catalogPieces();
const readme = await Bun.file(README).text();

const problems: string[] = [];

for (const { text, why } of HONEST) {
  if (readme.includes(text)) continue;

  problems.push(
    `${README} no longer says "${text}" in the sentence that opens the catalog.\n` +
      `    ${why}.\n` +
      "    The table covers part of the pieces on purpose, and the sentence is the only\n" +
      "    place where that is written. Without it, the reader takes the table for the catalog.",
  );
}

const cited: string[] = [];
const declared: string[] = [];

for (const piece of pieces) {
  const named = new RegExp(`\\b${piece}\\b`);

  if (named.test(readme)) {
    cited.push(piece);

    if (OUT_OF_README[piece]) {
      problems.push(
        `\`${piece}\` is in OUT_OF_README and IS ALREADY cited in ${README}.\n` +
          "    The debt was paid: delete its line from the list. An exception that does not\n" +
          "    shrink becomes the place where the invisible piece hides.",
      );
    }
    continue;
  }

  if (OUT_OF_README[piece]) {
    declared.push(piece);
    continue;
  }

  problems.push(
    `\`${piece}\` appears nowhere in ${README}.\n` +
      "    Either it gets a line in its family's table - and the table says the difference\n" +
      "    between it and the look-alike neighbor, which is the README's job -, or it gets a\n" +
      "    line in OUT_OF_README, in scripts/check-readme-coverage.ts, saying what\n" +
      "    prevents it. Both answers are valid; silence is not.",
  );
}

for (const piece of Object.keys(OUT_OF_README)) {
  if (!pieces.includes(piece)) {
    problems.push(
      `\`${piece}\` is in OUT_OF_README and is not a catalog piece.\n` +
        `    Either the name changed, or the page in ${DOCS} is gone. Delete or fix the line:\n` +
        "    a dead entry makes the list look bigger than the debt.",
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) in ${README} coverage:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "The digit has had a guard since the README announced 55 pieces while having 83.\n" +
      "This guard looks after what comes after the digit: the list below it covered 49\n" +
      "of 90, and a true number on top of a half list flags nothing.",
  );
  process.exit(1);
}

console.log(
  `${cited.length} of ${pieces.length} pieces cited in ${README}, and ${declared.length} ` +
    "declared out, each with its reason.",
);
