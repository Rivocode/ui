---
category: Feedback
---

# Meter

A measure of how much of a capacity is in use: space, quota, limit.

```tsx
<Meter value={72} max={100} label="Espaco de arquivos" showValue />
```

`showValue` shows the value next to the label, and `format` says how it is
written: the name of a house formatter (`percent`, `currencyShort`, `compact`)
or a function of yours. It receives the value clamped to `min` and `max`, the
same one the bar draws. Without a visible label, pass `aria-label`.

## Motion

The bar fills from zero on mount (`animate-fill`, `--rc-duration-slow`), the same as `Progress`, and then moves along its width when the value changes. With "reduce motion", it starts at the value.

## When not to use

For a task that advances and ends (sending a file, generating a report), use
`Progress`. **It looks like the same bar and it is not.** Progress walks toward
an end; a meter stays put showing a state that can go up and down.

Swapping one for the other makes the screen reader announce "loading" for
something that is not loading, and the listener keeps waiting for the end of an
operation that does not exist.

## In React Native

Ported. The value text comes from `format`, with the same formatter names as the web (`percent`, `currencyShort`, `integer`...) or a function, and applies on screen and in the announcement. Native-only is `valueLabel`, for a measure that already arrives written, and it wins over `format` when both come. The accessibility role changes, and for a reason: React Native has no equivalent of `meter`, so the piece announces itself as text with a value, and never as `progressbar`, which is precisely the mistake it exists to avoid.

The parts are styled through the same `classNames` as the web: `label`, `value`, `track` and `indicator`.
