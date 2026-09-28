---
category: Navigation
---

# MenuContent

The menu's floating panel, with portal, positioning and the side flip when it
does not fit.

It uses the same visual shell as `SelectContent` and `TooltipContent`: what
floats in this library looks alike on purpose. And it positions the same way:
`side`, `align` and `sideOffset` mean the same thing in all five, and open 6px
from the trigger when nobody asks for a different gap.

```tsx
<MenuContent side="top" align="end">
  <MenuItem>Baixar PDF</MenuItem>
</MenuContent>
```
