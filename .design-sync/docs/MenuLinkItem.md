---
category: Navigation
---

# MenuLinkItem

The menu item that navigates, and that is why it renders as a real `<a>`.

It is the "My profile" of the avatar menu. What you gain is what only the
anchor has: the middle button opens it in another tab, the right button copies
the address, and the browser's status bar shows where the item leads before
the click.

```tsx
<MenuContent>
  <MenuLinkItem href="/perfil">Meu perfil</MenuLinkItem>
  <MenuLinkItem render={<NavLink to="/assinatura" />}>Assinatura</MenuLinkItem>
</MenuContent>
```

With a single-page router, pass its link component in `render`: the element is
yours, and the piece only lends the skin and the menu behavior.

**`closeOnClick` starts as `true` here, and in Base UI it starts as `false`.**
The reason is client-side navigation: without a page reload nobody unmounts the
menu, and it stayed open floating over the new screen. Whoever wants the Base
UI behavior passes `closeOnClick={false}`.

## When not to use

For what happens on the same screen (duplicate, export, cancel), use
`MenuItem`. An anchor that leads nowhere (`href="#"` with `onClick`) betrays
the three affordances above, and is worse than an ordinary item.

A whole menu of links is a navigation menu, not an action menu: there the
piece is `NavigationMenu`, or the `Sidebar` when the destinations are the
sections of the dashboard.
