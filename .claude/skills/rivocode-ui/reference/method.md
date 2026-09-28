# The method: from the request to a screen you can show

The other files teach the system. This one says the **order**, and what is
checked at the end of each step.

A beautiful screen is almost never a better-written screen: it is the same
screen, gone over more times. What separates an interface that looks designed
from one that looks generated is not talent nor a new token, it is having made
six passes instead of one.

## Contents

- The loop, in six steps
- Step 1: the direction, in one sentence
- Step 2: the skeleton
- Step 3: the real content
- Step 4: the four finishing passes
- Step 5: look, in both themes and both densities
- Step 6: measure
- What makes a screen look generated
- What makes a screen look current
- The final check

## The loop, in six steps

| Step | The question it answers | Only ends when |
|---|---|---|
| 1. Direction | what screen is this, and for whom | it fits in one written sentence |
| 2. Skeleton | where things go | it is one of the four in `layout.md`, unmixed |
| 3. Content | what is written in them | the text and the numbers are real |
| 4. Finish | rhythm, tone, shape, motion | the four passes ran separately |
| 5. Look | how it actually is | it was seen in both themes and both densities |
| 6. Measure | what the eye does not see | contrast, focus and keyboard checked |

Skipping 1 produces the average of all possible screens. Skipping 5 is the only
defect on this list that has already reached npm.

## Step 1: the direction, in one sentence

Before the first line, write a sentence that decides three things: **who uses
it, how much ceremony, and which skeleton**. "Operations dashboard, dense, for
someone who looks at it all day" and "the product's first screen, with
breathing room, for someone who just arrived" produce different screens with
the same pieces.

Without the sentence, each isolated decision comes out reasonable and the whole
comes out without personality - which is exactly what gets recognized as
generated.

The sentence is not decoration: it already decides.

