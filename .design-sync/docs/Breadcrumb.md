---
category: Navigation
---

# Breadcrumb

The path to where the person is.

It shrinks on its own: past `max`, the middle becomes an ellipsis, and the
first crumb and the last `max - 1` remain (never fewer than the last one). The
ellipsis only shows up when it hides at least one crumb. On a phone the last
two crumbs remain, because a long path scrolls off the screen and nobody reads
the beginning.

The ceiling is called `max`, the same name that `Indicator`, `AvatarGroup` and
`TagsInput` use for the same idea.

The path comes in through `items`, a list of `Crumb` (`{ label, href }`, with
the `href` left out on the last one, which is where the person already is):

```tsx
const trilha: Crumb[] = [
  { label: 'Notas fiscais', href: '/notas' },
  { label: 'Nota 4813' },
]
```

The last one is not a link and carries `aria-current="page"`.

## In React Native

Does not port. The path to where the person is, on the phone, is the router's back button plus the screen's title. Drawing a trail on top of that duplicates the navigation and eats the width the title needs.
