---
category: Navigation
---

# MenuSubmenu

A branch of the menu, which opens beside it.

It paints no element: it is only state. Inside it go the `MenuSubmenuTrigger`,
which is the item that opens the branch, and a `MenuContent`, which is the same
panel as the menu above.

The side does not need to be asked for. Base UI opens the branch at
`inline-end` when the parent is a menu, and flips to the other side on its own
when it does not fit. Passing `side` here is for whoever has a reason, not an
obligation.

```tsx
<MenuContent>
  <MenuItem>Duplicar</MenuItem>
  <MenuSubmenu>
    <MenuSubmenuTrigger>Exportar</MenuSubmenuTrigger>
    <MenuContent>
      <MenuItem>XML da NF-e</MenuItem>
      <MenuItem>PDF do DANFE</MenuItem>
    </MenuContent>
  </MenuSubmenu>
</MenuContent>
```

`MenuSubmenuTrigger` brings the arrow that says there is more ahead, and
`classNames` reaches it by the name `indicator`. The item stays highlighted
while the branch is open: without that the highlight goes away as soon as the
pointer enters the child panel, and nothing else ties one to the other.

## When not to use

One level solves almost everything. Two is already a tree, and a tree under
the mouse is like walking diagonally without losing the line: whoever slips
closes the whole branch and starts over. Beyond that, a `Dialog` or a screen of
its own costs the user less.

For the menu that opens on right-click over an area, the trigger is different:
`ContextMenu`. And for the site's main navigation, with wide panels and links,
it is `NavigationMenu`: the submenu here is a list of actions, not a map of
sections.
