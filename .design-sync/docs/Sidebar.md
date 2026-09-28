---
category: Navigation
---

# Sidebar

The side bar of an operations screen. It is not just a menu: it is a state
provider, bar, search, groups, items, submenu, footer, trigger and the page area
beside it.

Closed means different things at each width. On the desktop, shrunk down to the
icon column, with each item's name becoming a tooltip on hover. On the phone,
off the screen, and the bar becomes the side sheet.

The shortcut is Ctrl+B, or Cmd+B on the Mac, the same as the editor's. Whoever
works all day on an operations screen opens and closes it dozens of times.
Inside a text field or `RichTextEditor` it does not fire, because there Ctrl+B
is bold; and `shortcut` ignores case, so `"B"` and `"b"` are the same shortcut.

## Collapsed, nothing disappears

This is where almost every sidebar fails. Shrinking to 3.5rem usually hides the
search, cuts the group title in the middle of a word and makes the submenus
vanish, leaving part of the system with no path while the bar is closed.

Here each piece knows what to do at that width:

- `SidebarInput` becomes the magnifying glass icon, which opens the bar again.
  A 3.5rem text field does not take even one word.
- `SidebarMenuSub` becomes a menu that pops out to the side, with the same
  children. Indenting does not fit; hiding would be worse.
- `SidebarGroup` hides the title. Vanishing says less; lying about the group's
  name says something wrong.
- `SidebarMenuItem` shows only the icon, with the name in the tooltip. Without
  the tooltip, the icon column turns into guesswork, and that is why so many
  collapsed bars only serve whoever already memorized the system.

## The pieces

`SidebarProvider` holds the state and the shortcut. `Sidebar` is the column,
with `side="left"` or `"right"`. Inside it: `SidebarHeader`, `SidebarInput`,
`SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`,
`SidebarMenuSub`, `SidebarSeparator`, `SidebarFooter`.

`SidebarMenuRow` with `SidebarMenuAction` inside gives a row the secondary
button that shows on hover. `SidebarMenuSkeleton` holds the place while the
navigation comes from the server. `SidebarRail` is the thin strip on the edge
that opens and closes when clicked, and `SidebarTrigger` is the button that does
the same from the keyboard. Its name follows what it does there: on the
desktop, "Recolher barra lateral" and "Expandir barra lateral", because the bar
becomes the icon column and does not vanish; on the phone, "Abrir menu" and
"Fechar menu", because there it is a sheet.

`SidebarMenuItem` is a list item inside `SidebarMenu`, and a loose link outside
it. In `SidebarFooter`, wrap the items in a `SidebarMenu` when there is more
than one; a single item can stay loose, without becoming an `li` outside a list.

`SidebarInset` is the page area, beside the bar.
`SidebarBrand` is the brand at the top, and it shrinks along with the bar: open
it shows the name next to the symbol, in the icon column it shows only the
symbol.

### `title` and `label` say different things

Four pieces of the family receive a text, and two prop names cover all four
because there are four roles:

- `Sidebar` has `title`: the title only the screen reader hears, on the phone,
  where the bar becomes a sheet and loses its context. It is the same role (and
  the same name) as in `CalendarPanel` and `Command`.
- `SidebarGroup` has `label`: the visible header of a group of items, as in
  `MenuGroup` and in `Command`'s groups.
- `SidebarInput` has `label`: the accessible name of a field with no visible
  label, as in `Editable`, `Splitter` and `Progress`.
- `SidebarMenuSub` has `label`: the text of the row itself, as in `Tree` and in
  `Command`'s items.

It is worth knowing this when looking for the prop: the name follows the role,
not the piece.


## With the router's link

`SidebarMenuItem` is an `<a href>` by default. In an app with a router, the
click would reload the whole page: pass the router's link through `render`, and
the item keeps the design, the `aria-current` from `active` and the closing of
the sheet on the phone.

```tsx
import { NavLink } from 'react-router'

<SidebarMenuItem render={<NavLink to="/notas" />} active icon={<FileText size={16} />}>
  Notas fiscais
</SidebarMenuItem>
```

TanStack Router's `Link` goes in the same way, and in Next it is the `Link` from
`next/link`: `render={<Link href="/notas" />}`.

## The phone comes already solved

None of this needs to be wired by hand. Below 640px the bar becomes a sheet, and
the sheet starts **closed**: `defaultOpen` refers to the desktop column, where
open is the useful state and the page stays whole beside it. On the phone the
same bar covers everything, and opening on its own at load covers exactly the
screen the person came to see.

The same goes for the controlled mode. `open` and `onOpenChange` are the desktop
state, and on the phone they neither open the sheet nor are called by it:
saving `open` as open in a cookie does not cover the phone screen on load, and
closing the sheet does not write closed into the desktop state. The sheet has
its own state, and whoever needs to control it uses `openMobile` and
`onOpenMobileChange`.

On the phone, the `Sidebar`'s `className` goes to the sheet, and the other
attributes (`role`, `data-*`, `aria-*`) to the block inside it, without erasing
the sheet's dialog role.

Choosing an item also closes the sheet, which there is the moment to get out of
the way. On the desktop it covers nothing, so it stays open. `SidebarRail`
disappears on the phone, because dragging a 1px edge with a finger is no
target.

When the application needs the same answer, it reads it from the same place:

```tsx
const { isMobile, open, collapsed, toggle, close } = useSidebar()
```

Outside a `SidebarProvider`, the same breakpoint comes from `useMobile()`:

```tsx
import { useMobile } from '@rivocode/ui'

const isMobile = useMobile()
```

Both answer through the same media query the bar and the calendar use. Writing
`640` again in some corner of the application is how the two halves of the
screen end up disagreeing about what a phone is. Inside the provider prefer
`useSidebar().isMobile`, which avoids a second subscriber to the same query.

On the server both return `false`, and not a guess: the first paint comes out
the same as the desktop's and corrects itself on the first effect, because
erring toward narrow breaks the wide layout, and the opposite does not.

## When not to use

Fewer than five destinations fit in a `Menubar` or a `NavigationMenu` at the
top, and the whole width is left for the content. The sidebar pays for itself
when the list grows, gains groups and needs submenus.

## In React Native

Does not port. The sidebar is the navigation skeleton of a wide screen; on the phone that role is played by the router's tab bar and drawer (Expo Router, React Navigation), which bring edge gesture, history and tab state for free. A hand-drawn drawer on top of that loses all three.
