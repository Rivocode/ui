---
category: Typography
---

# Heading

The title of a section, with level and size kept apart. `level` decides the
tag, from `h1` to `h6`, and is what the screen reader uses to jump from
section to section; `size` decides the type size on the house scale, from `sm`
to `3xl`.

```tsx
<Heading level={2}>Notas fiscais</Heading>
<Heading level={2} size="md">Resumo do mês</Heading>
```

The split exists so the order of headings is not held hostage by size. When
the tag carries the look, whoever wants a smaller title drops the level, and
the page starts jumping from `h2` to `h4` without an `h3`. Someone navigating
by heading hears a gap that is not on the screen. Here the size changes on its
own, and the level keeps saying where the title lives.

`level` has no default, on purpose: the page knows the level, not the piece.
Without `size`, the type size follows the level: `h1` is `2xl`, `h2` is `xl`,
`h3` is `lg`, `h4` is `md`, `h5` is `base` and `h6` is `sm`. The typeface is
`font-display` at weight 600, the same as `CardTitle` and `PageHeader`.

`truncate` cuts to one line with an ellipsis, for a title that lives in a
narrow column. The whole sentence stays in the DOM, and the screen reader reads
all of it.

## When not to use

- **Top of a route:** `PageHeader`. It already brings the `h1`, the
  breadcrumb, the description and the actions, in the same hierarchy on every
  page; building that with `Heading` is rewriting the top on every route.
- **Card, dialog or sheet title:** `CardTitle`, `DialogTitle`, `SheetTitle`.
  They wire the title to the region they name (`DialogTitle` becomes the
  dialog's accessible name), and a loose `Heading` there wires nothing.
- **Text that only needs to look big:** `Text` with `size="lg"` and
  `weight="semibold"`. A heading is for what opens a section; a highlighted
  number or a catchy sentence that opens nothing does not belong in the page
  outline.

## In React Native

Translates, with the same `level`, `size` and `truncate` as the web, and the same size for each level when `size` is not given. It comes out as a `Text` with `accessibilityRole="header"`, in the provider's `display` family.

**The level is not announced.** VoiceOver and TalkBack say “cabeçalho” and stop there: there is no `h1` to `h6` on touch. `level` is still required anyway, for two reasons: it decides the size when `size` is not given, and the screen ports from the web without rewriting the call.
