---
category: Forms
---

# Switch

An on-off switch, for what changes right away.

The target is 44px tall even with a 24px track, through invisible padding: it
is the size of a finger.

## The label

Pass the text as a child and the switch comes out inside a `<label>`, so
clicking the text also turns it on:

```tsx
<Switch defaultChecked>Enviar o XML junto com o PDF</Switch>
```

Without a child, only the switch comes out. It works for a settings row where
the text has a description below and the switch sits at the right end.

## The track when on

The track when on paints `accent-text`, not `accent`: it is the same lime one
step darker, and the swap is about contrast. With the full lime the track
measured 1.21:1 against the page in the light theme, versus 3.33:1 for the
**off** track - the on state was less visible than the off one, and below the
3:1 WCAG 1.4.11 asks for a control that carries no text. With `accent-text` it
measures 5.55:1 against the page and 5.75:1 against the card.

There was no light lime that would solve it: the darkest step before
`accent-text` is `accent-active`, and it stops at 1.54:1 on white. In the dark
theme both roles point to the same value, so there the track did not change a
pixel. The on thumb follows in `surface-raised`, and it is what reads inside
the track, at 5.75:1 in light and 13.91:1 in dark.

Whoever writes a client theme inherits the guarantee without doing anything:
`accent-text` already needs 4.5:1 against the backgrounds for accent text, and
it is the same measure the track uses.

## Disabled

Disabled is painted with a token, not with opacity, as in `Checkbox` and
`Radio`. The track is already the dimmed surface when the switch is off, so
here it is the thumb that says locked: it goes from `fg-muted` to
`fg-disabled`, and the track loses the accent when on.

Giving a washed-out accent back to the on-and-locked track so that "on" stays
obvious does not work: measured, the thumb drops to 2.5:1 on it in the dark
theme, below the 3:1 of WCAG 1.4.11. And the thumb is the only place where the
switch is read.

## When not to use

Inside a form that has a save button, use `Checkbox`. **It is not the same
control in a different shape**: the switch acts on click and the effect is
immediate; the checkbox answers a question that only counts when the form is
submitted. A switch above a Save leaves the person not knowing whether it
already took effect, and if they leave the screen without saving, the answer is
no.

## In React Native

Translates: `@rivocode/ui-native` exports `Switch` - `checked` and `onCheckedChange` required; the track is the system's, painted by token, and the thumb slides with the platform's own animation; `label` is the spoken name, required without `children`; `classNames` only with `label`, because the thumb belongs to the platform. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
