---
category: Forms
---

# SelectContent

The select's floating list.

It is born with the trigger's width and scrolls on its own when it does not fit
on the screen. The portal uses `RivoProvider`'s container, so the theme applies
inside it.

`side`, `align` and `sideOffset` position the panel, as in the other floating
pieces. **Asking for any of the three changes the positioning mode**: by
default the list overlaps the trigger to align the chosen item with its text,
and in that mode there is no side or offset to respect. Whoever asks for none
keeps the item alignment.

```tsx
<SelectContent side="top" align="start">
  <SelectItem value="abertas">Abertas</SelectItem>
</SelectContent>
```
