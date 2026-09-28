# How we program here

The house rules, for humans and for agents. Everything internal is written in
English: code, comments, tests, scripts, docs, skills, commits. The one thing
that stays in Portuguese is the text a component puts on the SCREEN - labels,
announcements, empty states - because it reaches the end user of a Brazilian
app, and that text keeps its accents.

This file is the RULE. The state of the repository - what exists, what is
missing, the numbers - lives in `docs/ESTADO.md`. The contract for whoever
CONSUMES the library lives in `.design-sync/conventions.md` and in
`.claude/skills/rivocode-ui/SKILL.md`.

## Comments

**The rule:** ONLY the JSDoc attached to a public prop stays. Everything else
goes.

A public prop is a member of an exported props `type` or `interface` - the
block whose next token is a name followed by `:`. That text is not a comment,
it is DATA: `bun run gen:props` extracts it into the `note` field of
`apps/docs/src/component-props.json`, which is the props table published at
`ds.rivocode.com.br`. Deleting it deletes site documentation, and no test
notices - the guard is `bun run check:props`, which goes red when the JSON
diverges.

```ts
export type ButtonProps = {
  /** The size of the touch target. Combines with the provider density. */
  size?: "sm" | "md";
};
```

Everything else goes, no exceptions: JSDoc above `export function`, `export
const`, `type` and `interface`; `/* ---- */` file headers; every `//` line;
every `{/* */}` inside JSX; every `/* */` in `.css` files. **Including comments
that tell an incident, a trap or a cost.** That part hurts and it is the
decision: the reason behind a choice lives in `git log`, in the CHANGELOGs and
in `docs/ESTADO.md`, not scattered through the code.

Keep what is NOT prose: `@deprecated`, `@internal`, `eslint-disable`,
`oxlint-disable`, `@ts-expect-error`, `@ts-ignore`. They are directives, and
they change compilation or lint. If one of them sits inside a block that goes,
keep only the tag in a minimal block.

Three exceptions, all of them functional:

- **`.design-sync/previews/*`**. The `/** */` above each `export function`
  there is NOT a comment, it is the story TITLE: `apps/docs/src/example-source.ts`
  reads that block to build the site. Deleting it breaks the page. Do not touch.
- **`scripts/check-*.ts`**. Each one opens with the JSDoc of the incident that
  made it exist. Without it, the next person removes the guard because it looks
  like paranoia, and the incident comes back. The folder follows the old rule:
  a comment stays when it explains a decision or a trap the code does not show.
- **`apps/docs/`**. It is an application, not a library: it exports no prop,
  so the rule above would have nothing to preserve - applying it there would be
  total removal, without the criterion that justifies it. It follows the old
  rule.

Form rules that still apply:

- JSDoc in English. The text that goes to the screen stays in Portuguese WITH
  accents (`test/accents.test.ts` enforces it, in BOTH packages).
- A prop's JSDoc says what the TYPE does not: unit, what changes on screen,
  what it combines with. Never the signature.
- `bun run check:comments` guards the LANGUAGE, not the presence: it flags
  a Portuguese comment by closed class (`que`, `nao`, `para`, `quando`), two in
  the same comment being the cut. Its `DEBT` list is empty, and the agreement
  is that it only shrinks.

History: until 26/08/2026 the rule was "a comment stays when it explains a
decision or a trap the code does not show". It was replaced by the one above
by the owner's decision, and the cut removed thousands of lines. Until
28/09/2026 everything internal was written in Portuguese; it was moved to
English, also by the owner's decision, and the screen text stayed in
Portuguese. If you are reading a file with prose comments outside the
exceptions, or internal prose in Portuguese, it predates those dates or it
escaped - it is to be removed or translated, not imitated.

## Code language

Identifiers in English, always - including the parameter name of a public
prop, which leaks into the `.d.ts` and into the site's props table.
`bun run check:names` fails by a list of known words and by suffix (`-acao`,
`-mento`, `-dade`, `-agem`, `-encia`, `-ivel`).

## Where things live

