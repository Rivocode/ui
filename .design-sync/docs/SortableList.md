---
category: Data
---

# SortableList

The list the person puts in order with their own hands: the invoice issuing
queue, the steps of a process, the priority of tasks. It drags with the pointer,
with a finger and with the keyboard, and the screen reader hears each step. It
lives in `@rivocode/ui/dnd`, behind `@dnd-kit/core` and `@dnd-kit/sortable`,
which are optional dependencies: only whoever imports this path installs them.

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

```tsx
import { SortableList } from '@rivocode/ui/dnd'

const [notes, setNotes] = useState(initialNotes)

<SortableList
  aria-label="Ordem de emissão"
  items={notes}
  getKey={(note) => note.id}
  getLabel={(note) => `Nota ${note.number}`}
  onReorder={setNotes}
  renderItem={(note) => (
    <Item>
      <ItemContent>
        <ItemTitle>{note.client}</ItemTitle>
        <ItemDescription>{currencyShort(note.amount)}</ItemDescription>
      </ItemContent>
    </Item>
  )}
/>
```

## The piece is controlled

`items` goes in, the new order comes out ready in
`onReorder(items, { key, from, to })`, and the piece draws whatever comes back.
It keeps no order on its own: without the parent changing `items`, the item
goes back to its place when dropped. That is what lets the order go to the
server before changing on the screen, and go back if the server refuses.

Dropping in the same place and canceling with Esc do not call `onReorder`.

`getKey` is the item's identity, and has to be unique and stable: the key that
travels with the item, not its position.

## Keyboard and screen reader

The keyboard is not a second-class alternative: it is the path of whoever does
not use a mouse.

| Key | What it does |
| --- | --- |
| Space or Enter | picks up the item with focus on the handle |
| Arrows | move the item one position |
| Space or Enter | drops it in the new place |
| Esc | cancels, and the item goes back to where it was |

Each step is announced in a live region, with the name `getLabel` returns:
"Item Nota 1043 pego. Posição 2 de 8.", "Item Nota 1043 movido para a
posição 3 de 8.", "Item Nota 1043 solto na posição 3 de 8.". The handle is
called "Reordenar Nota 1043", and the keyboard instruction is tied to it through
`aria-describedby`, so the reader reads it on arrival and not on every step.

`labels` changes any of these texts, including the word "Item", when the list
is of something else:

```tsx
<SortableList
  items={steps}
  getKey={(step) => step.id}
  getLabel={(step) => step.name}
  onReorder={setSteps}
  labels={{
    moved: (label, position, total) => `Etapa ${label} agora é a ${position}ª de ${total}.`,
  }}
  renderItem={(step) => step.name}
/>
```

## The handle

`handle`, on by default, draws an `IconButton` with the grab icon at the start
of each row, and **only it drags**. The rest of the row stays clickable,
selectable and, on the phone, scrollable: it is the handle that locks scrolling
while the finger is on it, not the whole row.

With `handle={false}` the piece draws no handle, and whatever drags is the
element you spread `handleProps` onto: your own handle, or the whole row. In
this mode touch asks you to **hold** the item before it leaves its place, and
swiping without holding still scrolls the screen.

```tsx
<SortableList
  items={notes}
  getKey={(note) => note.id}
  onReorder={setNotes}
  handle={false}
  renderItem={(note, { handleProps, isDragging }) => (
    <div {...handleProps} className={isDragging ? 'shadow-2' : undefined}>
      {note.client}
    </div>
  )}
/>
```

## Horizontal

`orientation="horizontal"` becomes a row that scrolls sideways when it does not
fit, and the arrows that move become left and right.

## Motion

The neighbors make room with the tokens' spatial spring
(`--rc-duration-spatial` and `--rc-ease-spatial`), and the dragged item lifts
with `shadow-2`. With "reduce motion" on in the system the tokens' duration
goes to zero: the neighbors swap places without sliding, and the scrolling the
keyboard causes on reaching the edge also stops being smooth.

## States

- **Empty**: the list mounts with no items and no handle. Say what is missing
  with an `EmptyState` in its place.
- **`disabled`**: the handle comes out disabled and nothing drags, not even
  from the keyboard. Use it while the previous order is still being saved.

## Parts

`classNames` reaches `item` (the `li` that moves), `handle` (the handle) and
`content` (the box around what `renderItem` draws).

## When not to use

- **Ordering by a criterion is `DataTable`.** If the person wants to see the
  invoices by amount or by date, the `sortable` column solves it with one
  click and without anyone moving anything. `SortableList` is for the order
  only the person knows, and that comes out of no field.
- **Changing group is `Kanban`.** When the item changes status ("A emitir" to
  "Emitida") and not only position, the columns are the information, and the
  board shows both.
- **Hierarchy is `Tree`.** Putting one item inside another is not reordering.

## In React Native

Translates, on its own path `@rivocode/ui-native/dnd`, with the same `items`, `getKey`, `renderItem`, `onReorder`, `getLabel`, `handle`, `orientation`, `disabled` and `labels`.

**No new peer.** The gesture is React Native's `PanResponder`, the same as the `Slider`'s, and not react-native-gesture-handler: dragging by the handle, on a single axis, is a gesture the core solves on its own. The handle is 44pt and holds the gesture until the finger lifts (it does not yield to the screen's scroll in the middle of a drag), and the rest of the row keeps scrolling the list, as with iOS's reorder handle. That is why, on the phone, **only the handle drags**: with the whole row as a handle, every touch to scroll would become a drag.

**The screen reader does not drag: it moves.** Each handle brings two actions, "Mover para cima" and "Mover para baixo" (or left and right, horizontally), and each one moves one step and announces the new position with the same text as the web: "Item Nota 1043 movido para a posição 3 de 8". The drag also announces on picking up, at each position and on dropping.

During the drag a copy of the item follows the finger over the list, and the neighbors make room with the tokens' `base` duration, with no motion when the system asks to reduce it. `handleProps` are the gesture and the actions, to spread on a `View` of your own with `handle={false}`.