| When the sentence says | It is decided |
|---|---|
| operations, all day, many rows | `density="compact"`, skeleton 1 or 2, entrance only for what arrives (the pieces' own), none on the frame, shadow only on what floats |
| registration, once a week | `density="comfortable"`, skeleton 3, `max-w-3xl` centered |
| dashboard, for deciding | skeleton 4, `font-display` on the number, indicator before chart |
| brand, first visit | doubled breathing room, staggered `animate-rise`, `shadow-glow` on a single CTA |

**One direction per screen.** An operations dashboard with an animated hero is
not both things, it is neither.

## Step 2: the skeleton

Pick one of the four in `layout.md` and build only the structure: empty `Card`,
grid, header, bar. Still without final content, but already with the **real
quantity** - four indicators if there are four, twelve rows if the table shows
twelve.

A structure built with three sample rows collapses when thirty arrive, and what
collapses is always the same thing: a missing `min-w-0`, a filter without
`flex-wrap`, a column that stretches the whole page.

## Step 3: the real content

Invented text hides exactly what the next pass needs to see.

- **Real Portuguese**, never "Lorem" or "Título 1". A fake sentence has a fake
  length, and the real sentence's line break only shows up in production.
- **Ugly numbers**: `R$ 1.284.930,00` and not `R$ 1.000,00`. A forty-character
  name next to a four-character one. That is what reveals alignment and
  truncation.
- **Abbreviated money** with `currencyShort` in indicators, axes, legends and
  tooltips. Never typed as `R$ 12,4K`: that shows the result and hides the
  mechanism.
- **The four endings** - data, loading, error and empty. Delivering only the
  happy path is delivering half the screen, and the missing half is the one the
  user sees on their worst day.

## Step 4: the four finishing passes

A pass is a sweep of the whole file asking **one** question. Four separate
passes find what a "general" reading does not, because the general question has
no wrong answer.

| Pass | The question, literally | What it usually finds |
|---|---|---|
| Rhythm | how many different spacing values exist in this file? | six or seven; there should be three |
| Tone | is what the person came to read in `text-fg`, and only that? | everything in `text-fg`, or everything in `text-fg-muted` |
| Shape | is the inner radius smaller than the outer one? | `rounded-lg` inside `rounded-lg` |
| Motion | how many things move when the screen opens? | three; there should be one, or none |

The rhythm pass is the one that changes the screen most per line changed.
Standardizing six spacings into three (`gap-2`, `gap-4`, `space-y-6`) fixes the
"almost right" feeling that no specific defect explained.

## Step 5: look, in both themes and both densities

It is the step that gets skipped, and the only one that catches what no test
catches.

```bash
bun run demo && bun run serve
```

There are four states, and all four: `rivocode-dark` and `rivocode-light`, each
in `comfortable` and in `compact`. In the consuming project, switch on
`RivoProvider` and look:

```tsx
<RivoProvider theme="rivocode-light" density="compact">
  <InvoiceScreen />
</RivoProvider>
```

What only shows up by looking:

- a shadow that separates in light and disappears in dark, where the border
  does the separating;
- text that fits in `comfortable` and wraps in `compact`;
- contrast the math approves and the eye rejects, in tiny text on `subtle`;
- a chart without height, which disappears without an error;
- the second action in `bg-accent` next to the first, which is only noticed by
  seeing.

Seven pieces of this library were published to npm without anyone having
looked at any of them. They passed more than a thousand tests. The step that
says to look was skipped, and nothing flagged it.

## Step 6: measure

The eye does not measure contrast and does not navigate by keyboard.

```bash
npx rivocode-ui check-theme caminho/do/tema.css
```

Then, on the finished screen:

- **Keyboard to the end.** `Tab` from the first to the last stop, without
  falling into a trap and without an invisible stop. A visible focus ring on
  all of them.
- **Accessible name** on every control: an icon-only button has `aria-label`, a
  field has a real label and not a `placeholder`.
- **Heading order** without jumps: one `h1`, and no `h2` followed by `h4`.
- **Never color alone.** Every status signaled by tone carries the word along.

`reference/a11y.md` has the full list. These four are the ones that fail most.

## What makes a screen look generated

These are signs, not errors - each one passes `tsc` and the tests.

- Everything in the same tone and the same size: without hierarchy, the eye
  does not know where to start.
- Two buttons in `bg-accent` side by side: no action is the primary one.
- `Card` inside `Card` to highlight: the two layers flatten.
- Six spacing values for no reason.
- Icons from two sets on the same screen, or an emoji instead of an icon.
- Only the happy path, without loading, error and empty.
- A spelled-out value where the abbreviated one fit, overflowing the column.
- Everything animated, or animation in an operations product.
- Everything centered, including what is read in a row.
- Interface text in English mixed with Portuguese.

## What makes a screen look current

Today's taste, written in the tokens that already exist here:

- **Surface and border instead of a heavy shadow.** `bg-surface` on `bg-bg`
  with `border-border` holds the separation in both themes; `shadow-2` is for
  what really floats.
- **One big number and the rest quiet.** `font-display` with
  `tracking-display` in `text-3xl` on the value the screen exists to show, and
  `text-fg-muted` on everything that explains it.
- **Wide breathing room between sections, tight inside the control.**
  `space-y-6` between subjects and `gap-2` between icon and text, with nothing
  in between.
- **Emphasis by `bg-accent-subtle`**, not by one more surface layer nor by a
  thicker border.
- **One motion gesture per screen**, and in the right place: staggered
  `animate-rise` on a landing's entrance, nothing on a dashboard.
- **Data before drawing.** The indicator on top because it answers in one
  second; the chart below because it asks for ten.
- **Truly narrow first**, with the phone version written first and
  `sm:`/`lg:` on top.

## The final check

Before saying the screen is ready:

- [ ] The step 1 direction still describes what is on the screen.
- [ ] No literal color, no numeric `z-index`, no hardcoded control height.
- [ ] Every piece used exists in the catalog, and no prop was invented.
- [ ] The four endings of every listing and every chart.
- [ ] Three spacing values, three text tones, one primary action.
- [ ] `min-w-0` on every grid or flex item with wide content inside.
- [ ] Seen in both themes and both densities.
- [ ] Walked through by keyboard, with visible focus from start to end.
- [ ] Clean `tsc`.
