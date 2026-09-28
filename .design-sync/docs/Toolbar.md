---
category: Actions
---

# Toolbar

A toolbar: the controls sit in a single tab stop, and the arrows move between
them.

That is what sets it apart from a `div` with buttons: **ten loose buttons are
ten Tab stops** between the previous field and the next. In a toolbar, it is
one.

```tsx
<Toolbar>
  <ToolbarButton render={<Toggle />}>Negrito</ToolbarButton>
  <ToolbarButton render={<Toggle />}>Italico</ToolbarButton>
  <ToolbarSeparator />
  <ToolbarButton render={<Button variant="ghost" />}>Limpar formato</ToolbarButton>
</Toolbar>
```

Use `ToolbarButton` with `render` to dress `Button`, `Toggle` or `Select`
without losing that navigation.

## Parts

`ToolbarGroup` gathers buttons that belong to the same subject (align left,
center, right), and `ToolbarSeparator` separates one group from the next. For
the screen reader, the group is what says the three options are a single
choice.

## In React Native

Does not port, by decision - a desktop editing surface: a single tab stop and arrow navigation, which touch does not have. It is not queued: it will not exist. The [parity table](/react-native) gives the reason for each one.
