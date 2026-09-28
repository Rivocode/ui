---
category: Forms
---

# Tree

The tree on its own, with no field or panel. It serves a folder browser and a
full-screen choice.

A parent with some of its children checked is in the mixed state. Checking the
parent checks only the enabled children, and unchecking does not touch the
disabled ones either. The search keeps the path to whatever matched, otherwise
the result shows up loose and nobody knows where it came from, and it ignores
accents and case: `sao` finds São Paulo.

The keyboard arrows move through the rows on the screen, not through the whole
tree: navigation follows what the eye sees. `Home` and `End` go to the first
and the last row, and `Tab` returns to the last row that had focus. A disabled
row cannot be chosen, neither by click nor by Enter or Space.

## The choice

`value` and `onValueChange`, the same pair as `TreeSelect` (which is this piece
inside a panel) and the same vocabulary as the rest of the catalog. Both are
optional: with neither, the tree keeps its own choice, and `defaultValue` says
what it starts with.

They used to be required, and under another name: swapping the panel for the
inline tree rewrote the whole binding, and a tree that only wanted to open and
close still paid a `useState` to exist.

## Writing direction

In `dir="rtl"` the whole tree flips. Each level's indent grows from the edge
where reading begins, the branch arrow points to the side it opens, and `→` and
`←` swap roles: `←` opens the branch and enters it, `→` closes it and goes up to
the parent. It is what the WAI-ARIA treeview pattern asks for, and the reason
is the drawing: the key that opens is the one that points to where the
indentation grows.

The direction comes from `RivoProvider`, not from a `dir` written by hand on an
element above the piece. And the indent is `padding-inline-start`, not
`padding-left`: with the physical property the three levels stopped at the same
point in `rtl`, the hierarchy vanished from the screen and a flat list was left.
Swapping only the key would have fixed the keyboard for a drawing that was still
wrong.

## In React Native

Translates, and the rule survives whole: **the leaf is what counts**. Checking a branch checks all the leaves under it, and what comes out in `onValueChange` is always a list of leaves.

**The drawing is what does not port.** On the web the open levels appear at the same time, one indent per level; at 390px the third level starts past the middle of the screen and the node's name fits in four letters. The piece becomes illegible precisely where it is most useful. Here it is **one level at a time**: tapping a branch pushes the inner level, and the header shows the path ("Financeiro › Contas a pagar", truncated from the front, because the part that matters is the last one) and goes back one level.

Two consequences of stacking. **A branch has two targets**: tapping the name enters, and the box beside it checks the whole branch: with a single target there was no way to check "Financeiro" without visiting the seven leaves inside. And **the branch box uses the mixed state**, as on the web: with some of the leaves checked, it draws the dash and announces `mixed`, and tapping it checks the whole branch. The exact count does not appear on screen, as on the web; it goes in the branch's spoken name ("Financeiro, 7 itens, 2 escolhidos"), because that is how you enter it.

Out, by decision: `filter` (searching inside a tree flattens the levels, and a flattened list with search is already `Combobox`), `open`/`onOpenChange` (there is no open and closed, there is the level where the finger is) and the node's `label`, which here is `string`. It is built into the spoken label and the path, and there is no way to read the text back from a `ReactNode`.
