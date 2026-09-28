# Layout with @rivocode/ui

## Contents

- The four page skeletons
- The spacing rhythm
- Grid or flex, and the `min-w-0` trap
- Reading width and alignment
- Density, and what it moves
- Narrow first
- Layout mistakes that always show up

## The four page skeletons

Almost every product screen is one of these four. Start from the one that looks
like the request and adjust, instead of building from scratch.

### 1. Operations: sidebar and work area

The internal-system pattern. The sidebar holds navigation, `SidebarInset`
receives the page.

```tsx
<SidebarProvider defaultOpen>
  <Sidebar>
    <SidebarHeader><SidebarBrand mark={<Waves size={18} />}>RivoCode</SidebarBrand></SidebarHeader>
    <SidebarContent>
      <SidebarGroup label="Operação">
        <SidebarMenu>{/* items */}</SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>

  <SidebarInset>
    <header className="sticky top-0 z-[var(--rc-z-sticky)] flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-md">
      <SidebarTrigger />
      <Breadcrumb items={trilha} className="min-w-0" />
      <div className="ml-auto flex items-center gap-2">{/* actions */}</div>
    </header>

    <div className="p-4 sm:p-6">{/* the screen */}</div>
  </SidebarInset>
</SidebarProvider>
```

The `ml-auto` on the actions block is what separates navigation from action
without needing `justify-between`, which would fight with `gap`.

### 2. Listing: filters, table, pagination

```tsx
<div className="space-y-4">
  <Card>
    <CardContent className="flex flex-wrap items-center gap-3 py-4">
      {/* search with flex-1, filters with their own width */}
    </CardContent>
  </Card>

  <DataTable {...} />

  <div className="flex justify-center">
    <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
  </div>
</div>
```

`flex-wrap` on the filter bar, always. Without it, the fifth filter pushes the
search off the screen instead of dropping a line.

### 3. Long form: step ruler and one card

```tsx
<div className="mx-auto max-w-3xl space-y-6">
  <Steps steps={STEPS} step={wizard.step} onStepChange={wizard.goTo} />
  <Card>
    <CardContent className="py-6">
      <div className="grid gap-4 sm:grid-cols-2">{/* fields */}</div>
      <WizardFooter>{/* back and continue */}</WizardFooter>
    </CardContent>
  </Card>
</div>
```

`max-w-3xl` and not the full width: a form stretched across a 1440 screen
becomes a 1200px-wide field to type a CNPJ.

### 4. Dashboard: indicators on top, charts below

```tsx
<div className="space-y-4">
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
    {/* four indicators */}
  </div>
  <div className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
    <Card className="xl:col-span-2">{/* the main chart */}</Card>
    <Card>{/* the donut or the list */}</Card>
  </div>
</div>
```

The indicator comes before the chart because it answers in one second; the
chart asks for ten.

## The spacing rhythm

Use few values, always the same. Tailwind's scale is too fine to decide per
component, so treat it like this:

| Distance | Where |
|---|---|
| `gap-2` | inside a control: icon and text, sibling buttons |
| `gap-3` | items of the same bar: filters, header actions |
| `gap-4` | between cards, between grid columns |
| `space-y-4` | between blocks of a screen |
| `space-y-6` | between sections that change subject |
| `p-4 sm:p-6` | page breathing room |

Inside a `Card`, use `CardContent` instead of inventing `padding`: it already
brings `--rc-pad-panel`, which the density moves along.

**A single distance between siblings.** If a block needs more air than its
neighbor, the problem is almost always a lack of hierarchy, not a lack of
pixels.

## Grid or flex, and the `min-w-0` trap

- **Grid** when the columns are the structure: dashboard, two-column form,
  listing with a filter sidebar.
- **Flex** when the items are a row that may wrap: actions, filters, tags.

The trap applies to both: **grid items and flex items have
`min-width: auto`**, that is, they never shrink below their own
`min-content`. A wide table inside a column stretches the whole column, and the
neighbor goes off the screen with it.

```tsx
// The table scrolls inside its own box again.
<div className="grid gap-4 lg:grid-cols-[16rem_1fr] [&>*]:min-w-0">
```

The same goes for text that promises to truncate: `truncate` without `min-w-0`
truncates nothing, it pushes.

```tsx
<span className="min-w-0 flex-1 truncate">{nome}</span>
```

When the content is wide by nature, let **it** scroll, and not the page:
`overflow-x-auto` on its box. `Table` already does this on its own.

Watch out for a CSS effect: on an element with `overflow-y-auto`, the X axis
stops being `visible` and becomes `auto` too. A page area that scrolls
vertically scrolls sideways without anyone asking, and the overflow does not
show up in the document's `scrollWidth`.

## Reading width and alignment

- Running text: `max-w-prose`. A 200-character line cannot be read.
- Form: `max-w-3xl` centered with `mx-auto`, which is `<Container size="md">`.
- Dashboard and listing: full width, because the information is the density.
- Number in a table: `text-right` and `font-mono`. Right-aligned and with
  fixed-width digits, the values compare vertically without effort.
- Label above the field, never beside it: on a phone it does not fit beside,
  and a screen that changes arrangement between widths costs more than it
  gains.

## Density, and what it moves

`density="compact"` shrinks the control height, `--rc-item-y`, the panels'
breathing room and the `gap` of `Stack` and `Grid`, which comes from
`--rc-gap-*`. It does **not** touch the `gap` or the `padding` you write by
hand.

Hence: control height always by token.

```tsx
<div className="h-[var(--rc-control-md)]" />   // follows the density
<div className="h-10" />                        // does not follow
```

Compact is for operations screens, where fitting more rows is worth more than
breathing room. Do not use it in a registration or a long form.

## Narrow first

Write the phone version and add `sm:` and `lg:` on top. The opposite produces a
layout that "falls apart" when shrinking, because the narrow case was never
thought through.

Breakpoints the library already uses, and worth following:

| Breakpoint | What changes |
|---|---|
| `sm` (640px) | the sheet docks at the bottom, the sidebar becomes a sheet, the calendar shows one month |
| `lg` (1024px) | the second column appears |
| `xl` (1280px) | the dashboard opens to three or four columns |

When the decision does not fit in a class, read the same breakpoint the
components read, with `useMobile()`, instead of writing `640` again.

## Layout mistakes that always show up

- A grid or flex item without `min-w-0`, with wide content inside.
- `truncate` without `min-w-0`: promises to truncate and pushes.
- A filter bar without `flex-wrap`.
- A hardcoded control height, breaking the compact density.
- A chart without height: `ChartContainer` without `h-*` disappears.
- `justify-between` on a row that has `gap`: use `ml-auto` on what should go
  to the end.
- The whole page with `overflow-hidden` to "solve" a sideways overflow. That
  hides the symptom and clips menus and tooltips along with it.
- Vertical space solved with `<br>` or a loose `mt-*` instead of `space-y-*` on
  the container.
