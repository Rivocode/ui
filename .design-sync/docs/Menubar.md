---
category: Navigation
---

# Menubar

The application menu bar: File, Edit, View.

It coordinates several `Menu` side by side: with one open, hovering over the
neighbor already switches, with no new click, and the arrows move between
them.

**On a web screen this is almost never the right thing.** A menu bar is
desktop-program vocabulary; in a dashboard, `Sidebar` and `Tabs` say more. It
exists for editors and tools, where the user already expects this
arrangement.

```tsx
<Menubar>
  <Menu>
    <MenuTrigger>Arquivo</MenuTrigger>
    <MenuContent>
      <MenuItem>Nova nota</MenuItem>
      <MenuItem>Abrir</MenuItem>
    </MenuContent>
  </Menu>
</Menubar>
```

## Parts

`MenubarTrigger` is the trigger of each menu in the bar: "Arquivo", "Editar",
"Exibir". It comes already dressed, including the focus ring. Inside the bar
it is the one to use, and not a `MenuTrigger` with a class by hand.

## In React Native

Does not port, by decision - a desktop idiom; native navigation is the router's tab bar and drawer. It is not queued: it will not exist. The [parity table](/react-native) gives the reason for each one.
