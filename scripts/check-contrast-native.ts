/**
 * Contrast guard for the MAP theme - the half of the themes that
 * `check-contrast` does not see.
 *
 * `check-contrast` reads CSS: it opens `src/tokens/themes/*.css`, resolves
 * `var()` and measures the pairs. It so happens the native side has no theme
 * CSS. At the time, the `RivoProvider` of `@rivocode/ui-native` received the
 * client theme as an object - the 45 roles in `light` and in `dark` - and no
 * line of the gate measured a single color of it. The effect is what the
 * report describes: a client theme written for the phone could ship with
 * unreadable text and the gate stayed green, while the SAME error in CSS
 * failed. Whoever felt it ported the math by hand, outside the repository, and
 * math done by hand ages silently. The object prop died later, and the
 * `light`/`dark` pair is still the SHAPE this guard measures: it is what
 * `bun run gen:native --tema` emits, and it is where a client theme passes
 * through before becoming CSS.
 *
 * The math does not change; the SHAPE of the data changes, and that is where
 * the door was left open. The generator emits alpha as
 * `rgba(212,243,74,0.14)`, which is what React Native understands, and the
 * `compose` of `check-contrast` only knew `rgb(212 243 74 / 0.14)`. Measured
 * before writing this guard: it returned the string untouched and
 * `contrastRatio` answered NaN. That is why `compose` learned the three
 * syntaxes instead of this guard getting its own - the WCAG math lives in a
 * single place, and both guards measure with the same code.
 *
 * **That place is `src/lib/contrast.ts`, and no longer `scripts/`.** The math
 * and the engine of this file moved there because `scripts/` is not in the
 * `files` of either package: while it stayed here, whoever consumes the
 * library had nothing to import and ported everything by hand. What is left
 * here is the GUARD: the list of roles of the house map, the debt it does not
 * arm, and the command. `checkThemeMap` stays exported from the published
 * module, so that whoever measures the CONSUMER's theme calls the same pair
 * table instead of porting it by hand again, which is what gave rise to this
 * guard.
 *
 * ## The pairs are not the same, and that is a decision
 *
 * Native is not the web with another syntax: it is another finger. A pair
 * that only makes sense with a pointer does not come in, and a pair that only
 * exists on touch does.
 *
 * Out, with the reason on each line of `WITHOUT_PAIR`: `ring` (there is no
 * keyboard focus on touch), `accent-hover` and `line-hover` (there is no
 * pointer), and the LOCKED boundary pair - the one with a floor AND a ceiling,
 * the only one on the web with both -, because `border-disabled` is not used
 * even once in `native/src`: disabled there is `opacity-50` on the whole
 * layer, which is another idea and not a color role.
 *
 * In come four that only exist here:
 *
 * - **the primary button label UNDER THE FINGER.** `active:bg-accent-active`
 *   swaps the fill while the person holds it, and the label stays on screen.
 *   Touch has a pressed state the way the pointer has hover, and this is the
 *   one the person reads while holding still.
 * - **alpha over alpha.** In the `Calendar`, the range cell is already
 *   `selected` and the day under the finger gets `selected` AGAIN, one View
 *   inside the other. The web does not stack those two; here the text reads
 *   over two layers, and the guard composes both before measuring. Today's
 *   boundary inside the range comes in for the same reason.
 * - **the layer at 90%.** See the `MAP_LAYER_PAIRS` block, below.
 * - **the `Slider` thumb inside the empty track.** The track is the same
 *   `bg-skeleton` in both packages, but the thumb is not: on the web it is
 *   `border-accent bg-surface`, and here it is a `bg-fg` circle with a
 *   `border-border-strong` border. Different roles in the same place on the
 *   screen, so the pair belongs here and not there. See the block below.
 *
 * ## Composed alpha: does React Native compose the same way? Almost, and the
 * "almost" bites
 *
 * Measured, not assumed. For the token's OWN alpha the math is identical to
 * CSS - `alpha * color + (1 - alpha) * background`, in sRGB, source-over. The
 * three syntaxes agree with each other on the same pixel:
 * `rgb(212 243 74 / 0.14)`, `rgba(212,243,74,0.14)` and the eight-digit form
 * over the dark background give the same value, all three. And there is no
 * blend mode nor elevation in `native/src` to mess up the order: the layers are
 * those of the Views, and that is all.
 *
 * What has NO parallel in this house's CSS is React Native `opacity`. It does
 * not paint a translucent background: it flattens the WHOLE layer - fill and
 * label together - and composes the result against whatever is behind. That
 * is, the text fades along with its background, and the ratio between the two
 * CHANGES without any token having changed. The destructive `Button` does
 * exactly that with `active:opacity-90`: released, the label measures 5.94:1
 * in the light theme, and under the finger it drops to 5.12:1; in dark it
 * drops from 4.83:1 to 4.57:1, 0.07 from the minimum. That is why
 * `MAP_LAYER_PAIRS` exists and measures the pressed state as a pair of its
 * own: a client theme with the red one step lighter crosses the line there and
 * nowhere else. Both sides are composed against the SAME background, not one
 * over the other: composing the text over the already faded fill is the wrong
 * math, and it errs downward - it gave 4.44:1 where the right one gives
 * 5.12:1.
 *
 * ## Why the checked control has two measurements
 *
 * The `Switch`, the `Checkbox` and the `RadioGroup` write nothing: whoever
 * reads whether they are checked reads the track and the thumb position, the
 * full box with the tick and the circle with the dot. While the three painted
 * `accent`, checked measured 1.21:1 over the page in the light theme and
 * 1.26:1 over the card, against 3.33:1 for UNCHECKED, which is
 * `border-strong`. It failed 1.4.11 AND failed it backwards, with checked less
 * visible than unchecked. It was the debt this guard measured without arming,
 * and the `DEBT` line left on the day the pieces changed - in both packages,
 * because the defect was the same in both.
 *
 * On the switch the color IS the boundary, and there is no drawing way out:
 * the track is the system's, and React Native `Switch` accepts `trackColor`
 * and nothing more. A border of its own - the path the web would have - does
 * not exist on this side, and that is why the fix for both was the same role:
 * `accent-text`, the lime one step darker, already guaranteed at 4.5:1 by the
 * text pairs. In the dark theme both roles point to the same value, so dark
 * does not change a pixel. The two measurements are the standard's floor, 3:1
 * over the THREE backgrounds the control sits on - `surface-raised` came in
 * along with the box and the radio, which sit inside the `Sheet` and the
 * `Dialog` -, and checked weighing at least as much as unchecked, which is the
 * defect the floor alone does not catch.
 *
 * The mark INSIDE the fill has its own pair, and it is the only one in the
 * house measured backwards: `surface-raised` over `accent-text`. When checked,
 * the touch box fills with `accent-text` and the tick on top is two borders in
 * `surface-raised`; the `RadioGroup` here does not fill the circle - it leaves
 * the core hollow, with the dot in `accent-text` over the screen background -,
 * and that is why its dot is already covered by the pair above and not by this
 * one. Without this line nothing says the mark inside the accent has to be
 * readable, and a theme that brings `surface-raised` close to the accent
 * delivers a box that is full and empty at the same time. It measures 5.75:1
 * in light and 13.91:1 in dark, against the standard's 3.
 *
 * ## The Slider thumb, and the shadow that never painted anything
 *
 * On 27/08/2026 the `shadow-1` class left the native `Slider` thumb. It never
 * generated a byte - `shadow` does not exist in React Native CSS, and the
 * Tailwind utility could not even be generated, because the `--tw-shadow`
 * chain brings down the compiler -, so what left was decoration that never
 * reached the screen.
 *
 * **The decision to REMOVE instead of implement rested on a number measured by
 * hand.** The thumb is visible without a shadow because `bg-fg` over the
 * `bg-skeleton` track measures 14.68:1 over the page and 15.23:1 over the card
 * in the light theme, and 14.64:1 and 12.97:1 in dark; and because the
 * `border-border-strong` border alone, without counting the core, already
 * gives 3.19:1 and 3.22:1 in light and 3.53:1 and 3.40:1 in dark. The 1.4.11
 * floor is 3. With that room the shadow is ornament, and the piece loses
 * exactly nothing by going without it.
 *
 * A number measured by hand is a number the next person does not have. While
 * no pair measured it, a client theme that brought `fg` close to `skeleton`
 * undid the decision SILENTLY: the thumb dissolves into the track, and nothing
 * flags it. And what is lost on screen is the whole control, because the touch
 * `Slider` writes no number at all - `accessibilityValue` goes to the screen
 * reader, and what the eye reads is the POSITION of the circle on the track.
 * Without a visible thumb what remains is the `bg-accent` fill, which says
 * roughly how far it has gone, and does not say where to put the finger to
 * change it.
 *
 * **They are two pairs, not one, because the two numbers say different
 * things.** The border scrapes by - 3.19:1 is 0.19 above the floor, and it is
 * the place where a client theme has almost no room -, and that is why it
 * comes in, not why it would stay out. The core passes with wide room, and it
 * comes in because it is the number the shadow decision rests on: the pair
 * with no room guards the THEME, and the pair with room guards the DECISION.
 * Arming only the tight one would leave the sentence "the thumb is visible
 * without a shadow" with nothing underneath it.
 *
 * Two backgrounds and not three, for the same reason as the state and series
 * boundaries: the `Slider` here sits on the page and the card.
 *
 * **`skeleton` left `WITHOUT_PAIR`, and its line did not change address.** The
 * role serves two purposes with different requirements, and the old line -
 * "loading block, no text on top" - described only the first. As the waiting
 * block of the `Skeleton`, the `DataList` and the `QueryBoundary` it still
 * carries neither text nor boundary, and still has no TEXT pair. As the empty
 * track of the `Slider` it is the background of a control identified only by
 * its shape, and there 1.4.11 demands 3:1. Keeping the line and measuring the
 * same role would print "no pair, by declaration: skeleton" in the same
 * report that prints four `skeleton` measurements, and
 * `test/consumer-contrast.test.ts` demands the sum: `MEASURED_ROLES` plus
 * `WITHOUT_PAIR` has to give exactly the 45 roles, and a role in both places
 * gives 46. The two lists are disjoint on purpose - a role is measured or
 * declared, never both -, and `MAP_ROLES` stays at 45 because it is the UNION:
 * `skeleton` switched halves without changing the total.
 *
 * ## What it covers, beyond the pairs
 *
 * A MISSING role fails. The generator only checks that on the `--tema` path; a
 * hand-written map never went through any check, and a missing role gives no
 * error on the phone - the piece inherits the RivoCode color and the client
 * finds out months later. A NEW role also fails while nobody says what to do
 * with it: every role has to be in a pair or in a `WITHOUT_PAIR` line with the
 * reason, otherwise it enters the map with nobody measuring it.
 *
 * The role check works BOTH ways, and the second was born with the change of
 * address. `MAP_ROLES` - the list the published module uses when the caller
 * passes no roles - is DERIVED from the pair tables plus `WITHOUT_PAIR`, not
 * written by hand: a second list of 45 names would be the next place to age
 * silently. So the guard checks that it matches exactly what
 * `native/tokens.ts` emits, both ways - a map role the table does not reach,
 * and a name in the table that is not a map role.
 *
 * ## Outside the repository
 *
 * Without an argument, it measures the two house themes in `native/tokens.ts`.
 * With an argument, it measures whatever map comes in:
 * `bun run check:contrast:native-map acme.theme.ts` - which is the file
 * `bun run gen:native --tema` writes. The same map can be measured without
 * cloning the repository, via `rivocode-ui check-theme acme.theme.ts`, which
 * calls this same engine.
 */
