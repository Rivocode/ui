/**
 * Compares each portrait in `demo/dist` with the committed signature.
 *
 * `check:scripts` guards the incident of nobody RUNNING this comparison. This
 * is the other one, and it cost half a day of two people: it ran, and the
 * portrait was from another build. The `datas` and `datas-celular` portraits
 * came out red, and two different work streams reported it as a real
 * `EventCalendar` regression. It was not. The PNGs were from 08:55, and
 * `demo/dist/demo.css` was rebuilt at 09:12: the old CSS was today's minus one
 * rule, `.[scrollbar-gutter:stable]`, used in a single place in the repository
 * - the scroll container of the day view. Without the reserved gutter, the day
 * column gets about 15px wider and the event bars run to the edge.
 *
 * Proven by reconstruction: deleting ONLY that rule from today's CSS and
 * reshooting, the result matched the old PNG in 0 pixels of 6,150,400, and
 * reproduced the exact numbers of the alarm - 4 of 576 squares worst 7, and 6
 * of 576 worst 10.
 *
 * A comparison that may be measuring another build cannot come out green or
 * red: both answers lie. So each PNG carries the stamp of the build that
 * generated it, in a `tEXt` chunk called `rc-build` that `shot.ts` stitches in:
 * the path and content digest of each file the browser loaded - the page HTML,
 * the frame HTML when there is one, the compiled CSS and the bundle. Before
 * comparing, this guard recomputes the digests and REFUSES the portrait whose
 * build is no longer what is on disk, the same way it already refuses the
 * section that did not fit in the window. A portrait without a stamp is also
 * refused: it came from another tool, or from before this guard existed, and in
 * both cases nobody knows where it came from.
 *
 * The stamp cites only what that route loads, and not the whole build.
 * Measured with one extra byte in `demo/dist/datas.js`: it refused `datas` and
 * `datas-celular`, exactly the two from the incident, and compared the other 42
 * normally. Swapped CSS refuses all 44, because the CSS belongs to all of them.
 *
 * The first idea was to compare `mtime`, and it loses on both sides. It flags
 * what did not change: `bun build` rewrites the 17 bundles on every
 * `bun run demo` with identical bytes - measured, the dates went from 11:00:53
 * to 11:06:03 and no digest changed. Since `bun run portrait` rebuilds the
 * whole showcase and reshoots ONE section, the other 43 portraits would be
 * older than every bundle, and the guard would refuse 43 without anything
 * having changed. And it lets through what really changed: `touch`, folder
 * copy and backup restore change the date without changing the content. A
 * content digest errs on the right side in both cases, and costs 122 to 166
 * bytes per PNG and under a second of reading, against the 77s of Chrome each
 * `bun run shot` spends.
 */

import {
  type PngImage,
  CELL,
  CELL_CEILING,
  FRAME,
  SHOTS,
  SIGNATURES,
  compareSignatures,
  decodePng,
  driftOf,
  isSection,
} from "./portraits";
import { scanAtLeast } from "./scan";

const GRID = 24;

function signatureOf({ width, height, channels, pixels }: PngImage): number[] {
  const cells: number[] = [];

  for (let row = 0; row < GRID; row++) {
    for (let column = 0; column < GRID; column++) {
      const fromY = Math.floor((row * height) / GRID);
      const toY = Math.max(fromY + 1, Math.floor(((row + 1) * height) / GRID));
      const fromX = Math.floor((column * width) / GRID);
      const toX = Math.max(fromX + 1, Math.floor(((column + 1) * width) / GRID));

      let sum = 0;
      let count = 0;
      for (let y = fromY; y < toY; y += 2) {
        for (let x = fromX; x < toX; x += 2) {
          const at = (y * width + x) * channels;
          sum += (pixels[at]! * 299 + pixels[at + 1]! * 587 + pixels[at + 2]! * 114) / 1000;
          count++;
        }
      }

      cells.push(Math.round(sum / count));
    }
  }

  return cells;
}

function isFrame({ pixels }: PngImage, at: number) {
  return (
    Math.abs(pixels[at]! - FRAME.red) < 6 &&
    Math.abs(pixels[at + 1]! - FRAME.green) < 6 &&
    Math.abs(pixels[at + 2]! - FRAME.blue) < 6
  );
}

function trimFrame(image: PngImage) {
  const { width, height, channels } = image;

  let right = width;
  while (right > 0) {
    let onlyFrame = true;
    for (let y = 0; y < height && onlyFrame; y++) {
      if (!isFrame(image, (y * width + right - 1) * channels)) onlyFrame = false;
    }
    if (!onlyFrame) break;
    right--;
  }

  let bottom = height;
  while (bottom > 0) {
    let onlyFrame = true;
    for (let x = 0; x < right && onlyFrame; x++) {
      if (!isFrame(image, ((bottom - 1) * width + x) * channels)) onlyFrame = false;
    }
    if (!onlyFrame) break;
    bottom--;
  }

  return { width: right, height: bottom };
}

function sectionSignature(image: PngImage) {
  const { width, height } = trimFrame(image);

  if (width === 0 || height === 0 || width === image.width || height === image.height) {
    return undefined;
  }

  const columns = Math.max(1, Math.round(width / CELL));
  const rows = Math.max(1, Math.round(height / CELL));
  if (columns * rows > CELL_CEILING) return { columns, rows, cells: undefined };

  const cells: number[] = [columns, rows];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const fromY = Math.floor((row * height) / rows);
      const toY = Math.max(fromY + 1, Math.floor(((row + 1) * height) / rows));
      const fromX = Math.floor((column * width) / columns);
      const toX = Math.max(fromX + 1, Math.floor(((column + 1) * width) / columns));

      let sum = 0;
      let count = 0;
      for (let y = fromY; y < toY; y++) {
        for (let x = fromX; x < toX; x++) {
          const at = (y * image.width + x) * image.channels;
          sum +=
            (image.pixels[at]! * 299 + image.pixels[at + 1]! * 587 + image.pixels[at + 2]! * 114) /
            1000;
          count++;
        }
      }

      cells.push(Math.round(sum / count));
    }
  }

  return { columns, rows, cells };
}

