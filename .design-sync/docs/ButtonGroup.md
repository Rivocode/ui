---
category: Actions
---

# ButtonGroup

Buttons that act on the same thing, pressed up against each other.

It is for sibling actions: "emitir" with the variants menu attached to its
side, or switching the view between list, rows and grid.

The fitting is done with a sibling selector, not by asking for a `className`
on each child. Any `Button`, link or menu trigger falls into the right place
without knowing it is in a group. The inner borders merge into one, otherwise
the division between two secondary buttons comes out twice as thick as the
outer ones.

`orientation="vertical"` stacks them, for a narrow sidebar.

## When not to use

It is not a choice group. If what you want is to mark one option among several,
`ToggleGroup` keeps state and says so in the aria; here they are actions, and
each click does something different.

Unrelated buttons do not go in either: pressed together, they promise a family
that does not exist. For those, a normal `gap`.

## In React Native

Does not port, by decision - `Tabs` and `ToggleGroup` cover the case; a button against a button becomes a single target for the finger. It is not queued: it will not exist. The [parity table](/react-native) gives the reason for each one.
