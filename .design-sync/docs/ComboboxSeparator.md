---
category: Forms
---

# ComboboxSeparator

The line between two `ComboboxGroup` in the list.

It is the sibling of `SelectSeparator`, and closes the parity with
`MenuSeparator`: the library's three lists divide the same way. As in `Select`,
it renders with `role="presentation"`: a node with a role of its own among the
options would break the "option 3 of 12" that the screen reader announces.

## When not to use

While search is the main path, the line decorates and does not orient: whoever
types three letters never sees the divider, because the filtered list drops it.
It serves a list at rest, open and short enough to be read at once, and even
then only between groups that have a name.
