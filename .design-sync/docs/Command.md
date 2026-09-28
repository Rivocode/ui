---
category: Navigation
---

# Command

The command palette: a field, a list and the keyboard.

It exists for people who work all day on the same screen and already know
where they want to go. Navigating by menu costs three clicks and remembering
where the option lives; here it costs the name of the thing.

```tsx
<Command
  open={aberta}
  onOpenChange={setAberta}
  groups={[
    { label: 'Ir para', items: [{ id: 'notas', label: 'Notas fiscais', onSelect: irParaNotas }] },
  ]}
/>
```

## The search

It ignores accents and case, and also reads the item's `keywords`. "nf",
"fatura" and "boleto" leading to Notas fiscais is what separates a useful
palette from one that only finds things for whoever already knows the exact
name, which is precisely who needs it least.

Each opening starts clean. A palette that keeps the last search opens showing
the answer to another question.

Searching and finding nothing also has to be said. The result count and the
empty message go out in a `role="status"` region outside the list: without it,
typing a search with no results produces silence, with focus sitting in the
field and no hint that the list emptied. The `title` is the name of the field
and of the list, and it is what the screen reader announces on opening: the
`placeholder` disappears on typing and does not serve as a label.

## The shortcut

`Ctrl+K`, or `Cmd+K` on a Mac, registered by the component itself. Pass
`shortcut={null}` to register it in your application, or another letter to
change it; upper and lower case are the same key.

The shortcut does not fire inside a text field or inside `RichTextEditor`,
where Ctrl+K is a link, nor when another component has already handled the
key. The exception is the open palette's own field: there the same shortcut
closes it. While an input method is composing (Japanese, Chinese, accents via
IME), Enter confirms the composition and does not run the command.

## The list is data, not children

The items come through `groups`, not as nested components. Filtering, the
order the arrow moves in and `aria-activedescendant` all live in a single
place; the composed form would force the component to guess each child's text
in order to filter by it.

## When not to use

Fewer than ten destinations do not justify it. With that many the sidebar
shows everything at once, and the palette becomes one more step to reach the
same place.

## In React Native

Does not port. The command palette is a desktop gesture (it opens by shortcut, moves by arrow, confirms by Enter), and none of the three exists on touch. On the phone the equivalent door is the router's search screen, with the field at the top and the result leading straight to the screen.
