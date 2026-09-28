---
category: Structure
---

# FilterBar

The row of applied filters, the clear button and the count: the three things
every listing rebuilds by hand around `DataTable`.

It **does not manage the query**. It does not know what a page, a `queryKey`
or a `refetch` is, for the same reason `DataTable` does not know React Query:
query state is application architecture, and the house decided to leave it
out. The piece receives `filters`, presents what it received and reports when
something left.

```tsx
const [filters, setFilters] = useState<AppliedFilter[]>([
  { id: 'status', label: 'Situação', value: 'Em aberto' },
  { id: 'customer', label: 'Cliente', value: 'Clínica São Lucas' },
])

<FilterBar filters={filters} onFiltersChange={setFilters} />
```

`onFiltersChange` receives **what is left**, on the X and on clear. It is the
same pair as `TagsInput`'s `onValueChange`, and on its own it is already
enough. `onRemove` exists next to it for whoever needs to know *which* filter
left, and receives the whole object; `onClear` fires before `onFiltersChange`,
for the telemetry that counts "how many times someone gives up on everything".
Clear delivers the list with only the locked filters, and not the empty list
(see "A filter the app locks").

Each filter is `{ id, label, value }`. The `id` is the stable key: it is by it
that the piece removes, and not by index. The `label` is the field (`Cliente`)
and the `value` is the chosen one (`Clínica São Lucas`); the two together are
what the screen reader hears on the X, because "Remover" repeated four times
distinguishes nothing.

## The row stays, even when empty

With no filter at all the bar **keeps taking up the row**, with "Nenhum filtro
aplicado" in muted text. A screen that jumps when the first filter comes in is
a known defect, and React Native's `Tracker` already paid for it: there the
reading line exists from the first frame precisely so that the space stays
reserved and nothing jumps on the first tap. Here it is the same math, and it
costs one control height (`--rc-control-sm`), the same as the density chosen
in the provider, and not a hard-coded number.

Whoever really cannot spend the row passes `reserve={false}`. **The screen
reader notice stays mounted even so**: a live region needs to exist *before*
the change in order to announce it, and a bar that unmounts on losing its last
filter would announce silence.

## When the filters do not fit

At 390px, three filters do not fit. The bar **scrolls horizontally inside its
own frame**, with "clear" anchored outside the scrolling part.

It does not wrap because the bar's height would start depending on how many
filters there are: four chips of "Cliente: Clínica São Lucas" become four
lines, and the listing (which is the content) drops below the fold. The bar is
a frame, and a frame that grows to half the screen has stopped being a frame.

It does not collapse into "+3" because the bar exists precisely to say that the
result is filtered. A filter hidden behind a counter is the source of the "my
data disappeared" ticket, and unfolding it would call for a second floating
surface for a row of chips.

Each chip truncates the value with an ellipsis at 10rem, so a long value
shrinks itself instead of pushing its neighbors out of reach. The keyboard
reaches them all: the browser scrolls to the X that receives focus.

When **no X is reachable** (a bar of only locked filters, or a `disabled` bar)
**and** the row **actually overflows**, the scrolling part becomes a tab stop,
otherwise the keyboard would have no way to reach what is out of view. Both
conditions are required, and for a while only the first was enforced. The price
came out in stops that led nowhere: `disabled`, whose purpose is to *take*
controls out of the way while the query reruns, **added** one; and a row of
locked filters that fit entirely on the line (`scrollWidth` equal to
`clientWidth`, measured in Chrome) became another, without a single pixel to
scroll. Tabbing into a list that does not move is tabbing into nowhere.

Being a stop, it **has a name**: "Filtros aplicados: role para ver todos", the
row's `label` plus what to do there. Without a name, the screen reader
announces "list" and leaves the person guessing where they landed. The text is
swapped through `labels.scroll`, which receives the `label` and returns the
sentence.

## The edge fades when there is more

Scrolling solves reach and does not solve the signal, and for a while the
piece only had the first half. Measured in Chrome, with six filters of company
legal names: at 390px **a chip and a half** fit, and the second was cut in the
middle of a letter (`Emissão 01/`), with a straight cut, no ellipsis and
nothing saying there were five more. At desktop width the same cut fell on the
fifth chip. The irony is that the piece had refused "+3" so as not to hide a
filter behind a counter, and ended up hiding filters with no counter at all.

An ellipsis does not solve it, because **what cuts is the scroller, not the
chip**: `FilterChip`'s truncation at 10rem had already happened before, inside
the pill, and the frame's edge cuts what was left.

