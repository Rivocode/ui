/**
 * Language guard for comments.
 *
 * The sibling of `check:names`, and the half that was missing. That one
 * enforces the identifier side - English, always. This one enforces the
 * other: comments and JSDoc in English, like the rest of the internal
 * material. The text that goes to the SCREEN stays in Portuguese, and it is
 * not a comment, so this guard never reads it.
 *
 * It was born the other way around. Until 28/09/2026 the house wrote its
 * comments in Portuguese, and this file flagged English: four whole areas had
 * been written in English with nobody warned - `apps/docs/src/**`,
 * `src/chart/chart-axis.tsx`, `src/lib/format.ts` and `scripts/accents.ts` -,
 * because a rule that only lives in the documentation is a suggestion. When
 * the owner moved everything internal to English, the guard kept its shape and
 * swapped its dictionary: the incident it protects against is the same, a
 * language decision that nothing enforces.
 *
 * ## Why it can ask "is this Portuguese?"
 *
 * It cannot, and it does not try. Guessing a language by vocabulary is the
 * road to false positives: a comment that cites a Brazilian term - CPF, boleto,
 * Pix, a screen label like "Salvar" - is still an English comment.
 *
 * What it looks at is the CLOSED CLASS: article, pronoun, preposition,
 * conjunction. `que`, `nao`, `para`, `quando`, `porque`, `uma`. They are few,
 * they do not grow, nobody invents them, and none of them is a CSS property, an
 * API method or a package name. A Portuguese sentence does not go two lines
 * without several of them; an English sentence uses none.
 *
 * Two DIFFERENT words in the same comment is the cut. One could be a quoted
 * label. Two is already Portuguese syntax. Quoted text and code between
 * backticks are removed before counting, because that is where screen text is
 * cited on purpose.
 */
import { scanAtLeast } from "./scan";

/** The same areas as `check:names`: everything that is our code. */
const AREAS: [area: string, floor: number][] = [
  ["src/**/*.{ts,tsx}", 80],
  ["scripts/**/*.ts", 20],
  ["test/**/*.{ts,tsx}", 60],
  ["demo/*.tsx", 10],
  ["native/src/**/*.{ts,tsx}", 60],
  ["mcp/src/**/*.ts", 3],
  [".claude/skills/*/scripts/*.{ts,mts}", 1],
  ["apps/docs/src/**/*.{ts,tsx}", 20],
  ["apps/docs/*.ts", 1],
  [".design-sync/previews/*.tsx", 80],
];

/**
 * The Portuguese closed class.
 *
 * Chosen by a single question: can this word show up alone, outside a
 * sentence, as the name of a thing? `data`, `valor`, `nome` and `campo` can,
 * and they were left out however useful they looked. `que` and `porque`
 * cannot, and that is what the guard lives on. `com` needs the lookbehind
 * because of `.com` in a URL.
 */
const PORTUGUESE =
  /(?<![.\w])(?:que|nao|não|para|quando|porque|uma|com|sem|pelo|pela|pelos|pelas|dos|das|esta|este|isso|isto|ser|sao|são|tem|mas|onde|entao|então|tambem|também|ainda|cada|depois|aqui|fica|deve|pode|sobre|ela|ele|seu|sua|voce|você|mesmo|mesma|antes|porém|porem|nunca|sempre|agora)(?![\wÀ-ÿ])/gi;

/**
 * What talks ABOUT Portuguese.
 *
 * This guard carries the list of Portuguese words as data, `check:names`
 * carries the suffixes and the words that leak into identifiers, and
 * `scripts/accents.ts` carries the accent dictionary. Flagging them would be
 * the guard biting its own list.
 */
const DICTIONARIES = /check-comments-in-english|check-names-in-english|scripts\/accents\.ts/;

/**
 * The debt left for later. Today: none.
 *
 * The list stays here empty because the mechanism is what matters, not the
 * lines: the next collision between the guard and a file under construction
 * has a place to be written down without anyone reinventing the agreement.
 * The agreement is that it ONLY SHRINKS - an entry that no longer flags is an
 * error, and the guard says to delete the line. That is what keeps this list
 * from becoming the place where Portuguese lives.
 */
const DEBT = new Set<string>([]);

/** Removes what is cited, not written: code between backticks and quoted text. */
const withoutCitations = (comment: string) =>
  comment
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/"[^"\n]*"/g, " ")
    .replace(/'[^'\n]*'/g, " ");

const found: string[] = [];
const paid = new Set<string>();

for (const [area, floor] of AREAS) {
  for (const file of await scanAtLeast(area, floor, { dot: true })) {
    if (DICTIONARIES.test(file)) continue;

    const text = await Bun.file(file).text();

    for (const hit of text.matchAll(/\/\*[\s\S]*?\*\/|(?<![:"'`\w])\/\/[^\n]*/g)) {
      const words = [
        ...new Set(
          (withoutCitations(hit[0]).match(PORTUGUESE) ?? []).map((word) => word.toLowerCase()),
        ),
      ];
      if (words.length < 2) continue;

      if (DEBT.has(file)) {
        paid.add(file);
        continue;
      }

      const line = text.slice(0, hit.index!).split("\n").length;
      const opening = hit[0].replace(/\s+/g, " ").slice(0, 72);
      found.push(`  ${file}:${line}  (${words.slice(0, 4).join(", ")})\n    ${opening}`);
    }
  }
}

if (found.length > 0) {
  console.error(`${found.length} comment(s) in Portuguese:\n`);
  for (const item of found) console.error(item);
  console.error(
    "\nThe library writes to the screen in Portuguese and programs in English." +
      "\nIdentifiers, comments and JSDoc go in English - and a prop's JSDoc ships" +
      "\nin the props table the site publishes." +
      "\n\nScreen text stays in Portuguese, with accents, and it is not a comment.",
  );
  process.exit(1);
}

const stale = [...DEBT].filter((item) => !paid.has(item));
if (stale.length > 0) {
  console.error(`${stale.length} debt line(s) that no longer flag anything:\n`);
  for (const item of stale) console.error(`  "${item}",`);
  console.error(
    "\nThe file was translated, and the debt was paid. Delete these line(s) from" +
      "\n`DEBT` in scripts/check-comments-in-english.ts - an exception list that" +
      "\ndoes not shrink becomes the place where Portuguese hides.",
  );
  process.exit(1);
}

console.log(
  DEBT.size === 0
    ? "Every comment in English, and no declared debt."
    : `Every comment in English, except the ${DEBT.size} debts already declared.`,
);
