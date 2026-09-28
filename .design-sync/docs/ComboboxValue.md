---
category: Forms
---

# ComboboxValue

What is selected, so the chips know what to draw.

It renders no element at all: it takes a function and returns whatever that
function builds. It is the piece that was missing for `ComboboxChips` to be of
any use. Without it, multiple selection with chips was only possible by
importing straight from Base UI.
