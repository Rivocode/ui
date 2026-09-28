/**
 * The CI bench's judge: compares the base tree with the head tree, both
 * measured on the SAME machine, and says what got worse.
 *
 * The bench has existed since 24/09/2026 and resolves a deadlock that kept
 * `bun run a11y` and `bun run visual` out of any CI. Both guards measure
 * against an absolute reference - the empty list of problems, and the
 * committed signatures - and neither reference holds on ubuntu:
 *
 * - The signatures were born on macOS. Fonts and antialiasing change between
 *   systems, and the same tree measured on linux comes out different from the
 *   committed one without anyone having touched anything. Comparing there would
 *   be permanent red, and permanent red gets switched off in the second week.
 * - `bun run a11y` comes out red on every tree today: it flags what the pieces
 *   HAVE, and the list has not reached zero yet. In the gate, it would stop
 *   everyone's `check`.
 *
 * The obvious ways out each fail on one side. A committed per-platform
 * signature ages with every new runner Chrome, which GitHub swaps without
 * notice. A per-square tolerance high enough to silence antialiasing also
 * silences the square `Progress` track, which scored 3 of gray in a page frame
 * (see `check-portraits.ts`). And leaving visual only on the machine is the
 * state `check:scripts` describes: the guard that only runs when someone
 * remembers.
 *
 * The DIFFERENTIAL comparison swaps the absolute reference for the base. Same
 * machine, same Chrome, same fonts, same minute: everything that is platform
 * cancels out, and what is left is what the commit changed. The platform never
 * turns this red, and a portrait the commit changed never passes without
 * someone having accepted it.
 *
 * ## Who accepts
 *
 * A portrait change is accepted by the same gesture as always: whoever changed
 * the screen runs `bun run shot && bun run visual --accept` on the machine,
 * looks, and commits `demo/assinaturas.json`. That portrait's entry changing
 * between base and head is the proof that someone looked - and a portrait that
 * changed on linux without its entry changing is a change nobody saw. The
 * `retrato-aceito` label on the PR is the valve for the case the rule does not
 * cover: a difference that only shows up on linux.
 *
 * Accessibility has no acceptance: a problem the head has more of than the base
 * is a regression, and the fix is in the piece. A problem the head has FEWER of
 * is only reported - the list shrinking is what we want.
 *
 * ## Measuring is a precondition
 *
 * A tree that measured nothing is not a tree without problems. That is why
 * there is a floor of audited pages and compared portraits, and a missing
 * measurement file brings the run down instead of becoming an empty list.
 */
import { compareSignatures } from "./portraits";

export type AccessibilityReport = { pages: string[]; problems: Record<string, number> };

export type Signatures = Record<string, number[]>;

export type ShotReport = { signatures: Signatures; refused: string[] };

export type AccessibilityVerdict = {
  worse: { key: string; before: number; after: number }[];
  better: { key: string; before: number; after: number }[];
  problems: string[];
};

export function compareAccessibility(
  base: AccessibilityReport,
  head: AccessibilityReport,
  floor: number,
): AccessibilityVerdict {
  const problems: string[] = [];
  if (head.pages.length < floor) {
    problems.push(
      `the head audited ${head.pages.length} page(s), and the floor is ${floor}: the measurement was lost, and an empty list of pages is not an empty list of problems`,
    );
  }

  const keys = new Set([...Object.keys(base.problems), ...Object.keys(head.problems)]);
  const worse: AccessibilityVerdict["worse"] = [];
  const better: AccessibilityVerdict["better"] = [];

  for (const key of [...keys].sort()) {
    const before = base.problems[key] ?? 0;
    const after = head.problems[key] ?? 0;
    if (after > before) worse.push({ key, before, after });
    if (after < before) better.push({ key, before, after });
  }

  return { worse, better, problems };
}

export type ShotInput = {
  base: ShotReport;
  head: ShotReport;
  committedBase: Signatures;
  committedHead: Signatures;
};

export type ShotVerdict = {
  compared: number;
  unaccepted: string[];
  accepted: string[];
  lost: string[];
  fresh: string[];
  problems: string[];
};

