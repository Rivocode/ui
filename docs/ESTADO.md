# Where we stopped

Snapshot of the repository on **25/09/2026**, rewritten from scratch. Every
number here was measured in this tree, on that day, and the section **How to
check each number** gives the command for each one: whoever comes later
measures again instead of believing.

This file is the STATE: what exists, what is really missing, what is waiting on
a person. The RULE lives in `CLAUDE.md`; the contract for whoever consumes, in
`.design-sync/conventions.md` and in `.claude/skills/rivocode-ui/SKILL.md`. The
history - why each thing ended up as it is - lives in the `git log` and in the
three CHANGELOGs, and is not repeated here.

## The packages

| Package               | Where     | Manifest  | On npm on 25/09                    | Tag              |
| --------------------- | --------- | --------- | ---------------------------------- | ---------------- |
| `@rivocode/ui`        | `src/`    | 1.0.0     | **1.0.0**, with provenance         | `v1.0.0`         |
| `@rivocode/ui-native` | `native/` | 1.0.0     | **1.0.0**, with provenance         | `native-v1.0.0`  |
| `@rivocode/ui-mcp`    | `mcp/`    | 0.6.0     | **0.6.0**, with provenance         | `mcp-v0.6.0`     |

The `ds.rivocode.com.br` site comes out of `apps/docs/` on every push to `main`
(`docs.yml`), and is up to date with `db0fad9`. `origin` has 36 tags; `gh release
list` is still empty, because a tag does not become a GitHub release and that
was never automated.

**Native 0.14.0 shipped on the second attempt.** The first died at
`npm publish` with `ENEEDAUTH`: trusted publishing for `@rivocode/ui-native`
was misconfigured on npmjs.com, and a green rehearsal would not catch that,
because `--dry-run` does not authenticate. Once the configuration was fixed,
the same tag published through
`gh workflow run release-native --field tag=native-v0.14.0`: the version had
not been burned.

### Trusted publishing, since 25/09

The three release workflows publish through npm's trusted publishing (OIDC),
without `NPM_TOKEN` and without `registry-url`: no token is written to
`.npmrc`. Each one installs the newest npm (trusted publishing requires 11.5.1
or later) and fails early if the OIDC token is not there. `--provenance` and
`id-token: write` go together, and `--dry-run` exercises neither.

Web 0.18.1 and native 0.14.0 shipped through that path, signed.
`@rivocode/ui-mcp` has not published through it yet: only its next version
proves its trusted publisher configuration. The `NPM_TOKEN` secret **is still
registered** in the repository (`gh secret list`, created on 04/09) and no
workflow reads it anymore: it should be deleted on GitHub and revoked on npm by
the owner.

Versions without provenance, and they stay that way because publishing cannot
be undone: up to `v0.8.0` and `native-v0.3.1`, when the repository was
private.

## The catalog

**134 pieces** and **222 documents** in `.design-sync/docs/`. The difference is
the **88 parts**: `CardHeader`, `DialogFooter`, `SelectItem` only exist inside
another piece, and live on its page with their own anchor. A part is not a
piece; whoever counts files as the catalog opens `CardTitle.md` as if it were a
component. The rule is in `apps/docs/src/parts.ts` (`findParent`).

