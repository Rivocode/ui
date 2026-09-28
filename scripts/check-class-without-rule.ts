/**
 * Dead class guard: a name that looks like a utility, generates no rule at
 * all, and draws an error from nobody.
 *
 * The measured case: `native/src/slider.tsx` painted the thumb with
 * `shadow-1`, a class the native CSS never emitted - `grep -c shadow
 * native/theme.css` gave zero. On the web it exists, someone copied it by
 * analogy, and the thumb of the native `Slider` spent its whole life without a
 * shadow. Nothing flagged it: `tsc` passes, `oxlint` passes, `bun test`
 * passes, the package publishes, and the defect only shows up on the screen of
 * whoever installed it.
 *
 * It is the worst kind of defect in this house, because the class vanishes
 * WITHOUT STYLE AND WITHOUT ERROR. `check:groups` says in its header that "the
 * orphan class scan does not catch it"; this is the orphan class scan, and the
 * two guards measure different things: there the selector exists and never
 * matches, here the rule never gets born.
 *
 * ## How to know whether the class generates a rule
 *
 * By the compiler, and not by a list of known names. Tailwind's
 * `__unstable__loadDesignSystem` builds the same design system the build
 * builds, from the SAME entry CSS, and `candidatesToCss` returns `null` for a
 * candidate it does not know how to compile. So `shadow-1` comes back null on
 * native and comes back a rule on the web, which is exactly the difference
 * nobody saw. Variants, arbitrary values and opacity modifiers go through the
 * same path as the build, with no parallel rule to grow stale here.
 *
 * ## How to know whether the string is a class list
 *
 * This is the hard side, and the first attempt was measured before it became
 * a guard: accepting every string spits 145 warnings on native and 217 on the
 * web - `--color-accent`, `aaaa-mm-dd`, package names, object keys. Noise on
 * that scale is a guard nobody reads.
 *
 * The cut that reached a clean signal has two doors, and a string comes in
 * through one or the other:
 *
 *  1. **position.** A literal attached to `className=` or `class=` is a class
 *     list by construction, even if none of its tokens compiles - it is the
 *     only way to catch a lone `className="shadow-1"` in a piece.
 *  2. **company.** Anywhere else - an argument of `cn(...)`, a variant map, a
 *     ternary -, the string counts as a class list when at least ONE of its
 *     tokens compiles. A token that does not compile next to a token that
 *     does is the defect; a loose token with no company at all is prose.
 *
 * With both doors: 145 warnings become 1 on native, and the 1 was real.
 *
 * The company door refuses a string with an English closed-class word in it
 * (`PROSE`): that is a sentence, and a sentence in English easily carries a
 * word that is also a utility.
 *
 * ## Scope: both packages
 *
 * `src/**` too, and not only `native/src/**`. It was measured on both, with
 * each one's CSS: the web comes out clean today, but the mechanism of the
 * defect is identical there - Tailwind ignores a candidate it does not
 * understand, with another configuration and another set of tokens. A guard
 * covering half the house would let the same error in through the side that is
 * clean today, and the web piece is the one that changes the most.
 *
 * Left out are `demo/`, `.design-sync/previews/` and `apps/docs/`: none is
 * published as a package, and each compiles with its own CSS entry, with
 * `@source` and tokens that are not the library's. Measuring with the wrong
 * CSS invents accusations.
 *
 * ## No exception list, on purpose
 *
 * Both trees come out clean with the rules above, so there is no `DEBT` here,
 * and one should not be born. Two token classes are left out by RULE, and not
 * by name:
 *
 *  - `group`, `peer`, `group/x`, `peer/x` - markers, not utilities. They
 *    generate no rule in any version of Tailwind, and whoever checks that a
 *    marker has a consumer is `check:groups`.
 *  - a token without a single letter (`0`, `1px`, `1.5`) - it was never a
 *    class, and it shows up when a string of abbreviated values falls through
 *    the company door.
 *
 * ## The shadow that made the guard be born
 *
 * The class left the `Slider` instead of the scale being generated, and the
 * three measurements that decided it:
 *
 *  1. `react-native-css@3.0.7` TRANSLATES `box-shadow` into React Native's
 *     `boxShadow` - with `light-dark()` turning into a
 *     `prefers-color-scheme` rule, and each layer into `offsetX`, `offsetY`,
 *     `blurRadius`, `spreadDistance` and `color`. Shadow on touch is not a
 *     lost idiom;
 *  2. but Tailwind's `shadow-*` utility does not get there. It goes through
 *     the `--tw-shadow` chain, and the second declaration of that variable -
 *     the rule, on top of the `:root` that `native/scripts/build-css.mjs`
 *     synthesizes from the `@property` - brings the native compiler down with
 *     "failed to deserialize; expected an object-like struct named
 *     Specifier". Generating the scale in `@theme` would not give a shadow: it
 *     would give an app that does not compile CSS, which is the same damage the
 *     `@source not inline("shadow")` of `examples/native/global.css` already
 *     avoids;
 *  3. and the thumb does not need it. The web `Slider` has no shadow on the
 *     thumb at all - `size-4 rounded-pill border border-accent bg-surface`
 *     -, so the class was never parity, but invention. Measured with
 *     `src/lib/contrast.ts`, the `bg-fg` thumb over the `bg-skeleton` track
 *     gives 12.97:1 to 15.23:1 in both themes and over both backgrounds,
 *     against a minimum of 3:1 from 1.4.11.
 */
import { scanAtLeast } from "./scan";
import { __unstable__loadDesignSystem } from "tailwindcss";
import { dirname, isAbsolute, join, resolve } from "node:path";

