---
category: Data
---

# Tracker

The strip of little squares per period: the last 90 issues, the month's uptime,
the queue over the last few days.

It answers a question the number alone does not ("was it always like this, or
did it get worse yesterday?") and that is why it fits inside a `Stat`, below
the value.

Each square carries its own text. A color strip without text does not exist for
screen reader users, and "green, green, red" says nothing to sighted people
either: what matters is which day was the red one.

There is a single tooltip. The whole strip is the target: the pointer runs
along it, a thin mark follows the period being read and a single floating panel
moves along. Before, each square mounted its own tooltip, and a year of issues
mounted 365 of them so that at most one would appear.

The keyboard reaches the same period. The strip is one tab stop (just one, not
one per square): on receiving focus it opens on the most recent period, the
arrows walk through the periods, `Home` and `End` go to the ends and `Esc`
closes the panel without moving focus away. The period read by the keyboard is
also spoken in a live region, because drawing does not reach whoever is
listening; the pointer stays quiet there, so as not to fill the screen reader's
queue with every square swept.

## The name is said once

The `label` text comes out in a `<p>` that the `label` slice can show, and the
group takes it through `aria-labelledby` instead of repeating it in an
`aria-label`. Before, there were two identical sentences in a row in the
accessibility tree: the hidden paragraph and the group's name, one after the
other. The `<p>` is `aria-hidden`, because what carries the sentence to whoever
listens is the group's name; removing it from reading takes nothing from
anyone, and it is what makes the sentence be said once instead of twice.

Keeping the `<p>` instead of deleting it is what preserves both intentions: the
`label` slice exists for whoever wants the text on the screen, and the group's
name still comes from the same place that person sees.

An `aria-label` written by the caller beats `label` and lands on the same
group. Before, it stopped at the outer `div`, with no role, which Chrome keeps
as a named `generic` node and no screen reader exposes.

## Writing direction

In `dir="rtl"` the strip flips along. The most recent period becomes the one on
the left, the pointer reads from the edge where reading begins and the arrows
move toward the side the person sees: `←` moves forward in time, `→` goes back.
`Home` and `End` stay logical: the first and the last period, not left and
right.

The direction comes from `RivoProvider`, not from a `dir` written by hand on an
element above the strip. It is the same `dir` the rest of the catalog reads,
and without it the strip would mirror the drawing without mirroring the math:
a finger on the first column would read the last period.

## The bubble moves one frame behind

While the finger sweeps the strip, the thin mark changes period in the same
frame as the event and the bubble arrives in the next frame. Base UI follows a
moving anchor through `IntersectionObserver`, which only reports at the end of
the frame. There is no way to make it arrive together without giving the
tooltip a positioner of its own.

The delay is exactly one frame, and it does not grow: the distance between the
mark and the bubble is the one the pointer travels in that frame (at 800px/s,
about 13px at 60Hz) and in the frame where the finger stops the two coincide
again. Since the tooltip is only read with the pointer still, this is declared
as a limit and not as a defect to fix.

## Motion

The strip appears from left to right on mount, by clipping (`animate-reveal`, `--rc-duration-slow`): it is a timeline, and it reveals itself in its own direction. With "reduce motion", it appears whole.

## When not to use

When the quantity is continuous and the shape of the curve matters, use
`Sparkline`: the tracker counts discrete occurrences, one per period, and does
not draw a trend.

## In React Native

Translates, and both sides arrived at the same design: **the whole strip is a single target**. Native got there first out of necessity, and the web followed it. There, each point mounted a `Tooltip`, and a tooltip is a portal: 365 days were 365 portals mounted so that at most one would appear. Here not even that way out existed, because a tooltip opens on resting the pointer, and swapping each square for a `Pressable` would not solve it either: 90 periods in 358px give 4px per square, six times less than the minimum touch target.

**What does not cross over is the bubble.** On the web the reading comes out in a single `Tooltip` that follows pointer and keyboard; here it lives in a fixed line below the strip. The finger rests and drags, a thin mark follows, and the period being read appears on that line, which exists from the first frame, showing the most recent period: the space stays reserved, the screen does not jump on the first tap, and the most recent is what the question "did it get worse yesterday?" wants to read first.

Screen reading changes shape too. The hidden list with the 365 texts, which on the web is cheap, here would be 365 VoiceOver stops inside a card; the strip is a single stop, of the adjustable kind (the same contract as the `Slider`), and each step announces the text of one period. No data is unreachable and none becomes an obstacle. That is why each point's `label` is `string`, not `ReactNode`: it goes whole into the strip's accessible value, and there is no way to read the text back from a `ReactNode`.

The parts are styled through the same `classNames` as the web: `track`, the strip that receives the drag, and `cell`. `label` does not port as a part: on the web it is hidden text, and here the name goes only into the strip's `accessibilityLabel`, with no node to style.
