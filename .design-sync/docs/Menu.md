---
category: Navigation
---

# Menu

An action menu, the typical three dots on a table row.

Composes with `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuGroup` and
`MenuSeparator`. The group title is the `label` prop of `MenuGroup`, not a
separate piece.

The menu also chooses, not just acts: `MenuCheckboxItem` toggles an option on
and off without closing the panel (the "which columns to show" of a listing),
and `MenuRadioGroup` with `MenuRadioItem` makes a single choice, the "sort
by". Both bring the menu item `aria-checked` and navigation by arrow and by
first letter, which a `Popover` with a `Checkbox` inside does not have.

When a branch deserves its own panel, `MenuSubmenu` with `MenuSubmenuTrigger`
opens beside it. And the item that navigates is `MenuLinkItem`, which renders
as a real `<a>`.

`tone="danger"` on the item that deletes. It renders in a portal, so it
requires the `RivoProvider`.

## In React Native

Translates: `@rivocode/ui-native` exports `Menu` - bottom sheet with `actions`, never an anchored popup; `children` opens on long press; `classNames` with `trigger`, `content` and `item`. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
