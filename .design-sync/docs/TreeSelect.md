---
category: Forms
---

# TreeSelect

A choice inside a tree: department and team, category and subcategory, account
and cost center.

**What counts is the leaf.** The value comes out as a list of leaf ids; checking
a parent checks all the leaves under it. Storing the parent too would create
two ways of saying the same thing.

The trigger summarizes instead of listing: up to three names they show, past
that comes the number. A name cut in the middle says less than "7 escolhidos".

`value`, `defaultValue` and `onValueChange` are the same as `Tree`'s: swapping
the panel for the inline tree, or the other way around, means changing the
piece's name and nothing else.

## The click checks, the arrow opens

The panel opens with all branches **closed**, and clicking a branch's name does
not open it: it checks all the leaves under it at once. Whoever builds the
screen clicks "Financeiro" expecting to see the children, reads "Contas a
pagar, Contas a receber" in the trigger and concludes the piece is broken. It
is not: in the WAI-ARIA `treeview` pattern the whole row is the target of the
**choice**, and opening and closing is a separate role - without that split
there would be no way to check a branch without first visiting the leaves
inside it.

Opening has three paths, and none of them is the name: the little arrow to its
left, the `→` key with the row in focus, or the search - while there is text in
the field the tree stays fully open, and then the open and close arrows have
nothing to do. Once inside it, `↑` and `↓` move through the visible rows, `←`
closes the branch or goes up to the parent, and `space` checks. In `dir="rtl"`
the two horizontal arrows swap roles, for the reason given on the `Tree` page.

The tree is **a single tab stop**: `Tab` goes through the search and stops on
the row that last had focus, the first one when none did, and from there on it
is the arrows, with `Home` and `End` at the ends. It is not `Tab` that walks
the rows.

## In React Native

Translates: it is the native `Tree` inside the bottom sheet, with the same level navigation. And that is why it solves what the two chained `Select`s, which this page used to tell you to use, never solved: the depth is not fixed, and the second `Select` only knew how to exist after someone chose in the first.

**The footer is the half the web does not need to have.** On desktop the panel sits next to the trigger, and the trigger counts how many there were; under a sheet there is no trigger in sight, so the count lives in the footer, next to `Aplicar`, and it counts the **draft**, which is the only number that answers "how many have I checked?" while the person is still checking. The text comes from the same summary as `Select` and `Combobox`, on purpose.

**Leaving through the side gives up**, and `Aplicar` is the only door that confirms, the same split as `DateRangePicker`: a tap on the dimmed background is the gesture of someone who changed their mind, and it cannot count as applying. No `searchable`, for the reason on the `Tree` page.