/** Every string in the code: double quotes, single quotes and backticks. */
const LITERAL =
  /"([^"\\\n]*(?:\\.[^"\\\n]*)*)"|'([^'\\\n]*(?:\\.[^'\\\n]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`/g;

/** `className="..."`, `class={"..."}` - the position door. */
const AT_CLASS = /\bclass(?:Name)?\s*=\s*\{?\s*("[^"\n]*"|'[^'\n]*'|`[^`\n]*`)/g;

/** `group`, `peer`, `group/bar` - a marker, measured by `check:groups`. */
const MARKER = /^(?:group|peer)(?:\/|$)/;

const MODULES = "node_modules";

/**
 * The entry CSS of each package, word for word the same the build uses.
 *
 * Native has no committed entry file: whoever assembles it is the consuming
 * app's `global.css`, and the three lines below are the three of it that
 * decide which classes exist. `@source` is left out because the design system
 * does not scan code - the one that scans is this guard.
 */
const AREAS = [
  {
    name: "web",
    css: { path: "src/styles.css", text: null as string | null },
    trees: [["src/**/*.{ts,tsx}", 80]] as [area: string, floor: number][],
  },
  {
    name: "native",
    css: {
      path: "native/entry.css",
      text:
        `@import "tailwindcss/theme.css" layer(theme);\n` +
        `@import "./theme.css";\n` +
        `@import "tailwindcss/utilities.css";\n`,
    },
    trees: [["native/src/**/*.{ts,tsx}", 60]] as [area: string, floor: number][],
  },
];

async function loadStylesheet(id: string, base: string) {
  let path = isAbsolute(id) ? id : resolve(base, id);
  if (!id.startsWith(".") && !isAbsolute(id)) {
    path = join(process.cwd(), MODULES, id);
    const file = Bun.file(path);
    if (!(await file.exists())) path = join(process.cwd(), MODULES, id, "index.css");
  }
  return { path, base: dirname(path), content: await Bun.file(path).text() };
}

/** One candidate judge per package, with memory: the same token repeats a lot. */
async function compilerOf(css: { path: string; text: string | null }) {
  const text = css.text ?? (await Bun.file(css.path).text());
  const system = await __unstable__loadDesignSystem(text, {
    base: dirname(resolve(css.path)),
    loadStylesheet,
    loadModule: () => Promise.reject(new Error(`No plugin nor config: ${css.path}`)),
  });

  const known = new Map<string, boolean>();
  return (token: string) => {
    const cached = known.get(token);
    if (cached !== undefined) return cached;
    const compiles = system.candidatesToCss([token])[0] !== null;
    known.set(token, compiles);
    return compiles;
  };
}

/** A token that was never a class, by shape and not by name. */
const skipped = (token: string) =>
  token.endsWith("-") || token.includes("$") || MARKER.test(token) || !/[a-zA-Z]/.test(token);

/**
 * English prose, by its closed class. The company door was measured when the
 * internal text was Portuguese, and Portuguese never shares a word with a
 * utility. English does: a developer message reading "the panel stays hidden
 * and the table goes blank" has `hidden` and `table` for company, and 385
 * words of CLI and warning text came in as classes the day the house moved to
 * English. No utility is named `the`, `of` or `is`, so a string carrying one of
 * them is a sentence, whatever else it carries.
 */
const PROSE = new Set([
  "the", "a", "an", "of", "to", "is", "are", "was", "be", "and", "or", "that",
  "this", "it", "in", "on", "with", "for", "not", "no", "by", "from", "as", "at",
  "has", "have", "does", "do", "can", "cannot", "would", "should", "when", "if",
]);
const isProse = (tokens: string[]) =>
  tokens.some((token) => PROSE.has(token.toLowerCase().replace(/[.,:;!?]+$/, "")));

const problems: string[] = [];
let scanned = 0;

for (const area of AREAS) {
  const compiles = await compilerOf(area.css);

  for (const [tree, floor] of area.trees) {
    for (const file of await scanAtLeast(tree, floor, { dot: true })) {
      const code = await Bun.file(file).text();
      scanned += 1;

      const atClass = new Set<number>();
      for (const hit of code.matchAll(AT_CLASS)) {
        atClass.add(hit.index + hit[0].length - hit[1]!.length);
      }

      for (const hit of code.matchAll(LITERAL)) {
        const raw = hit[1] ?? hit[2] ?? hit[3] ?? "";
        // Interpolation becomes a space: `${base} h-4` is two tokens, and what
        // is inside the braces is the caller's problem.
        const tokens = raw
          .replace(/\$\{[^{}]*\}/g, " ")
          .split(/\s+/)
          .filter(Boolean);
        if (tokens.length === 0) continue;

        const list = atClass.has(hit.index) || (!isProse(tokens) && tokens.some(compiles));
        if (!list) continue;

        for (const token of tokens) {
          if (compiles(token) || skipped(token)) continue;
          const line = code.slice(0, hit.index).split("\n").length;
          problems.push(`${file}:${line}  "${token}"  on ${area.name}: no rule`);
        }
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} class(es) without a rule:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nTailwind ignores a candidate it does not understand, and nobody complains: the piece\n" +
      "ships without the style, the gate stays green and the package publishes. That is how\n" +
      "the native Slider thumb lived without a shadow.\n" +
      "Either the name is wrong, or the token behind it does not exist in that\n" +
      "package - and the second hypothesis is the one nobody remembers to check.\n" +
      "On the web there is a third: the word is in the `@source not inline` of\n" +
      "src/styles.css, which cuts event, tag and method names the scanner\n" +
      "read as classes. If it became a real class, take it out of there.",
  );
  process.exit(1);
}

console.log(
  `Every class in ${scanned} files generates a rule, in both packages, and with no exception list.`,
);
