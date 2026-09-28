---
category: Charts
---

# Sparkline

The tiny line that fits inside a number.

```tsx
<Sparkline data={[12, 15, 14, 19, 22, 28]} className="h-8 w-24" />
```

No axis, no grid, no tooltip. It does not answer "how much was it in May", but
"is this going up or down". An indicator alone is a number without a story, and
opening a whole chart next to each indicator fills the dashboard with frames.

## Color

By default it comes out in the theme's accent, which is the neutral reading of
"this is a number on this screen".

`trend="auto"` paints green or red depending on whether it goes up or down from
the first point to the last. **Use it only when going up is good.** In cost,
delinquency or overdue invoices, going up is bad, and the piece has no way of
knowing that: invert the numbers before passing them, or fix the color through
the `color` prop. With fewer than two points there is no trend, and it comes out
in the neutral accent color.

The prop is not called `tone` on purpose: that is the name the whole catalog
uses for the semantic color scale, `success`, `danger`, `warning`, `info`, in
`Badge`, `Alert`, `Tracker` and `Timeline`. Here the word would mean something
else, with other values.

## It fades in, and that is all

The Sparkline enters, but briefly and quietly: the drawing fades in over
`--rc-duration-base` (200 ms) when it appears, and it neither draws itself
stroke by stroke nor moves when the data changes. It lives in table rows and in
rows of indicators, and in those places it shows up by the dozen: twenty lines
drawing themselves left to right at the same time are a wave crossing the
table, and twenty lines changing shape on a filter are noise, not the change.
The fade says only "arrived", which is what the thumbnail needs to say. And it
costs one CSS animation per thumbnail, instead of one JavaScript interpolation
per frame, which across fifty rows is felt in scrolling.

The animation lives on the SVG surface itself, not on the box around it:
Recharts only paints after measuring, and a box coming from the server would
already have faded in before the stroke existed. With "reduce motion", it
appears still. `ChartContainer`, the donut and the gauge draw themselves and
move to the new value because each one is the subject of its card; the
thumbnail is a detail of the number next to it.

## Accessibility

It comes out hidden from the screen reader on purpose: a trend drawing with no
number has nothing to read out loud, and the number next to it has already been
read.

Pass `label` when it is the only information there, and it becomes `role="img"`
with the text you write.

`variant="bar"` counts occurrences per period (issues per day, tickets per
week) instead of a continuous trend. It is the only variant that crosses over to
`@rivocode/ui-native`: the area needs a filled polygon, which does not come out
without SVG.

## In React Native

Translates: `@rivocode/ui-native` exports `Sparkline`, and it is what the native `Stat`'s `chart` slot was waiting for. It is drawn with `View`, without SVG, and that decides what crosses over: `variant="line"` and `variant="bar"` mean the same thing in both worlds, and **`area` does not port**: an area wants a filled polygon, which `View` does not do. Two other differences, both deliberate: the stroke draws 2px instead of 1.5 (at 1.5 it disappears on a phone screen in daylight) and the width comes from the parent, with the height in `height`. **Without `label` it is hidden from the screen reader on purpose**: a line without a description says nothing to whoever cannot see it, and announcing "image" would be worse than staying silent. And it enters **only by fading in**, as on the web, at `duration-base`: it does not draw itself or move when the data changes, and with "reduce motion" it appears still.
