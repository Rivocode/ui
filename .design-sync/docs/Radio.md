---
category: Forms
---

# Radio

The circle, with no label. The text sits in a `<label>` that wraps both, like
Checkbox, so a click on the text also checks it.

Use it when the options fit on the screen and comparing them matters. Past
about five, `Select` uses less space.

## The label

Pass the text as a child and the circle comes out inside a `<label>`:

```tsx
<RadioGroup defaultValue="pix">
  <Radio value="pix">Pix</Radio>
  <Radio value="boleto">Boleto</Radio>
</RadioGroup>
```

Without a child, only the circle comes out, for when the label has a structure
of its own.

## Parts

`classNames` dresses each part by name: `circle` is the outer circle,
`indicator` is the inner mark and `label` is the `<label>` that wraps both.

```tsx
<Radio value="pix" classNames={{ circle: 'size-5', indicator: 'size-2.5' }}>
  Pix
</Radio>
```

The gap between the circle and the text is the same as in `Checkbox` and
`Switch`, which appear in the same form list. And it is smaller than the one
that separates one option from the next, otherwise the label would sit closer
to the option below than to its own circle.

## The checked circle

The checked circle paints `accent-text`, not `accent`, with the dot in
`surface-raised`. It is the same swap as the `Checkbox` box and the `Switch`
track: with the full lime the fill measured 1.21:1 against the page in the
light theme and 1.26:1 against the card, versus the 3:1 of WCAG 1.4.11. The dot
was graphite and read fine, so what disappeared was the **circle's boundary** -
the person saw a loose dot, and not a chosen option.

With `accent-text` the boundary measures 5.55:1 against the page and 5.75:1
against the card, and the dot measures 5.75:1 inside the fill. In the dark
theme both roles point to the same value, so there the circle did not change
color.

## Disabled

Disabled is painted with a token, not with opacity: the background becomes
`surface-raised` and the mark goes to `fg-disabled`. It is the same recipe as
`Checkbox`, border included. It does not change with state. Opacity would dim
everything at once, and the repository's contrast guard does not measure
opacity: the pair approved in the theme file could fail on screen without
anything flagging it.
