/**
 * Showcase guard: a catalog piece nobody looked at in both themes.
 *
 * The house process ends with a step no machine did: render it in `demo/` and
 * look, in both themes and both densities. It is the only place where the
 * things tests do not see show up - indeterminate state, loading state, a
 * dashed border that vanishes in dark, a touch target that shrinks in dense.
 *
 * On 26/08/2026 seven pieces were published to npm without anyone having
 * looked at any of them: `TimeField`, `TimePicker`, `FilterBar`,
 * `FilterChip`, `QueryBoundary`, `Popconfirm` and `VirtualList`. They passed
 * 1072 tests. The seven agents that wrote them skipped the step, each for a
 * reasonable reason, and nothing flagged it - because the step was prose in an
 * agent, and prose does not fail.
 *
 * When measured, the count was worse than seven: 28 of the 90 catalog pieces
 * were missing from `demo/`. The rule had always existed and the compliance
 * rate was two thirds, which is another way of saying it did not exist.
 *
 * This guard does not ask for a pretty portrait nor demand showcase quality -
 * it cannot see the screen. It demands the DECLARATION, as `check:scripts` does
 * with an orphan script: either the piece appears in some page of
 * `demo/*.tsx`, or there is a line in `WITHOUT_SHOWCASE` saying WHY it does not.
 * Both answers are valid; silence is not.
 *
 * `WITHOUT_SHOWCASE` **only shrinks**, like the `DEBT` of `check:comments` and
 * the parity's `FILA_DECLARADA`: a piece that started appearing in the demo is
 * an error, and the guard says to delete the line. An exception list that does
 * not shrink becomes the place where debt lives without bothering anyone.
 *
 * The search is by word boundary, and that is not a regex detail: `Card` is
 * inside `CardHeader` and `Button` is inside `ButtonGroup`. Without the
 * boundary, `ButtonGroup` - which really is not in the showcase - would pass
 * green forever because of the `Button` that appears in eight places, and the
 * guard would be lying exactly about the piece it exists to catch.
 */
import { readdirSync } from "node:fs";

import { findParent } from "../apps/docs/src/parts";

const DOCS = ".design-sync/docs";
const DEMO = "demo";

/**
 * The same source as `check:pieces` and the parity's `catalogPieces()`.
 *
 * `.design-sync/docs/` minus the parts, and the `findParent` from
 * `apps/docs/src/parts.ts` is what decides what is a part - the same one the
 * site sidebar uses. The parity carries a copy of this rule because it cannot
 * import from the app; if the two diverge, the piece count starts depending on
 * which guard you ran, which is the start of every wrong count in this
 * repository.
 */
function catalogPieces() {
  const names = readdirSync(DOCS)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""))
    .sort();

  return names.filter((name) => !findParent(name, names));
}

/**
 * The pieces that have no showcase today, and the reason for each.
 *
 * The reason is for whoever decides whether it is still worth leaving out, so it
 * says what PREVENTS it, and not that it is missing. Two things live in this
 * list, and telling them apart is the work: a piece another one already
 * portrays, and a piece whose state only exists during a gesture no portrait
 * keeps.
 *
 * The third class - actual debt, which was the majority - was paid on 27/08/2026:
 * twenty-five lines left here at once, between pieces placed in pages that
 * already existed and the two new pages, `demo/painel.tsx` and `demo/paleta.tsx`.
 * If any comes back here, the reason has to say what started preventing it.
 *
 * On 25/09/2026 the two gesture ones left: `Autocomplete` went in closed in
 * `demo/dados.tsx`, with text outside the list, and `Editable` went in to
 * `demo/painel.tsx`, opened by a scripted click in the dark theme, as
 * `ContextMenu` already did. What is left is the only one with nothing to
 * portray on its own.
 */
const WITHOUT_SHOWCASE: Record<string, string> = {
  ToastViewport:
    "Has no showcase of its own: RivoProvider mounts it, and no app writes it. What can be seen of it is already in demo/flutuantes.tsx, which fires the toasts that land inside it.",
};

const pieces = catalogPieces();

const pages = readdirSync(DEMO)
  .filter((file) => file.endsWith(".tsx"))
  .sort();

if (pages.length < 15 || pieces.length < 100) {
  console.error(
    `The scan read ${pages.length} page(s) from ${DEMO}/ and ${pieces.length} piece(s) from ${DOCS}/,\n` +
      "  and the floor is 15 and 100. A short list here leaves the guard green without having looked.",
  );
  process.exit(1);
}

const sources = await Promise.all(
  pages.map(async (page) => [page, await Bun.file(`${DEMO}/${page}`).text()] as const),
);

/**
 * A `demo/` file split into top-level declarations, and what the render reaches.
 *
 * On 24/09/2026 merging the 0.18.0 work streams left in `demo/novas.tsx` the
 * functions `Transfers`, `Highlights` and `Spoilers` defined and never called:
 * the `Sample` that mounted them lost the three lines. The old guard searched
 * for the NAME in the text, and `TransferList`, `Highlight` and `Spoiler` were
 * written inside the dead functions, so it stayed green with the three pieces
 * off screen. It was the same defect as the day that gave birth to it - a piece
 * nobody looked at - coming in through the door it left open.
 *
 * Now it only counts `<Piece` written inside code the render REACHES. The roots
 * are every top-level statement that is not a declaration
 * (`createRoot(...).render(...)`, the `if (view === ...) root.render(...)` of
 * portrait pages) and every declaration that calls `createRoot`. From there, a
 * declaration gets in when its name appears in already-reached code. It is not
 * a real parser: the cut is by line starting at column zero, which is how the
 * `demo/` files are written, and `{false && <Piece />}` would still pass. What
 * it closes is the shape that actually happened: a whole function nobody calls.
 */