| Folder | What it is |
|---|---|
| `src/` | the web package `@rivocode/ui` |
| `src/chart/`, `src/form/` | subpaths with an OPTIONAL peer; Recharts cannot leak into `src/index.ts` (`check:chart`) |
| `src/ai/`, `native/src/ai/` | subpath WITHOUT a peer, because of weight: the model-conversation pieces do not enter the root index (`check:chart` guards both) |
| `src/dnd/`, `native/src/dnd/` | drag and drop: on the web with an OPTIONAL peer (`@dnd-kit/core` and `@dnd-kit/sortable`), on native WITHOUT a peer, using the core `PanResponder` gesture (`check:chart` guards both) |
| `src/editor/` | subpath with an OPTIONAL peer (Tiptap 3); `@tiptap/*` cannot leak into `src/index.ts` (`check:chart`). `RichTextView` lives here and does not import Tiptap |
| `src/tokens/` | the ONLY place where a literal color may exist (`check:colors`) |
| `native/src/` | the `@rivocode/ui-native` package, published as SOURCE |
| `mcp/` | the `@rivocode/ui-mcp` package, an MCP server over stdio; a root workspace |
| `.design-sync/docs/` | one page per piece and per part |
| `.design-sync/previews/` | the runnable example of each piece |
| `apps/docs/` | the `ds.rivocode.com.br` site |
| `test/`, `native/test/` | the suite |
| `demo/` | where you look at a piece in both themes and both densities |

**Generated. Do not edit by hand:** `native/theme.css`, `native/tokens.ts`,
`native/tokens.json` (`bun run gen:native`), `apps/docs/src/component-props.json`
(`bun run gen:props`), `apps/docs/src/native-props.json`
(`bun run gen:props:native`), `examples/native/generated.css`
(`bun run build:css` in the app). All of them carry a header saying so, and
`check` fails if the committed file diverges from its source.

**Do not run `bun install` inside `native/`.** It is not a workspace: the
command creates a second React and takes down dozens of tests with "Invalid
hook call". CI never sees it, because it only installs at the root.
`check:install` is the guard.

**`mcp/` is a workspace, and `native/` is not.** The MCP server has no React,
so there is no second copy to fear, and the root `bun install` brings its SDK
for `test/mcp-server.test.ts`. The content it serves is NOT source: it is
`mcp/dist/content.json`, written at build time by `scripts/mcp-content.ts`
from the same `agentFiles()` as the site, the props, parity and signature
tables, the skill's choice table and the tokens in DTCG. New documentation
ships in the next `@rivocode/ui-mcp` release, not before: the package carries
the documentation of the tree it was built from.

## The gate

`bun run check` runs THIRTY-EIGHT steps in sequence and stops at the first one
that fails: installation, lint, types, previews, props, names, comments,
literal color, alpha over color, web contrast, native map contrast, contrast
mirror, themes, contract, doc, doc example, README coverage, class without a
rule, class groups, chart boundary, CLI boundary, package size, skill, skill
list, native tokens, native theme generator, shared code, parity, native
signature, piece count, showcase, declared portraits, install recipe, script
outside the gate, scan floor, test count, MCP up to date, and finally
`bun test`.

The number above is not decoration: when it does not match `scripts.check` in
`package.json`, the gate grew and this page did not follow.

Each `scripts/check-*.ts` opens with the JSDoc of the incident that made it
exist - read the one on top before touching what it guards. The guards that
surprise the most:

- `check:opacity` - `opacity-<n>` in `src/` has to be in `DECLARADAS`, with
  a reason, and the line that declares a color pair has the ratio MEASURED in
  both themes with the alpha applied. It was born because `check:contrast`
  measures the FULL pair and does not see alpha: the `Alert` close button
  painted `opacity-70` over `{tone}-subtle` and measured 2.77 on success and
  2.66 on warning, against the 3 of 1.4.11, and the destructive Button's
  `hover:opacity-90` measured 4.45 against the 4.5 of AA. Five other pieces
  disabled with `opacity-60` instead of `text-fg-disabled`. The repository
  already knew, and the rule had become a test of THREE pieces
  (`test/sibling-contract.test.tsx`), while the other seven were never
  looked at. Web only: in `native/src` disabled IS `opacity-50` on the whole
  layer, a decision written in `WITHOUT_PAIR`. The list only shrinks.
- `check:doc` - a piece without a page and a page without a piece, both ways.
- `check:examples` - a name cited in a `tsx` block of `.design-sync/docs/` has
  to exist in the packages. It was born because the `ChartContainer` page
  taught calling a `useAreaGradient('faturado')` that never existed - the real
  function is `areaGradient(id, name)` -, and the paragraph right below the
  block explained the `id` the block itself forgot. The body of the pages is
  what people copy, and it was the only part of the material that went through
  no compiler: `check:previews` compiles the previews, and `check:skill` covers
  the SKILL. In the whole tree it was the ONLY invented name across 177 pages.
  The `FOREIGN` list only names third-party library hooks, and holds no
  exception of ours.
