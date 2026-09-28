/**
 * Checks that the themes guide cites everything a theme can declare, and
 * maintains the catalog of roles that `rivocode-ui check-theme` carries in the
 * package.
 *
 * There are two lists. The color roles, where missing one leaves the piece
 * with the previous theme's color; and the shape tokens - radius, duration,
 * easing, letter spacing - that the theme can also redefine. If someone adds
 * one and does not cite it in the guide, the text starts lying: in the first
 * case the lie shows up on a client's screen months later, as an isolated
 * RivoCode color in the middle of their brand; in the second it is a
 * capability nobody discovers, which is what happened with the radius - it
 * always worked in a theme selector, and the guide advised against it in
 * writing.
 *
 * The check is of the guide against the tokens, not the other way around: the
 * token is the truth.
 *
 * ## Why this guard also writes a file
 *
 * Because it runs on the wrong side of the boundary. `--rc-font-*` became a
 * theme role in 0.7.0, and a client theme written for 0.6.x started rendering
 * with no font family at all: `tsc` green, build green, wrong screen. This
 * guard would catch it, and it lives in the library repository - the consumer
 * never runs it. What runs on the consumer is `rivocode-ui check-theme`, and to
 * demand a missing role it needs the SAME list.
 *
 * Two lists for the same question mean one of them is always wrong, and this
 * repository has already paid that bill twice (the piece catalog announced 55
 * while having 83, and the accents vocabulary had twenty-two words next to a
 * list of two hundred and eighty-one). So there is a single list: the CSS.
 * This guard extracts it and WRITES it to `src/tokens/theme-roles.ts`, which
 * is generated code, versioned and with a header, as `native/tokens.ts`
 * already is; `bun run gen:themes` rewrites it, and `bun run check:themes`
 * turns red if the committed one diverges from the source. The CLI imports
 * from there, and tsdown bundles it inside `dist/cli.js`.
 *
 * Why the file did not go to `src/shared/`: it would pass the purity
 * criterion and fail its second half, which is "it has to ALREADY be
 * duplicated". The native mirror would carry the list into the tarball that
 * metro compiles on a third party's device, for a desk command React Native
 * never runs. The design is in
 * `docs/2026-08-27-codigo-puro-compartilhado-design.md`.
 *
 * ## The third thing it demands
 *
 * That every required role has a CONSEQUENCE written in
 * `src/lib/theme-check.ts`. "Missing --rc-font-sans" fixes nothing; "without
 * it the whole page falls back to the browser font" does. Without this rule,
 * the new role enters the list through automatic generation and reaches the
 * consumer with an empty message - the guard would stay green showing the
 * useless text.
 */
import { readFileSync } from "node:fs";

import { ARRIVED, OPTIONAL, effectOf, requiredRoles } from "../src/lib/theme-check";

const THEME_FILE = "src/tokens/themes/rivocode-dark.css";
const SHAPE_FILE = "src/tokens/forma.css";
const GUIDE_FILE = "apps/docs/src/content/temas.md";
const CATALOG_FILE = "src/tokens/theme-roles.ts";

const theme = readFileSync(THEME_FILE, "utf8");
const shape = readFileSync(SHAPE_FILE, "utf8");
const guide = readFileSync(GUIDE_FILE, "utf8");

/**
 * No repeats: the `@media (prefers-reduced-motion)` of `forma.css` redeclares
 * four durations, and the same token counted twice would become a doubled line
 * in the catalog the CLI reads.
 */
const declaredIn = (css: string) => [
  ...new Set([...css.matchAll(/^\s+(--rc-[a-z0-9-]+):/gm)].map((match) => match[1]!)),
];

const themeRoles = declaredIn(theme);
const shapeTokens = declaredIn(shape);
const roles = [...themeRoles, ...shapeTokens];

const list = (names: string[]) => names.map((name) => `  "${name}",\n`).join("");

