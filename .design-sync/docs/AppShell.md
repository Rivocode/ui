---
category: Structure
---

# AppShell

The application's skeleton: a fixed header, a sidebar, content, and, when the
screen asks for it, a side column and a footer. It is the first component of a
new application, and the one that gives each region the right landmark without
anyone having to remember.

```tsx
<AppShell
  sidebar={
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem href="/notas" active>Notas fiscais</SidebarMenuItem>
        <SidebarMenuItem href="/clientes">Clientes</SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  }
  header={<SearchInput placeholder="Buscar notas" />}
  container
>
  <PageHeader title="Notas fiscais" />
</AppShell>
```

## The regions, and what the screen reader hears

| Prop       | Renders as                 | Landmark                                   |
| ---------- | -------------------------- | ------------------------------------------ |
| `header`   | `<header>`, fixed at the top | banner                                   |
| `sidebar`  | `<nav>` inside `Sidebar`   | navigation, "Navegação principal"          |
| `children` | `<main>`                   | main                                       |
| `aside`    | `<aside>`                  | complementary, "Informações complementares" |
| `footer`   | `<footer>`                 | contentinfo                                |

Each region only exists when its prop is passed. The `<aside>` that `Sidebar`
draws inside renders with `role="none"`: the sidebar is navigation, and also
announcing it as complementary would give two regions for the same thing.

**The page's first focus is the "Pular para o conteúdo" link.** It stays
hidden until it receives focus, appears in the top corner, and takes focus to
`<main>` without changing the page address, which does not disturb the router.
Keyboard users stop having to go through the whole bar on every new screen.

## The sidebar

`sidebar` takes the inside of the house `Sidebar` (`SidebarHeader`,
`SidebarContent`, `SidebarMenu`, `SidebarFooter`), and the shell builds the
rest: the `SidebarProvider` at the root, the `Sidebar` with the `<nav>` inside,
and the `SidebarTrigger` at the front of the header. Everything the bar already
does still holds: it shrinks to the icon column on desktop, opens and closes
with Ctrl+B, and **on a phone becomes the sheet** that slides in from the edge,
closed on load and closed again when the person picks a destination.

`defaultOpen`, `open`, `onOpenChange` and `shortcut` go straight to
`SidebarProvider`. `sidebarSide="right"` puts the bar on the other side.
`useSidebar()` works anywhere inside the shell.

## The content

Without `container`, the content touches the edges of `<main>`: it is what an
edge-to-edge listing wants. With `container`, it goes inside a house
`Container`, with the maximum width, the side spacing and the panel's top and
bottom spacing. `true` uses `lg`; a size (`sm`, `md`, `xl`, `full`) picks
another.

`aside` sits to the right of the content from `lg` up, at the sidebar's width,
and below the content before that. `footer` closes the column.

## Inside a box

The shell takes the window: the sidebar sticks at the screen's height and the
page scrolls in the window. `contained` swaps the window for the parent's box,
and the bar and the content column start scrolling inside it. It is the way to
build the shell in a panel, in a `Splitter` or in a documentation example.

```tsx
<div className="h-[32rem]">
  <AppShell contained sidebar={menu} header={busca}>…</AppShell>
</div>
```

## Parts

`classNames` reaches each node by name: `skipLink`, `sidebar`, `column` (the
column to the right of the bar), `header`, `body` (the row with the content and
the side column), `main`, `aside` and `footer`.

## Text

`labels` changes the skip link's text (`skipLink`) and the names the screen
reader announces for the navigation (`navigation`) and for the side column
(`aside`). `mainId` fixes the `id` of `<main>`, when another part of the page
needs to point to it.

## When not to use

- **The top of a screen** is `PageHeader`. The shell is the whole application
  and appears once; `PageHeader` is the title, trail and actions of each route,
  and lives inside the shell's `children`.
- **Just the sidebar, in a layout you already have** is `Sidebar` with
  `SidebarProvider` and `SidebarInset`. The shell is `Sidebar` plus the other
  regions; if the others already exist, it is surplus.
- **Reading width without an application skeleton** (a login page, a public
  form) is `Container`. There is no navigation to organize there.
- **Side-by-side panels the person resizes** is `Splitter`. The shell's
  `aside` has a fixed width and does not drag.

## In React Native

Does not port, by decision. On the phone the application skeleton is not drawn by the component library: it is the router (Expo Router, React Navigation) that builds the tab bar, the drawer, each screen's title bar and the safe area, with the back gesture, the history and each tab's state for free. A shell of ours on top of that would be a second skeleton competing for the same screen edges.

What the web shell solves for accessibility also already comes from the system: VoiceOver and TalkBack announce the tab bar and the screen's title, and there is no skip link for those navigating by touch. The top of each screen is still `PageHeader`, which translates.