- `check:readme` - every piece in the catalog has to be cited in `README.md`,
  or have a line in `OUT_OF_README` with the reason, and the sentence that
  opens the catalog has to keep saying the table is NOT the index. It was born
  because the digit was right and the list below it was not: `check:pieces`
  guarded the "90 pieces.", and of the 90 the whole file cited 49. The list
  only shrinks.
- `check:contract` - what `src/chart/index.ts`, `src/form/index.ts`,
  `src/ai/index.ts`, `src/dnd/index.ts`, `src/editor/index.ts` and the native
  subpaths export has to be cited in `conventions.md` AND in the skill.
- `check:skill` - a prop cited in a skill example has to exist on the piece.
- `check:skill-list` - every file in `.claude/skills/rivocode-ui/reference/`
  has to be in the `SKILL.md` index AND in the `curl` loop of
  `apps/docs/src/content/skill.md`. It was born because the loop listed seven
  names and the folder had eight: whoever installed from the site went without
  the React Native reference, and the `curl` exited zero. Zero exceptions, and
  no exception list.
- `check:parity` - `scripts/native-parity.ts` is the single source of the
  parity table, and it also writes the "In React Native" section of each page.
- `check:signature` - `check:parity` answers "does it exist on native?";
  this one answers "how is the call written there". It checks each line of the
  signature table against both props catalogs, and demands COVERAGE of the
  only family that derives itself: a variant that exists on one side only. The
  native side comes from `apps/docs/src/native-props.json`, an artifact
  committed because generating it requires `examples/native` installed - the
  `check:props:native` that keeps it current runs in the `nativo` CI job, next
  to `check:native:types`.
- `check:tests` - the count the home page shows.
- `check:demo` - every piece has to appear in `demo/*.tsx`, or have a line in
  `SEM_VITRINE` with the reason. It was born because seven pieces were
  published to npm without anyone having looked at any of them: they passed
  1072 tests, and the process step that says to look in both themes and both
  densities was skipped with nothing flagging it. Measured afterwards, 28 of
  the 90 were outside the showcase. The list only shrinks.
- `check:recipe` - what `npx rivocode-ui-native-init` writes has to say the
  same as `examples/native`, which is the source because it is the only one of
  the two that runs. It was born because an agent built an app from scratch
  with the published package and did not get to the end reading the doc: the
  `native/README.md` listed FOUR setup files and hid the two most expensive to
  diagnose. It compares FACT, not text - the ordered list of `global.css`
  directives, the PostCSS plugins, the metro wrapper, `userInterfaceStyle`,
  `browserslist` -, because the monorepo relative path is different on
  purpose. `babel.config.js` is the only fact by ABSENCE, and it was measured:
  writing one with `presets: ["babel-preset-expo"]` takes down a whole Expo 57
  app, because in that SDK the preset does not resolve from the root.
- `check:scripts` - every `scripts/*.ts` has to be reachable from `check`, or
  have a line in `OUT` saying what prevents it. It was born because
  `visual-regression.ts` lived outside the gate and went red silently: three
  portrait signatures diverged from the committed ones and nobody knew,
  because nobody ran it. The `OUT` list only shrinks.
- `check:floor` - a scan that can return an empty list and leave the check on
  top of it green. In `scripts/`, `new Glob(` only in `scripts/scan.ts`:
  whoever scans calls `scanAtLeast(pattern, floor)`, which demands the floor
  in the SAME call - you cannot ask for the files without saying how many you
  expect. In `test/` and `native/test/`, every `new Glob(` or `readdirSync(`
  inside a `test(...)` block needs a floor in the same block. It was born
  because breaking each pattern on purpose, in a single day, left eleven
  guards in `scripts/` green reading ZERO files - among them `check:contrast`,
  which announced "Contrast ok in every theme" without having opened a theme
  - and six test blocks passing with the empty list. One area was written and
  never read: `check:comments` declared `.design-sync/previews/*.tsx` and
  bun's Glob skips hidden folders without `dot`. The `OUT` list only shrinks.