import {
  MAP_ROLES,
  MEASURED_ROLES,
  WITHOUT_PAIR,
  checkThemeMap,
  type ColorMap,
  type ThemeMap,
  MAP_PAIRS,
  MAP_BOUNDARIES,
  MAP_LAYER_PAIRS,
  MAP_TINTED_PAIRS,
  MAP_CHECKED_OVER,
  MAP_CODE,
  MAP_MEDIA,
  MAP_SIGNATURE,
  checkCodePair,
  checkMediaStage,
  checkSignaturePaper,
} from "../src/lib/contrast";
import { tokens } from "../native/tokens";

/** The 45 map roles, in the order the generator emits them. */
const ROLES = Object.keys(tokens.themes["rivocode-dark"]);

/**
 * The measured debt this guard does NOT arm, with the number and the address
 * of the fix.
 *
 * It exists for the defect that is not in the theme but in the piece: arming
 * the pair would leave the gate red for something no theme fixes alone, and
 * staying quiet would let the number vanish. So it measures, shows and does
 * not arm.
 *
 * The list has been EMPTY since 27/08/2026, when the track of the switched-on
 * switch - the only entry it ever had - became an armed pair, in both
 * packages. The agreement is that of the other lists in the house: it ONLY
 * SHRINKS. An entry that stopped failing is an error, and the guard says to
 * delete the line - otherwise it becomes the place where the defect lives.
 */
