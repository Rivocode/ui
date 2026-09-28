---
category: Charts
---

# ChartRadial

The arc of a single measure: target hit, quota usage, conversion rate.

```tsx
<ChartRadial value={82} centerLabel="da meta do mês" />
```

The arc stops at the end when the value goes past `max`, but the text says the
real value: 140 of 100 renders "140%", not "100%". A value that is not a number
(`NaN`, infinity) or a zero or negative `max` renders "—", as in `ChartGauge`.

## Versus Meter

Choose by space, not by taste. The `Meter` bar fits in a form row and reads
faster. The arc asks for a whole card, and wins when the number **is the
subject** of the card, not a detail inside it.

## It is not Progress

Progress moves toward the end and finishes; this measure goes up and down as
the month runs. That is why it renders as `role="img"` with a label, and not as
a loading bar: swapping one for the other makes the screen reader announce
"loading" for something that does not load.

## Motion

The first time it appears, the arc sweeps from the start to the value; when
`value` changes, it moves from the old value to the new one. In both cases,
with the tokens' duration and curve (`--rc-duration-slow`, `--rc-ease`), by the
same decision as `ChartContainer`. With "reduce motion", the arc is born in
place and jumps.

In `segmented`, the lit ticks light up in sequence, from first to last, within
the same `--rc-duration-slow`. Each one lights up whole: it is a count, not a
continuous stroke, and a half-lit tick says nothing.

## The hidden axis

`sweep` is how much of the circle the arc takes. At `270`, the default, it
leaves the base open, and that is where the bottom label breathes. At `360` it
closes.

Inside there is a `PolarAngleAxis` with `domain={[0, max]}` that draws nothing.
It exists because Recharts normalizes by the series' largest value, and with a
single point that means **any value would go all the way around**.

## The center is small, and it does not grow with the card

The arc is a square bounded by the smaller side, and the component has a fixed
height of `11rem` (176px). In a card of 176px or more the inner gap locks at
**about 125px wide**: widening the card widens the chart, not the hole.

What fits there, measured in that gap: **about ten characters** in the big
number (`1,5rem`) and **about eighteen** in the bottom line (`0,75rem`) —
`da meta do mês` has fourteen and there is room to spare; `R$ 246,7K de R$
300K` has twenty and does not fit. Past the limit nothing gets cut or turns
into an ellipsis, because the ceiling the CSS imposes is a fraction of the
**card's width**, not the hole: in a wide card the phrase crosses the ring from
end to end, and in a narrow one it breaks into two lines and presses against
the open base. Both come out ugly, and neither one complains.

The hierarchy that works is the percentage as the big number and the
denominator as the bottom line, which is exactly what the percentage does not
carry:

```tsx
<ChartRadial value={246_700} max={300_000} centerLabel="de R$ 300K" />
```

When the phrase is longer than that, it leaves the center. The arc has no
outside legend to take text — the donut has one, and it is one of the reasons
to choose it —, so the place is the card around it: the title, or a supporting
line above the chart. For whoever listens, the whole phrase goes in `label`:
without it the accessible name is only the percentage, and "82 por cento" alone
does not say percent of what.

## The donut's legend

`ChartDonut` has a list below with each slice's name and value, on by default.
The arc does not: it shows a single measure, and the legend of one item is the
label itself.

With `variant="segmented"` the arc becomes ticks, which is the most requested
gauge variation on dashboards. The unlit ticks stay on screen on purpose:
without the whole scale visible, a lit tick means nothing.

## In React Native

Translates almost whole, in `@rivocode/ui-native/chart`, and it is the chart piece that changes least: **it never had a tooltip**. The value lives in the middle of the arc, as text, since the web. What the finger would do here, the eye has already done. `value`, `max`, `sweep`, `variant` and `segments` cross over unchanged, the dashed arc included.

Two type changes, the same as the donut: `centerValue` and `centerLabel` are `string`, and `color` is a token role (`chart-3`, `success`), not a CSS color.

The accessibility role is `image`, like the web's `role="img"`, and the two neighbors explain why: the native `Meter` had already refused `progressbar`, which makes the screen reader announce a progress indicator for a measure that goes up and down, and `adjustable`, which would promise that the gesture changes the value. The name carries the number, so hearing the piece is hearing the measure. Without `label`, it is built from what is written in the middle (the value **and** the line below), not just the percentage as on the web: "82 por cento" alone does not say percent of what.

The smooth arc moves to the new value as on the web, and is born in place; `segmented` lights the dashes all at once, also as on the web.