| Family       | Qty | Pieces                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------ | --: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario   |  37 | Autocomplete, Calendar, Checkbox, CheckboxGroup, ColorPicker, Combobox, CurrencyInput, DatePicker, DateRangePicker, Editable, Field, Fieldset, FileUpload, Form, Input, InputGroup, MaskedInput, NumberField, OTPField, PasswordInput, PostalCodeField, Questionnaire, RadioGroup, Rating, RichTextEditor, SearchInput, Select, SignaturePad, Slider, Switch, TagsInput, Textarea, TimeField, TimePicker, TransferList, Tree, TreeSelect |
| Estrutura    |  25 | Accordion, Affix, AppShell, AspectRatio, Avatar, Card, Carousel, Collapsible, Container, DataTable, DescriptionList, FilterBar, FilterChip, Grid, Item, PageHeader, ResizablePanelGroup, ScrollArea, Separator, Splitter, Spoiler, Stack, Stat, Table, VirtualList                                                                                                                                                                       |
| Feedback     |  14 | Alert, Badge, Banner, CookieConsent, EmptyState, Indicator, Kbd, Meter, NotificationCenter, Progress, QueryBoundary, Skeleton, Spinner, ToastViewport                                                                                                                                                                                                                                                                                    |
| Dados        |  10 | Code, EventCalendar, Gantt, Kanban, PixCode, QRCode, RelativeTime, SortableList, Timeline, Tracker                                                                                                                                                                                                                                                                                                                                       |
| Navegacao    |  10 | Breadcrumb, Command, Menu, Menubar, NavigationMenu, Pagination, Sidebar, Steps, TableOfContents, Tabs                                                                                                                                                                                                                                                                                                                                    |
| Sobreposicao |  10 | AlertDialog, ContextMenu, Dialog, ImageViewer, Popconfirm, Popover, PreviewCard, Sheet, Tooltip, Tour                                                                                                                                                                                                                                                                                                                                    |
| Acoes        |   9 | ActionBar, Button, ButtonGroup, Clipboard, IconButton, ScrollToTop, Toggle, ToggleGroup, Toolbar                                                                                                                                                                                                                                                                                                                                         |
| Grafico      |   8 | ChartContainer, ChartDonut, ChartFunnel, ChartGauge, ChartHeatmap, ChartRadial, ChartTreemap, Sparkline                                                                                                                                                                                                                                                                                                                                  |
| Tipografia   |   5 | Heading, Highlight, Link, RichTextView, Text                                                                                                                                                                                                                                                                                                                                                                                             |
| IA           |   5 | AILabel, Conversation, Message, PromptInput, ToolCall                                                                                                                                                                                                                                                                                                                                                                                    |
| Fundacao     |   1 | RivoProvider                                                                                                                                                                                                                                                                                                                                                                                                                             |

The family comes from each document's `category`, and the site writes it with
accents.

### Subpaths

Rule of both packages: **one subpath per peer, and not one per subject** - the
peer is what charges the installation, so it is what decides the door. The
exception is `/ai`, which has no peer and exists because of weight.

| Web                   | Optional peer                        | What it exports                                                                          |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `@rivocode/ui/chart`  | `recharts`                           | `ChartContainer` and axes, tooltip, gradient, the six shapes, `Sparkline`, `useChartMotion` |
| `@rivocode/ui/form`   | `react-hook-form`, `zod`, resolvers  | `Form`, `FormField`, `useZodForm`                                                        |
| `@rivocode/ui/ai`     | none                                 | `AILabel`, `Conversation`, `Message`, `PromptInput`, `ToolCall`                          |
| `@rivocode/ui/dnd`    | `@dnd-kit/core`, `@dnd-kit/sortable` | `SortableList`, `Kanban`                                                                 |
| `@rivocode/ui/editor` | `@tiptap/*` (Tiptap 3)               | `RichTextEditor`, `RichTextView` (the latter does not import Tiptap)                     |

Besides them the web exports `./styles.css`, `./fonts.css`, `./preset` and
`./tokens/*`, and the `rivocode-ui` binary (`check-theme` and `tokens`, which
writes DTCG 2025.10 JSON). Native exports `./form`, `./chart`, `./clipboard`,
`./file-upload`, `./ai`, `./dnd`, `./tokens`, `./contrast` and `./theme.css`,
and three binaries: `rivocode-ui-native-css`, `-theme` and `-init`.
`check:chart` guards the boundaries (eleven, across both packages) and
`check:contract` demands that every subpath export be in `conventions.md` AND
in the skill.

## React Native

Of the 134 pieces: **103 translate** with the same name, **5 become** another
(`Autocomplete` -> `Combobox`, `DataTable` -> `DataList`, `ToastViewport` ->
`useToast`, `Popconfirm` -> `AlertDialog`, `ContextMenu` -> `Menu`), **26 do not
port** by written decision, and **0 are queued**. `DECLARED_QUEUE` is empty and
the agreement is that it stays so: a new web piece is born in both packages on
the same day, or is born with `no` and the reason.

