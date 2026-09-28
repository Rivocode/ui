---
category: Structure
---

# Stat

The dashboard number: label, value, change and trend, in the hierarchy every
dashboard reinvents by hand.

The value arrives formatted because formatting is a domain decision: money
comes out abbreviated from `currencyShort`, a count comes out raw, a percentage
carries its sign.

`delta` is the change, with `deltaLabel` saying against what ("sobre julho").
`delta={0}` comes out neutral: no arrow, in the secondary text color, and no
"alta de" for the screen reader, because not changing is not going up.
When going up is bad (overdue, cost, delinquency), pass `invert`: the arrow
still points where the number went; what inverts is the color's judgment. The
direction is also spoken for the screen reader, not only painted.

The trend comes in through the `chart` slot, with the `Sparkline` from
`@rivocode/ui/chart`:

```tsx
<Stat
  label="Faturado em agosto"
  value={currencyShort(246_700)}
  delta={20}
  deltaLabel="sobre julho"
  chart={<Sparkline data={TREND} variant="area" trend="auto" className="h-8 w-full" />}
/>
```

The core does not import `Sparkline` on purpose: it brings Recharts along, and
a dashboard without a chart should not pay for it.

## The change is not always a percentage

The `%` used to be hard-coded in the JSX, and `Stat` was the only number piece
in the house outside the formatting vocabulary that `Progress`, `Meter` and
`Slider` already speak. A delta in reais or in basis points came out with a
percent sign that was not true.

`deltaFormat` is the same `format` as its siblings, the name of a house
formatter or a function of your own:

```tsx
<Stat label="Faturado" value={currencyShort(246_700)} delta={12_400}
      deltaFormat="currencyShort" deltaLabel="sobre julho" />
```

Without it, `percent`, which is what always came out. The house `percent`
rounds to an integer; for a decimal place, pass the function:
`deltaFormat={(value) => percent(value, 1)}`.

What reaches the formatter is the **absolute value** of `delta`: the sign is
carried by the arrow, and by the "alta de"/"queda de" the screen reader hears
before the number.

## Motion

The card's content fades in on mount (`animate-appear`, `--rc-duration-base`), and the frame stays still: the number arrives, the card was already there. The digits do not count up from zero, on purpose: a number racing to its value is unreadable while it races, and it is what the person came to read.

## In React Native

Translates: `@rivocode/ui-native` exports `Stat` - `value` already formatted, a numeric `delta` written by the web's `deltaFormat`, and the `chart` slot that the native `Sparkline` fills. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
