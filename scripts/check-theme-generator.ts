/**
 * Guard for the native theme generator - `rivocode-ui-native-theme`.
 *
 * The report that made the command exist: a consumer wrote 220 lines inside
 * their app to dress a client in React Native. The 45 role names, the contrast
 * pairs, the minimums, the alpha composition and the output format - all of
 * that is library knowledge, and it was living outside of it. Worse: they
 * ported the BROKEN math. Their copy's `compose` did not see `rgba(r,g,b,a)`,
 * returned the string untouched, and `contrastRatio` answered `NaN` - silent
 * precisely on the 12 of the 45 roles that carry alpha.
 *
 * The generator closes the door from the right side: the consumer writes only
 * the palette, and the machine emits the `@theme`. And it REFUSES to write a
 * theme that does not pass contrast, measuring with
 * `native/scripts/contrast.mjs`, which is the same engine as
 * `check:contrast:native-map`. There is no second math.
 *
 * ## What this guard demands, and why it is not the test
 *
 * The test (`test/native-theme-generator.test.ts`) demands the BEHAVIOR: the
 * refusals, the math, the two-theme ceiling. This guard demands what ages
 * silently when nobody is looking at the generator:
 *
 * 1. **The derivation table against the role list.** The list comes out of
 *    `native/tokens.json`, which is GENERATED from the CSS by
 *    `bun run gen:native`. A new role in `src/tokens/` goes in there on its
 *    own, `check:native` stays green, and the published generator stops
 *    knowing how to dress a complete theme. On the consumer side that becomes a
 *    refusal - which is the right behavior for THEM -, but on our side it is a
 *    version that shipped without the generator keeping up. Here the gate goes
 *    red in the commit that adds the role, which is the moment when the
 *    decision "derived from what?" costs five minutes instead of a version.
 *
 *    It works BOTH ways, like the role check of `check-contrast-native`: a
 *    name in the table that is not a map role demands from the consumer a role
 *    the `@theme` never reads.
 *
 * 2. **The binary declaration.** `bin` without the line, or `files` without
 *    `scripts`, publishes a command nobody can run - and nothing in `bun test`
 *    flags it, because the installed package is not what the tests import.
 *
 * 3. **One green end-to-end pass**, with a palette of EIGHT seeds and nothing
 *    else. It is the only way to know the 37 derivations still produce a theme
 *    that passes contrast: they are alpha and mixing over a color the consumer
 *    wrote, and a swapped number in the alpha ladder fails a pair without
 *    changing a line of the generator's code.
 */
import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GENERATOR = "native/scripts/build-theme.mjs";
const COMMAND = "rivocode-ui-native-theme";

const generator = (await import(`${import.meta.dir}/../${GENERATOR}`)) as {
  ROLES: string[];
  SEEDS: string[];
  DERIVED: string[];
  EXPLAIN: Record<string, string>;
};

const { ROLES, SEEDS, DERIVED, EXPLAIN } = generator;

const problems: string[] = [];

const pkg = (await Bun.file("native/package.json").json()) as {
  bin?: Record<string, string>;
  files?: string[];
};

if (pkg.bin?.[COMMAND] !== GENERATOR.replace("native/", "")) {
  problems.push(
    `native/package.json does not declare \`${COMMAND}\` in \`bin\`.\n` +
      `    Without the line, \`npx ${COMMAND}\` does not exist for whoever installs, and\n` +
      "    the consumer goes back to writing the math by hand in their app - which is\n" +
      "    the report that made this command exist.",
  );
}

for (const needed of ["scripts", "tokens.json"]) {
  if (!pkg.files?.includes(needed)) {
    problems.push(
      `native/package.json does not publish \`${needed}\` in \`files\`.\n` +
        "    The generator lives in `scripts/` and reads the role list from `tokens.json`:\n" +
        "    without both in the package, the command breaks on the first line, on\n" +
        "    the computer of whoever installed it.",
    );
  }
}

const executable = (statSync(GENERATOR).mode & 0o111) !== 0;
if (!executable) {
  problems.push(
    `${GENERATOR} has no execute bit.\n` +
      "    npm preserves the file mode, and `bin` without `+x` fails with\n" +
      "    `permission denied` - measured, not assumed: that is how the first call\n" +
      "    of this command through `node_modules/.bin` ended.",
  );
}

const known = new Set([...SEEDS, ...DERIVED]);
const orphans = ROLES.filter((role) => !known.has(role));
if (orphans.length > 0) {
  problems.push(
    `${orphans.length} role(s) of native/tokens.json the generator does not know how to dress:\n` +
      orphans.map((role) => `    ${role}`).join("\n") +
      "\n\n    Either it goes into `SEEDS` - and starts being demanded of the consumer -, or\n" +
      "    it gets a line in one of the generator's derivation tables. A role outside both\n" +
      "    ships in a new version as a refusal on the machine of whoever installed it.",
  );
}