The 26 that do not port, with each one's note in `scripts/native-parity.ts`:

| Piece               | Why not                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Affix               | the platform already gives it: an absolute sibling of `ScrollView`, or `stickyHeaderIndices`                     |
| AppShell            | the app skeleton on a phone is the router: tab bar, drawer, stack bar                        |
| Breadcrumb          | the way back is the router's back button                                                 |
| ButtonGroup         | `Tabs` and `ToggleGroup` cover it; a button against a button becomes a single target under the finger                  |
| Command             | a command palette is a desktop gesture: field, list and keyboard                                       |
| Container           | the phone is already narrower than the smallest step; the breathing room is the screen's padding                    |
| CookieConsent       | an app has no cookies; consent is the platform's prompt (ATT on iOS)                         |
| EventCalendar       | a time grid is a desktop idiom; on the phone it is a list, and the month is `Calendar`                     |
| Gantt               | a schedule is a desktop idiom; tasks per day are a list, a deadline is `Calendar`                          |
| Kanban              | at 390px one column fits; moving a card is a "Mover para" menu, not a drag                           |
| Kbd                 | there is no keyboard to draw                                                                     |
| Menubar             | desktop idiom; native navigation is the router's tab bar and drawer                                    |
| NavigationMenu      | same                                                                                             |
| Pagination          | a phone list scrolls; choosing a page number is a desktop gesture                                 |
| Popover             | an anchored panel the finger itself covers: use `Sheet`                                            |
| PreviewCard         | appears on pointer hover, and there is no hover on touch                                           |
| ResizablePanelGroup | dragging to split the width is desktop; on a phone each area is a screen                       |
| RichTextEditor      | another engine (WebView or native module); the phone writes with `Textarea` and reads with `RichTextView` |
| ScrollToTop         | the platform already gives it: tap the status bar (iOS) and tap the tab again                        |
| Sidebar             | desktop idiom; native navigation is the router's tab bar and drawer                                    |
| Splitter            | two areas side by side do not fit; list and detail are two screens                                 |
| Table               | there is no table on a phone; the query becomes `DataList`                                             |
| TableOfContents     | an app screen has no side index: sections in a list, or `Tabs`                                 |
| Toolbar             | a desktop editing surface: tab stop and arrows, which touch does not have                    |
| Tooltip             | hover does not exist on touch; the label needs to be on screen                                        |
| VirtualList         | the platform already virtualizes: `FlatList` and `FlashList`                                             |

**Same name is not same API.** In native everything is controlled (no
`defaultValue`) and the list comes through `items`, not composition. What is
reused is the class vocabulary, the token and the choice of piece; the JSX is
rewritten. `check:signature` checks **222 signature divergences in 91
pieces** against both props catalogs - the native one,
`apps/docs/src/native-props.json` (117 pieces, 773 props), is a committed
artifact, because generating it requires `examples/native` installed;
`check:props:native` keeps it up to date in the CI's `nativo` job, next to
`check:native:types`.

Pure code crosses over through `src/shared/` and `src/hooks/common/`, mirrored
in `native/`: **38 files**, with `check:shared` demanding that the mirror have
no global nor platform import, and 16 declared copies.

## The gate

`bun run check` is **37 steps** - 36 checks plus `bun test` -, in sequence,
stopping at the first one that fails. It matches `CLAUDE.md`. On 25/09 it came
out green.

The suite: **3096 tests in 227 files, 23255 `expect`**, 0 failures. Native has
971 tests in 75 files; web, 2125 in 152. The site's home page shows the same
number (`TESTS` in `apps/docs/src/pages/home.tsx`), and `check:tests` fails if
they diverge.