const accept = process.argv.includes("--accept");

// The CI bench shoots two trees on the SAME machine and compares one with the
// other, and not with the committed one - which was born on macOS and never
// matches on linux. With `--record-to`, this guard only writes what it measured
// and what it refused, and the judge is `scripts/bench-comparison.ts`.
const recordAt = process.argv.indexOf("--record-to");
const recordTo = recordAt === -1 ? "" : (process.argv[recordAt + 1] ?? "");
if (recordAt !== -1 && !recordTo) {
  console.error("--record-to needs the file path.");
  process.exit(1);
}
const stored: Record<string, number[]> = await Bun.file(SIGNATURES)
  .json()
  .catch(() => ({}));

const current: Record<string, number[]> = {};
const changed: { name: string; cells: number; total: number; worst: number }[] = [];
const fresh: string[] = [];
const broken: string[] = [];
const outdated: string[] = [];
const refused = new Set<string>();

for (const file of await scanAtLeast("*.png", 30, { cwd: SHOTS })) {
  const name = file.replace(/\.png$/, "");
  const image = decodePng(new Uint8Array(await Bun.file(`${SHOTS}/${file}`).arrayBuffer()));

  if (!image.build) {
    outdated.push(`${name} - no build stamp`);
    refused.add(name);
    continue;
  }

  const drift = await driftOf(image.build);
  if (drift.length > 0) {
    outdated.push(`${name} - ${drift.join(", ")}`);
    refused.add(name);
    continue;
  }

  let signature: number[];

  if (isSection(name)) {
    const section = sectionSignature(image);

    if (!section) {
      broken.push(
        `${name} - the section did not fit in the window, or the \`data-rc-shot\`` +
          " marker was not found on the page.",
      );
      refused.add(name);
      continue;
    }
    if (!section.cells) {
      broken.push(
        `${name} - the frame has ${section.columns}x${section.rows} cells, above the ceiling of` +
          ` ${CELL_CEILING}. That is a page with a section name: tighten the` +
          " `data-rc-shot` down to the piece, or shoot the whole page.",
      );
      refused.add(name);
      continue;
    }
    signature = section.cells;
  } else {
    signature = signatureOf(image);
  }

  current[name] = signature;

  const before = stored[name];
  if (!before) {
    fresh.push(name);
    continue;
  }

  const diff = compareSignatures(name, before, signature);
  if (diff.frame) {
    changed.push({ name: `${name}  ${diff.frame}`, cells: 0, total: 0, worst: 0 });
  } else if (diff.cells > 0) {
    changed.push({ name, cells: diff.cells, total: diff.total, worst: diff.worst });
  }
}

if (recordTo) {
  await Bun.write(
    recordTo,
    `${JSON.stringify({ signatures: current, refused: [...outdated, ...broken] }, null, 0)}\n`,
  );
  console.log(
    `${Object.keys(current).length} signature(s) measured and ${refused.size} refused, written to ${recordTo}.`,
  );
  process.exit(0);
}

const gone = Object.keys(stored).filter((name) => !(name in current) && !refused.has(name));

if (accept && broken.length === 0 && outdated.length === 0) {
  await Bun.write(SIGNATURES, `${JSON.stringify(current, null, 0)}\n`);
  console.log(`${Object.keys(current).length} signature(s) stored in ${SIGNATURES}.`);
  process.exit(0);
}

for (const problem of outdated) console.log(`  refused ${problem}`);
for (const problem of broken) console.log(`  broken  ${problem}`);
for (const name of fresh) console.log(`  new     ${name}`);
for (const name of gone) console.log(`  gone    ${name}`);
for (const { name, cells, total, worst } of changed.sort((a, b) => b.cells - a.cells)) {
  if (total === 0) {
    console.log(`  changed ${name}`);
    continue;
  }
  const share = ((cells / total) * 100).toFixed(1);
  console.log(`  changed ${name}  ${cells} of ${total} squares (${share}%), worst ${worst}`);
}

if (
  changed.length === 0 &&
  fresh.length === 0 &&
  gone.length === 0 &&
  broken.length === 0 &&
  outdated.length === 0
) {
  console.log(`${Object.keys(current).length} portraits, none changed.`);
  process.exit(0);
}

if (outdated.length > 0) {
  console.log(
    `\n${outdated.length} portrait(s) refused: there is no way to claim the build that` +
      "\ngenerated them is the one in demo/dist now. Without a stamp, the portrait came" +
      "\nfrom another tool or from before this guard; with a stamp that does not match," +
      "\nsomething was rebuilt after the shot." +
      "\n\nComparing like that would answer about another build, and neither green nor red" +
      "\nwould be true - that is why the refusal comes before the comparison, and --accept" +
      "\ndoes not write while it stands." +
      "\n\nReshoot: bun run shot. A single section: bun run portrait <part>.",
  );
}

if (changed.length > 0 || fresh.length > 0 || gone.length > 0) {
  console.log(
    "\nLook at what changed before accepting: this guard says where it changed, and not" +
      "\nwhether the change is right. After looking: bun run visual --accept",
  );
}

process.exit(changed.length > 0 || broken.length > 0 || outdated.length > 0 ? 1 : 0);