const catalog =
  `/* Generated from ${THEME_FILE} and ${SHAPE_FILE} by bun run gen:themes. Do not edit. */\n\n` +
  `export const THEME_ROLES = [\n${list(themeRoles)}] as const;\n\n` +
  `export const SHAPE_TOKENS = [\n${list(shapeTokens)}] as const;\n`;

const problems: string[] = [];

/**
 * The guide writes a family by pattern: `--rc-<state>-fg` covers the four
 * states, and `--rc-chart-1` to `--rc-chart-8` covers the eight series.
 * Expanding the abbreviation here is more honest than forcing the text to list
 * twenty-four nearly identical lines.
 */
function documented(role: string) {
  if (guide.includes(role)) return true;

  const state = /^--rc-(success|warning|danger|info)(-fg|-text|-subtle)?$/.exec(role);
  if (state) return guide.includes(`--rc-<state>${state[2] ?? ""}`);

  const series = /^--rc-chart-([1-8])$/.exec(role);
  if (series) return guide.includes("--rc-chart-1` to `--rc-chart-8");

  const shadow = /^--rc-shadow-([1-3])$/.exec(role);
  if (shadow) return guide.includes("--rc-shadow-1` to `--rc-shadow-3");

  const radius = /^--rc-radius-(sm|md|lg|xl)$/.exec(role);
  if (radius) return guide.includes("--rc-radius-sm` to `--rc-radius-xl");

  return false;
}

const missing = roles.filter((role) => !documented(role));

if (missing.length > 0) {
  problems.push(
    `${missing.length} token(s) the theme can declare that are missing from the guide:\n` +
      missing.map((role) => `    ${role}`).join("\n") +
      `\n\n    Document them in ${GUIDE_FILE}, or the guide starts lying silently.`,
  );
}

const mute = requiredRoles(themeRoles).filter((role) => !effectOf(role));

if (mute.length > 0) {
  problems.push(
    `${mute.length} required role(s) without a written consequence:\n` +
      mute.map((role) => `    ${role}`).join("\n") +
      `\n\n    Write what happens ON SCREEN without it, in EFFECTS of\n` +
      `    src/lib/theme-check.ts, and say whether the breakage is silent or visible. It\n` +
      `    is the text \`rivocode-ui check-theme\` shows to whoever forgot the role,\n` +
      `    and "such token is missing" makes nobody fix anything.`,
  );
}

const known = new Set(themeRoles);
const rotten = [...Object.keys(OPTIONAL), ...Object.keys(ARRIVED)].filter(
  (role) => !known.has(role),
);

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} role(s) cited in src/lib/theme-check.ts that the theme no longer declares:\n` +
      rotten.map((role) => `    ${role}`).join("\n") +
      `\n\n    Delete them from OPTIONAL or ARRIVED. A list that does not shrink becomes\n` +
      `    the place where the dead role lives, and the CLI starts talking about a\n` +
      `    token that does not exist.`,
  );
}

if (process.argv.includes("--write")) {
  await Bun.write(CATALOG_FILE, catalog);
  console.log(
    `${themeRoles.length} theme roles and ${shapeTokens.length} shape tokens written to ${CATALOG_FILE}.`,
  );
} else if (
  (await Bun.file(CATALOG_FILE)
    .text()
    .catch(() => undefined)) !== catalog
) {
  problems.unshift(
    `${CATALOG_FILE} diverged from ${THEME_FILE}.\n` +
      `\n    Run: bun run gen:themes\n` +
      `    It is the file that travels in \`dist/cli.js\` and tells the consumer which\n` +
      `    roles a theme has to declare. Diverged, the command they run demands the\n` +
      `    previous version's list.`,
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`${problem}\n`);
  process.exit(1);
}

console.log(
  `${roles.length} theme and shape tokens, all cited in the guide. ` +
    `${requiredRoles(themeRoles).length} required roles, each with what happens on screen without it.`,
);
