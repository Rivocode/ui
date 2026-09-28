---
category: Overlays
---

# ContextMenu

The right-click menu.

The content is the same as `Menu`'s: use `MenuContent`, `MenuItem`, `MenuGroup`
and `MenuSeparator` inside it. Only the trigger changes, because here what
opens it is the whole area, not a button.

**Never let an action exist only here.** Keyboard users depend on the menu key,
which not every keyboard has, and a phone browser has no right button. It
speeds up what is already somewhere else, in the row's actions menu, for
example.

In React Native the same case exists, and the gesture changes: the `Menu` of
`@rivocode/ui-native` opens on a long press on the area you pass as
`children`. The section at the end of this page explains how.

```tsx
<ContextMenu>
  <ContextMenuTrigger className="rounded-md border border-dashed p-6">
    Clique com o botao direito
  </ContextMenuTrigger>
  <MenuContent>
    <MenuItem>Baixar PDF</MenuItem>
    <MenuItem>Duplicar</MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger">Cancelar nota</MenuItem>
  </MenuContent>
</ContextMenu>
```

## In React Native

Becomes `Menu`, not a new piece: the right-click menu is, on the phone, the long press, and what opens the action sheet is already `Menu`. Pass the target area as its `children` — what on the web is `ContextMenuTrigger` — and it calls `onOpenChange(true)` on long press, with `classNames.trigger` for the layout the children require. Screen reader users enter through the same door: the area exposes the `longpress` action, which VoiceOver and TalkBack offer in the actions menu, so the gesture is never the only path.
