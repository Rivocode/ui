---
category: Forms
---

# TransferList

Two lists side by side: on the left what **is available**, on the right what
**was chosen**. The person checks one or several items and moves them from one
side to the other. A role's permissions, a report's columns, delivery cities,
the products of a price table.

```tsx
const [granted, setGranted] = useState<string[]>([])

<TransferList
  items={[
    { value: 'notas.emitir', label: 'Emitir nota fiscal' },
    { value: 'notas.cancelar', label: 'Cancelar nota fiscal' },
    { value: 'conta.excluir', label: 'Excluir a conta', disabled: true },
  ]}
  value={granted}
  onValueChange={setGranted}
  labels={{ available: 'Permissões', chosen: 'Concedidas' }}
/>
```

The piece is controlled: `value` is the `value`s of the chosen ones, and
`onValueChange` receives the new list on every move. The right side appears
**in `value` order**, and whatever comes in goes to the end, in `items` order.
The left side is `items` without the chosen ones, in `items` order.

## Moving

Between the two lists sit four buttons: move the checked ones to the right, move
all to the right, and the same two back. Each has its own name ("Mover
selecionados para Escolhidos") and a tooltip with the same text on hover. The
button is dimmed when there is nothing to move.

"Move all" moves **what is showing**: with a search typed in, only what the
search left in the list. A checked item the search hid is not moved by "move
selected" either, so nobody moves what they are not seeing.

An item with `disabled` cannot be checked and does not move, not even through
"move all": it stays where it is. It serves the permission the role cannot lose
or gain.

After moving, the sentence "3 itens movidos para Escolhidos" is spoken in a
polite live region, with the right plural and the destination list's name. If
the pressed button went dimmed (because nothing was left to move), focus moves
to the destination list, and does not fall to the start of the page.

## The count and the search

Each list's header says how many items it has ("10 itens") and, with checked
items, how many are checked ("3 de 10 selecionados"). The count is the list's
description for the screen reader.

The search at the top of each list ignores accents and case: "sao" finds "São
Paulo" and "joao" finds "João Pessoa". With no result, the list says "Nada
encontrado"; empty, it says "Nenhum item". `searchable={false}` removes both
searches, for short lists.

## Keyboard

Each list is one Tab stop and moves by the multi-select listbox pattern:

| Key | What it does |
| --- | --- |
| Up and down arrow | moves through the list without checking |
| Space | checks or unchecks the current item |
| Shift + arrow | moves and checks the way |
| Home and End | go to the first and the last; with Shift, check the stretch |
| Ctrl + A (⌘ + A) | checks everything showing, or unchecks if it already was |
| Enter | moves the checked ones to the other list |
| Esc | unchecks everything |

In the search, the down arrow drops into the list.

## Texts

`labels` changes the lists' names (`available` and `chosen`), the empty
sentences (`empty` and `noResults`), the search placeholder (`search`), the
count (`count`) and the announcement (`moved`). The names of the buttons and
the searches follow the lists' names.

## Parts

`classNames` reaches each node by name: `panel` (each list with its frame),
`header`, `search`, `list` (the scrolling box, 240px tall), `option`, `actions`
(the button column) and `empty`. The list's height is changed in
`classNames.list`.

On the phone, the two lists stack, and the buttons' arrows rotate to point up
and down.

## When not to use

- **Checking a few options from a short list** is `CheckboxGroup`.
  `TransferList` is worth it when the list is long and what matters is seeing,
  side by side, what was left out and what went in.
- **Choosing several from a long list without needing to see what is left** is
  `Combobox` with `multiple`: it takes a single line and shows the chosen ones
  as chips.
- **Putting the chosen ones in an order only the person knows** is
  `SortableList`. `TransferList` appends at the end, and does not drag.
- **Choosing inside a tree**, such as departments and teams, is `TreeSelect`.

## In React Native

Translates, with the same `items`, `value`, `onValueChange`, `searchable`, `disabled` and `labels`, and the same count and announcement sentences.

**The lists stack, and each has its own buttons.** On the phone there is no width for two columns with buttons in the middle: the top list is the available one, the bottom one the chosen one, and each ends with “Mover selecionados para …” and “Mover todos para …”. Each row is a checkbox with a 44-point target, and the list scrolls internally from 288 points. The announcement goes out through the system screen reader.

The parts are styled through the same `classNames` as the web: `panel`, `header`, `search`, `list`, `option`, `actions` and `empty`. Since the buttons live in each list, `actions` styles the row below each one, not a column in the middle.