- `check:classes` - a class used in `src/**` or `native/src/**` that the
  Tailwind of that package cannot compile. It was born because the native
  `Slider` thumb painted `shadow-1` and `shadow` does not exist in the native
  CSS: the class never generated a byte, `tsc` passed, the build passed, and
  the thumb had no shadow since birth. It asks the compiler itself, not a
  list - so variants, arbitrary values and opacity modifiers go through the
  build path. No exception list, and the agreement is to keep it that way.
- `check:cli` - `src/lib/contrast.ts`, `src/lib/theme-check.ts` and
  `src/tokens/theme-roles.ts` are desk tooling: they travel in `dist/cli.js`
  and **cannot** become reachable from `src/index.ts`, otherwise the contrast
  math enters the bundle of whoever only uses the pieces. It reads the import
  GRAPH from the three entries and prints the chain, because banning the
  folder leaves the indirect path open. It also checks the reverse direction,
  so it does not become decoration, and that each file's marker sentence still
  exists in the source - that last assertion was missing, and the guard went
  green by vacuity when a rename took the sentence away. In the artifact it
  reads what `dist/index.js` and the subpaths REACH, not `dist/index.js`
  alone: since `unbundle` it is only re-exports, and looking for the sentence
  in it would pass without reading a single piece.
- `check:size` - the gzip of each `exports` entry (the root, the five
  subpaths and `styles.css`) and of `Button` imported alone, against
  `scripts/size-budget.ts`, where each limit has its reason written.
  It was born because `import { Button } from "@rivocode/ui"` pulled 129 KB
  gzipped out of 307 KB possible: `tsdown` merged the pieces into a single
  `index.js`, and the package.json `"sideEffects": ["*.css"]` - which already
  said the right thing - only discards a WHOLE file. With `unbundle` the same
  `Button` costs 12.3 KB, and both halves are needed: without `sideEffects`
  it goes back to 144 KB. It builds into its own folder instead of reading
  `dist/`, because the gate runs before the build and whatever `dist/` is
  there is from other code; it costs under a second. It has a ceiling and a
  floor: above the limit fails, and below 80% of it fails too - the limit goes
  down in the commit that shrank. Going up is a decision: in the same commit
  that grew, `limit` becomes the number the guard suggests and `why` says what
  came in.
- `check:native:contrast` - `native/scripts/contrast.mjs` is a GENERATED
  mirror of `src/lib/contrast.ts`, because the native package publishes SOURCE
  and cannot reach the web `src/`. It checks the text AND that the mirror
  MEASURES: it imports both and compares line by line in the house theme. Text
  catches the hand-edited file; the measurement catches the file that went
  inert. The comparison ignores whitespace, because the workflows use
  `bun-version: latest` and new transpiler formatting would turn CI red
  without anyone touching the repo.
- `check:theme:native` - `rivocode-ui-native-theme` derives 37 roles from 8
  seeds, and the guard goes red **in the commit that adds a new role**, both
  ways. It is so the question "derived from what?" costs five minutes instead
  of a version.
- `check:mcp` - the top section of `mcp/CHANGELOG.md` says which version of
  `@rivocode/ui` and of `@rivocode/ui-native` the MCP carries the
  documentation of, and the numbers have to be the current ones. It was born
  because the library shipped four versions in a row without a new MCP, and
  whoever used the MCP was left with the old documentation with nothing
  flagging it. Every release of either package opens a new section in the MCP,
  with its version bumped along.
- `check:portraits` - a section declared in `SECTIONS` has to have a marker in
  the showcase and a committed signature, and an orphan signature has to go.
  It runs in milliseconds and without a browser, because the portrait itself
  lives outside the gate.

`bun run a11y` stays OUTSIDE the gate, like `shot` and `visual`, because it
needs Chrome: it mounts the showcase and measures each page with axe-core (the
showcase layout rules it ignores are in `IGNORED_RULES`, each with its reason,
and the library node it ignores without turning the rule off is in
`IGNORED_NODES`), the focus that survives the action (`FOCUS_TARGETS`), the
24px target and reflow at 320px, and exits with code 1 when it finds
something. The target measures the area that receives the click - an absolute
`::after` with negative inset counts, confirmed by `elementFromPoint`, so a
pseudo clipped by `overflow` does not count - and only the text link or button
that shares the line with the surrounding text escapes through the sentence
exception. Before the showcase, the probe runs on `TARGET_CALIBRATION`, cases
on both sides, and stops everything if one of them switches sides. Chrome
comes from `RC_CHROME`, with the macOS one as default, and `RC_CHROME_FLAGS`
adds flags.

