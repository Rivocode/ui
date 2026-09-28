---
category: Feedback
---

# Badge

A status badge, always a pill, always short.

`tone`: `neutral`, `accent`, `success`, `warning`, `danger`, `info`. Pick the
tone by meaning, never by the color you want.

It is the only component that is a pill by default: a badge with square
corners looks like a label from an old system, and a pill button inside a form
looks like a toy.

## In React Native

Translates in the tones and the pill, and **without the web's `size`**. There, `sm` exists so the badge fits in a `DataTable` row, which is a desktop thing and shrinks with density; here there is no row that shrinks: the native `RivoProvider` already declares that `comfortable` is the only height, because a touch target does not get smaller, and a second size would make this the only piece in the package offering the compact mode the package decided not to have.

And the prop would cost more than it pays. To match the web it would have to be born at `md`, which would enlarge every badge already published; being born at today's size would make `size="md"` draw different things in the two packages, which is worse than not having the prop. The native badge is `text-xs`, fixed.
