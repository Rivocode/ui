---
category: Forms
---

# SelectSeparator

The line between two groups of the list.

It comes out with `role="presentation"`, and not with `MenuSeparator`'s
`role="separator"`. The difference is not one of looks: inside a list of
options, a node with a role of its own enters the count the screen reader
announces ("opção 3 de 12"), and the count stops matching what is seen.

## When not to use

Without a `SelectGroup` around it, what does it separate? In a flat list the
line becomes a division with no criterion: whoever reads looks for the reason
for the cut and finds none. If the reason exists, it has a name, and the name
is a `SelectGroupLabel`.
