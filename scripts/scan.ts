/**
 * Scan floor: the guard that scans an empty list and stays green without having looked at anything.
 *
 * On 27/08/2026 four checks were found passing without measuring, and two of
 * them had this shape. `test/accents.test.ts` was widened to both packages
 * with `{src/**\/*.{ts,tsx},native/src/**\/*.{ts,tsx}}` - a NESTED brace,
 * which bun's Glob does not expand: the test scanned zero files and passed.
 * The same shape was measured in the `scripts/` guards, breaking the pattern
 * on purpose to see who turned red: `check:contrast` announced contrast was ok
 * in every theme having read ZERO themes, and `check:colors`,
 * `check:groups`, `check:classes`, `check:names`, `check:comments`,
 * `check:chart`, `check:skill`, `check:scripts` and `check:shared`
 * exited with code 0 the same way.
 *
 * The defect is not the wrong pattern - it is that the scan can return empty
 * without anyone complaining. The safe path only becomes the only path if it
 * is easier to write than the unsafe one, and that is why this module returns
 * the list and demands the floor in the SAME call: you cannot ask for the
 * files without saying how many you expect.
 *
 * The floor is a loose number, not the exact count. It exists to tell "the
 * tree shrank a little" apart from "the pattern stopped matching", and a floor
 * glued to today's count turns red every time someone deletes a file.
 *
 * Whoever scans without Glob - a count of measured themes, of mirrored files -
 * demands the same floor with `countAtLeast`.
 */
import { Glob } from "bun";

type ScanOptions = { cwd?: string; dot?: boolean; followSymlinks?: boolean };

function refuse(what: string, counted: number, floor: number): never {
  console.error(
    `The scan of ${what} found ${counted} item(s), and the declared floor is ${floor}.\n`,
  );
  console.error(
    "This is not the guard flagging what it guards: it is the guard flagging itself." +
      "\nWith the list empty, the check below would pass green without having read anything." +
      "\n\nEither the pattern stopped matching - nested brace, hidden folder without `dot`," +
      "\nrenamed folder -, or the tree really shrank and the floor must go down with it," +
      "\nin the same commit that shrank it.",
  );
  process.exit(1);
}

/**
 * The files that match the pattern, in stable order, or the process dies.
 *
 * `dot` turns on scanning of hidden folders - `.design-sync/`, `.claude/` -,
 * which bun's Glob silently skips when they appear in the pattern.
 *
 * With a LIST of patterns, the floor applies to the sum, and the order of the
 * patterns is preserved. That serves whoever looks for the same thing in two
 * places without knowing which one holds it: the fonts live in
 * `node_modules/@fontsource*` or in `node_modules/.bun`, depending on the shape
 * of the install, and demanding a floor from each pattern there would fail
 * every tree that has only one of the two.
 */
export async function scanAtLeast(
  pattern: string | string[],
  floor: number,
  options: ScanOptions = {},
): Promise<string[]> {
  const patterns = typeof pattern === "string" ? [pattern] : pattern;
  const found: string[] = [];

  for (const one of patterns) {
    const batch = await Array.fromAsync(
      new Glob(one).scan({
        cwd: options.cwd ?? ".",
        dot: options.dot ?? false,
        followSymlinks: options.followSymlinks ?? false,
      }),
    );

    found.push(...batch.sort());
  }

  if (found.length < floor) {
    refuse(patterns.map((one) => `\`${one}\``).join(" plus "), found.length, floor);
  }

  return found;
}

/** The same floor, for a count that does not come from a Glob. */
export function countAtLeast(what: string, counted: number, floor: number): number {
  if (counted < floor) refuse(what, counted, floor);

  return counted;
}
