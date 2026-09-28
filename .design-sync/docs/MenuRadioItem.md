---
category: Navigation
---

# MenuRadioItem

A single-choice option in the menu: "by issue date", "by amount".

Always inside a `MenuRadioGroup`, which is what holds the value. `value` is
required: it is what the group compares to know which row is chosen.

The dot in place of the checkmark is not decoration: it says that choosing
this one unchooses the one above.

As in Base UI, choosing does **not** close the menu. When the choice settles
the matter, and sorting usually does, pass `closeOnClick`.

## Parts

`classNames` reaches the `indicator`, the column that holds the dot (the same
width as `MenuCheckboxItem`, so both align their text when they show up in the
same panel).

## When not to use

To toggle each option on and off on its own, use `MenuCheckboxItem`.

For an action that happens and is done (downloading the PDF, cancelling the
invoice), use `MenuItem`: `aria-checked` on an item that holds no state at all
tells the screen reader there is a checked choice where there is none.
