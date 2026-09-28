---
category: Data
---

# RelativeTime

"há 2 minutos", "em 3 dias".

No outside library delivers this, because it is not a code problem. It is a
language and product decision: where to cut between "agora" and "há 1 minuto",
when to stop counting and show the date, how the plural is written. Leaving it
to the screen means each screen deciding differently, and logs, queues and
notifications are exactly where the same instant appears on three screens at
once.

It comes out in a real `<time>`, with the exact instant in `datetime` and the
spelled-out date in `title`: the relative text is a summary, and a summary
loses information that is sometimes the information that matters.

The text redraws itself at a pace that follows the unit: every thirty seconds
while it counts minutes, every hour once it counts days. A second-by-second
clock for each row of a thousand-row table is the easiest way to kill
scrolling. Passing `now`, the text stops updating: whoever pinned "now" does
not want a clock.

`cutoff` decides when the relative text stops helping. "há 412 dias" says
nothing; the date does.

An invalid date (`new Date("ontem")`, `NaN`) comes out as "—", with no
`datetime`, no `title` and no clock. The table row with the broken date stays
standing, and does not bring down the whole screen with the `RangeError` from
`toISOString`.

## When not to use

When the exact date is the data: due date, accounting period, issue date.
There the relative text hides the information the person came for; use
`formatDate`.

## In React Native

Translates clock and all: receiving ready-made text would have been cheaper to write and would have handed the problem back to the screen, which is where it came from. The step follows the unit, as on the web: thirty seconds while counting minutes, one hour once counting days, and never one second. Hours advance every five minutes, not every one: the difference between "há 1 hora" and "há 2 horas" is not worth one timer per minute times the mounted rows. Two things are native-only. The text redoes itself when returning from the background, because while the app sleeps the JS timer does not run and the screen would reopen saying "há 2 minutos" three hours later. And the text is always numeric: `Intl.RelativeTimeFormat` does not exist in Hermes, the plural is written by hand, and where the web says "ontem" native says "há 1 dia". `cutoff` and `now` are the same, and the date it shows comes in the format of `formatDate`. What does not cross over is the exact instant: on the web it lives in the `title` of the `<time>`, and on touch there is no `title` and nowhere to rest the pointer. When the exact date matters, it needs to be written on the screen.