The edge that has hidden content behind it **fades** (`mask-image`, 1.5rem of
dissolve) and goes away on its own when there is nothing more to scroll on that
side: at the start only the right, in the middle both, at the end only the
left, and neither when everything fit. Nothing leaves the row: the six chips
are still there, reachable by dragging and by tabbing, which is the decision
this section has defended from the start.

The fade was chosen because it is the only cue that **costs no width**, and
width is exactly what is missing on a 390px line that already shares space
with "clear":

- **Scroll arrows** would eat some 56px of target precisely at the width where
  the problem is worst, and would only serve the pointer: the finger already
  drags and the keyboard already tabs. They would still need the same scroll
  measurement the fade uses, so they do not replace the cost: they add to it.
- **A "+3" counter** next to clear would duplicate a count that is already on
  screen (that is the same reason the separate counter does not exist), and
  "+3" is the vocabulary of collapsing: whoever sees it tries to click
  expecting the row to unfold, which is the second floating surface refused
  above.

**The button does not lie.** "Limpar 6 filtros" next to three visible chips
counts the **applied** filters, which is the question that matters before
touching it, and was the only true thing on the screen. What was missing was
not fixing the 6: it was the row admitting it was cut off. Read together, the
two add up: six applied, three in view, the rest continues to the right.

The fade does not eat the focus ring. The scrolling part carries
`scroll-padding` of the same 1.5rem, so the X that receives focus always stops
past the dissolve; and when the row is only locked filters and the scroller
becomes the tab stop, the fade goes away while it is focused, so the ring shows
whole.

Through `classNames.list` the measurement can be redrawn (`mask-r-from-*`), for
whoever wants a different dissolve.

## Focus after removing a filter

The X that receives the tap **leaves the DOM together with the chip**, and
focus went with it: measured in Chrome, `activeElement` went back to `<body>`
on every removal. The live region announced "5 filtros aplicados" at the right
moment, and the announcement came from nowhere: in a bar of six, six restarts
at the top of the document for a keyboard user.

The piece chooses where focus lands, in this order:

1. **the X of the next chip**, which is the one that took the place of the
   one that left. That is what lets you remove six filters in a row without
   letting go of the keyboard;
2. **"clear"**, when the one that left was the last in the row;
3. **the X of the previous chip**, when there is no clear
   (`clearFrom={Infinity}`, or a count that dropped below the threshold);
4. **the scrolling part** (or the `role="group"` root, when the last filter
   left and the whole row unmounted). In both cases `tabindex="-1"` is set on
   the spot and given back on `blur`: an emergency landing does not leave a
   new tab stop behind.

A locked control does not count. A bar that becomes `disabled` in the same
step as the removal (the query already rerunning) would have sent focus to an
X that cannot receive it, which is `<body>` again by another route; in that
case the landing skips to the first step that accepts focus.

**Focus only moves if it was in the row.** Whoever clicked with the pointer
while the cursor was elsewhere on the page is not pulled into the bar.

## Clear shows up from two onward

With a single filter, the chip's own X does exactly the same, at the same
distance from the finger: a second control for the same effect teaches nothing
and still eats 110px of a 390px line. The button starts to be worth it when
"removing one by one" becomes work.

It shows the count ("Limpar 3 filtros") and that is where the visible count
lives. A separate counter would compete for the scarce width with the chips,
which are the count already visible; on the button it doubles in function and
says the size of the damage before the tap. For a different threshold,
`clearFrom={1}` always shows the button, and `clearFrom={Infinity}` removes it
for good.

## A filter the app locks

