---
category: Navigation
---

# MenuRadioGroup

The single-choice group inside the menu, and what holds the chosen value.

It is the "Sort by" of a listing: one order at a time. The value lives here,
and not on each item: `defaultValue` to leave it with the piece, `value` plus
`onValueChange` to leave it with the screen.

The title comes in `label`, for the same reason as in `MenuGroup`: Base UI
wires the group's `aria-labelledby` to the title that lives inside it, and a
title written outside names no group at all (a failure that breaks no type,
only the announcement).

```tsx
<MenuRadioGroup defaultValue="emissao" label="Ordenar por">
  <MenuRadioItem value="emissao" closeOnClick>Data de emissão</MenuRadioItem>
  <MenuRadioItem value="valor" closeOnClick>Valor</MenuRadioItem>
</MenuRadioGroup>
```

## Parts

`classNames` reaches the `label`, the same title that `MenuGroup` writes.

## When not to use

For options that add up (which columns to show, which statuses to include in
the filter), use `MenuCheckboxItem`: there each row is independent, here one
row clears the previous one.

If the options fit on the screen and comparing them matters, the menu hides
what should be in view: `RadioGroup` shows them all at once, and
`ToggleGroup` handles the two or three that become buttons. The menu is for
when the choice does not deserve to take up permanent space on the bar.
