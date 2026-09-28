---
category: Forms
---

# Checkbox

A checkbox.

`indeterminate` is the mixed state: some items checked, not all. It is what the
"select all" box shows when part of the list is selected.

With no visible label beside it, pass `aria-label`.

## The label

Pass the text as children and the box renders inside a `<label>`, so clicking
the text also checks it:

```tsx
<Checkbox defaultChecked>ISS retido na fonte</Checkbox>
```

Without children, only the box renders, and the arrangement is up to whoever
builds the screen. Use it this way when the label has its own structure: a
title with a description below, a link in the middle of the sentence. In that
case, the `<label>` around it is yours, and it is what makes the click on the
text count.

## The checked box

The checked box paints `accent-text`, not `accent`, with the tick in
`surface-raised`. It is the same swap as the `Switch` track, and for the same
reason: with the full lime the fill measured 1.21:1 over the page in the light
theme and 1.26:1 over the card, below the 3:1 WCAG 1.4.11 asks for a control
without text.

Here the state could still be read, and that is what let the defect through:
the tick was graphite and was visible either way. What disappeared was the
**boundary of the box** - what was left was a tick floating where a checked box
should be. With `accent-text` the boundary measures 5.55:1 over the page and
5.75:1 over the card, and the tick measures 5.75:1 inside the fill.

The mixed state goes into the same swap, with the same token pair: it painted
the full lime too, and the select-all box disappeared the same way.

No lighter lime would solve it: the darkest step before `accent-text` is
`accent-active`, and it stops at 1.49:1 over the page. In the dark theme the two
roles point to the same value, so there the box did not change color, and the
tick went from 15.06:1 to 13.91:1.

Whoever writes a client theme inherits the guarantee without doing anything:
`accent-text` already needs 4.5:1 over `bg`, `surface` and `surface-raised`,
and contrast is symmetric - it is the same measurement the boundary and the
tick use.

## Disabled

Disabled is painted with a token, not with opacity: the background becomes
`surface-raised` and the check mark goes to `fg-disabled`. It holds checked,
unchecked and in the mixed state. Before, `indeterminate` won over disabled,
and the select-all box rendered painted in full accent.

The border drops one step, to `border-disabled`. The two neighbors did not
work: `border` gives 1.3:1 against the fill itself and the locked box would
disappear, and `border-strong` (the control boundary at WCAG 1.4.11's 3:1)
would make the locked one look the same as the live one. The middle token
exists for this range, and it is the only pair in the house with a ceiling as
well as a floor: at least 1.6:1 against the background, and the live boundary
weighing 1.4 times more. 1.4.11 exempts an inactive control from the 3:1, and
it is that slack the token occupies.

This matters most where there is no label. In a `DataTable` selection column,
an unchecked, locked box has no dimmed text beside it to state its state. And
`surface` and `surface-raised` are the same white in the light theme, so the
fill says nothing either. The border was what was left, and it said nothing.

## When not to use

For a setting that takes effect immediately (a notification that turns on, dark
mode, a feature the account gains), use `Switch`. The box promises a Save
later; the switch promises it already took effect. A checkbox on a preferences
screen without a save button leaves the person waiting for a button that does
not exist.

To choose one option among several mutually exclusive ones, it is
`RadioGroup`: a box that unchecks its sibling when checked is a badly made
radio.

## In React Native

Translates, with a catch that bites on the first line: on native the `Checkbox` is **always controlled**. `checked` and `onCheckedChange` are required and there is no `defaultChecked`. Copying `<Checkbox defaultChecked>ISS retido</Checkbox>` from the web does not compile.

**The third state crosses over.** `indeterminate` draws a dash in the filled box and announces `mixed` to the screen reader; it wins over `checked` in the drawing, and a tap checks everything. The select-all box is assembled by hand, because the web's `parent` does not exist there: `indeterminate` when part of the list is checked, `checked` when all of it is.

**The spoken name is `label`, in place of the web's `aria-label`**, the same name the other native pieces use. With `children` it is optional and replaces the text the screen reader reads; without `children` it is required, and the type rejects a box with neither - the one that checks a list row would be announced only as "caixa de seleção, marcado". Inside `FormField`, `forChecked` already provides the `label`.

The parts are styled through the same `classNames` as the web: `box`, `indicator` (the check mark or the dash) and `label`.
