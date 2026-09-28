/**
 * Section portrait guard: a piece whose SHAPE nobody is measuring.
 *
 * The `Progress` track came out square in a real app, and whoever found it was
 * the person using the library, sending a screenshot. The 1101 tests passed,
 * `tsc` passed, and `bun run visual` passed - because none of that sees a
 * corner. It was measured before this guard existed, by swapping
 * `rounded-pill` for `rounded-none` in `Progress` and reshooting the showcase:
 *
 *   whole page, 24x24 grid          0 of 576 squares, worst 0
 *   section column, 24x24 grid      0 of 576 squares, worst 3
 *   section block, 8px cell         4 squares, worst 19
 *
 * The square track moves 146 pixels out of 9.4 million - 0.0015% of the portrait.
 * The gray average of a 103x158 pixel square erases that by definition, and
 * the same average over an 8x8 square does not. What separates blind from
 * sighted here is not the number of squares in the grid, it is the SIZE of the
 * square in screen pixels; and the only way to have a small square without
 * storing a hundred and forty thousand numbers per portrait is for the frame to
 * be a section, and not a page.
 *
 * Six consecutive captures of the same tree, measured on 27/08/2026: 43 of the 44
 * portraits came out pixel-identical in all six, and among them the twelve
 * section frames. For those, the noise floor does not change with the smaller
 * cell - what changes is the sensitivity to real change. The old sentence
 * claimed this of ALL frames, and spoke of two captures; the PAGE portrait at
 * phone width did not fit in it.
 *
 * The forty-fourth was `paleta-celular`, and it flickered: in one of the six
 * runs it gave 1 of 576 squares, worst 5, against a `NOISE` of 4, and in the other
 * five it gave zero. The difference was 76 pixels out of 2.24 million, in a 2
 * by 38 pixel bar at x 74, y 1151 - the TEXT CURSOR of the `Command` search
 * field, which `demo/paleta.tsx` opens with `autoFocus` in the light theme
 * frame. A cursor blinks, and a photo of something that blinks comes out
 * according to the phase; the rest of the page came out the same in all six.
 *
 * The same cursor appears in the desktop `paleta`, and there it does not fire:
 * the same 2 by 38 pixel bar falls into a 103 by 93 square and is worth less
 * than two gray levels, and at phone width it falls into a 41 by 93 square and
 * is worth five. These are not two defects, it is the same one measured with a
 * square two and a half times narrower - that is why desktop stays silent while
 * phone lights up.
 *
 * Raising `NOISE` to 6 would silence the alarm and silence along with it every
 * change of that size in the 44 portraits - the square `Progress` track scored
 * only 3 in a page frame, and would stop scoring anything. So the way out was to
 * freeze the source of the oscillation, and not to blind the guard:
 * `demo/paleta.html` paints the cursor transparent. Ten captures after that gave
 * 0 pixels of difference at both widths, and against the old portrait the only
 * thing that changed was the cursor, in the same 76 pixels.
 *
 * This guard does not take portraits: it cannot, because the gate runs without
 * a browser - the portrait runs on the CI bench, which compares the base with
 * the head on the same runner because the committed signature is from macOS. It
 * demands the DECLARATION, as `check:scripts` and `check:demo` do - a section
 * declared in `scripts/portraits.ts` must have a `data-rc-shot` marker on the
 * demo page and a committed signature in `demo/assinaturas.json`. That is what
 * keeps the section portrait from going back to ad hoc: declaring without
 * shooting fails the gate the same day, and not months later, which is how the
 * three page signatures aged silently before `check:scripts`.
 */
import { SECTIONS, SIGNATURES, isSection, markers, shotName, slug } from "./portraits";

const problems: string[] = [];

const found = await markers();

const orphans = SECTIONS.filter((section) => !found.get(section.page)?.has(section.name));

if (orphans.length > 0) {
  problems.push(
    `${orphans.length} declared section(s) with no marker in the showcase:\n` +
      orphans.map(({ page, name }) => `    demo/${page}.tsx  ${name}`).join("\n") +
      "\n\n    The portrait's address is the demo's `data-rc-shot`. Without it Chrome" +
      "\n    shoots an error page, and the signature stores the error.",
  );
}

const stored: Record<string, number[]> = await Bun.file(SIGNATURES)
  .json()
  .catch(() => ({}));

const missing = SECTIONS.filter((section) => !stored[shotName(section)]);

if (missing.length > 0) {
  problems.push(
    `${missing.length} declared section(s) with no committed signature:\n` +
      missing.map((section) => `    ${shotName(section)}`).join("\n") +
      "\n\n    Run `bun run shot` and then `bun run visual --accept`, with your" +
      "\n    eyes on the PNGs in `demo/dist/` before accepting. A declaration without" +
      "\n    a portrait is the promise the next regression will collect on.",
  );
}

const declared = new Set(SECTIONS.map(shotName));
const rotten = Object.keys(stored).filter((name) => isSection(name) && !declared.has(name));

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} section signature(s) nobody declares anymore:\n` +
      rotten.map((name) => `    ${name}`).join("\n") +
      "\n\n    Either it goes back into `SECTIONS` in scripts/portraits.ts, or it leaves" +
      "\n    demo/assinaturas.json. A portrait nobody takes guards nothing.",
  );
}

const thin = SECTIONS.filter((section) => {
  const signature = stored[shotName(section)];
  return signature && signature.length - 2 !== (signature[0] ?? 0) * (signature[1] ?? 0);
});

if (thin.length > 0) {
  problems.push(
    `${thin.length} section signature(s) whose size does not add up:\n` +
      thin.map((section) => `    ${shotName(section)}`).join("\n") +
      "\n\n    The first two numbers are columns and rows, and the rest are the" +
      "\n    averages. Rewrite with `bun run shot && bun run visual --accept`.",
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

const cells = SECTIONS.reduce((sum, section) => sum + (stored[shotName(section)]?.length ?? 0), 0);
const pieces = [...new Set(SECTIONS.map((section) => `${section.page}/${slug(section.name)}`))];

console.log(
  `${SECTIONS.length} section portraits over ${pieces.length} area(s), ${cells} squares` +
    ` stored. Markers in the demo: ${[...found.values()].reduce((sum, set) => sum + set.size, 0)}` +
    " - any of them becomes a portrait with one line in scripts/portraits.ts.",
);
