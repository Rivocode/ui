---
category: Forms
---

# ComboboxChips

The frame for the chips of a multiple selection, with the search field inside it.

The field goes in as the last child, not beside it: to the person using it, the
chips and the typing are the same field, and separating the two makes the
search look like a filter for something else.

Inside it, the `clearable` of `ComboboxInput` steps aside: each chip already
has its own x, and a clear-all button right next to them is the wrong button in
the easiest place to hit by accident.
