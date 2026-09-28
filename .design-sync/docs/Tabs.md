---
category: Navigation
---

# Tabs

Switches between sibling panels on the same page.

It composes with `TabList`, `Tab` and `TabPanel`, matching `value` between tab
and panel. The indicator that runs to the active tab positions itself.

`TabList` has `variant`, of type `TabVariant`. The underline, which is the
default, says "this part of the page". The little box, `variant="segmented"`,
says "the same thing, another way": screen width, preview and code, dark and
light. Swapping one for the other makes the control promise what it does not
do.

## When not to use

Do not use it for navigation between pages: a tab suggests the content is
right there beside it, not at another address. If the click changes the URL,
it is a link, and its place is `NavigationMenu` or `Sidebar`.

## In React Native

Translates halfway, on purpose. The native `Tabs` is **only** the box (`variant="segmented"` on the web): `items`, `value`, `onValueChange`, no `TabList`, `Tab` or `TabPanel`. A tab that switches the page's section is not a piece on the phone (it is the router's tab bar), and insisting on a tab drawn on top of that gives two competing navigations on the same screen.
