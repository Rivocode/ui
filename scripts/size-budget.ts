/**
 * The package size budget, in gzip bytes, with the reason for each number.
 * The one that checks it is `check:size` (`scripts/check-package-size.ts`).
 *
 * Every limit was born as the value measured on 24/09/2026 plus 10%, rounded
 * up to the hundred bytes. The 10% is the slack for what nobody decides: the
 * minifier and gzip change versions - CI runs `bun-version: latest` -, and a
 * class tweak in a piece moves dozens of bytes. Beyond that, growth is a
 * choice, and a choice gets written here.
 *
 * To raise a limit on purpose: in the SAME commit that made it grow, replace
 * `limit` with the number the guard suggests (the measured value plus 10%) and
 * rewrite `why` saying what came in and why it is worth the weight. The floor
 * works the other way: a measurement below 80% of the limit fails, and the
 * limit goes down in the commit that shrank it.
 */
export type Budget = { limit: number; why: string };

/**
 * The tree-shaking line. `mark` is a class only the `Button` writes: the
 * measured package has to contain it, otherwise the number is of an empty file.
 */
export const BUTTON_ALONE = {
  name: "Button alone",
  mark: "motion-safe:active:scale-[0.985]",
};

export const BUDGET: Record<string, Budget> = {
  ".": {
    limit: 159_900,
    why: "Went up on 24/09/2026 from 113.9 to 141.9 KB, with the thirteen pieces of 0.18.0; measured per piece, with dependencies left out: Gantt 18.2 KB (dates, virtual scrolling and dependency arrows, no peer - it stays in the root because, with tree-shaking, only whoever imports it pays), SignaturePad 6.0, TransferList 5.8, Tour 4.6, ScrollToTop 3.4, TableOfContents 2.5, Affix 1.4, Spoiler 1.1 and Highlight 0.9. Before: 113.9 KB in 153 files: the pieces of the root index, with no dependency at all - Base UI, TanStack, react-day-picker and tailwind-merge belong to whoever installs and stay out of the count. Almost nobody downloads all of this; it is the ceiling for whoever imports everything, and it is what grows with each new piece. A new piece that costs more than about 2 KB gzipped deserves the question of whether it should be a subpath.",
  },
  "./styles.css": {
    limit: 20_200,
    why: "18.2 KB: the CSS Tailwind generates from the pieces' classes, plus the tokens of both themes and both densities. Everyone downloads all of it, on every screen, and that is why this limit is the tightest in proportion to what it delivers. On 25/09/2026 it had reached 19.4 KB (98% of the limit) and went down 1.3 KB without changing a pixel of the 56 portraits: 0.8 KB of whitespace that `compactCss` (scripts/compact-css.ts) removes - Tailwind's `--minify` was measured and refused, because it quantizes the alpha of colors and changed the Gantt border -, and 0.4 KB of fourteen rules no piece uses: the scanner read as a class the array `filter(`, the event `\"resize\"`, the tag `\"table\"` and the variant name `outline`, and `.filter`, `.blur` and `.invert` dragged in thirteen `@property`. They leave through the `@source not inline` of src/styles.css, and `check:classes` flags it if one of them becomes a real class.",
  },
  "./form": {
    limit: 2_700,
    why: "2.3 KB: the bridge to react-hook-form and zod, which are optional peers and do not enter the count. The subpath is small on purpose - whoever does not use forms does not even pay this.",
  },
  "./chart": {
    limit: 24_400,
    why: "Went up on 26/09/2026 from 21.2 to 21.7 KB measured (limit with 10% slack) with the charts' empty state and the donut tooltip outside the hole: the `empty` with EmptyState in the donut, the funnel, the map and the heat grid, the no-data notice of ChartContainer, the background ring and the positioning of the donut tooltip, and the safe name of the series color variable. Went up on 24/09/2026 from 10.7 to 19.7 KB with the four Recharts-free charts of 0.18.0: ChartTreemap 4.1 KB (the squarified layout), ChartHeatmap 4.0, ChartGauge 2.3 and ChartFunnel 1.9. Before, 10.7 KB: the dressing of Recharts, which is an optional peer and stays out. The weight of Recharts is the reason this code lives in a subpath and not in the root index (`check:chart`).",
  },
  "./ai": {
    limit: 13_700,
    why: "Went up on 26/09/2026 from 11.7 to 12.1 KB with the layer context (src/lib/layer.tsx), which the floating pieces the subpath depends on started reading to open above whoever opened them - a Select inside a Dialog opened hidden behind it. Before, 10.9 KB: the pieces for conversation with a model. Subpath without a peer, split out for its weight: whoever has no AI screen does not pay the 10 KB.",
  },
  "./dnd": {
    limit: 11_400,
    why: "Went up on 26/09/2026 from 9.7 to 10.1 KB with the layer context (src/lib/layer.tsx): the Kanban's dragged card reads the step of whoever contains it and passes over the Dialog or Sheet where the board lives. Before, 9.1 KB: drag and drop on top of dnd-kit, which is an optional peer and stays out of the count.",
  },
  "./editor": {
    limit: 19_900,
    why: "17.6 KB: the toolbar, the commands and `RichTextView` on top of Tiptap 3, which is an optional peer and stays out.",
  },
  "Button alone": {
    limit: 13_900,
    why: "12.3 KB, and 36.9 KB minified, with dependencies INSIDE and only the peers left out: the Button, `cn` with tailwind-merge (most of it), Base UI's `useRender` and cva. Before `unbundle` in tsdown.config.ts this number was 129 KB, because the single index dragged in all of Base UI. If it jumps to the hundreds, tree-shaking broke again - and the `sideEffects` of package.json is the first place to look.",
  },
};