`removable: false` shows the filter without an X. It is the scope the
application imposes (the person's branch, the tenant, the open fiscal year): it
**needs** to show, because it explains the result, and leaving it is not the
reader's choice. Today that filter is usually just omitted, and then the list
lies about its own slice.

Clear **does not take the locked one along**: `onFiltersChange` receives only
the filters with `removable: false`, and the button's count counts only the
ones it removes. With the branch locked and two filters chosen, the button
says "Limpar 2 filtros", and the `clearFrom` threshold also measures only the
removable ones. After clear, focus lands on the `role="group"` root, with the
same emergency `tabindex="-1"` as the landing after the X.

## While the query reruns

`disabled` locks every X and clear at once. It is the state in which the list
has already been requested again and has not come back yet: without it, the
second tap fires a query that the first one will still overwrite.

The group carries `aria-disabled`, and the screen reader announces the whole
row as unavailable, and not just each X. Each chip carries `data-disabled` on
its root, the same mark the other pieces use for inactive: the muted text is
that of an inactive component, which WCAG 1.4.3 exempts from text contrast.

## The row's name

`label` is the only door to the name, and the default is "Filtros aplicados".
Passing `aria-label` directly **is refused by the type**, and not out of
fussiness: up to 0.7.0 it compiled, rendered and was silently swallowed,
because the caller's `{...props}` was spread *before* the piece's
`aria-label`. `<FilterBar aria-label="Filtros da listagem" />` kept announcing
itself as "Filtros aplicados", and nothing flagged it: the defect only shows
with a screen reader on.

Accepting and ignoring was the worst of the three ways out. Between the two
honest ones (let the caller win, or forbid it), the piece forbids it, because
`label` already existed exactly for this and because **the same text names two
things**: the row and the scrolling part, when it becomes a tab stop. Two doors
would give two names to the same place, and the stop would inherit the old
name. Whoever needs to point to a heading already on the screen uses
`aria-labelledby`, which the piece does not overwrite.

## Parts

`classNames` dresses each node by name: `list` is the scrolling part, `item`
is the `<li>` of each filter, `chip` is the chip's root, `clear` is the clear
button and `empty` is the text of the reserved row. Without them the only way
out would be `[&_li]`, which ties your screen to the piece's internal tree.

The row renders as a `<ul>` with an explicit `role="list"`. Preflight's
`list-style: none` removes the list semantics in Safari, and that is what makes
the screen reader announce "3 items" without anyone counting anything.

## Motion

Only the filter chip applied after mount grows on entering (`animate-pop`, `--rc-duration-fast`); the ones already there start still.

## When not to use

When the options are few, fixed and fit in view, use `ToggleGroup`: choosing
and unchoosing happen in the same place, with one tap, and there is nothing to
summarize afterwards. `FilterBar` is for the opposite case: the filter was
chosen somewhere else (a `Combobox`, a `DateRangePicker`, a whole sheet of
filters) and the listing needs to say what is still in effect.

When the filter is the very text the person types, use `TagsInput`: there the
list is born from the field and the field is the piece. Here the piece has no
field at all, on purpose.

## In React Native

Translates, and this is where the piece is worth the most: a listing on the phone is where filtering hurts. The drawing decisions had already been made with 390px in mind, so almost everything crosses over: it scrolls horizontally, does not wrap and does not collapse into `+3`.

**The clear button stays OUTSIDE what scrolls.** If it scrolled along, the control that exists to undo everything would be the only one that requires scrolling to the end to find. It anchors to the right of the row, and the native `Button`'s `size="sm"` already delivers the 44pt target on its own.

**The reserved row is now measured in fingers.** On the web it keeps the height of `--rc-control-sm`; here it keeps 44pt, which is one touch target tall. There is no control token on this side. The row has the same height empty and full, for the same reason as the `Tracker`: the screen cannot jump when the first filter comes in.

The live region is a single `Text` that combines both roles, instead of the web's two nodes: duplicating would open a dead `gap` in the row. `accessibilityLiveRegion` is Android's and the web's; on iOS, where it does not exist, the same sentence goes out through `announceForAccessibility`, and only when the count changes, like the live region.

**RTL was verified, and React Native itself solves most of it.** The row and the chip are already mirrored by Yoga when the locale is right-to-left, and the scroll's resting position already stops at the edge where reading starts: flipping again would be the classic mistake of mirroring twice. The `contentOffset` that reaches JavaScript is always a physical distance from the left, in both directions and on both platforms, so the rule marks the physical side that has content beyond it, and does not switch sides.

What needed math was the RESTING value. The code kept zero until the first scroll event arrived: true in LTR, false in RTL, where the resting position is the end of the content. On iOS the defect lasted forever as long as nobody dragged, because at rest it emits no event at all, and the rule appeared on the wrong side.

**The edge fades on the web; here it is a rule.** `mask-image` does not exist in React Native, and a real fade could only come in two ways. A new peer (`expo-linear-gradient`, `MaskedView`), which a filter bar cannot demand, because on the phone a peer is a native module to link and rebuild. Or a gradient painted IN the color of the surface behind, which the piece has no way of knowing: in the dark theme, `surface` over `bg` becomes a light smear over the chips. The gradient itself was even within reach, because `react-native-css` compiles `linear-gradient` to the `experimental_backgroundImage` that RN ships with; what is missing is the mask, and without it there is no per-pixel alpha.

What remained: a 1pt rule in `border-strong` against the edge that has hidden content, which appears and disappears on its own as the scroll moves, costs no width and does not eat a drag that starts on it. It is the same cue, harder, and it is the same `inset 1px` with which the `DataTable` marks the frozen column on the web.

The web's tab stop goes away, because there is no keyboard focus here. The parts are styled through the same `classNames` as the web: `list` on the scrolling content, `item`, `chip`, `clear` and `empty`, the last only on the reserved row.
