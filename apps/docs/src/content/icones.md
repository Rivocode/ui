The set is [lucide](https://lucide.dev), installed as `lucide-react` and
declared as a required peer dependency: same stroke, same grid, and the numeric
`size` makes a class unnecessary. Never an emoji in place of an icon, and never
a second set mixed in: two different strokes on the same screen look like two
brands.

## Size by context

| Where | Size |
|---|---|
| Inside a control (`Button`, `Tab`, menu item) | `size={16}` |
| Next to `sm`/`xs` text (cell, meta, eyebrow) | `size={14}` |
| Tiny in a tight line (`Stat` hint, delta) | `size={13}` |

The touch target is still at least 24px: a smaller icon grows the button and
gives the space back with a negative margin, as the `Stat` hint does.

## Accessible name

A decorative icon (one that goes along with text that already says it all)
takes `aria-hidden="true"`. An icon that is a button's only content requires a
name **on the button**, never on the icon. `IconButton` enforces this through
its type: `label` is required and becomes the name, and the icon comes out
`aria-hidden` on its own.

```tsx
<IconButton variant="secondary" label="Mais filtros">
  <SlidersHorizontal />
</IconButton>
```

## The vocabulary

One concept, one icon. Lucide has a synonym for almost everything (`Trash` and
`Trash2`, `Gear` and `Settings`), and each synonym that gets in is a screen
that looks like another product. This is the canonical table; a new concept
goes in here before it goes into the code.

| Concept | Icon |
|---|---|
| add / create | `Plus` |
| delete | `Trash2` |
| edit | `Pencil` |
| search | `Search` |
| download / export | `Download` |
| upload a file | `Upload` |
| copy | `Copy` |
| confirmed / done | `Check` |
| close / clear | `X` |
| more actions | `MoreHorizontal` |
| fine-grained filters | `SlidersHorizontal` |
| reload | `RefreshCw` |
| view / preview | `Eye` |
| link that leaves the product | `ExternalLink` |
| sign out | `LogOut` |
| opens a level (item, breadcrumb) | `ChevronRight` |
| expands downward (select, accordion) | `ChevronDown` |
| previous page / back | `ChevronLeft` |
| sortable, unsorted | `ChevronsUpDown` |
| change up / down | `ArrowUpRight` / `ArrowDownRight` |
| document / invoice | `FileText` |
| people / customers | `Users` |
| system settings | `Settings` |
| date | `CalendarDays` |
| dashboard | `LayoutDashboard` |
| short explanation | `Info` |
| agent / AI | `Bot` |
