---
category: Typography
---

# Text

A paragraph or a run of text, dressed in the house roles: `size` on the scale
from `xs` to `lg`, `tone` among the theme's text roles, and `weight`.

```tsx
<Text size="sm" tone="muted">Atualizado há 2 minutos.</Text>
```

It comes out in a `<p>`. `render` swaps the element without changing the
design: `render={<span />}` for a run inside a sentence, `render={<div />}` for
a block that contains another block, which a `<p>` cannot contain.

**With no `size`, no `tone` and no `weight`, the text inherits from whatever
surrounds it.** That is what makes the inline run work: a bold value inside an
`sm` sentence stays `sm`, and stays the sentence's color unless it asks for
another. The cost is that a loose paragraph also inherits, and the page body is
your app's; pass `size` on the outer paragraph.

The tones are the theme's text roles, and only those: `neutral` is running
text, `muted` the secondary, `subtle` the caption, `accent` the brand
highlight, and `success`, `warning`, `danger` and `info` are the `-text` of
each state, the ones that read over the page background. The fill ones
(`bg-danger` and relatives) are not included, because they have no contrast as
text.

`truncate` cuts to one line, and `lineClamp` cuts after 1 to 6 lines; when both
are given, `lineClamp` wins. The cut text stays whole in the DOM: the screen
reader hears everything, and whoever sees it needs a `title` or a `Tooltip` to
read the rest.

## When not to use

- **A file name, a command or a JSON key in the middle of a sentence:** `Code`.
  It changes the font to fixed-width and marks the run as code; a `Text` with
  `font-mono` looks the same and does not say what it is.
- **A key or a shortcut:** `Kbd`. It draws the key and says its name to whoever
  listens to the screen; a bold `Text` reading "Ctrl+K" does neither.
- **A section heading:** `Heading`. Large text does not enter the page outline,
  and whoever navigates by headings does not find it.
- **A field label:** `FieldLabel`, which ties itself to the control.

## In React Native

Translates, and the native `Text` is the same primitive the package's other pieces already wear, now with `size`, `tone`, `weight`, `truncate` and `lineClamp`, the same names and the same values as the web. `truncate` and `lineClamp` become `numberOfLines`.

**Without the new props, it inherits, as on the web.** A `Text` inside another `Text` takes the outer one's size and color, and that is what makes a bold snippet in the middle of a sentence work. The difference is at the top: React Native does not inherit color from `View`, so an outer paragraph without `tone` comes out in the device's default color, not the theme's. Pass `tone` on the outer `Text`.

There is no `render`: the phone's element is always `Text`, and a block is a `View` around it.
