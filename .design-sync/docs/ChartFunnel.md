---
category: Charts
---

# ChartFunnel

The stages of a path, with how many reached each one and how many made it from
one to the next: from whoever visited to whoever issued their first invoice.

```tsx
<ChartFunnel
  data={adesao}
  valueKey="total"
  nameKey="etapa"
  format="integer"
  label="Funil de adesão em agosto"
/>
```

Each stage has its name, its number and a bar with a width proportional to the
widest stage. Between two stages comes the **conversion rate**, written out:
"↓ 25% da etapa anterior". At the end, the end-to-end conversion. The rate is
the information the funnel drawing alone does not give, because the eye
compares width and not ratio, and it is almost always the question of whoever
opened the panel.

## The math

The rate is the stage over the previous one, and the end-to-end rate is the
last over the first. A zeroed previous stage does not invent a rate: "—"
shows up. `formatRate` changes how it is written, and takes 0 to 100.
`labels.rate` and `labels.overall` change the sentences, which is what a
product in another language needs; `showOverall={false}` hides the total line.

## The drawing

`align="center"` draws a real funnel, each bar centered under the one above.
`align="start"` aligns the bars to the left, which reads better when the names
are long and what matters is comparing length.

All bars have the same color, `var(--rc-chart-1)` or the one in `color`, and
that is on purpose: the stages are not different categories, they are the same
population shrinking, and one color per stage would suggest the opposite.

## Screen reader

There is no drawing to describe: the component **is** an ordered list, with
each stage's name, number and rate as text, and the bar is hidden from it.
`label` names the list.

## Motion

The bars grow from the center (or from the left, with `start`) the first time,
and move to the new width when the data changes, in `--rc-duration-slow`. With
"reduce motion", they are born in place.

## No data

`empty` is the same object as in `ChartContainer` and `DataTable`: `title`,
a required `description`, optional `action` and `icon`. It shows up in place of
the drawing when the list comes empty or all stages add up to zero. Without it,
the funnel draws the stages with zero-width bars.


When the stages are not subsets of one another (acquisition channels, invoice
types), there is no conversion to compute, and what exists is comparison: a
horizontal bar. When the subject is **where the person is** in a process, and
not how many went through, it is `Steps`, which looks ahead. And to say which
part of the total belongs to each thing, it is `ChartDonut`: a slice is part of
a whole, and a funnel stage is not.

## In React Native

Translates, in `@rivocode/ui-native/chart`, and it is the chart piece that needs `react-native-svg` least: the bars are `View`s, and the rate math is the same function as the web, generated in `native/src/shared/`. `valueKey`, `nameKey`, `align`, `formatRate`, `showOverall`, `labels` and `format`, with a formatter name or a function, cross over unchanged.

One type change, the same as the donut: `color` is a token role (`chart-2`), not a CSS color. And one reading change: on the web the piece is an ordered list and the screen reader reads the name, the number and the rate in pieces; here **each stage is a single stop**, with all three in the same sentence ("Cadastros: 400, 40% da etapa anterior"), because the phone's screen reader moves from element to element and three stops per stage would triple the path. There is no `label`: on touch there is no list name, and the card's title plays that role.

The bars grow from zero on appearing and move to the new width when the data changes, through Reanimated and with the motion tokens; with "reduce motion", they are born in place.

The parts are styled through the same `classNames` as the web: `stage`, `bar` and `rate`. With `empty` (the `ChartContainer` format), an empty list or a zero sum shows the empty state in place of the bars.
