---
category: Typography
---

# Highlight

Marks, inside a text, the part the person searched for. It is what makes a
results list say **why** each row showed up: whoever typed "sao" sees the "São"
of "Clínica São Lucas" painted.

```tsx
const [query, setQuery] = useState('')
const found = customers.filter((name) => matchesSearch(name, query))

<SearchInput aria-label="Buscar cliente" value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
{found.map((name) => (
  <Highlight key={name} query={query}>{name}</Highlight>
))}
```

The text comes in as a child, and it has to be a `string`: the highlight is
computed over it. `query` is the term, or a list of terms.

## Accents do not matter

Case and accents do not matter, both ways: "sao" finds "São", "JOÃO" finds
"joao", and "acao" finds "Ação". What comes out painted is always the
**original** text, with the accent it had. An accent written in two parts (the
letter and the mark separate, as some databases produce) stays inside the
highlight, and not loose after it.

`matchesSearch(texto, termo)` is the same rule, to filter the list before
highlighting: what the filter finds is what `Highlight` paints.

## Several terms

With a list, each term is highlighted wherever it appears. Two terms that touch
or overlap become a single span, and an empty or whitespace-only term is
ignored: `query=""` returns the whole text, with no mark at all.

```tsx
<Highlight query={['nota', 'cancelada']}>
  A nota fiscal 1042 foi cancelada dentro do prazo.
</Highlight>
```

## The color

Each span renders in a `<mark>` with the solid `warning` background, the
`warning-fg` ink and semibold weight. They are two pairs measured in
`src/lib/contrast.ts`, in both themes: the background against the three house
backgrounds (`bg`, `surface` and `surface-raised`) exceeds 3:1, so the span
stands out by color and not only by weight; and the ink over the background
exceeds 4.5:1. The subtle `warning-subtle` background was discarded for that
reason: it measured 1.14:1 against the background in light and 1.27:1 in dark,
and the highlight lived on bold alone. The span's ink does not follow the
surrounding paragraph, not even when it is `fg-muted`.

`<mark>` is not announced by most screen readers, and it does not need to be:
the listener already knows what they searched for.

## Parts

`className` goes on the outer `<span>`. `classNames.mark` reaches each matched
span.

## When not to use

- **Emphasized text that does not come from a search** is `<strong>` inside
  `Text`. `Highlight` says "this is what you looked for", and used as emphasis
  it misleads.
- **Cutting long text** is `Text` with `truncate` or `lineClamp`, and showing
  more on demand is `Spoiler`. `Highlight` does not touch the text's length.
- **Marking the current item of a list** is the list's own `aria-selected`
  (`Select`, `Combobox`, `Command`). The search highlight is something else, and
  paints over the selected one.

## In React Native

Translates, on top of the package's `Text`, with the same `query` and the same accent-insensitive rule. Each match is a nested `Text` with the same solid `warning` background, the `warning-fg` ink and the semibold weight, and the outer one accepts all the `Text` props (`size`, `tone`, `weight`, `lineClamp`).

Each match's class goes in `classNames.mark`, as on the web. `matchesSearch` also comes from the native package, so the filter and the highlight use the same rule.
