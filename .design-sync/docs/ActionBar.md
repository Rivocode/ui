---
category: Actions
---

# ActionBar

The bar for **bulk** actions: it appears when there are selected items, says
how many there are, offers what can be done with all of them at once and lets
the selection be cleared. Exporting twenty invoices, cancelling three boletos,
resending a week's receipts.

```tsx
const [selected, setSelected] = useState<string[]>([])

<DataTable
  data={invoices}
  columns={columns}
  rowKey={(invoice) => invoice.id}
  selectable
  value={selected}
  onValueChange={setSelected}
/>
<ActionBar count={selected.length} onClear={() => setSelected([])}>
  <Button size="sm" variant="secondary">Exportar XML</Button>
  <Button size="sm" variant="danger">Cancelar notas</Button>
</ActionBar>
```

The bar keeps no state at all. `count` says how many are checked, and it is the
`length` of the `DataTable`'s `value`; `onClear` is what resets the selection.
With a controlled `DataTable`, "Limpar seleção" unchecks the table at the same
moment, because both read the same state.

## When it appears

Above zero it enters, rising from the bottom of the area; at zero it leaves.
The entrance uses the enter curve of the motion tokens (`--rc-ease-enter`, at
the `base` duration) and the exit uses the exit one (`--rc-ease-exit`, at
`fast`), so whoever asked the system to reduce motion sees the bar appear and
disappear without sliding.

While it leaves, it keeps saying the last number (and not "0 selecionados")
until it has finished disappearing. Closed, it is inert: none of its buttons
receives focus or clicks.

## The count, said out loud

The sentence comes out with the right plural and with the number in Brazilian
format: "1 selecionado", "3 selecionados", "1.234 selecionados". It is also
announced in a polite live region, which exists before the first selection (a
region mounted together with its text is not announced by any screen reader).
When the selection goes back to zero, what is heard is "Seleção limpa".

`labels.selected` takes the count and returns the sentence, for whoever wants
to name the item and get the grammatical gender right:

```tsx
<ActionBar
  count={selected.length}
  onClear={() => setSelected([])}
  labels={{
    selected: (count) => (count === 1 ? '1 nota selecionada' : `${count} notas selecionadas`),
  }}
>
  <Button size="sm" variant="secondary">Reenviar por e-mail</Button>
</ActionBar>
```

## Where it sticks

`position="sticky"`, the default, sticks to the bottom of the area that
contains it: put the bar right after the table, inside the same block. While it
is open it takes up room below the table, so the pagination is never hidden
behind it.

`position="fixed"` sticks to the bottom of the window, above the phone's safe
area, and takes up no room at all. It is for a listing that takes the whole
screen; on a screen with more than one area, `sticky` says better which list it
is talking about.

Since `fixed` takes up no room, it can cover the control that receives focus
via Tab at the bottom of the screen, and the browser does not scroll to get it
out from under the bar. Reserve the bar's height in the page scroll while it is
open:

```css
html {
  scroll-padding-bottom: 6rem;
}
```

With Tailwind it is the `scroll-pb-24` class on `html`. If the page scrolls
inside a container, the rule goes on it, not on `html`. The `6rem` covers a
one-line bar with the safe area; with actions that wrap onto two lines on a
phone, raise the value.

The buttons inside it wrap a long label onto more than one line instead of
pushing the page sideways, so the bar fits in 320px, which is the screen of
someone using 400% zoom.

In both cases it stacks at `--rc-z-sticky`: above the scrolling content and
below menus, dialogs and toasts.

## Focus

When the bar leaves with focus inside it (after "Limpar seleção", or after an
action that resets the selection), focus does not fall to the top of the page:
it returns to where it was before entering the bar, which is almost always the
checkbox of the last checked row. If that disappeared from the screen, it stays
on the bar's root, at the same reading point. `finalFocus` sends it somewhere
else, such as the table block. Focus that was outside the bar is not touched.

## Parts

`classNames` reaches each node by name: `bar` (the panel), `count`, `actions`
and `clear`.

## When not to use

- **A single-row action** lives on the row itself, in a `Menu` in the actions
  column. `ActionBar` is for what is done with several at once; with a single
  item it appears, but whoever clicked the row expected the action there.
- **Controls that are always on screen**, such as filter, search and export
  all, are `Toolbar`. `Toolbar` is there from the start and moves by arrow key;
  `ActionBar` only exists while there is a selection.
- **Confirming what the action did** is `Toast`. The bar does not say "3 notas
  canceladas": the caller clears the selection, the bar leaves, and the `Toast`
  tells the result.
- **A destructive bulk action** does not run straight from the bar's button: it
  opens an `AlertDialog` saying how many items are going away.

## In React Native

Translates, with the same `count`, the same `onClear` and the same sentence with the right plural. The actions come in as children, and the buttons' text is the native `Button`'s.

**It sticks above the bottom safe area.** The package does not depend on `react-native-safe-area-context`, so the height of the system bar comes in through `bottomInset`: `bottomInset={useSafeAreaInsets().bottom}`. The bar sits on top of the list, in `absolute`, and whoever mounts it leaves breathing room at the end of the list so the last row does not end up under it.

**The count is announced.** The sentence goes out through the system screen reader's announcement, and the bar slides up on entering and down on leaving with the motion tokens, with no slide when the system asks to reduce motion.

The parts are styled through the same `classNames` as the web: `bar`, `count` and `clear`, and `className` styles the same panel as `bar`. `actions` does not exist here: the actions are direct children of the panel, with no box of their own.
