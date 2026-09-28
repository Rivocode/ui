# The design decisions, and where they live in the tokens

This file does not teach color theory. It says **which token carries which
decision** in this library, so the choice comes from the system's vocabulary
and not from a value invented on the spot.

## Contents

- The rule that holds up all the others: fill ≠ write
- The three depth planes
- Text hierarchy with three tones
- Color with meaning, and when not to use color
- The chart palette, and why it is separate
- Typography: three families, three jobs
- Shape, shadow and motion
- Focus and states

## The rule that holds up all the others: fill ≠ write

No color works both to fill a block **and** to write text on the page
background. They are different contrasts against different backgrounds, and it
is the most common mistake.

| Intent | Right pair |
|---|---|
| Block filled with the color | `bg-accent` + `text-accent-fg` |
| Colored text on the page | `text-accent-text`, alone |
| Soft background block | `bg-accent-subtle` + `text-fg` |

The same holds for `success`, `warning`, `danger` and `info`. `bg-danger` asks
for `text-danger-fg` on top; `text-danger-text` is the red that reads on the
page.

Swapping the two produces the exact defect of text in the color of its own
background, which is not "low contrast": it is invisible.

## The three depth planes

Depth here is surface, not shadow. Use them in this order and do not invent a
fourth plane.

| Token | What it is |
|---|---|
| `bg-bg` | the page background, the deepest plane |
| `bg-surface` | card, panel, field: what stands out from the background |
| `bg-surface-raised` | what pops out of the card: menu, tooltip, toast, key |

`bg-overlay` is the scrim that darkens the rest when something modal opens. It
is not a plane, it is an interruption.

Stacking `surface` inside `surface` to "highlight" flattens both. If something
needs emphasis inside a card, use a border or `bg-accent-subtle`, not one more
layer.

## Text hierarchy with three tones

Three, and only three. The fourth variation becomes noise.

| Token | Role |
|---|---|
| `text-fg` | what the person came to read: value, title, answer |
| `text-fg-muted` | support: description, row text, supporting caption |
| `text-fg-subtle` | metadata: axis caption, group header, help hint |

`text-fg-disabled` is not a fourth tone, it is a state.

A field label is the exception, and a deliberate one: `FieldLabel`, `Slider`,
`Progress` and `Meter` write in `text-fg` with `font-rc-medium`. The label is
what names the control, and naming is not supporting.

Hierarchy is made first by **size and weight**, then by tone. A dashboard where
everything is `text-fg` is tiring; one where everything is `text-fg-muted` has
no focus.

## Color with meaning, and when not to use color

`success`, `warning`, `danger` and `info` carry meaning. Do not use any of them
for aesthetic taste: a green that means "goes with the brand" erases the green
that means "it worked".

**Color is never the only signal.** A status `Badge` carries the word along,
and not just the tone. People who cannot tell red from green are a large slice
of any user base, and black-and-white printing is the same problem.

As for the accent: it marks **one** action per screen. Two actions in
`bg-accent` side by side have no primary action at all. The second one goes
with `variant="secondary"` or `"outline"`.

## The chart palette, and why it is separate

`--color-chart-1` to `--color-chart-8` exist separately from the accent because
a chart series needs things a brand color does not give: telling eight values
apart side by side, surviving in a thin slice, and not suggesting "right" or
"wrong".

Use them in order, or name them in the series `config`. Do not pick one because
it matches. Above six series reading ends, and the problem becomes the chosen
chart, not the color.

`--color-chart-grid` is the mesh. It is weak on purpose: a grid that competes
with the data line inverts the reading.

## Typography: three families, three jobs

| Class | For |
|---|---|
| `font-sans` | interface, running text, label |
| `font-display` | big number, screen title, indicator value |
| `font-mono` | what is compared vertically or read character by character: table value, CNPJ, code, shortcut |

Size goes from `text-xs` to `text-3xl`. Skip steps to create hierarchy:
`text-sm` next to `text-base` is barely distinguishable, and the distinction
was the point.

Weight by intent, not by number: `font-rc-regular` (body), `font-rc-medium`
(label, button, tab), `font-rc-strong` (strong emphasis), `font-rc-bold` (bold)
and `font-rc-display`, which goes with **every** `font-display`. The number
lives in `--rc-weight-*`, and the theme of a client whose font has no 600 swaps
it without touching any screen. A hardcoded `font-semibold` does not follow the
theme.

