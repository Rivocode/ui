---
category: Overlays
---

# Popover

An anchored panel of free-form content. The piece between the `Tooltip`, which
only shows short text, and the `Dialog`, which takes over the whole screen.

Composes with `PopoverTrigger`, `PopoverContent`, `PopoverTitle`,
`PopoverDescription` and `PopoverClose`.

`side`, `align` and `sideOffset` live on `PopoverContent`: whoever writes the
screen thinks about them together with the content.

## In React Native

Does not port. A panel anchored to the trigger is a narrow-screen problem before it is a touch problem: it is born under the finger that opened it and has nowhere to escape. In React Native the equivalent is `Sheet`, which rises from the bottom and does not compete for space with anything.