const invented = [...known].filter((role) => !ROLES.includes(role));
if (invented.length > 0) {
  problems.push(
    `${invented.length} name(s) in the generator's tables that the role map does not have:\n` +
      invented.map((role) => `    ${role}`).join("\n") +
      "\n\n    The generator demands of the consumer what is in its tables. A wrong name\n" +
      "    there demands a role the `@theme` never reads, and the client theme fails\n" +
      "    for nothing.",
  );
}

const mute = DERIVED.filter((role) => (EXPLAIN[role]?.length ?? 0) < 10);
if (mute.length > 0) {
  problems.push(
    `${mute.length} derived role(s) without a line saying where they come from:\n` +
      mute.map((role) => `    ${role}`).join("\n") +
      "\n\n    `--roles` is the only documentation that travels with the installed\n" +
      "    version. A derivation without explanation is a color nobody knows the origin of.",
  );
}

const bench = mkdtempSync(join(tmpdir(), "rivocode-theme-generator-"));
const palette = join(bench, "seed.mjs");
const output = join(bench, "seed.theme.css");

writeFileSync(
  palette,
  "export const seed = {\n" +
    '  light: { bg: "#ffffff", surface: "#ffffff", fg: "#111111", accent: "#1d4ed8",' +
    ' success: "#0f6b52", warning: "#7a4a00", danger: "#b3261e", info: "#1d4ed8" },\n' +
    '  dark: { bg: "#101314", surface: "#191d1f", fg: "#f2f3f0", accent: "#8ab4f8",' +
    ' success: "#3ddc97", warning: "#f2b21c", danger: "#ff8a8a", info: "#8ab4f8" },\n' +
    "};\n",
);

const runtime = Bun.which("node") ?? "bun";
const shell = Bun.spawn([runtime, GENERATOR, palette, output], { stdout: "pipe", stderr: "pipe" });
const said =
  (await new Response(shell.stdout).text()) + (await new Response(shell.stderr).text());
const code = await shell.exited;

if (code !== 0) {
  problems.push(
    `The ${SEEDS.length}-seed palette no longer generates an approved theme:\n` +
      said.replace(/^/gm, "    ") +
      "\n    The generator's alpha ladder and mixes derive 37 roles over a color the\n" +
      "    consumer wrote. If they stop passing, the command's promise - \n" +
      `    "write ${SEEDS.length} roles" - no longer holds.`,
  );
} else {
  const css = await Bun.file(output).text();
  const emitted = [...css.matchAll(/^ {2}--color-([\w-]+):\s*(.+);$/gm)];
  const names = emitted.map(([, role]) => role!);

  const holes = ROLES.filter((role) => !names.includes(role));
  if (holes.length > 0) {
    problems.push(
      `${holes.length} role(s) the generator did not write into the \`@theme\`:\n` +
        holes.map((role) => `    ${role}`).join("\n") +
        "\n\n    A role missing from the CSS gives no error: the class falls back to the value\n" +
        "    of `@rivocode/ui-native/theme.css` imported before, and the screen comes out\n" +
        "    mixed - half the client's, half ours.",
    );
  }

  const strange = emitted
    .filter(([, , value]) => !/^(#[\da-f]{6}|rgba?\(|light-dark\()/i.test(value!.trim()))
    .map(([, role, value]) => `    ${role}: ${value}`);
  if (strange.length > 0) {
    problems.push(
      `${strange.length} value(s) the native compiler does not read:\n` +
        strange.join("\n") +
        "\n\n    `react-native-css` pins the color inside the rule: what comes out of here has\n" +
        "    to be a literal sRGB, or a `light-dark()` with two sRGBs inside.",
    );
  }

  if (!css.includes("@theme {")) {
    problems.push(
      "The generated CSS has no `@theme` block.\n" +
        "    It is what Tailwind 4 materializes, and that is why the client theme\n" +
        "    overrides RivoCode's: two `@theme` blocks merge, and the last one wins.",
    );
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`${problem}\n`);
  process.exit(1);
}

console.log(
  `\`${COMMAND}\` up to date: ${SEEDS.length} seeds, ${DERIVED.length} derived roles,` +
    ` ${ROLES.length} in the \`@theme\`. A palette of ${SEEDS.length} values per scheme` +
    " generates a theme approved on contrast, measured with the check:contrast:native-map engine.",
);
