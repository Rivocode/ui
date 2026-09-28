---
category: Data
---

# Timeline

What happened to something, in order.

An invoice looks back (issued, authorized, sent, paid, canceled) with a
timestamp and an author at each point. An audit trail has the same shape: what
changed, when and by whom.

It comes out as an `<ol>` because the order is the data. A screen reader that
announces "list, 5 items" in the right order has already delivered half of what
the line draws.

The tone is per item, on purpose: on an invoice, the cancellation row is red
and the others are not, and that is the row the person looks for when they open
the trail. `pending` leaves the marker hollow: filling in the marker of a future
event makes the line promise it already happened, which is the mistake an audit
trail cannot make.

Since color and a hollow marker do not reach whoever is listening, the title
carries before it a text only for the screen reader: "Pendente", and one word
per tone ("Sucesso", "Atenção", "Erro", "Destaque"; `neutral` says nothing).
What each tone means belongs to the product, so `labels` changes the word:
`labels={{ tone: { danger: "Cancelada" } }}`, and an empty text silences it.

## Motion

Each `TimelineItem` fades in and rises 4px (`animate-enter`, `--rc-duration-base`), without staggering: on mount the whole trail enters at once, and afterwards only the new event enters. With "reduce motion", it appears still.

## When not to use

For a long form in steps, use `Steps`. `Steps` is a wizard: it looks forward,
knows how many steps are left and only lets you go back. `Timeline` looks back
and nobody "moves forward" on it. Swapping one for the other makes the control
promise what it does not do, the same argument that separates `Progress` from
`Meter`.

## Parts

`TimelineItem` is a point: `title`, `at`, `by`, `tone`, `pending`, and free
content as a child. `at` usually receives a `RelativeTime`.

## In React Native

Translates, with the list through `items`: each event carries `title`, `at`, `by`, `description`, `tone` and `pending`, and the `TimelineItem` composition does not cross over (the same rule as `RadioGroup` and `Select`). **The timestamp is text, not a `RelativeTime`**: each event is a single screen reader stop and its label is built from that text, so a live clock inside it would keep moving on screen while the label stayed stuck at the time it was built. And an audit trail cannot say two different times. For the timestamp, `formatDate`. **The order, which the web's `<ol>` delivers for free, is written out**: there is no list item role in React Native, so each event announces "3 de 5: Nota autorizada, 12/03 às 14:22, por Ana Duarte", one sentence with what changed, when and by whom, instead of three VoiceOver stops that do not say the subject. And nothing is tappable: a trail is read, and the 9px marker would never be a finger target. Whoever wants to open the detail of an event puts in an `Item` with `onPress`.