type Segment = { name: string | null; code: string };

const DECLARATION =
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/;

function segmentsOf(source: string): Segment[] {
  const segments: Segment[] = [];
  let current: Segment = { name: "#top", code: "" };

  for (const line of source.split("\n")) {
    if (/^[A-Za-z_$]/.test(line) && !/^(?:else|from)\b/.test(line)) {
      const declared = DECLARATION.exec(line);
      current = { name: /^import\b/.test(line) ? "#import" : declared ? declared[1]! : null, code: "" };
      segments.push(current);
    }
    current.code += line + "\n";
  }

  return segments.filter((segment) => segment.name !== "#import");
}

function reachableCode(source: string) {
  const segments = segmentsOf(source);
  const seen = new Set<Segment>(
    segments.filter((segment) => segment.name === null || segment.code.includes("createRoot(")),
  );
  const queue = [...seen];

  while (queue.length > 0) {
    const code = queue.shift()!.code;
    for (const segment of segments) {
      if (seen.has(segment) || !segment.name) continue;
      if (new RegExp(`(?<![\\w$.])${segment.name.replace(/\$/g, "\\$")}(?![\\w$])`).test(code)) {
        seen.add(segment);
        queue.push(segment);
      }
    }
  }

  return {
    live: segments.filter((segment) => seen.has(segment)).map((segment) => segment.code).join("\n"),
    dead: segments.filter((segment) => !seen.has(segment)).map((segment) => segment.code).join("\n"),
  };
}

const reached = sources.map(([page, source]) => [page, reachableCode(source)] as const);

for (const [page, code] of reached) {
  if (!/\.render\(/.test(code.live)) {
    console.error(
      `${DEMO}/${page}: the cut found no \`.render(\` in reached code.\n` +
        "  Without a root, every piece on the page would count as dead - or, worse, the\n" +
        "  reading changed shape and the guard stopped measuring. Check the cut in segmentsOf.",
    );
    process.exit(1);
  }
}

/**
 * Where the piece is RENDERED, by whole name: `<Card` does not match inside
 * `<CardHeader`, and the bare name in an import, a string or a function nobody
 * calls does not count.
 */
function pagesWith(piece: string) {
  const rendered = new RegExp(`<${piece}\\b`);
  return reached.filter(([, code]) => rendered.test(code.live)).map(([page]) => page);
}

/** Where the piece only appears in dead code, so the message says where to look. */
function deadPagesWith(piece: string) {
  const rendered = new RegExp(`<${piece}\\b`);
  return reached.filter(([, code]) => rendered.test(code.dead)).map(([page]) => page);
}

const problems: string[] = [];
const onStage: string[] = [];
const declared: string[] = [];

for (const piece of pieces) {
  const found = pagesWith(piece);

  if (found.length > 0) {
    onStage.push(piece);

    if (WITHOUT_SHOWCASE[piece]) {
      problems.push(
        `\`${piece}\` is in WITHOUT_SHOWCASE and ALREADY appears in ${found.join(", ")}.\n` +
          "    The debt was paid: delete its line from the list. An exception that does not shrink\n" +
          "    becomes the place where the piece without a showcase hides.",
      );
    }
    continue;
  }

  if (WITHOUT_SHOWCASE[piece]) {
    declared.push(piece);
    continue;
  }

  const dead = deadPagesWith(piece);
  problems.push(
    (dead.length > 0
      ? `\`${piece}\` only appears in code the render does not reach, in ${dead.join(", ")}.\n` +
        "    The function that mounts it exists and nobody calls it: wire it into the page's Sample.\n"
      : `\`${piece}\` is not rendered in any page of ${DEMO}/*.tsx.\n`) +
      "    Render the piece in one of the pages and look in BOTH themes and BOTH densities -\n" +
      "    it is the only step of the process no test does for you. If it should not have a\n" +
      "    showcase, write the reason in WITHOUT_SHOWCASE, in scripts/check-demo.ts.",
  );
}

for (const piece of Object.keys(WITHOUT_SHOWCASE)) {
  if (!pieces.includes(piece)) {
    problems.push(
      `\`${piece}\` is in WITHOUT_SHOWCASE and is not a catalog piece.\n` +
        `    Either the name changed, or the page in ${DOCS} is gone. Delete or fix the line:\n` +
        "    a dead entry makes the list look bigger than the debt.",
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) in the showcase:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "Seven pieces were published to npm without anyone having looked at\n" +
      "any of them, and the 1072 tests stayed green the whole time. This guard is\n" +
      "what is left of that day: either the piece is in the showcase, or the reason is written.",
  );
  process.exit(1);
}

console.log(
  `${onStage.length} of ${pieces.length} pieces in the showcase, and ${declared.length} declared out, ` +
    `across ${pages.length} pages of ${DEMO}/.`,
);