The three run in CI through the **bench** (`.github/workflows/bancada.yml`),
on PR and on push to `main`, and it is DIFFERENTIAL: it measures the base and
the head on the same runner, with the head's scripts, and
`scripts/bench-comparison.ts` judges. The absolute reference does not
work there - on ubuntu, the main tree with no change at all comes out with 23
of the 50 portraits different from the ones committed on macOS, the twelve
section frames among them, and `a11y` flags today what the pieces already
have. It fails an accessibility problem the base did not have, and a portrait
that changed without its entry in `demo/assinaturas.json` changing along -
accepting is still `bun run shot && bun run visual --aceitar` on the machine,
and the `retrato-aceito` label on the PR is the valve for a difference that
only exists on linux. It measures with a floor: fewer than 15 audited pages
or 30 compared portraits fails. It is its own workflow, not a job of
`ci.yml`, because `tag.yml` listens to `ci`.

`bun run build` afterwards, because some breakage only shows up when
packaging. It also builds `mcp/dist`, and `bun run smoke:mcp` starts that
server with `node` over stdio and checks the eight tools - CI runs both, in
that order.

## Assertions that pass without measuring

A green guard is not a guard that measured: it is a guard that did not
complain. On 27/08/2026 four checks were found whose success did not depend on
what they claimed to guard, and a sweep of the whole tree found nineteen more
of the same family. Two rules came out of it, and one of them has no guard.

**A scan declares how much it expects to find.** It has a guard: `check:floor`,
described above. In `scripts/`, use `scanAtLeast` from `scripts/scan.ts`;
in a test, `expect(files.length).toBeGreaterThan(n)` before the loop. The
floor is loose, not today's count.

**A class is compared by TOKEN, not by substring.** It has no guard, and the
decision was measured: `bg-accent` is a prefix of `bg-accent-text`, and
`expect(className).toContain("bg-accent")` passes with both - with the defect
AND with the fix. There were sixteen assertions like that, proven one by one
by swapping the token in the piece and seeing the test stay green: the primary
Button painting `bg-accent-text`, the Card born `raised`, the Alert turning
`flex-col-reverse`, the focused native field wearing `border-accent-text`. The
form that measures is `expect(className.split(" ")).toContain("bg-accent")`,
plus a `not.toContain` of the wrong value when there is one.

Why no guard: the prefix detector raised 50 candidates and 16 were defects.
The other 34 were `toContain` of a MESSAGE fragment - "altura", "isEmpty",
"março" - where a prefix means nothing. A guard that is wrong two thirds of
the time gets turned off in the second week, and then the one third it got
right stops being seen. The rule stays written, and the next sweep measures
again.

When you distrust an assertion, **break on purpose what it should catch**. A
suspect that bites is not a defect. The forms that fooled us the most here: a
literal searched in a DERIVED artifact without anyone demanding the literal in
the source (`check:cli`), two artifacts generated from the SAME source
compared to each other (`check:parity`) and an assertion loop that passes
with zero iterations.

## New piece

There are NINE artifacts and the piece does not exist without all nine. Use
the `peca-nova` agent (`.claude/agents/peca-nova.md`), which has the order and
the reason for each step. Summary: a wrapper with no literal color and no
numeric `z-index`, `classNames` per part, preview, a page with the "when not
to use" section naming the neighbor piece, test, `gen:props`, new contrast
pairs.

**The ninth artifact is the native side, and it is not optional.** A new web
piece is born in both packages on the same day. It is not a symmetry rule: it
is what keeps the native queue from existing. It reached zero on 26/08/2026
and filled up again the same day, when seven pieces entered the web at once -
each one looking like a temporary delay, and temporary is how a queue of
twenty starts.

Three answers are valid, and all of them have to be WRITTEN in
`scripts/native-parity.ts` at the time:

- **`traduz` / `vira`** - the piece was born on both sides. The default case.
- **`nao`** - a desk idiom that makes no sense on touch, or something the
  platform already gives out of the box. A decision, not a delay; the reason
  goes on the line.
- **`fila`** - only when the piece depends on a GESTURE DECISION not yet made,
  and never for lack of time. It requires an entry in `FILA_DECLARADA` with
  the reason, and `bun run check:parity` refuses a queue without a
  declaration.

The `FILA_DECLARADA` list **only shrinks**, like the `DEBT` of the other
guards: an entry that no longer flags is an error, and the guard says to
delete the line.

