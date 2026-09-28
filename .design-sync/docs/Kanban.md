---
category: Data
---

# Kanban

The column board: each column is a status, each card is a thing that moves
between them. Invoices going from "A emitir" to "Emitida", orders going from
"Recebido" to "Entregue". Cards drag between columns and within them, with the
pointer, with the finger and with the keyboard. Lives in `@rivocode/ui/dnd`,
behind `@dnd-kit/core` and `@dnd-kit/sortable`, which are optional
dependencies.

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

```tsx
import { Kanban } from '@rivocode/ui/dnd'

const [columns, setColumns] = useState([
  { id: 'todo', title: 'A emitir', items: pending },
  { id: 'review', title: 'Em análise', items: reviewing, limit: 4 },
  { id: 'done', title: 'Emitida', items: issued },
])

<Kanban
  aria-label="Notas de setembro"
  columns={columns}
  getKey={(note) => note.id}
  getLabel={(note) => `Nota ${note.number}`}
  onMove={({ itemId, from, to, index }) => setColumns((now) => move(now, itemId, from, to, index))}
  renderCard={(note) => (
    <div className="flex flex-col gap-1">
      <span className="font-medium">{note.client}</span>
      <span className="text-fg-muted">{currencyShort(note.amount)}</span>
    </div>
  )}
/>
```

## The piece is controlled

The board holds no cards at all. During the drag it shows where the card will
land (that is the only state it has), and on drop it requests the change
through `onMove({ itemId, from, to, index })`: the card's key, the column it
left, the column where it stopped and the final position within it, counting
from zero. You are the one who changes `columns`, and the board draws what
comes back. Without a change, the card goes back to where it was.

That is what lets the status change go through the server first: moving the
invoice from "Em análise" to "Emitida" is usually a call, and it can refuse.

Dropping in the same place, dropping outside any column and cancelling with
Esc do not call `onMove`.

`getKey` is the card's identity, unique across the whole board, and not just
within the column.

## Count and limit

Each column says how many cards it has, next to its name. `limit` turns on the
work-in-progress limit: the count becomes "3/4", and **above the limit** it
takes the warning tone and says "Acima do limite" in text, with an icon. Color
is never the only signal.

The limit warns and does not lock: the card still goes in, because sometimes
the column needs to go over the limit for a day, and the person is the one who
decides that. The screen reader announcement says when the card pushed the
column over: "A coluna Em análise passa do limite de 4.".

## Empty column

A column with no cards shows a dashed area, "Nenhum cartão. Solte um aqui.",
and the whole of it accepts the card. While a card passes over it, the column
that will receive it gets the focus ring.

## Keyboard and screen reader

The whole card is the handle, and receives focus with Tab.

| Key | What it does |
| --- | --- |
| Space or Enter | picks up the card |
| Up and down arrows | move within the column |
| Left and right arrows | take the card to the neighboring column |
| Space or Enter | drops it |
| Esc | cancels, and the card goes back to where it was |

Each step is announced with the name `getLabel` returns and the column's name:
"Cartão Nota 1043 movido para Em análise, posição 2 de 3.". `labels` swaps
those texts, the count, the limit warning and the empty column text.

## On a phone

The row of columns scrolls sideways and snaps one column at a time. Swiping the
finger over a card **scrolls the board**; to drag, the person holds the card
for a moment before moving. Without that, every scroll gesture would grab the
first card under the finger.

## Motion

The column's cards make room with the tokens' spatial spring, and the moving
card follows the pointer in a copy with `shadow-3`, while the origin spot stays
dashed. On drop, the copy settles into place with the same spring
(`--rc-duration-spatial` and `--rc-ease-spatial`), and via the keyboard it
moves from position to position with the spring too. With "reduce motion", the
tokens go to zero: the copy jumps into place and disappears without settling.

## Card content

`renderCard` draws the core; the frame, the focus and the handle belong to the
piece. Since the whole card is a drag button, **do not put another button
inside it**: a control inside a control confuses the screen reader and steals
the click. To open the detail, use an action outside the board, or the list
beside it.

## Parts

`classNames` reaches `column`, `header`, `title`, `count`, `list`, `card` and
`empty`. `card` also dresses the copy that follows the pointer, so the two come
out the same.

## When not to use

- **An item that only changes position is `SortableList`.** If there are no
  columns (just a queue the person orders), the board is a spare frame.
- **A status that is only read is `DataTable`.** When the person looks up many
  invoices and rarely changes the status of one, the table with a `Badge`
  column shows more rows, sorts and filters. The board is for whoever moves
  cards all day.
- **Stages of a single process are `Steps`.** `Steps` says which step *one*
  thing is in; `Kanban` shows *many* things, each in its own step.

## In React Native

Does not port, and it is not queued: it is a decision. **The board exists for the eye to see the columns side by side**, and at 390px one fits. Dragging a card to the next column means holding the finger while the row scrolls under it to a column that is not yet on screen, and the finger that drags is the same one that would need to scroll. In the phone's browser the web `Kanban` still stands, with the row scrolling one column at a time and the card leaving its place only after the finger holds it, but that is the fallback for someone who opened a desktop screen on the phone, not the design of an app.

**On the phone, each column is a list, and changing columns is an action.** The columns become `Tabs` (or sections of a `DataList`), the order within the column is the `SortableList` from `@rivocode/ui-native/dnd`, and each card gets a `Menu` with "Mover para" and the names of the other columns. It is the same `onMove({ itemId, from, to, index })` as the web on the side that holds the state, and it is the path the screen reader would take anyway.