type Debt = { id: string; min: number; why: string; measure: (colors: ColorMap) => number };
const DEBT: Debt[] = [];

const maps: Array<[string, ThemeMap]> = [];
const files = process.argv.slice(2).filter((argument) => !argument.startsWith("-"));

if (files.length === 0) {
  maps.push([
    "rivocode",
    { light: tokens.themes["rivocode-light"], dark: tokens.themes["rivocode-dark"] },
  ]);
}

for (const file of files) {
  const path = file.startsWith("/") ? file : `${process.cwd()}/${file}`;
  const loaded = (await import(path)) as Record<string, unknown>;
  const found = Object.entries(loaded).filter(
    ([, value]) =>
      typeof value === "object" && value !== null && "light" in value && "dark" in value,
  );
  if (found.length === 0) {
    console.error(
      `${file}: no export with \`light\` and \`dark\` - it is not a theme map. Emit one with` +
        " `bun run gen:native --tema`.",
    );
    process.exit(1);
  }
  for (const [key, value] of found) maps.push([`${file}:${key}`, value as ThemeMap]);
}

let failed = 0;

const orphans = ROLES.filter((role) => !MEASURED_ROLES.includes(role) && !(role in WITHOUT_PAIR));
if (orphans.length > 0) {
  console.error(
    `${orphans.length} role(s) no pair measures and nobody declared:\n` +
      orphans.map((role) => `    ${role}`).join("\n") +
      "\n\n    Either it goes into a pair in src/lib/contrast.ts, or it gets a line in" +
      "\n    `WITHOUT_PAIR` saying why it does not need one. A role without a pair is" +
      "\n    a color nobody measures.",
  );
  failed++;
}