## Dependencies

Dependabot proposes updates (`.github/dependabot.yml`), every Monday: one
grouped PR of minor and patch for the root, another for `examples/native`,
and one PR per major. `ci.yml` approves, running the whole gate on the PR -
merging without it green is what we do not do. A dependency PR does not bump a
version, so it does not publish a package; it only publishes the site, like
every push to `main`.

`native/` is left out on purpose, for the same reason as the `bun install`
above. In `examples/native` only patches of React, React Native,
`react-native-*` and `expo*` go in: the Expo SDK pins those versions, and an
SDK change is `npx expo install --fix`, done by a person.

## Commit and release

Message: `type: lowercase sentence, in English, in prose, stating the effect`.
The subject is the code, not you - "applyMask decides the phone mask", "the
guards start catching what they promised to catch". Types in use: `feat`,
`fix`, `refactor`, `docs`, `ci`, `chore`. Commits before 28/09/2026 are in
Portuguese, and they stay that way.

Three tags, three workflows, and the prefix is what separates them:

- `v*` publishes `@rivocode/ui` (version in `package.json`).
- `native-v*` publishes `@rivocode/ui-native` (version in `native/package.json`).
- `mcp-v*` publishes `@rivocode/ui-mcp` (version in `mcp/package.json`).

**From 1.0 on, strict semver**, in all three packages: a break (removing or
renaming a prop, piece or export, changing a default or a callback shape) only
in a major version; what is going away gets `@deprecated` with the new path
and stays at least one minor version before leaving in the next major; a new
prop and a new piece are minor; a fix is a patch. The 0.x to 1.0 table lives
in the `migracao` agent.

The packages move at different speeds on purpose. The tag has to match the
version in the corresponding `package.json`, and the workflow checks that -
along with the secret and whether the version exists in the registry - BEFORE
spending the whole `check`.

CHANGELOG sections published before 28/09/2026 are in Portuguese and stay
that way: they are record. New sections are written in English.

### What each push publishes

**A push to `main` publishes the SITE, and may publish a PACKAGE.** The first
half is the easiest to forget, because nothing in the command warns you:
`git push origin main` triggers `docs.yml` and `ds.rivocode.com.br` changes.
The second half is new, from 28/08/2026: until then npm only shipped by tag,
and the tag was a person's action. Now `tag.yml` creates the tag by itself
when a manifest version changes. Merging half-done work still publishes
nothing, but what holds that back is now a guard, not a human finger on
`git tag`.

| Trigger | Workflow | Publishes |
|---|---|---|
| push to `main` | `ci.yml` + `docs.yml` | the site |
| `ci` green on `main` | `tag.yml` | the tag, and calls the release |
| tag `v*` | `release.yml` | `@rivocode/ui` on npm |
| tag `native-v*` | `release-native.yml` | `@rivocode/ui-native` on npm |
| tag `mcp-v*` | `release-mcp.yml` | `@rivocode/ui-mcp` on npm |

### The tag is born by itself, and what stays human

The trigger is the `workflow_run` of `ci`, type `completed`, on `main`, and
the job only proceeds with `conclusion == "success"`: no tag is born before
the whole gate has passed on that commit. It is not `on: push` on purpose -
the push would run in parallel with `ci` and tag code the gate is still going
to fail, and an npm publish cannot be undone. For the same reason the checkout
is of `workflow_run.head_sha`, not of the current tip of `main`: the tag
points to the commit that was measured.

For each package, separately - the three move at different speeds, and the
prefix is what separates them -, the tag is only born if all FOUR pass:

1. **The tag does not exist yet**, here and on `origin`. Without this, every
   push to `main` would try to recreate the last one.
2. **The version is not on npm yet**, measured with
   `npm view <package> versions --json`. Publishing cannot be undone, and
   that is how three attempts in a row got a `403` for republishing the SAME
   number.
3. **That package's CHANGELOG opens with `## <version>`**, equal to the
   manifest's and at the TOP. This is the guard that protects merging
   half-done work: a bump that goes in without a closed CHANGELOG does NOT
   publish. The house order was always "close the CHANGELOG before the tag";
   the difference is that now it is enforced by machine.
4. **The SUBJECT of the head commit has no `[no-release]`.** It is the escape
   valve to bump without publishing. It applies to all three packages at once,
   because the message is one. Only the first line is read, and that was
   learned the hard way: the very commit that created this automation
   explained the valve in its body, wrote the marker in the middle of the
   prose, and was blocked by it - the automation vetoed itself on its debut.
   It is the same shape as the Tailwind scanner generating a class from a
   name written in a comment.

