/**
 * Guard for alpha applied over an already approved color.
 *
 * `check:contrast` measures token pairs: `danger-fg` over `danger`,
 * `success-text` over `success-subtle`. It does not see `opacity-70`. So the
 * math approved the FULL pair and the piece painted 70% of it, and the guard
 * stayed green over a screen that failed.
 *
 * There were three defects, all in the light theme, all invisible to the gate:
 *
 *   - the close X of the `Alert`, at `opacity-70` over `{tone}-subtle`,
 *     measured 2.77 on success and 2.66 on warning. 1.4.11 asks for 3;
 *   - the `hover:opacity-90` of the destructive Button measured 4.45, and AA
 *     asks for 4.5. It was the only variant whose hover was not a token;
 *   - five pieces disabled through `opacity-60` instead of `text-fg-disabled`.
 *
 * The repository already knew. `test/sibling-contract.test.tsx` demands "none
 * of the three disables through opacity" on Checkbox, Radio and Switch, and
 * explains this very reason - but the rule became a test of three pieces
 * instead of a guard, and the other seven were never looked at.
 *
 * ## Why only the web
 *
 * In `native/src` disabled IS `opacity-50`, on the whole layer, and that is
 * written and decided in `WITHOUT_PAIR` of `src/lib/contrast.ts`: on touch
 * there is no color role for disabled. Demanding the web rule there would
 * fail a decision, and a guard that flags a decision gets switched off in the
 * second week.
 *
 * ## What it demands
 *
 * Coverage both ways. Every occurrence of `opacity-<1..99>` in `src/` has to
 * be in `DECLARED`, with a reason; and every line of `DECLARED` that no longer
 * finds its occurrence has to go. Whoever declares a color pair has the ratio
 * MEASURED in both themes, with the alpha applied - writing the reason is not
 * enough. The list only shrinks.
 */
import { compose, contrastRatio, readTokens } from "../src/lib/contrast";
import { countAtLeast, scanAtLeast } from "./scan";

type Declared = {
  /** File suffix, without `src/`. */
  file: string;
  /** The alpha written in the class, from 1 to 99. */
  alpha: number;
  reason: string;
  /** When there is color to measure: the front role and the backgrounds it sits on. */
  front?: string;
  over?: string[];
  min?: number;
};

const DECLARED: Declared[] = [
  {
    file: "chart/chart-legend.tsx",
    alpha: 30,
    reason:
      "Marker of a series the person TURNED OFF. There is no text in the marker, and the state is already said by the `line-through` of the label beside it: color is not the only signal.",
  },
  {
    file: "chart/chart-legend.tsx",
    alpha: 60,
    reason:
      "Label of the turned-off series. It is the same case as disabled, which WCAG exempts, and it comes with `line-through` alongside.",
  },
  {
    file: "components/button.tsx",
    alpha: 80,
    reason: "Loading button, with `aria-busy` and the spinner beside it saying the same.",
    front: "--rc-fg-disabled",
    over: ["--rc-surface-raised"],
    min: 1.6,
  },
  {
    file: "components/color-picker.tsx",
    alpha: 60,
    reason:
      "Disabled color swatch. The button's content IS the color, so `text-fg-disabled` would have nothing to paint, and alpha is the only way to say it does not respond.",
  },
];

const CLASS_PATTERN = /(?<![\w-])opacity-(\d{1,2})(?![\d%])/g;

const files = await scanAtLeast("src/**/*.tsx", 60);
const found: Array<{ file: string; line: number; alpha: number }> = [];

for (const file of files) {
  const source = await Bun.file(file).text();
  source.split("\n").forEach((text, index) => {
    for (const [, alpha] of text.matchAll(CLASS_PATTERN)) {
      const value = Number(alpha);
      if (value === 0) continue;
      found.push({ file: file.replace(/^src\//, ""), line: index + 1, alpha: value });
    }
  });
}

const problems: string[] = [];

for (const hit of found) {
  const declared = DECLARED.find(
    (item) => item.file === hit.file && item.alpha === hit.alpha,
  );
  if (declared) continue;

  problems.push(
    `src/${hit.file}:${hit.line} paints \`opacity-${hit.alpha}\` and is not declared.\n` +
      "    Alpha over a token color degrades a pair that `check:contrast` approved at full,\n" +
      "    and it does not measure alpha: the guard stays green over a screen that fails.\n" +
      "    Either the state becomes a token (`text-fg-disabled`, `bg-surface-raised`), or\n" +
      "    it goes into DECLARED with the reason and, if there is color, the pair to measure.",
  );
}

for (const declared of DECLARED) {
  const alive = found.some(
    (item) => item.file === declared.file && item.alpha === declared.alpha,
  );
  if (alive) continue;

  problems.push(
    `DECLARED still holds \`opacity-${declared.alpha}\` in src/${declared.file}, which no longer exists.\n` +
      "    The list only shrinks: an exception that no longer flags anything is noise, and noise\n" +
      "    is what makes the next person stop reading the list. Delete the line.",
  );
}

const palette = await Bun.file("src/tokens/palette.css").text();
const themes = await scanAtLeast("src/tokens/themes/*.css", 2);
let measured = 0;

for (const file of themes) {
  const tokens = readTokens(palette + "\n" + (await Bun.file(file).text()));
  if (!tokens["--rc-bg"]) continue;

  for (const declared of DECLARED) {
    if (!declared.front || !declared.over || declared.min === undefined) continue;

    const front = tokens[declared.front];
    if (!front) {
      problems.push(`${file}: the theme does not declare \`${declared.front}\`, which DECLARED says to measure.`);
      continue;
    }

    for (const name of declared.over) {
      const back = tokens[name];
      if (!back) {
        problems.push(`${file}: the theme does not declare \`${name}\`, which DECLARED says to measure.`);
        continue;
      }

      const alpha = declared.alpha / 100;
      const degraded = compose(mixAlpha(front, alpha), back);
      const ratio = contrastRatio(degraded, back);
      measured += 1;

      if (ratio < declared.min) {
        problems.push(
          `${file}: \`${declared.front}\` at ${declared.alpha}% over \`${name}\` measures ${ratio.toFixed(2)}, ` +
            `below the minimum ${declared.min}.\n` +
            `    src/${declared.file} paints that alpha. The full pair passes, and that is why\n` +
            "    `check:contrast` did not see it.",
        );
      }
    }
  }
}

/** The same composite the browser does, written as a color with alpha. */
function mixAlpha(value: string, alpha: number): string {
  const hex = value.trim();
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match) {
    const to255 = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${hex}${to255}`;
  }
  return hex.replace(/^rgb\(([^)]+)\)$/, (_, body: string) => `rgb(${body} / ${alpha})`);
}

if (problems.length > 0) {
  console.error(`${problems.length} alpha-over-color problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "Alpha is not a state: it is a discount on a pair someone already measured whole.\n" +
      "A color state is written with a token, which `check:contrast` knows how to measure.",
  );
  process.exit(1);
}

countAtLeast("alpha measurement in DECLARED", measured, 1);

console.log(
  `${found.length} partial opacity uses in src/, all declared, and ${measured} alpha measurement(s) in the themes.`,
);
