/**
 * Promise guard: no page may document a piece that does not exist.
 *
 * FileUpload was published with its whole page written - props, dragging,
 * validation of accept and maxSize - and the component missing from the
 * package. Whoever followed the doc broke at build time; an agent reading the
 * index proposed the piece with confidence. And the cross-check that uncovers
 * this runs in seconds.
 *
 * The check applies in both directions, because both failures are silent: a
 * page without an export is a promise nobody keeps, and an export without a
 * page is a piece nobody finds.
 *
 * The second direction has a declared exception: a part that only exists
 * inside another piece is documented on that piece's page.
 */
import { scanAtLeast } from "./scan";

const DOCS = ".design-sync/docs";
const ENTRY_POINTS = [
  "src/index.ts",
  "src/form/index.ts",
  "src/chart/index.ts",
  "src/ai/index.ts",
  "src/dnd/index.ts",
  "src/editor/index.ts",
];

/**
 * What is not a piece and so has no page of its own: hook, utility, and the
 * type that goes with the piece - `ButtonProps` lives on the Button page.
 */
const NOT_A_PIECE = (name: string) => /^(use[A-Z]|[a-z])/.test(name) || name.endsWith("Props");

const exported = new Set<string>();

for (const entry of ENTRY_POINTS) {
  const source = await Bun.file(entry).text();

  // A third-party re-export does not promise a page of ours: whoever documents
  // Recharts is Recharts.
  // `[^}]` and not `[\s\S]*?`: the non-greedy one crossed from the first export
  // block to the Recharts one and swallowed everything in between - eight
  // pieces showed up as a page without code.
  const ours = source.replace(/export \{[^}]*\} from "recharts";/g, "");

  for (const block of ours.matchAll(/export \{([\s\S]*?)\} from/g)) {
    for (const raw of block[1]!.split(",")) {
      const part = raw.trim();
      // A comment inside the block is not an export, and a type is not a piece.
      if (!part || part.startsWith("//") || part.startsWith("type ")) continue;

      // `ToolbarRoot as Toolbar`: the public name is the one after `as`, and it
      // is the one the page documents.
      exported.add(
        part
          .split(/\s+as\s+/)
          .pop()!
          .trim(),
      );
    }
  }

  for (const [, name] of ours.matchAll(/export (?:const|function|class) (\w+)/g)) {
    exported.add(name!);
  }
}

const documented = (await scanAtLeast("*.md", 150, { cwd: DOCS })).map((file) =>
  file.replace(/\.md$/, ""),
);

const promised = documented.filter((name) => !exported.has(name));
/*
 * A part does not need a page of its own: `CardHeader` is documented on the
 * `Card` page, and that is how the index for agents lists the two. What it
 * needs is to be mentioned somewhere - `SidebarMenuItem` on the Sidebar page,
 * `MASKS` on the MaskedInput one. The question that matters is not "does it
 * have a page", but "will whoever looks for it find it".
 */
const prose = (
  await Promise.all(documented.map((name) => Bun.file(`${DOCS}/${name}.md`).text()))
).join("\n");

const silent = [...exported].filter(
  (name) =>
    !NOT_A_PIECE(name) && !documented.includes(name) && !new RegExp(`\\b${name}\\b`).test(prose),
);

if (promised.length > 0) {
  console.error(`${promised.length} page(s) documenting a piece that does not exist:\n`);
  for (const name of promised.sort()) console.error(`  ${DOCS}/${name}.md`);
  console.error("\nPublish the piece, or remove the page: the doc is promising what nobody delivers.");
  process.exit(1);
}

if (silent.length > 0) {
  console.error(`${silent.length} exported piece(s) without a page:\n`);
  for (const name of silent.sort()) console.error(`  ${name}`);
  console.error(
    `\nWrite ${DOCS}/<Piece>.md, or mention the piece on the page of whoever composes it -` +
      "\nwithout that it only exists for whoever reads the .d.ts.",
  );
  process.exit(1);
}

console.log(`${documented.length} pages, all with code behind them, and no silent piece.`);
