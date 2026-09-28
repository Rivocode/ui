---
category: Structure
---

# ResizablePanelGroup

Areas side by side, or stacked, with dividers that can be dragged: the tree,
the editor and the inspector of a tool; the folders, the note and its events.
As many panels as the screen asks for, and a group inside another's panel when
one of the areas also splits.

The family has three pieces. `ResizablePanelGroup` is the frame and decides the
direction through `orientation`; `ResizablePanel` is each area;
`ResizableHandle` is the divider between two of them.

```tsx
<ResizablePanelGroup autoSaveId="notas">
  <ResizablePanel defaultSize={25} minSize={15} collapsible>
    <nav>Pastas</nav>
  </ResizablePanel>
  <ResizableHandle withHandle aria-label="Entre pastas e nota" />
  <ResizablePanel defaultSize={50}>
    <ResizablePanelGroup orientation="vertical">
      <ResizablePanel defaultSize={70}>
        <article>Nota</article>
      </ResizablePanel>
      <ResizableHandle aria-label="Entre nota e eventos" />
      <ResizablePanel>
        <section>Eventos</section>
      </ResizablePanel>
    </ResizablePanelGroup>
  </ResizablePanel>
  <ResizableHandle aria-label="Entre nota e inspetor" />
  <ResizablePanel minSize={15}>
    <aside>Inspetor</aside>
  </ResizablePanel>
</ResizablePanelGroup>
```

Every size is a **percentage of the group**: the panel's `defaultSize`,
`minSize`, `maxSize` and `collapsedSize`, the controlled `layout` and what
`onLayoutChange` returns. A panel without `defaultSize` shares what is left
with the other unsized ones. The group takes the height and width of its
container, so the outer frame needs a height for `vertical` to have something
to split.

## The divider

Each `ResizableHandle` is a real `separator`, and the decisions are the same as
in `Splitter`, which today is built on top of this family:

- **The value states the size with a unit.** `aria-valuenow` is the size of the
  panel BEFORE the divider, and `aria-valuetext` says "40%", because the bare
  number is not a measure of anything. `aria-valuemin` and `aria-valuemax` are
  the extremes it can really reach with the current neighbors, and not the raw
  `minSize` and `maxSize`.
- **It points to the panel it measures**, through `aria-controls`. Without the
  reference, the screen reader has no way of knowing which of the two sides the
  value describes.
- **The name lives on it.** The `aria-label` you write lands on the node that
  has the role. With none, it is called "Redimensionar painéis", which is
  better than silence and worse than saying which areas it separates: with
  more than one divider on the screen, name each one.
- **The target is 25px and the line draws 1.** WCAG 2.5.8 asks for 24, and a
  transparent `::after` stretches 12px to each side without the drawing
  getting thicker. `withHandle` puts the little grip in the middle of the line,
  for whoever needs to see where to grab; the target is the same with or
  without it.
- **The line paints in `border-strong`, not `border`.** It is the only drawing
  of a control that receives focus, and WCAG 1.4.11 asks for 3:1 against the
  background: `border` measures 1.23:1 and would disappear, `border-strong`
  passes in both themes.

The keyboard follows the WAI-ARIA window splitter pattern:

| Key | What it does |
| --- | --- |
| `←` `→` (upright) or `↑` `↓` (lying down) | moves 2%, and the two neighbors trade size |
| `Home` | takes the panel before it to the smallest size it can reach; if it collapses, it collapses |
| `End` | takes the panel before it to the largest size the neighbors allow |
| `Enter` | collapses the neighboring collapsible panel, or restores it to its previous size |

An arrow that would go past the minimum stops at the minimum; at the minimum,
the next one collapses the collapsible panel. With the mouse, collapsing
happens at the halfway point: dragged below half of the way between
`collapsedSize` and `minSize`, the panel collapses, and above it, it stays at
the minimum. No panel stops at a size it does not accept.

## Collapsing

`collapsible` lets the panel shrink down to `collapsedSize` (0 by default).
Collapsed at 0, it leaves the screen **and the `Tab` order**: the content
becomes `inert`, and nobody tabs into a column that does not show. With
`collapsedSize` above 0, the strip that remains is still reachable, for the
icon column.

`onCollapse` and `onExpand` report the transition, and the panel's `ref` gives
the imperative API, for the show-and-hide button that lives outside the group:

```tsx
const filtros = useRef<ResizablePanelHandle>(null)

<Button onClick={() => filtros.current?.collapse()}>Esconder filtros</Button>
<ResizablePanel ref={filtros} collapsible minSize={20}>
  <form>Filtros</form>
</ResizablePanel>
```

There are five: `collapse()`, `expand()` (back to the size before collapsing),
`resize(size)`, `getSize()` and `isCollapsed()`.

## Saving the layout

`autoSaveId` saves the layout in `localStorage` under that key and restores it
on the next mount. Reading and writing are in a `try`: a private mode that
throws on touching `localStorage`, a full quota or a corrupted value do not
bring down the screen, and the group goes back to `defaultSize`. A saved layout
that no longer fits today's panels (a different count, a size outside the new
minimum) is also discarded.

`storage` changes the place: `sessionStorage`, or an object of yours with
`getItem` and `setItem` that writes to the person's profile. To hold the layout
in your hands, use a controlled `layout` with `onLayoutChange`.

## Writing direction

In `dir="rtl"` the first panel sits on the right, dragging measures from the
edge where reading begins and the arrows move toward the side the person sees.
The direction comes from `RivoProvider`, as in the rest of the catalog. `Home`
and `End` stay logical: the minimum and maximum of the panel before.

## On the phone

The group does not stack on its own, on purpose: whether three columns become a
stack or one screen at a time is your screen's decision, not the frame's. The
orientation is a prop, so a `useTelaEstreita()` swapping `orientation` solves
the common case. When the case is exactly list and detail, `Splitter` already
does it for you.

## When not to use

For **two areas**, list and detail, with no collapsing and no saving, use
`Splitter`: it is one line, stacks on its own on the phone and removes the
divider where it would have no function. `ResizablePanelGroup` is for when the
screen needs more than two areas, a group inside a group, a panel that
collapses or a layout that comes back the same tomorrow.

To hide and show a whole area with no proportion to negotiate, use `Sidebar`
or `Collapsible`.

## In React Native

Does not port, for the same reason as `Splitter`, which on the web is built on top of this family. Three resizable columns ask for a wide screen and a fine pointer: on a phone held upright there is no width to split, and dragging a 1px line with a finger is not a gesture that exists. The areas become router screens (Expo Router, React Navigation), and the panel that collapses becomes a `Sheet`. The layout saved by `autoSaveId` has nothing to save there.
