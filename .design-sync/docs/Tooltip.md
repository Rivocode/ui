---
category: Overlays
---

# Tooltip

A short hint, for a button that only has an icon.

It composes with `TooltipTrigger` and `TooltipContent`.

Do not keep essential information here: a tooltip does not appear on touch and
is not read in every context. The button's `aria-label` is still required.

For the most common case, a tooltip that repeats the name of an icon-only
button, use `IconButton` with `tooltip`: it builds the tooltip from the `label`
and does not tie it through `aria-describedby`, so the screen reader does not
hear the same sentence twice.

## In React Native

Does not port, and there is no substitute: the tooltip appears on resting the pointer, and on touch there is no resting. What on the web was an icon with a tooltip becomes, on the phone, an icon with a label written next to it, or an `accessibilityLabel`, which solves it for the screen reader and does not solve it for whoever can see.