| Guard                   | What it says on 25/09                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `check:props`           | 308 entries (pieces and parts), 4380 props; an own prop that collides with an inherited attribute fails              |
| `check:colors`          | 188 files with no literal color outside `src/tokens/`                                                           |
| `check:opacity`       | 4 uses of partial opacity, all declared, 2 alpha measurements                                             |
| `check:contrast`        | 138 pairs per theme, in both themes, plus 14 from `scales.css`                                                  |
| `check:contrast:native-map` | per scheme: 60 text, 47 for 1.4.11, 1 layer, 16 over series ink, 3 for checked; 7 roles without a pair |
| `check:native:contrast` | `native/scripts/contrast.mjs` mirror up to date, 273 lines measured equal                                      |
| `check:themes`           | 90 theme and shape tokens, 55 required roles                                                            |
| `check:doc`             | 222 pages, all with code                                                                                |
| `check:examples`        | names in `tsx` blocks against 752 names published by 14 entries                                           |
| `check:readme`          | 134 of 134 pieces cited, none declared out                                                             |
| `check:classes`         | 369 files, every class generates a rule, no exception list                                                   |
| `check:groups`          | 8 declared groups, each consumed and each consumption declared; a declaration without consumption fails              |
| `check:cli`             | 4 desk files outside the 205 files the library reaches in `dist/`                                 |
| `check:size`         | root 143.4 of 156.2 KB gzip; `Button` alone 12.2 of 13.6 KB; all entries between 90% and 97% of the limit   |
| `check:skill`           | 128 props cited in the skill examples, all existing; `reference/native.md` against the native table   |
| `check:skill-list`     | 13 reference files, in the index and in the site's `curl` loop                                                |
| `check:theme:native`     | 8 seeds, 37 derived, 45 in `@theme`                                                                     |
| `check:parity`        | 134 pieces: the table and the pages say the same                                                               |
| `check:pieces`           | 134, equal to the README, `package.json` and the site meta                                                     |
| `check:demo`            | 133 of 134 in the showcase, 1 declared out (`ToastViewport`), across 21 pages                                     |
| `check:portraits`        | 12 section portraits over 6 areas, 23256 squares, 90 markers in the demo                                   |
| `check:recipe`         | 7 files, 9 CSS directives, 5 peers, and no Babel in either                                             |

`check:size` is near the ceiling on every entry (`/ai` at 97%; `styles.css`
went down from 98% to 92% on 25/09, without whitespace and without the fourteen
rules the scanner generated from words that were not classes): the next piece
that grows the package raises the limit in the same commit, with the reason in
the `why` of `scripts/size-budget.ts`.

### Outside the gate: `a11y`, `shot`, `visual` and the bench

All three need Chrome and stay out of `check`. `bun run shot` builds the
showcase and takes **56 portraits** (44 of the showcase and 12 of sections, the
entries of `demo/assinaturas.json`); `bun run visual` compares them with the
signatures and refuses a portrait that is not from the current build (the
`rc-build` mark in the PNG); `bun run a11y` runs axe-core, focus that survives
the action, the 24px target and reflow at 320px.

In CI all three run through the **bench** (`.github/workflows/bancada.yml`), on
PR and push to `main`, DIFFERENTIALLY: base and head on the same runner, judged
by `scripts/bench-comparison.ts`. It fails an accessibility problem the base did
not have and a portrait that changed without its signature changing along; the
`retrato-aceito` label is the valve for a difference that only exists on linux.

**The bench has been green on `main` since `946d594`**, the first run with
deterministic capture, and again at `d5f98c2`; the runs before came out red
with no screen change. The portrait now comes out the same twice in a row, on
mac and on linux: proven with Chrome 154 in three runs on an ubuntu 24.04 and
two on the mac, the 56 PNGs identical pixel by pixel. The four causes `shot.ts`
started controlling, which hold for whoever touches it:

- **Unpainted tile.** Headless Chrome's `--screenshot` photographs before
  rasterizing the tall page. `shot.ts` drives Chrome through the debugging
  protocol (`launchChrome`, in `scripts/portraits.ts`, the same as `a11y`),
  captures in 2048px strips and stitches the PNG.
- **Font arriving after the measurement.** `demo/secao.html` waits for the
  inner page's `document.fonts.ready`, remeasures when it changes size, and only
  then marks `data-rc-ready`.
- **Focus order decided by the clock.** A scheduled click that depends on
  another waits for it, and a document with more than one modal frame fighting
  for focus comes out with no focus at all.
- **Clock, timezone and language.** The capture freezes `Date` at 15/10/2026
  13:00 UTC, fixes `America/Sao_Paulo` and `pt-BR`, and turns on focus
  emulation.

