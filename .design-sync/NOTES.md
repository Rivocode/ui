# Notes from the sync with claude.ai/design

Project: `RivoCode` (`ee82ac5d-bfc0-4f2f-959a-5e371dddee8b`).

## What cost time the first time

- **`package.json` needs `types` at the top level.** The converter reads
  `pkg.types`, not the `exports` block. Without it it finds zero components and
  reports `[ZERO_MATCH] tokens-only DS`, which looks like a problem of a
  different nature. Already fixed in the package, and useful for other tools
  too.

- **The code folder needs to be called `components`.** The converter takes the
  group from the directory name, and only ignores generic names
  (`components`, `component`, `src`, `lib`, `ui`, `packages`, `react`). With
  `src/primitives` the 14 components with an authored preview all ended up in a
  "primitives" group and the document's category was ignored. Renamed.

- **`provider` in `cfg` has to be `scope: 'local'`.** In global mode
  RivoProvider dresses the tokens but does not paint the background, so the
  card stays white with almost-white text on top and the outline and ghost
  variants disappear.

- **The previews need their own stylesheet.** The library's Tailwind scans only
  `src/`, so a class used only in a preview (`h-12`, `max-w-lg`) does not exist
  and the card renders incomplete **with no warning at all**. That is why
  `.design-sync/sync.css` exists, which also scans `previews/`, and
  `cfg.cssEntry` points to its output. The production CSS stays lean.
  Recompile before each sync:

  ```sh
  bunx @tailwindcss/cli -i .design-sync/sync.css -o .design-sync/.cache/styles.css
  bun run scripts/copy-fonts.ts .design-sync/.cache/styles.css
  ```

- **Playwright**: the latest version (1.62) asks for chromium 1234, which was
  already in the machine's cache. Nothing to download.

## Known warnings, already triaged

None. The last verification came out with zero warnings and `bad: 0`.

Five components have `cardMode` pinned because they float and do not fit the
grid: `Checkbox` (column), `Dialog`, `Menu`, `Select`, `Tooltip` and
`ToastViewport` (single). That is presentation, not a defect.

## Second round, 24/08/2026

The catalog went from 15 to 41 components and the sync fell 26 behind. 26
previews and 35 new documents were authored, and `docsMap` went from 52 to 87
entries.

A door for silent errors was closed: the previews were not type-checked, so a
nonexistent `variant` or a renamed prop only showed up as an incomplete card in
the sync. Now `bun run check:previews` compiles the folder against the
**source**, through `paths` in `.design-sync/tsconfig.json`, without depending
on a build or on `bun link`. It went into `bun run check`.

`sync.css` started scanning `src/form` too.

**The upload was not done yet** in that round: it depended on the
`/design-sync` skill, which was only installed later.

## Risks for the next sync

- **The composites are still on the fallback card** (`CardHeader`,
  `TableCell`, `MenuItem`, `ComboboxList` and the like). They import and work,
  they just have no preview of their own. Authoring them is optional and
  incremental.

- **The floating piece previews use `defaultOpen` and a minimum height**
  (`min-h-72`), or the card comes out empty. That holds for `AlertDialog`,
  `Sheet`, `Popover` and `Combobox`.

- **`Sidebar` has a fixed height in the preview** and not `min-h-dvh`, or the
  card grows to the size of the capture window.

- **The `.design-sync/.cache/styles.css` stylesheet is generated and
  gitignored.** If it is not recompiled before the build, the sync uses the old
  version and new preview classes vanish without warning. This is the most
  silent risk of this setup.

- **The `_ds_manifest.json` and `_adherence.oxlintrc.json` in the project are
  the app's**, not ours. Do not delete.

- **The landing had `Header` and `Logo` synced before**, from when the design
  system was the site's components. They were deleted in this sync. If anyone
  misses them, their place is another project, not this one.

## Third round, 24/08/2026, with the skill installed

The catalog reached 55 components plus the `/form` and `/chart` subpaths. The
sync really ran this time: 160 components discovered, `ok: true`, anchor ok.
**The upload was not done yet**, it stopped at the step of grading the 57
review sheets. See `docs/ESTADO.md`, section "Sync in progress", for the
step by step to resume.

### What cost time this time

- **A subpath component is not discovered.** The converter lists components
  through the **main entry's** `.d.ts`. `extraEntries` puts `/form` and
  `/chart` on `window.RivoCodeUI` (the agent can import them), but they get no
  contract, doc or card. The log says `stale preview: <Name>, component
  no longer exported`, which looks like a preview error and is something else.
  The fix is `componentSrcMap`, which **adds** besides pinning the path:
  `{"ChartContainer": "src/chart/chart.tsx"}`.

- **`ChartContainer` alone is an empty frame.** The marks and axes live in
  Recharts, and the bundle only exports what our entry exports. Without
  re-exporting `LineChart`, `Line`, `XAxis` and company through
  `@rivocode/ui/chart`, the design agent receives the container and has nothing
  to put inside. Fixed in the package itself, with a curated list.

- **A utility class no component uses does not exist in the stylesheet.**
  `conventions.md` was going to cite `bg-chart-1`; Tailwind only generates what
  it finds when scanning, so that class is not in the compiled CSS and the agent
  would write something that does not resolve, silently. Swapped for
  `var(--rc-chart-1)`, which always resolves. **Every class cited in the
  conventions was checked against `ds-bundle/*.css`**, 36 classes and 2 tokens,
  all present.

- **A component that returns `null` without props fails the render check.**
  `ChartTooltipContent` and `ChartLegendContent` only draw with `payload`. The
  fallback card renders them with nothing and the root comes out empty. The
  good way out is to author a preview with a fake `payload`, and not to send
  them to `overrides.skip`.

- **The anchor was saved without the per-file `sourceHashes`.** Consequence:
  the upload partition treats everything as missing and uploads the whole set,
  which is exactly the recommended pattern (`writes` always complete). What is
  lost is the automatic derivation of `deletePaths`, **check the remote list
  with `list_files` before `finalize_plan`** and put in the plan what the build
  no longer produces. In this round the diff reported `deletePaths: 0` and no
  component removed.

- **The previews' tsconfig needs to map each subpath.** `@rivocode/ui/chart`
  was missing, so `check:previews` resolved through the old `dist` and flagged a
  nonexistent export that existed in the source. One mapping per new subpath.

### Risks for the next sync

- **The showcase's `--force-prefers-reduced-motion` does not apply here.** The
  sync's render check uses its own playwright, without that flag, so a chart
  with animation on may be photographed before the first frame. The chart
  previews pass `isAnimationActive={false}` on purpose, do not remove it.

- **The chart palette has its own guard** (3:1 against the surface, in
  `check:contrast`). A new client theme needs to define `--rc-chart-1` to
  `--rc-chart-8`, or the chart comes out without series colors.

- **Playwright was no longer in the cache** of this machine and was reinstalled
  (chromium 1234, in `~/Library/Caches/ms-playwright`, not in `~/.cache`).

- **`docsMap` has 92 entries and grows with every component.** It should only
  keep exceptions; today it enumerates. It is worth swapping for `docsDir`
  pointing to `.design-sync/docs/` and letting discovery wire itself, keeping in
  the map only what does not match.
