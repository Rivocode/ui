---
category: Navigation
---

# MenubarTrigger

The trigger of a menu inside the bar: "Arquivo", "Editar", "Exibir".

It comes already dressed: padding, corner, text color, the hover highlight,
the open state and the keyboard focus ring. Inside a `Menubar` it is the one
to use, and there is nothing left to write from outside.

```tsx
<Menubar aria-label="Principal">
  <Menu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenuContent>
      <MenuItem>Nova nota</MenuItem>
      <MenuItem>Abrir rascunho</MenuItem>
    </MenuContent>
  </Menu>

  <Menu>
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenuContent>
      <MenuItem>Desfazer</MenuItem>
    </MenuContent>
  </Menu>
</Menubar>
```

## Why it exists, when there is already `MenuTrigger`

`MenuTrigger` comes unstyled on purpose: its common use is
`render={<Button />}`, and two sources of style would fight. The bar was the
one paying for that. The published example repeated the same five classes on
each item, and every bar built from it repeated them again. And the copy came
without the focus ring, so the documentation's bar was the only piece in the
catalog that vanished from view when tabbed through.

Both still exist because they have different jobs: one is a menu trigger
anywhere, the other is an item of a bar.

## When not to use

Outside a `Menubar`, it is the bare `MenuTrigger`. A standalone menu (the three
dots on a table row, the actions button of a card) opens with
`render={<Button variant="ghost" />}`, and the bar-item skin there misaligns
the trigger with the other controls on the row and promises a bar that does
not exist.

If the doubt is between a menu bar and something else, it is about the whole
`Menubar`, and not about the trigger: on a web screen, `Sidebar` and `Tabs`
almost always say more.