function sameSignature(a: number[] | undefined, b: number[] | undefined) {
  if (!a || !b) return a === b;
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function compareShots(input: ShotInput, floor: number): ShotVerdict {
  const { base, head, committedBase, committedHead } = input;
  const verdict: ShotVerdict = {
    compared: 0,
    unaccepted: [],
    accepted: [],
    lost: [],
    fresh: [],
    problems: [],
  };

  const acceptedByCommit = (name: string) =>
    !sameSignature(committedBase[name], committedHead[name]);

  for (const name of Object.keys(head.signatures).sort()) {
    const before = base.signatures[name];
    const after = head.signatures[name]!;
    if (!before) {
      verdict.fresh.push(name);
      continue;
    }

    verdict.compared++;
    const diff = compareSignatures(name, before, after);
    if (!diff.frame && diff.cells === 0) continue;

    const what = diff.frame
      ? `${name} - ${diff.frame}`
      : `${name} - ${diff.cells} of ${diff.total} squares, worst ${diff.worst}`;
    if (acceptedByCommit(name)) verdict.accepted.push(what);
    else verdict.unaccepted.push(what);
  }

  for (const name of Object.keys(base.signatures).sort()) {
    if (name in head.signatures) continue;
    if (!(name in committedHead)) {
      verdict.accepted.push(`${name} - left the showcase and the committed signature`);
      continue;
    }
    verdict.lost.push(name);
  }

  if (verdict.compared < floor) {
    verdict.problems.push(
      `${verdict.compared} portrait(s) compared, and the floor is ${floor}: the measurement was lost, and zero difference over zero portraits is not an identical portrait`,
    );
  }

  return verdict;
}

async function readJson<T>(path: string): Promise<T> {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    console.error(
      `${path} does not exist: one of the sides was not measured. The bench does not compare` +
        " a measurement with the absence of one, because the result would be green for lack of data.",
    );
    process.exit(1);
  }
  return (await file.json()) as T;
}

function option(name: string) {
  const at = process.argv.indexOf(name);
  const value = at === -1 ? undefined : process.argv[at + 1];
  if (!value) {
    console.error(
      `Usage: bun run scripts/bench-comparison.ts --base <folder> --head <folder> [--portrait-accepted]` +
        `\nEach folder has accessibility.json, portraits.json and assinaturas.json. Missing ${name}.`,
    );
    process.exit(1);
  }
  return value;
}

const PAGE_FLOOR = 15;
const SHOT_FLOOR = 30;

if (import.meta.main) {
  const baseDir = option("--base");
  const headDir = option("--head");
  const labelAccepts = process.argv.includes("--portrait-accepted");

  const accessibility = compareAccessibility(
    await readJson<AccessibilityReport>(`${baseDir}/accessibility.json`),
    await readJson<AccessibilityReport>(`${headDir}/accessibility.json`),
    PAGE_FLOOR,
  );

  const headShots = await readJson<ShotReport>(`${headDir}/portraits.json`);
  const shots = compareShots(
    {
      base: await readJson<ShotReport>(`${baseDir}/portraits.json`),
      head: headShots,
      committedBase: await readJson<Signatures>(`${baseDir}/assinaturas.json`),
      committedHead: await readJson<Signatures>(`${headDir}/assinaturas.json`),
    },
    SHOT_FLOOR,
  );

  const lines: string[] = ["## Bench: base against head, on the same machine", ""];
  const failures: string[] = [...accessibility.problems, ...shots.problems];

  lines.push("### Accessibility", "");
  if (accessibility.worse.length === 0) lines.push("No problem beyond the base.");
  for (const { key, before, after } of accessibility.worse) {
    lines.push(`- worse: \`${key}\` from ${before} to ${after}`);
  }
  for (const { key, before, after } of accessibility.better) {
    lines.push(`- better: \`${key}\` from ${before} to ${after}`);
  }
  if (accessibility.worse.length > 0) {
    failures.push(
      `${accessibility.worse.length} accessibility problem(s) the base did not have. Run \`bun run a11y\` on the machine: the fix is in the piece.`,
    );
  }

  lines.push("", "### Portraits", "", `${shots.compared} portrait(s) compared.`);
  for (const what of shots.unaccepted) lines.push(`- changed without acceptance: ${what}`);
  for (const what of shots.accepted) lines.push(`- changed, accepted by the committed signature: ${what}`);
  for (const name of shots.lost) lines.push(`- the head did not shoot: ${name}`);
  for (const name of shots.fresh) lines.push(`- new, no base to compare: ${name}`);
  for (const refused of headShots.refused) lines.push(`- refused on the head: ${refused}`);

  const unacceptedCount = shots.unaccepted.length + shots.lost.length;
  if (unacceptedCount > 0) {
    if (labelAccepts) {
      lines.push("", "The PR's `retrato-aceito` label accepts the changes above.");
    } else {
      failures.push(
        `${unacceptedCount} portrait(s) changed without the committed signature changing along.` +
          " Look on the machine and accept: bun run shot && bun run visual --accept, and commit" +
          " demo/assinaturas.json. A difference that only shows up on linux: the `retrato-aceito` label on the PR.",
      );
    }
  }

  if (failures.length > 0) {
    lines.push("", "### Why it went red", "");
    for (const failure of failures) lines.push(`- ${failure}`);
  }

  const report = lines.join("\n");
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await Bun.write(
      process.env.GITHUB_STEP_SUMMARY,
      `${await Bun.file(process.env.GITHUB_STEP_SUMMARY)
        .text()
        .catch(() => "")}${report}\n`,
    );
  }

  process.exit(failures.length > 0 ? 1 : 0);
}
