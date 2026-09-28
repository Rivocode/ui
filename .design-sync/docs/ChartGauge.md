---
category: Charts
---

# ChartGauge

A gauge from 0 to `max` with bands that say whether the number is good: on
track, attention, critical. The value is written in the middle, and the band's
name below it.

```tsx
<ChartGauge
  value={8.4}
  max={20}
  centerValue="8,4%"
  bands={[
    { until: 5, tone: 'success', label: 'Em dia' },
    { until: 12, tone: 'warning', label: 'Atenção' },
    { until: 20, tone: 'danger', label: 'Crítico' },
  ]}
/>
```

Each band goes from where the previous one stopped up to its `until`, and the
limit is inclusive: at `5`, it is still on track. The thin outer ring draws the
bands, the thick inner arc goes from zero to the value in the color of the band
it fell in, and a needle marks the exact spot on the ring. Without `bands`, the
gauge is a neutral accent arc, with no needle.

## Out of scale

The written number is always the real one. With `value={140}` and `max={100}`,
the middle says "140" and the screen reader hears "140 de 100, Crítico": only
the arc, the needle and the band stop at the end, because the drawing has
nowhere to go, but the person needs to know by how much it went over. Below
zero the same applies, at the other end. A `NaN` or an infinity is no number at
all: the middle shows "—", with no band, no needle and no painted arc.

With `centerValue`, the accessible name says the same text that is on the
screen ("R$ 1.234.567,89 de 2.000.000"), not the raw number. The middle text
has the width of the arc's hole, and the font shrinks until it fits: a long
value gets smaller, and never covers the arc or leaves the card.

`sweep` goes from 0 to 360, and 360 closes the ring.

## Color is never alone

The band's name is written below the number (replace it with `centerLabel` if
you want another phrase), and it is what the screen reader hears along with the
value: "8,4 de 20, Atenção". The whole band scale goes in the description, for
whoever wants to know where critical starts without seeing the ring.

The bands paint the `success-text`, `warning-text` and `danger-text` roles, not
`success`, `warning` and `danger`. The difference is measured: the arc is drawn
over the track, and the dark theme's `danger` over the track gave 2.99:1, below
the 3:1 the standard asks for an object that has to be perceived. The critical
band, of all of them, was the only one that disappeared.

## Versus Meter and ChartRadial

All three show a single measure, and the choice is by the question:

- **`Meter`** is a bar that fits in a form or table row, and does not judge the
  number: it says how much, and the reader decides whether it is a lot.
- **`ChartRadial`** is the arc of a measure that has a **target**: how much is
  left to get there. It has no bands, and going up is always better.
- **`ChartGauge`** is the gauge that **judges**: the number falls in a named
  band, and the band can say going up is worse (default rate, quota usage,
  response time). It is the only one of the three where the same color can be
  good on one card and bad on the next, because the band decides, not the
  direction.

## Motion

The first time it appears, the arc and the needle go from zero to the value, in
`--rc-duration-slow` with the `--rc-ease` curve; when the value changes, they
move from the old to the new. With "reduce motion", they are born in place.

## When not to use

Without a band that says good or bad, it is `ChartRadial`, which takes the same
card and does not fake a judgment nobody made. In a form row, it is `Meter`.
And to show how the number moved over the month, none of the three: it is
`Sparkline` or `LineChart`, because the gauge only knows the now.

## In React Native

Translates, in `@rivocode/ui-native/chart`, with the same props: `value`, `max`, `bands`, `sweep`, `centerValue`, `centerLabel`, `label`, `format`. The bands are the same, with `tone` `success`, `warning` or `danger`, and they paint the same `-text` roles as the web: the measurement of the arc over the track is the same on both sides, and it is in the native contrast map.

One type change, the donut's and the arc's: `centerValue` and `centerLabel` are `string`. And one reading change: on the web the band scale goes in a separate description, linked by `aria-describedby`; the phone has no such channel, so it goes at the end of the accessible name ("72 de 100, Atenção. Bom de 0 a 60; Atenção de 60 a 85; Crítico de 85 a 100"). The role is `image`, for the same reason as `ChartRadial`.

The arc and the needle move together to the new value, through Reanimated, and are born in place with "reduce motion".

The parts are styled through the same `classNames` as the web: `value` and `label`, the two texts in the middle. `arc` does not port as a part: the arc is drawn in the `Svg`, and `react-native-svg` does not take classes.
