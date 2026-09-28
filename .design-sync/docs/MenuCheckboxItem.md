---
category: Navigation
---

# MenuCheckboxItem

A menu item that toggles an option on and off, without closing the menu.

It is the "Columns" menu of a listing: which columns of the invoice table show
up. Each item holds its own state with `defaultChecked`, or responds to
`checked` and `onCheckedChange` when the screen is in charge.

Checking does **not close** the menu (`closeOnClick` starts as `false`, as in
Base UI), because whoever picks columns picks several at once.

```tsx
<MenuContent>
  <MenuGroup label="Mostrar na listagem">
    <MenuCheckboxItem defaultChecked disabled>Número</MenuCheckboxItem>
    <MenuCheckboxItem defaultChecked>Cliente</MenuCheckboxItem>
    <MenuCheckboxItem>Valor</MenuCheckboxItem>
  </MenuGroup>
</MenuContent>
```

## Parts

`classNames` reaches the `indicator`, which is the checkmark column. It exists
even on an unchecked item, on purpose: Base UI's indicator only mounts when the
item is on, and without a fixed column the text of every row shifted sideways
on each click. The width is the same as `SelectItem` and `ComboboxItem`, so the
three lists align their text in the same column.

## When not to use

For a choice between mutually exclusive alternatives (sort by date **or** by
amount), use `MenuRadioItem` inside a `MenuRadioGroup`: the dot says that
choosing this one unchooses the one above, which the checkmark does not say.

And do not swap it for a loose `Checkbox` inside a `Popover`, which was the
path left before this piece. It costs the two things only the menu gives: the
menu item `aria-checked`, which is how the screen reader announces the row, and
the navigation by arrow and by first letter that the menu list already brings.
A `Popover` is a panel with arbitrary content; nobody moves through it with the
keyboard the way they move through a menu.

When the options are many and call for search, the menu is not the place: the
list with a text field is `Combobox` with `multiple`.