The capture only happens when the page has settled (fonts loaded, finite
animations at the end and infinite ones at frame zero, three equal readings in
a row with a 1.5s floor); a page that does not settle in 20s brings the run
down with its name. The cost: `shot` got slower: 119s of wall clock on the mac
on 25/09.

## The declared debt lists

Every exception list **only shrinks**: an entry that no longer flags is an
error, and the guard says to delete the line.

| List              | Guard                   |    Size | Who is in it                                                                                       |
| ----------------- | ----------------------- | ------: | -------------------------------------------------------------------------------------------------- |
| `DEBT`            | `check:comments`     |       0 | empty                                                                                              |
| `DEBT`            | `check:names`           |       0 | empty                                                                                              |
| `DEBT`            | `check:contrast:native-map` |       0 | empty                                                                                              |
| `DECLARED_QUEUE`  | `check:parity`        |       0 | empty                                                                                              |
| `OUT_OF_SCOPE`    | `check:skill`           |       0 | removed: `reference/native.md` checks against `native-props.json`                                  |
| `OUT`             | `check:floor`            |       0 | empty: `retratos` and `regressao-visual` scan with `scanAtLeast`                                   |
| `OUT_OF_README`   | `check:readme`          |       0 | empty: `README.md` cites the 134 pieces                                                            |
| `WITHOUT_SHOWCASE`     | `check:demo`            |       1 | `ToastViewport` - `RivoProvider` mounts it, and no app writes it                                   |
| `DECLARED`      | `check:opacity`       |       4 | chart legend (2), loading `Button`, disabled `ColorPicker`                                         |
| `OUT`             | `check:scripts`         |       6 | `regressao-visual`, `shot`, `acessibilidade`, `serve`, `props-do-catalogo-nativo`, `fumaca-do-mcp` |
| `DECLARED_COPIES` | `check:shared`   |      16 | code that does not cross over: `useZodForm`, `RivoContext`, `normalizeColor` and 13 more           |

Outside `check`, in `a11y`: `IGNORED_RULES` with 6 showcase layout rules and
`IGNORED_NODES` with 2 library nodes. `check:classes` was born without an
exception list and still has none.

## What is really pending

### Waiting on the owner

None of these has code to write here.

1. **Delete the `NPM_TOKEN` secret** on GitHub and revoke the token on npm.
2. The `@rivocode/ui-mcp` trusted publisher was checked by the owner on 25/09;
   the next mcp version is the first to ship through it.
3. **Test on an iPhone** what tests and `react-native-web` do not reach:
   pasting a value into `CurrencyInput`; `Rating`'s half star, including in
   RTL; the native `Tour`; and `PromptInput`'s limit announcement with
   VoiceOver, which may be cut off by the last typed letter.
4. **Import the DTCG tokens into Figma** (`rivocode-ui tokens --out <folder>`).

### Code debt, checked against the tree

- **Imperative ref without a written rule.** `useImperativeHandle` appears in
  two places in the web, `VirtualList` (`scrollToIndex`) and
  `ResizablePanelGroup`, and neither `conventions.md` nor the skill say when to
  expose an imperative ref.
- **`QueryBoundary` does not handle stale data while revalidating.** The limit
  is written on the piece's page ("O que ela nao trata"), with the workaround
  through `isFetching`; the behavior is still the same.

### What was not measured

- The native pieces on a real device, beyond the iPhone items above.
- `npx rivocode-ui-native-init` on a freshly created Expo app: `check:recipe`
  only compares with `examples/native`, where the recipe already works.
- The landing (repo `rivocode.com`): it is not on this machine nor in the GitHub
  organization visible from here. The last measurement was `^0.7.0`.
- The sync with claude.ai/design, stopped since 24/08 (`.design-sync/NOTES.md`).

## Decisions that still hold

- **Mobile first.** Decide 390px before desktop: a floating panel does not touch
  the edge, the calendar drops to one month, a dialog becomes a bottom sheet, a
  table scrolls inside its own frame.
- **One subpath per peer**, in both packages.
- **Literal color only in `src/tokens/`**, and contrast measured, not
  estimated. A color the math cannot read fails.