const invented = MAP_ROLES.filter((role) => !ROLES.includes(role));
if (invented.length > 0) {
  console.error(
    `${invented.length} name(s) in the tables of src/lib/contrast.ts that the map does not have:\n` +
      invented.map((role) => `    ${role}`).join("\n") +
      "\n\n    `MAP_ROLES` is derived from the tables, and it is what the published module" +
      "\n    demands of a consumer theme. A wrong name there demands a role the" +
      "\n    `RivoProvider` never reads, and the client theme fails for nothing.",
  );
  failed++;
}

for (const [name, map] of maps) {
  for (const finding of checkThemeMap(name, map, ROLES)) {
    if (!finding.ok) failed++;
    console.log(finding.line);
  }
}

for (const finding of checkCodePair(
  "native/tokens.ts: code",
  tokens.code[MAP_CODE.ink],
  tokens.code[MAP_CODE.paper],
)) {
  if (!finding.ok) failed++;
  console.log(finding.line);
}

for (const finding of checkMediaStage(
  "native/tokens.ts: media",
  Object.fromEntries(
    Object.entries(MAP_MEDIA).map(([role, name]) => [
      role,
      (tokens.media as Record<string, string>)[name],
    ]),
  ),
)) {
  if (!finding.ok) failed++;
  console.log(finding.line);
}

for (const finding of checkSignaturePaper(
  "native/tokens.ts: signature",
  Object.fromEntries(
    Object.entries(MAP_SIGNATURE).map(([role, name]) => [
      role,
      (tokens.signature as Record<string, string>)[name],
    ]),
  ),
)) {
  if (!finding.ok) failed++;
  console.log(finding.line);
}

// The debt: measure, show the number and do not arm. It is ALWAYS measured on
// the house theme, never on the map that came in by argument: the debt is
// RivoCode's, and a client whose accent passes neither pays our debt nor
// deletes our line.
const house = [tokens.themes["rivocode-light"], tokens.themes["rivocode-dark"]];
const paid: string[] = [];
for (const item of DEBT) {
  const worst = Math.min(...house.map((colors) => item.measure(colors)));
  console.log(
    `\n  debt  ${item.id}  ${worst.toFixed(2)}:1 (min ${item.min})\n` +
      item.why.replace(/^/gm, "          "),
  );
  if (worst >= item.min) paid.push(item.id);
}

if (paid.length > 0) {
  console.error(
    `\n${paid.length} \`DEBT\` line(s) that no longer flag anything: ${paid.join(", ")}.` +
      "\n    Delete them from scripts/check-contrast-native.ts - or arm the pair, if it" +
      "\n    became a rule. An exception list that does not shrink becomes the place" +
      "\n    where the defect lives.",
  );
  failed++;
}

if (failed > 0) {
  console.error(`\n${failed} contrast problem(s) in the map theme.`);
  process.exit(1);
}
console.log(
  `\nContrast ok in ${maps.length} map(s), light and dark: ${MAP_PAIRS.length} text pairs,` +
    ` ${MAP_BOUNDARIES.length} for 1.4.11, ${MAP_LAYER_PAIRS.length} layer, ${MAP_TINTED_PAIRS.length} over series tint and` +
    ` ${MAP_CHECKED_OVER.length} for the checked control, per scheme.` +
    ` No pair, by declaration: ${Object.keys(WITHOUT_PAIR).join(", ")}.`,
);
