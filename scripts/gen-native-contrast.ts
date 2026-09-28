/**
 * The mirror of the contrast math inside the native package.
 *
 * The math and the pair table live in `src/lib/contrast.ts`, and from there
 * they ship in `@rivocode/ui` because `tsdown` bundles `src/cli.ts` and
 * whatever its graph reaches. `@rivocode/ui-native` publishes differently: it
 * ships as SOURCE, and the tarball only gets what is physically inside
 * `native/` - an import that climbs above the folder resolves here and
 * vanishes there. So whoever installs only the native package cannot reach
 * `src/lib/contrast.ts` at all, and `checkThemeMap` - the function written
 * precisely for the MAP theme, which is the theme shape only native has -
 * would be left outside the package that needs it most.
 *
 * The way out is the one `native/tokens.ts` and `native/theme.css` already
 * use, and not a second hand-written file: single source on the web, a
 * generated and versioned mirror, and `bun run check` red if the committed one
 * diverges from the source. Mirroring by hand is how the consumer's copy aged
 * silently - their `compose` did not see two of the three alpha syntaxes and
 * `contrastRatio` answered NaN, months after the fix had gone in here.
 *
 * ## Why the comparison ignores whitespace
 *
 * The `.mjs` comes out of `Bun.Transpiler`, which strips the types and
 * reprints the code. What it reprints is stable within a Bun version, not
 * across versions - and the four workflows of this house install
 * `bun-version: latest`. A formatting change in the transpiler would leave the
 * gate red in CI without anyone having touched a line of the repository, and a
 * guard that flags what is not a defect is switched off the second time.
 *
 * So the guard compares the CONTENT, without whitespace. It still catches what
 * matters - a swapped number, a deleted pair, a hand-edited file - and stops
 * catching what is not ours. Whoever wants the exact byte runs
 * `bun run gen:native:contrast`, which rewrites it.
 */
import {
  MAP_MEDIA,
  MAP_SIGNATURE,
  checkCodePair,
  checkMediaStage,
  checkSignaturePaper,
  checkThemeMap,
} from "../src/lib/contrast";

const SOURCE = "src/lib/contrast.ts";
const MIRROR = "native/scripts/contrast.mjs";

const BANNER = `/* Generated from ${SOURCE} by bun run gen:native:contrast. Do not edit. */\n\n`;

const source = await Bun.file(SOURCE).text();
const wanted = BANNER + new Bun.Transpiler({ loader: "ts", target: "node" }).transformSync(source);

/** Without whitespace: that is what the transpiler's formatting may touch. */
const same = (one: string, other: string) => one.replace(/\s+/g, "") === other.replace(/\s+/g, "");

if (process.argv.includes("--check")) {
  const committed = await Bun.file(MIRROR)
    .text()
    .catch(() => "");

  if (!committed) {
    console.error(`${MIRROR} does not exist. Run: bun run gen:native:contrast`);
    process.exit(1);
  }

  if (!same(committed, wanted)) {
    console.error(
      `${MIRROR} diverged from ${SOURCE}. Run: bun run gen:native:contrast\n\n` +
        `    The mirror is versioned because the native package publishes SOURCE, and\n` +
        `    only what is inside native/ ships in the tarball.`,
    );
    process.exit(1);
  }

  const pkg = (await Bun.file("native/package.json").json()) as {
    files: string[];
    exports: Record<string, unknown>;
  };

  const problems: string[] = [];
  if (!pkg.files.includes("scripts")) {
    problems.push('    `files` does not include "scripts": the mirror would not go into the tarball.');
  }
  if (pkg.exports["./contrast"] !== `./${MIRROR.replace("native/", "")}`) {
    problems.push(
      '    `exports` does not point "./contrast" to the mirror. With the `exports` field\n' +
        "    declared, a deep path does not resolve: without the line, the file travels in\n" +
        "    the tarball and nobody can import it.",
    );
  }

  if (problems.length > 0) {
    console.error(`native/package.json does not publish the mirror:\n${problems.join("\n")}`);
    process.exit(1);
  }

  // The proof that the mirror MEASURES, not only that it exists: the same map
  // through both paths has to give the same line. Comparing text catches the
  // edited file; this catches the file that went inert.
  const {
    checkThemeMap: mirrored,
    checkCodePair: mirroredCode,
    checkMediaStage: mirroredMedia,
    checkSignaturePaper: mirroredSignature,
  } = (await import(`../${MIRROR}`)) as {
    checkThemeMap: typeof checkThemeMap;
    checkCodePair: typeof checkCodePair;
    checkMediaStage: typeof checkMediaStage;
    checkSignaturePaper: typeof checkSignaturePaper;
  };
  const { tokens } = await import("../native/tokens");
  const map = { light: tokens.themes["rivocode-light"], dark: tokens.themes["rivocode-dark"] };

  const ink = tokens.code["code-ink"];
  const paper = tokens.code["code-paper"];
  const media = Object.fromEntries(
    Object.entries(MAP_MEDIA).map(([role, name]) => [
      role,
      (tokens.media as Record<string, string>)[name],
    ]),
  );
  const signature = Object.fromEntries(
    Object.entries(MAP_SIGNATURE).map(([role, name]) => [
      role,
      (tokens.signature as Record<string, string>)[name],
    ]),
  );
  const here = [
    ...checkThemeMap("proof", map),
    ...checkCodePair("proof", ink, paper),
    ...checkMediaStage("proof", media),
    ...checkSignaturePaper("proof", signature),
  ].map((finding) => finding.line);
  const there = [
    ...mirrored("proof", map),
    ...mirroredCode("proof", ink, paper),
    ...mirroredMedia("proof", media),
    ...mirroredSignature("proof", signature),
  ].map((finding) => finding.line);

  if (here.join("\n") !== there.join("\n")) {
    console.error(
      `${MIRROR} answers differently from ${SOURCE} on the house theme.\n` +
        "    Run: bun run gen:native:contrast",
    );
    process.exit(1);
  }

  console.log(`${MIRROR} up to date with ${SOURCE}, and measures the same: ${here.length} line(s).`);
  process.exit(0);
}

await Bun.write(MIRROR, wanted);
console.log(`${MIRROR} written from ${SOURCE}.`);
