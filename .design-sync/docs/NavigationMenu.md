---
category: Navigation
---

# NavigationMenu

A site's top navigation, with a panel per section.

It is not `Menu`: that one lists actions that get executed, this one lists
places to go, and the panel can have text, images and several columns. The
screen reader announces the two in different ways, and swapping one for the
other makes the action menu promise navigation that does not exist.

**On an application screen, `Sidebar` usually serves better.** This one is for
marketing pages and portals.

```tsx
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="/notas">Emissao de notas</NavigationMenuLink>
        <NavigationMenuLink href="/cobranca">Cobranca</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

The panel is a single one and lives outside the list: it is what slides from
one section to the other instead of flickering between panels.

## Parts

`NavigationMenuViewport` is the panel where the content of the open item
appears. It lives outside the items, and not inside each one: that way the
switch between two neighboring menus animates from one to the other instead of
closing and opening.

## In React Native

Does not port, by decision - a desktop idiom; native navigation is the router's tab bar and drawer. It is not queued: it will not exist. The [parity table](/react-native) gives the reason for each one.
