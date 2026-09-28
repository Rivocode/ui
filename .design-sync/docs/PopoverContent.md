---
category: Overlays
---

# PopoverContent

The panel, in a portal in the `RivoProvider` container.

`side`, `align` and `sideOffset` live here on purpose: whoever writes the
screen decides the side together with the content, and not on the root, far
from what goes inside. The panel flips on its own when it does not fit on the
requested side.

They are the same three props, with the same meaning and the same default gap
of 6px, on `MenuContent`, `SelectContent`, `ComboboxContent` and
`TooltipContent`: what floats in this library also positions the same way.
