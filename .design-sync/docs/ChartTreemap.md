---
category: Charts
---

# ChartTreemap

A rectangle split into areas proportional to the value of each category: the
month's revenue per service-list item, storage per file type.

```tsx
<ChartTreemap
  data={porServico}
  valueKey="total"
  nameKey="codigo"
  config={servicos}
  format="currencyShort"
  label="Faturamento do mês por item da lista de serviço"
  className="h-72"
/>
```

The area comes from an algorithm of nearly square rectangles (the *squarified*
one by Bruls, Huizing and van Wijk), which is what makes it possible to compare
size by eye. The `config` is the same as the donut's: a readable name and a
color per category, and without a color each one takes the next in the
palette, in the order of `data`. **The height is yours, by class**: without it,
`h-64`.

## The label disappears when it does not fit

Each rectangle writes the name and the value when both fit, only the name when
only one line fits, and **nothing** when not even the whole name fits. There
are no ellipses: "Retenç…" in a forty-pixel rectangle does not say which
category it is, and takes up the space that would let the rectangle read as
small, which is the right information. The math uses the box's real
measurement, and before the box is measured no label is drawn, instead of
guessing.

What disappears from the drawing remains in three places: in the tooltip, which
the pointer opens over any rectangle; on the keyboard, because the map is a
single Tab stop and the arrows move through the categories from top to bottom;
and in a visually hidden list, with each one's name, value and share, which is
what the screen reader reads. A category with zero, which gets no area at all,
is in it too.

## Colors and contrast

The rectangle is the category color at 30% over the background, with an
outline in the full color, and the label is written in `fg` on top. It is not
the full color with light text, and the reason is measured: the light theme's
dark lime with white text gives 4.10:1, below the 4.5 for text. With the 30%
tint, the worst pair among the eight series colors in both themes is 6.77:1,
and the contrast guard measures all sixteen on every commit. A color written by
hand in the `config` does not enter that measurement.

## Motion

The map fades in, and when the data changes each rectangle moves to its new
position and size in `--rc-duration-slow`. With "reduce motion", the change is
abrupt.

## No data

`empty` is the same object as in `ChartContainer` and `DataTable`: `title`, a
required `description`, optional `action` and `icon`. It shows up in place of
the drawing when the list comes empty or the sum is zero. Without it, the map keeps an empty frame, and the screen reader list keeps stating each category.

## Right to left

In `rtl` the boxes mirror: the largest category opens on the right, and the
arrow that moves forward (the left one) goes to the box that is on the left of
the screen. Before, the drawing stayed in `ltr` order and the arrow moved
against the eye.


Up to six categories, `ChartDonut` answers the same question with a total in
the middle and a legend that never disappears. When the exact number matters
more than the proportion, a horizontal bar: comparing area is less precise than
comparing length. And when the hierarchy is for **navigating**, opening a
folder and seeing what is inside, it is `Tree`: the treemap shows a single
level, and is not clickable.

## In React Native

Translates, in `@rivocode/ui-native/chart`, with the same props: `valueKey`, `nameKey`, `config`, `format`. The geometry is the same function as the web (the *squarified* one, generated in `native/src/shared/`), and so is the label rule: name and value when both fit, only the name when one line fits, nothing when not even the name fits, and nothing before `onLayout` measures the box. The 30% ink with `fg` on top is the same, and the sixteen pairs are in the native contrast map.

One type change: `config.color` is a token role, as in the whole family.

**What changes is how a category is read.** Here there are few (beyond a dozen the treemap stops informing), and few categories become few stops: each rectangle is a button with name, value and share, the donut legend's decision and not the `Tracker`'s. Tapping lights the outline and writes the reading below, in place of the web's tooltip; tapping again clears it. That is why there is no `label`: the web uses it to name the group and the hidden list, and on the phone neither exists. The card's title plays that role.

The parts are styled through the same `classNames` as the web: `cell`, each category's block, and `label`, the name and value inside it. With `empty` (the `ChartContainer` format), an empty list or a zero sum shows the empty state in place of the blocks.