The decision lives in a pure function - `decideRelease`, in
`scripts/release-decision.ts` - that receives the version, the existing
tags, the registry versions, the CHANGELOG text and the commit message, and
returns the verdict with the reason. `test/release-decision.test.ts` covers
the four reasons to block and the happy path, in all three packages. A publish
guard written as a shell `if` inside the `.yml` could not be proven, and this
is the only one in the repository that decides whether a version number burns.

**A guard that blocks does not turn CI red.** It writes in the run summary
what was done or why it was not, for each package, even when there was
nothing to do - and moves on. Red on every push that is not a release gets
turned off in the second week, and then the release the guard protected stops
being protected. What STOPS the run is something else: the guard that cannot
MEASURE. An `npm view` that fails for any reason other than the 404 of a
nonexistent package, a `git` that cannot reach `origin` - there the script
dies with code 1, because a guard without a measurement that answers "go
ahead" creates the tag for lack of an answer.

**Two things remain a person's decision, and no machine makes either of them:
the version number and closing the CHANGELOG.** That is all you do on a
release day - bump the right manifest, a new section in that package's
CHANGELOG, commit, merge to `main`. The rest is consequence.

**Publishing cannot be undone, and npm does not allow overwriting.** A version
published with a defect is not fixed by republishing: it is fixed with a new
version. That is why the four guards exist, and it did not change because the
tag became automatic - only who pays for forgetting changed.

**A tag pushed with `GITHUB_TOKEN` does not trigger `on: push: tags`.** GitHub
blocks it to avoid recursion, and that is why `tag.yml` does not stop at the
tag: it calls the release through `workflow_dispatch` passing the `tag`
field, which all three releases accept - and `workflow_dispatch` is one of the
exceptions written into that same rule. That is why the job asks for
`actions: write` besides `contents: write`. Without that call the tag would
exist and the version would never go up, the worst of both states.

Three dry runs, and none of them spends a version:

- `gh workflow run tag` runs the whole decision, with the four guards truly
  measured, and creates no tag - the box comes checked.
- `gh workflow run release --field ensaio=true`,
  `gh workflow run release-native --field ensaio=true` and
  `gh workflow run release-mcp --field ensaio=true` go through the publishing
  path up to the step before `npm publish`. The native one was born because
  the first real publish failed with `ENEEDAUTH`, someone published by hand,
  and the three following attempts got `403`.

**A package that does not exist in the registry yet.** On the first publish
of `@rivocode/ui-mcp`, `npm view` answers `E404` - for the whole package, not
only for the version. Both guards treat that as "go ahead": `decideRelease`
receives an empty version list (`publishedVersions` reads the `E404` from the
JSON and returns `[]`), and `release-mcp.yml` turns the error into an empty
string. In `decideRelease`, any other `npm view` failure still stops the run.

**The repository is public**, and the three workflows publish with
`--provenance` and `id-token: write`. The two go TOGETHER: one without the
other does not publish, and npm's `--dry-run` exercises neither - there is an
`if (!dryRun)` before the signature is generated. That is why each workflow
has a step that fails early if the OIDC token is not there. It is written in
all three, in the place where someone would try to "fix" it. `@rivocode/ui-mcp`
was born with the repository already public, and has shipped signed since its
first version.

Up to `v0.8.0` and `native-v0.3.1` the repository was private and npm refused
the signature with 422: those versions were left without provenance and stay
that way - publishing on npm cannot be undone. From `v0.9.0` and
`native-v0.4.0` on the tarball ships signed, and the registry's attestations
endpoint answers.

**Trusted publishing, no token.** Since 25/09/2026 the three workflows
authenticate to npm through the same OIDC as provenance: each package has, on
npmjs.com, a trusted publisher pointing to `Rivocode/ui` and to its workflow
file, and there is no `NPM_TOKEN` nor `registry-url` - without `registry-url`
setup-node does not write `.npmrc`, and no empty token is left for npm to
read. It requires npm 11.5.1 or newer, which is why the "Check the trusted
publishing npm" step updates npm and fails early if the version does not get
there. Renaming one of these three files breaks publishing: the name is
registered in the registry. The dry run does not prove authentication,
because `--dry-run` does not exchange the token; only the first real release
proves it.
