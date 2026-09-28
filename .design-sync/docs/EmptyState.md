---
category: Feedback
---

# EmptyState

An empty state, with a way out.

`title` and `description` are required, and `action` is strongly recommended.
A screen that only says "no results" pushes onto the person the work of
guessing what to do.

Tell the two empties apart: first use ("issue your first invoice") calls for a
create action; a search with no results ("nothing for this filter") calls for
a clear-filter action.

`title` and `description` accept a node, not just text (as in `PageHeader` and
`Timeline`). An already formatted number or a `<strong>` in the middle of the
sentence fits: "Nenhuma nota em **março**".

The `empty` of `DataTable` and of `ChartContainer` is this same object:
`title`, `description`, `action` and `icon`.

## Icon or illustration

There are two slots, and each has its own kind of empty.

**`icon` is the empty that happens in the middle of work**: a filter or search
with no results, a list the person emptied, a period with no activity. The
screen is already familiar, and the drawing only marks the spot. It renders at
32px, forced on every SVG, in `fg-subtle`.

```tsx
<EmptyState
  icon={<Search />}
  title="Nada encontrado para esse filtro"
  description="Tente ampliar o período ou limpar o filtro de status."
  action={<Button size="sm" variant="secondary">Limpar filtros</Button>}
/>
```

**`illustration` is the first-time empty**: the home screen that has nothing
yet, the onboarding step, the module the person just turned on. There the
empty is the first impression of the product, and a larger drawing explains
what will live in that place. Nothing is forced: the size belongs to whoever
draws it. When present, it takes the place of `icon`.

```tsx
<EmptyState
  illustration={
    <svg viewBox="0 0 120 80" className="h-20 w-auto">
      <rect x="20" y="10" width="80" height="60" rx="8" className="fill-accent-subtle" />
      <path d="M36 32h48M36 44h32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  }
  title="Nenhuma nota por aqui"
  description="Quando você emitir a primeira, ela aparece nesta lista."
  action={<Button size="sm">Emitir nota</Button>}
/>
```

**The illustration paints with `currentColor` or with a token class, and never
with a literal color.** The system dresses several clients through the theme,
and a drawing with its color written in hexadecimal looks the same on every
one of their screens, and may vanish in the dark theme. The wrapper already
comes in `text-fg-subtle`, so `currentColor` follows the theme on its own; for
the second tone, use `fill-accent-subtle`, `fill-surface-raised` and the other
roles of the contract. An `<img>` from an external file follows no theme at
all: prefer inline SVG.

There is no illustration kit in the library, on purpose: each client has its
own voice, and the reserved slot is what the library guarantees.

Both render `aria-hidden`: the title and the description already say what the
drawing shows. If it says something the text does not, what is missing is
text.

## Motion

The empty state enters on mount: it fades in and rises 4px at `--rc-duration-base` (`animate-enter`), the same as `Alert`. Inside `DataTable`, `QueryBoundary` and `ChartContainer`, it is what marks that the query came back, and came back with nothing. With "reduce motion", it appears still.

## In React Native

Translates, with `description` required for the same reason as the web, and with both drawing slots: `icon` and `illustration`, both hidden from the screen reader.

**In React Native color does not flow down from the `View` to the SVG**, so `icon` also accepts a function, which receives the `fg-subtle` of the theme currently painting and the same 32 as the web:

```tsx
<EmptyState
  icon={({ color, size }) => <Search color={color} size={size} />}
  title="Nada encontrado para esse filtro"
  description="Tente ampliar o período ou limpar o filtro de status."
/>
```

`illustration` forces nothing, as on the web: the size belongs to whoever draws, and the color comes from the roles in `useRivo().colors`, never from a literal color. `title` and `description` are `string`, because they live inside a `Text`.
