---
category: Structure
---

# TableRow

A table row.

`selected` draws an accent bar on the side, with a faint background. It is the
bar that says "this row", and a strong background smears the reading of the
whole row.

Color alone is not state, so the first cell of the chosen row opens with a
`<span>` only the screen reader hears: "Selecionada". It is always the first
cell, so whoever is listening knows where the notice appears.
`labels.selected` changes the text when the screen is in another language.

There is no `aria-selected` here. It is only valid inside `grid` or
`treegrid`, and in a plain `<table>` the browser discards the attribute:
measured in the accessibility tree, the row exposed zero properties. Adopting
`role="grid"` would bring the obligation to navigate with arrows between cells,
which the piece does not implement, and would trade one defect for a bigger
one.
