---
category: Charts
---

# ChartDonut

A donut with the total in the middle.

```tsx
<ChartDonut
  data={porNatureza}
  valueKey="total"
  nameKey="natureza"
  centerValue={compact(246700)}
  centerLabel="no mês"
/>
```

A pie answers "which is the biggest slice" and nothing more. A donut answers
the same thing and also uses the hole to say the total, which is the number
the person came looking for. A dashboard that shows the split without showing
the total forces mental addition.

## The ring

`thickness` is the thickness, as a fraction of the radius: the thinner the
ring, the bigger the hole, and that is where the total has to fit. At `1` it
closes and becomes a pie.

The middle number is bound to the width of the hole. A long total spilling over
the ring is this component's classic defect.

**The center is always in view, and the tooltip opens outside the hole.** It
does not follow the pointer: it goes to the side of the donut when there is
width to spare (to the right, and to the left if it only fits there) and above
the ring when there is not, as in a phone card. That way the tooltip says the
slice's number, the center keeps saying the total, and one never covers the
other. Measured in Chrome at 390px and 900px: the tooltip's rectangle does not
cross the center's, and the center stays at opacity 1 during the reading.

Until now the center faded while the pointer read a slice, because the
Recharts tooltip landed on top of it; the total disappeared just when the
person was comparing.

The ring is not a tab stop. With a legend, whoever reads the donut with a
screen reader reads the legend list, and the drawing stays hidden; without a
legend, the drawing becomes a single image, with a name. In both cases the
keyboard goes straight past the ring, instead of stopping at a group the reader
does not announce.

## Motion

The first time it appears, the donut sweeps from zero: the slices leave the top
together and each one opens to its angle. When the data changes, each slice
moves from the old angle to the new one. In both cases, with the tokens'
duration and curve (`--rc-duration-slow`, `--rc-ease`), by the same decision as
`ChartContainer`. With "reduce motion", the donut is born ready and the change
is abrupt.

## The colors

Without `config`, each slice takes a color from the theme palette, in order.
With `config`, the `color` you wrote there applies; and a slice declared
without `color` takes the palette one **in the order of the `config`**, not in
the order it arrives in `data`. That is what keeps the color of "Serviço" still
when the query returns the types in another order the next month. A slice the
`config` does not know comes after the declared ones, in the order of `data`.

What does not work is `var(--color-<name>)`: those variables are written by
`ChartContainer`, and the donut draws on its own, outside it.

## No data

`empty` is the same object as in `ChartContainer` and `DataTable`: `title`, a
required `description`, optional `action` and `icon`. It shows up in place of
the drawing when the list comes empty or all slices add up to zero. Without it, the donut draws only the **background ring**, in the theme's border color, with the center on top: the zero total is still stated, and the card is not left with a white hole where the chart should be.

The background ring always exists, with data too: it is what shows in the gaps
between the slices.

## When not to use

Above six slices it stops informing: the smallest become thin strips and the
legend becomes a list the person reads instead of looks at. In that case, a
horizontal bar reads better, and the full label still fits.

## In React Native

Translates, in `@rivocode/ui-native/chart`, with the same props: `valueKey`, `nameKey`, `config`, `thickness`, `legend`, `centerValue`, `centerLabel` and `format`, which accepts the name of a house formatter (`currencyShort`, `percent`) or a function, as on the web. One type change: the center is `string`, not `ReactNode`.

**What really changes is how a slice is read.** On the web the pointer rests on the ring and the tooltip, opened outside the hole, says name and value, with the total fixed in the middle. On touch there is no resting, and the equivalent gesture lives in the **legend**, not in the slice: tapping a row lights its slice, and the row itself already says name and value. The written center (`centerValue` and `centerLabel`) is always visible, the same decision as the web; only when there is no center does the empty middle show the slice being read. Tapping again clears the reading.

Each row's number is what arrived, negative included: only the arc uses the zero floor, because a slice has no negative size. The background ring is always drawn, in the border token, and with no slice at all the drawing announces nothing to the screen reader. With `empty` (`{ title, description, action?, icon? }`, the `ChartContainer` format), an empty list or a zero sum shows the empty state in place of the donut.

The slice is not the target, and the reason is arithmetic: a 190px ring has about 600px of circumference to split among up to six slices, and a 2% slice gets twelve (the same math that removed the per-square tooltip from the `Tracker`). The legend row is 44px tall and as wide as the screen.

**And screen reading does not use the `Tracker` trick.** There the 90 periods became a single `adjustable` stop, because 90 stops inside a card are an obstacle. Here there are at most six slices (beyond that the donut stops informing and a horizontal bar reads better), and six stops with name and value are better than one adjustable, because each one is also the button that lights the slice. Different count, different answer. With `legend={false}` the drawing becomes an image whose name carries the slices **and the values**: without a legend and without a tooltip, the data would be unreachable.

One drawing difference, and it is measured: the slice ends are **square**. The web's `cornerRadius` comes from Recharts, which trims the corner of a filled slice; here the slice is a stroked arc, and the round cap SVG offers extends the stroke by almost twelve degrees on each side at the default thickness: a 5% slice would look like 11%.

The motion is the web's: the donut is born complete and, when the data changes, each slice moves from the old angle to the new one with the duration and curve of the tokens, through Reanimated. With "reduce motion", the change is instant.