- **Desk tooling does not travel in the bundle.** Contrast, `theme-check`, DTCG
  and the role catalog go in `dist/cli.js`; `check:cli` reads the import graph.
- **TanStack Table is an internal engine** of `DataTable`; no third-party type
  leaks into the public signature. **React Query stays out**: it is application
  architecture. **Whole-screen recipes** too.
- **In native, density does not exist** (the control would fall below 44pt) and
  class color only changes at build: two themes per build, at most, through
  `light-dark()`.
- **The tag is born by machine; the version number and the CHANGELOG are not.**
  `tag.yml` only creates a tag with the four `decideRelease` guards green, and
  `[no-release]` in the commit SUBJECT holds back all three packages.
- **A guard only counts if it bites.** A scan declares a floor
  (`scanAtLeast`), a class is compared by token (`split(" ")`), and a new guard
  only counts after going red in front of you.
- **Shared tree: no `git stash`, `git checkout --` or `git reset --hard`** while
  more than one front is writing. An old version is read with
  `git show HEAD:<file>`.
- **An agent's report is not a measurement.** A number is checked with the
  command.

## How to resume

```sh
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun install                  # at the root, never inside native/
bun run check                # 37 steps, ends with the 3096 tests
bun run build                # some breaks only show when packaging; builds mcp/dist
bun run smoke:mcp           # the MCP server over stdio
bun run shot && bun run visual   # the 56 portraits against the signatures (~2 min)
bun run a11y                 # axe, focus, target and reflow on the showcase
cd apps/docs && bun run dev  # the site, locally
```

To see the tag decision without creating anything: `gh workflow run tag`. To
go through a release without publishing: `gh workflow run release --field
dry_run=true` (same for `release-native` and `release-mcp`).

## How to check each number

```sh
npm view @rivocode/ui version                       # 1.0.0
npm view @rivocode/ui-native version                # 1.0.0
npm view @rivocode/ui-mcp version                   # 0.6.0
curl -s https://registry.npmjs.org/-/npm/v1/attestations/@rivocode/ui@0.18.1 | head -c 80   # signed
gh run list --workflow=release-native --limit 3     # native-v0.14.0: failure (ENEEDAUTH), then success
gh secret list                                      # NPM_TOKEN still registered
grep -rn NPM_TOKEN .github/workflows                # nothing: no workflow reads it
git ls-remote --tags origin | grep -vc '\^{}'       # 36 tags
ls .design-sync/docs/*.md | wc -l                   # 222 documents
bun run check:pieces                                 # 134 pieces (222 - 88 parts)
grep -oE 'state: "[a-z]+"' scripts/native-parity.ts | sort | uniq -c   # same, renamed, no
grep -n DECLARED_QUEUE scripts/native-parity.ts   # {} empty
node -e 'p=require("./package.json");console.log(p.scripts.check.split("&&").length)'   # 37
bun run check:tests                                # 3096 tests in 227 files
bun test native/test                                # 762 in 63 files
bun run check:signature                            # 222 divergences in 91 pieces
node -e 'j=require("./apps/docs/src/native-props.json");console.log(Object.keys(j).length)'   # 117
bun run check:shared                         # 38 mirrored, 16 copies
bun run check:contrast | grep -cE '^ +ok'          # 290: 138 per theme plus 14 from scales.css
bun run check:contrast:native-map                       # 60 + 47 + 1 + 16 + 3 per scheme
bun run check:size                               # the budget table
bun run check:demo                                  # 133 of 134, 1 out
bun run check:readme                                # 134 of 134, 0 out
bun run check:scripts                               # 6 outside the gate
node -e 'console.log(Object.keys(require("./demo/assinaturas.json")).length)'   # 56 portraits
gh run list --workflow=bancada --limit 5            # green at 946d594 and d5f98c2
node -e 'j=require("./apps/docs/src/component-props.json");console.log(j.Clipboard.props.some(p=>p.name==="value"))'   # false: the props debt
```

Each piece's family comes from the document's `category:`, and a piece is the
document whose `findParent` (in `apps/docs/src/parts.ts`) finds no owner.