Line height by token: `--rc-leading-tight` for numbers and titles,
`--rc-leading-normal` for interface, `--rc-leading-relaxed` for paragraphs.

## Shape, shadow and motion

Radius: `rounded-sm` on a tiny marker, `rounded-md` on a control, `rounded-lg`
on a card, `rounded-xl` on a panel and dialog, `rounded-pill` on a tag and a
round button. **A piece inside another uses a smaller radius than the parent**,
or the inner corner visually "leaks" from the outer one.

Shadow: `shadow-1`, `shadow-2`, `shadow-3`, in order of how much the thing
floats. A still card does not need a shadow: in the dark theme the shadow
disappears and what separates is the border. Each shadow already carries a 1px
hairline outside, in the theme's right color: it is the bevel that lifts the
floating thing off the background, and it coexists with the `border` the piece
already has: one is the inner stroke, the other the outer outline.

`shadow-glow` is the accent's lantern, opt-in: a landing hero and a CTA that
deserves ceremony. No component turns it on by itself, and an operations
product never uses it.

A display title tightens the letters: `tracking-display` goes with
`font-display` from `text-xl` up (the Card, Dialog and Sheet titles already
come with it); `tracking-tight` is for a smaller title. Body text stays at
tracking 0.

Motion: `--rc-duration-fast` for touch feedback (hover color),
`--rc-duration-base` for what enters and leaves, `--rc-duration-sheet` for the
sheet. Animating `width` and `height` costs layout; prefer `opacity`, `scale`
and `translate`. In Tailwind 4, `scale-*`, `translate-*` and `rotate-*` write
the `scale`, `translate` and `rotate` properties, and not `transform`: with
`transition-[opacity,transform]` the panel appears fading and the scale snaps
in. Name the property that changes (`transition-[opacity,scale]`) or use
`transition-transform`, which covers all four. The duration always comes from
the token, `duration-fast` (or `duration-[var(--rc-duration-fast)]`, which is
the same): `transition-colors` alone falls back to Tailwind's 150ms, which do
not zero out with "reduce motion". A looping animation (`animate-spin`,
`animate-pulse`) takes `motion-reduce:animate-none` beside it.

The curve also has an intent name: `ease-rc` is the default, `ease-rc-enter`
for what arrives and `ease-rc-exit` for what leaves. The springs go with the
duration of the same name: `ease-rc-spatial duration-spatial` for position and
size, `ease-rc-expressive duration-expressive` when the gesture deserves to be
noticed, and `ease-rc-effects duration-effects` for color and opacity, which
must not overshoot the target.

Brand entrance: `animate-rise` goes up one step and settles, `animate-fade`
only appears. Stagger siblings with `[animation-delay:80ms]`, 160, 240: that is
for landing and hero, and not for an operations screen.

**Pieces animate in on mount.** The old rule said an operations product does
not animate entrances; the owner decided the opposite, and the criterion now is
a single one: the entrance helps notice what arrived or what changed. Data that
arrives animates in (the chart draws itself, the progress bar fills from zero,
the alert and the empty state rise 4px fading, the count pill grows, the table
body fades on leaving the skeleton). The frame does not: `Card`, `PageHeader`,
`Sidebar`, `Separator` and a control in its initial state stay still, because
the whole screen flashing on every navigation is noise, and a `Switch` that
slides on mount suggests a change that did not happen. The pieces already bring
their own entrance; the utilities are here for what you build outside them:

| Class | Effect | Duration |
|---|---|---|
| `animate-enter` | fades and rises 4px | `base` |
| `animate-appear` | only fades | `base` |
| `animate-pop` | grows from 60% fading | `fast` |
| `animate-fill` | the bar fills from zero by horizontal scale; together with `origin-left` | `slow` |
| `animate-reveal` | appears from left to right, by clipping | `slow` |

All five end in `backwards`: the starting frame applies while the animation
runs, and afterwards nothing is left, so the final state is always the
element's own, and if the animation does not run the content is still there. It
runs once per mount: a re-render does not repeat it, only a new node in the DOM
does. With `prefers-reduced-motion` the durations go to zero and nothing
animates in. To turn it off on one instance, `className="animate-none"`. And do
not put an entrance on a row that reorders or on a virtualized row: moving the
node in the DOM restarts the animation, and sorting becomes a blinking light.
The right level is the table body or the whole list.

## Icons

The set is **lucide-react**, a required peer: same stroke, same grid, and the
numeric `size` spares a class. Never an emoji in place of an icon, and never a
second set mixed in: two different strokes on the same screen look like two
brands.

| Where | Size |
|---|---|
| Inside a control (`Button`, `Tab`, menu item) | `size={16}` |
| Next to `sm`/`xs` text (cell, meta, eyebrow) | `size={14}` |
| Tiny in a tight row (`Stat` hint, delta) | `size={13}` |
| Empty state (`EmptyState` `icon`) | none: the piece forces 32px |

A decorative icon (one that goes with a text that already says it all) takes
`aria-hidden="true"`. An icon that is a button's only content requires
`aria-label` on the button, never on the icon. And the touch target is still
24px at minimum: a smaller icon grows the button and gives the space back with
a negative margin, as the `Stat` hint does.

### Icon or illustration in the empty state

`EmptyState` has two slots, and each serves one kind of empty:

- **`icon`** for the empty that happens in the middle of work: a filter or
  search with no result, a list the person emptied, a period with no activity.
  A lucide icon from the table below, and the piece sets it at 32px and
  `fg-subtle`.
- **`illustration`** for the first-time empty: the start screen that has
  nothing yet, the onboarding step. Free size, and it takes the place of `icon`
  when both come.

```tsx
<EmptyState
  icon={<Search />}
  title="Nenhum cliente com esse nome"
  description="Confira a grafia ou busque pelo CNPJ."
/>

<EmptyState
  illustration={<FirstInvoiceArt className="h-24 w-auto" />}
  title="Nenhuma nota"
  description="Emita a primeira para ela aparecer."
  action={<Button>Emitir nota</Button>}
/>
```

**The illustration paints with `currentColor` or with a token class**
(`fill-accent-subtle`, `stroke-fg-muted`), and never with a literal color: the
same screen dresses several clients through the theme, and a hex inside the SVG
stays the same in all of them and can vanish in the dark theme. The wrapper
already comes in `text-fg-subtle`, so `currentColor` follows on its own. Prefer
inline SVG to `<img>`, which follows no theme at all. The library has no
illustration kit, on purpose: the slot is what it guarantees, and the drawing
belongs to the product. In React Native, `icon` also accepts a function that
receives the color and the size, and the illustration paints with the roles in
`useRivo().colors`.

### The vocabulary

One concept, one icon. Lucide has a synonym for almost everything (`Trash` and
`Trash2`, `Gear` and `Settings`), and each synonym that gets in is a screen
that looks like it belongs to another product. This is the canonical table; a
new concept enters here before it enters the code.

| Concept | Icon |
|---|---|
| add / create | `Plus` |
| delete | `Trash2` |
| edit | `Pencil` |
| search | `Search` |
| download / export | `Download` |
| upload a file | `Upload` |
| copy | `Copy` |
| confirmed / done | `Check` |
| close / clear | `X` |
| more actions | `MoreHorizontal` |
| fine filters | `SlidersHorizontal` |
| reload | `RefreshCw` |
| view / preview | `Eye` |
| link that leaves the product | `ExternalLink` |
| log out | `LogOut` |
| opens a level (item, breadcrumb) | `ChevronRight` |
| expands downward (select, accordion) | `ChevronDown` |
| previous page / back | `ChevronLeft` |
| sortable with no order | `ChevronsUpDown` |
| change up / down | `ArrowUpRight` / `ArrowDownRight` |
| document / invoice | `FileText` |
| people / customers | `Users` |
| system settings | `Settings` |
| date | `CalendarDays` |
| dashboard | `LayoutDashboard` |
| short explanation | `Info` |
| agent / AI | `Bot` |

## Focus and states

Focus is `focus-visible:ring-2 focus-visible:ring-ring`, never `outline-none`
alone. Removing the ring without restoring it is the most common accessibility
defect, and it breaks keyboard navigation entirely.

| State | How it shows |
|---|---|
| hover | a change of surface, not of size |
| selected | `bg-selected`, or `bg-accent` when it is a single, strong choice |
| disabled | `text-fg-disabled` and no pointer; never opacity alone |
| loading | `bg-skeleton` in the shape of the content that is coming, and not a spinner in the middle of the screen |

The placeholder mark should have the **width of the column**, and not that of
whatever text comes: that way the screen does not jump when the data arrives.
