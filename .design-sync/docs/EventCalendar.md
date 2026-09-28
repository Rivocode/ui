---
category: Data
---

# EventCalendar

The appointments calendar: what happens, when, and for how long.

The house `Calendar` answers "which day?". The data it carries is a date, or
two, and its drawing is a month of numbers with one of them painted.
`EventCalendar` carries a list of appointments with a start and an end, and
exists to show the two things a text list does not show: **how much time each
one takes** and **which ones run over each other**.

```tsx
<EventCalendar
  defaultView="week"
  defaultDate={anchor}
  events={events}
  label="Agenda da equipe"
  onRangeChange={({ start, end }) => carregar(start, end)}
  onEventSelect={(event) => abrir(event.id)}
  onSlotSelect={({ start, end }) => novo(start, end)}
/>
```

An appointment is a small object, and the color vocabulary is the house's
closed one:

```ts
type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
}
```

**`tone`, not `color`.** It is a calendar's first temptation, one hex per
event, and it cannot work here: a literal color outside `src/tokens` is
rejected by the guard, and a hex coming from the app has no measured contrast
pair. Whoever needs more has `renderEvent` and `classNames.event`, with the
house classes. And color is never the data: if red means "cancelled",
something needs to write "cancelled", or the information does not exist for
half the people.

## The four views, and the three engines

There are four views and three drawing engines, because `day` is `week` with a
single column.

- **`agenda`** is a list grouped by day. It works at any width, it is the only
  one that asks for no geometry at all, and it is what the screen reader hears
  in all the others (see "Accessibility").
- **`week`** is the reason the piece exists. Seven time columns side by side is
  the only way to see that Thursday is packed and Friday is empty.
- **`day`** is the same grid with one column, and earns its own value by being
  the only time grid that fits in 390px.
- **`month`** is the density map: how many things on each day, and in what
  order. It is the view that answers "when is it due" better than any other.

### What `month` does not show, and you need to know before choosing it

A month cell has **no room for duration** and **no room for overlap**. Every
appointment becomes a strip of the same height: a fifteen-minute meeting and an
eight-hour training look identical. And two events at 14h sit one below the
other exactly like two events at 9h and 17h, so the screen does not say they
clash.

**Whoever needs to see scheduling clashes uses `day` or `week`.** `month`
serves the question before that one: which day does this fall on, and is that
day already full? Inside the cell the order is chronological, what exceeds
`maxLanes` (three, out of the box) becomes a `+N mais`, and that button opens
the list for that day, which is the `agenda` view of a single day.

## What happens at 390px

The house's usable width at 390px is 358px, and from there the arithmetic
decides on its own:

- **`week`**: 358 minus 44 for the hours gutter gives 314px, divided by seven
  gives **44.8px per column**. The column reaches the touch target and that is
  all it reaches: 44px fits some five letters, and "Reunião com o contador"
  becomes "Reun…". Seven columns like that are a screen with no information at
  all.
- **`day`**: 314px of a single column, with readable text and visible
  overlap.
- **`month`**: 358 divided by seven gives **51px per cell**.

**The decision:** below 640px `week` disappears from the selector, and
`view="week"` received through a prop resolves to `agenda`, silently, the same
way `Calendar` ignores `numberOfMonths` on a phone and `Dialog` becomes
`Sheet`. It is house precedent in three places.

**`month` stays**, and the reason is that it is not `week` under another name.
A `week` column needs to show *time and duration* in 44px, and does not; a
`month` cell needs to show *that something exists, and roughly what*, in 51px,
and that survives the cut: the strip stays readable by its first words, the
day's count stays exact, and `+N mais` opens the full list in a bottom sheet.
On a phone, whoever looks for duration goes to `day`; whoever looks for "which
day" stays on `month`.

**What is not done, and it is the way out everyone tries first: horizontal
scrolling in the week.** The time grid already scrolls vertically, and adding
horizontal scrolling creates two gesture directions fighting over the same
finger. The finger loses.

## The appointment that spans days

An appointment from 14/03 at 22h to 16/03 at 9h is not a rectangle, it is three
pieces in three columns, and the data is a single one. **The piece does not
store a split event: it splits it in the presentation.** Each segment carries
`continuesBefore` and `continuesAfter`, and that is what removes the rounding
from the edge and makes the accessible text say "continues from the previous
day". Without those two flags, a three-day event becomes three identical
appointments and nobody knows whether they are three meetings or one.

There are two cases, and they go to different places on the screen:

1. **All-day and multi-day** (`allDay`, or a duration of 24 hours or more) go
   to the **all-day band**, above the grid, as bars that span columns. The
   band stacks in lanes (sorts by start and, on a tie, by decreasing duration,
   and puts each bar in the first free lane), has a ceiling of `maxLanes`, and
   the rest becomes `+N`.
2. **The night that crosses midnight** (22h to 9h) is split into two segments
   and does **not** go up to the band, because its time is information: 22h is
   late at night, and the band on top would only say "Wednesday and Thursday".
   The same goes for the on-call shift from 19h to 9h, which has more hours
   than the `dayStart`/`dayEnd` window shows: it keeps its time on the grid and
   in the agenda, and is never announced as "all day" - only `allDay` says
   that.

Where the event splits depends on the browser's time zone. The same
appointment seen from another time zone may not cross midnight, and then it
does not split. It is a direct consequence of the piece not knowing time
zones, and it is behavior, not a defect.

## The appointment that overlaps another

The algorithm is the same as Google Calendar's, and it is worth writing down
because the mistake is always the same: whoever tries to solve it event by
event produces widths that do not add up.

1. **Group into clusters.** A cluster is a group connected by transitive
   overlap: A clashes with B, B clashes with C, so A, B and C are one cluster,
   even if A and C do not touch. Width is divided per cluster, never per pair.
2. **Columns within the cluster.** Walk in start order and put each event in
   the first column where it clashes with nothing.
3. **Expand to the right.** Whoever has free space to the right grows until it
   bumps into something. That is what keeps the screen from turning into four
   thin strips when only two slots actually collide.

`maxColumns` (three, out of the box) is the ceiling. What exceeds it becomes a
`+N mais` in the last column, which opens the day's list. At 314px of a single
column on a phone, three columns give 104px each, which still hold text; the
fourth would not.

## The height floor, and what it costs

At 48px per hour, a fifteen-minute appointment is 12px and a five-minute one is
4px. Neither is a touch target, and neither fits text. So the strip has a
**drawn height floor**: `--rc-control-md` on desktop (40px comfortable, 32px
compact, therefore sensitive to density) and 44px on a phone.

**The floor is only for the drawing. The overlap calculation runs on the real
times**, and that separation is the whole decision. The consequence needs to be
written down, because it shows on screen: two ten-minute appointments fifteen
minutes apart do not overlap in the data and **overlap on the screen**. They
draw stacked, with a shadow, and do not steal a column from each other.

It is an accepted visual defect, and the alternative is worse: letting the
layout use the floored heights makes the whole grid lie, because then
everyone's width starts depending on a number that is not the time. One error
stays at the edge of two short events; the other spreads across the day.

The scrolling area has `maxHeight` (560px out of the box) in `agenda`, `day`
and `week`; `month` grows with the number of rows and scrolls along with the
page, because a month cell is only useful whole.

For the same reason, whatever falls outside the `dayStart`/`dayEnd` window does
not disappear: it sits against the edge of the gutter, with the height floor,
and stays in `agenda` and `month`. `dayStart`/`dayEnd` exist because 24 hours
at 48px are 1152px of height, and nobody works at midnight: from 7h to 20h it
is 624px, which fits on a screen.

**Daylight saving time.** The piece draws by the wall clock: the 14h line sits
at `14 * hourHeight`, always. On a changeover day, the block that crosses the
change comes out an hour longer or shorter than its real duration, and no hour
line shifts. That is the chosen trade: the error stays in one block, and not in
the whole grid.

## Another language

Month and weekday names and the time come from `locale`, a BCP 47 tag
(`"en-US"`, `"es"`), and the default is `"pt-BR"`. The fixed words around them
come from `labels`: the bar's buttons, the view names, what the screen reader
hears on each appointment and the count. Pass only the keys that change. The
"Ir para a data" picker follows the same `locale` for month and day names, and
starts the week on the same `weekStartsOn` as the grid.

```tsx
<EventCalendar
  events={events}
  locale="en-US"
  labels={{
    today: 'Today',
    week: 'Week',
    events: (count) => `${count} events`,
    weekPeriod: (first, last) => `${first.getDate()}–${last.getDate()}`,
  }}
/>
```

## Accessibility

A calendar grid is two incompatible things: a two-dimensional table for
keyboard users, and a chronological list for listeners.

**For listeners, every view is the `agenda` view.** The visual scaffolding (the
hour lines, the gutter, the column headers, the weekday names in the month)
renders `aria-hidden`. What is exposed is, per day, a group with an accessible
name ("Terça-feira, 17 de março, 3 compromissos") and, inside it, a list in
chronological order with `aria-setsize` and `aria-posinset` per event. It is
the same pair `VirtualList` chose, and for the same reason: the count has to be
the real one, not the drawn one, because what is hidden behind a `+N mais`
still exists.

The all-day band is a separate group, called "Dia inteiro", with its own list
and its own count. The name of each day's group keeps adding up everything that
falls on that day, band included: it is the right answer to "how full is
Tuesday".

**What is not done:** `role="grid"` with one cell per half hour. A 24-hour week
in thirty-minute blocks gives 336 cells, almost all empty, and each one is a
stop. It is the mistake most calendar libraries make, and it is the same
mistake as `Tracker` in a new form.

**For the keyboard, one tab stop for the whole piece**, with roving focus
between **events**, and not between cells. Direct precedent from `Tracker`,
which is a single stop for 365 squares.

| Key | What it does |
|---|---|
| `↑` `↓` | previous and next event within the day, in time order |
| `↑` `↓` in `month` | on the first and last of the day, jumps to the same column of the week above or below |
| `↑` `↓` in `agenda` | previous and next in the list, crossing days |
| `←` `→` | the closest event in time, on the previous or next day |
| `Home` `End` | first and last event of the visible period |
| `PageUp` `PageDown` | previous and next period |
| `Enter` `Space` | fires `onEventSelect`, or opens the `+N mais` |
| `Esc` | returns focus to the toolbar |

`←` and `→` follow the writing direction: in RTL, `←` goes to the next day. The
direction comes from `RivoProvider`, and that went into v1 and not later,
because mirroring the drawing without mirroring the math has already cost real
defects in four house pieces.

Three more things:

- **A period change is announced** in a live region: "16 a 22 de março de
  2026, 7 compromissos". A drawing does not reach listeners, and paging is the
  only big change that does not move focus.
- **`aria-current="date"` travels with the day's group**, not with the column
  header. The header is scaffolding and renders `aria-hidden`, so an
  `aria-current` on it would be read by no one; today's group still says
  "today" in its name.
- **The now line is decorative** (`aria-hidden`). It is not data, it is a
  clock, and listeners have their own device's clock.

## The four outcomes, and where the empty state appears

The same as `DataTable` and `VirtualList`, in the same order and with the same
prop names: **error beats loading, and empty only counts after the query has
come back**. `isLoading` and `events === undefined` are the same thing.
`errorTitle`, `errorMessage`, `onRetry` and `labels.retry` are the error set.
Waiting is announced out loud in the same live region as the siblings.

The empty state has a difference that is this piece's decision: **in `agenda`
it takes the place of the list; in the grids it sits on top, and the grid stays
drawn**. A grid is also the surface you click to create, and hiding the week
when the week is free is hiding exactly the empty slot the person was looking
for.

## What comes out when the period changes

`onRangeChange` reports that the visible period changed, and it is the hook
for the app to fetch. **The end is exclusive**: it is midnight of the day after
the last day shown, which makes the comparison on the server
`start <= x < end` without a stray millisecond. `agenda` and `month` share the
month as a period, with one difference: `month` draws whole weeks, so it shows
the neighboring days that complete the first and the last row, and the emitted
range includes those days.

## Parts

`classNames` dresses each part without anyone reaching the inner node through
`[&>div>div]`:

- **`toolbar`**: the bar with navigation, "go to date" and the view selector.
- **`body`**: the frame that wraps the view.
- **`header`**: the day header row, in the grid and in the month.
- **`gutter`**: the hours gutter.
- **`column`**: a day's column in the time grid.
- **`cell`**: a day's cell in the month.
- **`band`**: the all-day band.
- **`section`**: a day's block in the agenda.
- **`event`**: each appointment's box, in all three forms.

`renderEvent` swaps only the strip's core. The box, the focus, the positioning
and the accessible label remain the piece's, because they are what sustain
keyboard navigation.

## What it does not do

Each line here is a door someone will try to open, and it is what keeps the
piece from becoming an application.

1. **It does not fetch data.** `events`, `isLoading`, `isError`, `onRetry` and
   `empty` come in; `onRangeChange` goes out. Same split as `DataTable`,
   `VirtualList` and `QueryBoundary`.
2. **It knows no server time zone.** Everything is `Date`, in the browser's
   local time, as `DatePicker` already decided. An appointment stored in
   `America/Sao_Paulo` and viewed from Lisbon appears at Lisbon time; if that is
   not what you want, convert before handing it over. A piece that knew time
   zones would need a time zone database, and a time zone database is the start
   of a date library.
3. **It does not edit.** No dragging to move, no stretching to resize. It emits
   `onEventSelect` and `onSlotSelect` (a click on empty space returns the
   half-hour range that was clicked, or the whole day in the month) and the app
   opens whatever `Dialog` it wants. Dragging on touch fights with scrolling,
   and it is the exact line where a component becomes an application.
4. **It does not expand recurrence.** No RRULE, no series exceptions: the app
   delivers the instances already expanded.
5. **It does not do resources.** Columns per room or per professional, instead
   of per day, is the same engine on another axis, and it is a real need of
   clinics and barbershops. It is left for later, and the door is open.
6. **It does not print**, does not export `.ics`, does not sync with anything.

## Two build choices you can see from outside

**`agenda` is not virtualized, on purpose.** The structure accessibility
requires here (one group per day, with its list inside, and `aria-setsize` per
event) is nested, and a virtual window is a flat list: you cannot express both
at once without lying about the count. On top of that, roving focus needs the
element to exist in the DOM to receive focus, and the visible period is at most
a month, which limits the list to a few dozen sections. For a whole year in a
single scroll, the path is `VirtualList` with the `renderItem` you already
have.

**In the month, a multi-day appointment is drawn per day**, and not as a single
bar across the row. All the pieces sit in the same lane, so it still reads as a
continuous strip, and the continuation edges lose their rounding. What you gain
from that is the day's group: each cell contains that day's appointments, which
is what the screen reader needs to hear.

## When not to use

**If nobody needs to see duration or scheduling clashes, use `DataTable`.**
This is the most important one, and the one most often gotten wrong. A listing
of appointments with columns for customer, time, status, sorting and filtering
is a table, and the table already does all of that better. `EventCalendar` only
pays off when the answer you are looking for is geometric: "this block is too
big", "these two clash". Otherwise it is an expensive table with fewer
features.

**If the question is "which day?", use `Calendar`, `DatePicker` or
`DateRangePicker`.** Picking a due date is not looking at an agenda, and an
`EventCalendar` for that is a 24-hour grid where the person wanted seven
numbers.

**If the question is "what happened to this thing?", use `Timeline`.** It
looks back, it is about a single object (an invoice, a contract) and its
events are instants with no duration. An `EventCalendar` of an invoice would
draw five zero-minute stamps scattered across three months of empty grid.

**If the question is "how many, per period?", use `Tracker`.** It counts
discrete occurrences, has no time of day and fits inside a `Stat`.

## In React Native

Queued, and the queue is about GESTURE design, not time. Three of the four views port: `agenda` becomes a `SectionList` (virtualization out of the box, the same argument that removed `VirtualList` from the native catalog), `day` is a single 314px column, which is a real column, and `month` survives at 51px per cell because the cell only needs to show that something exists and roughly what.

**`week` does not port.** Seven columns in 358px give 44.8px each, and the week column exists to show time and duration. At 44.8px it shows a colored rectangle, which is what `month` already does better and cheaper. The web made the same decision for its own narrow screen: below `sm`, `week` disappears from the switcher and `view="week"` resolves to `agenda`.

**The decision was made on 2026-08-27, and it is no.** It sat in `DECLARED_QUEUE` waiting for a gesture decision; the design was written, measured, and its math decided against the piece. It is in `docs/2026-08-27-event-calendar-nativo-desenho.md`, and remains valid as a record of what was measured.

The cost is not spread evenly across the views, and that is what decides it. `agenda` and `month` are cheap: one is a list, the other is a month grid, and both already have an answer in the package. `day` and `week` are the whole piece - the time layout engine, the 44-point target over a 12-point strip, the conflict between swiping to change the period and dragging to read, and most of the twelve hundred lines. They cost 15 to 18% of the package, compiled by metro in the app of anyone who imports a `Button`, because the native package publishes SOURCE.

And what they would buy does not fit on the screen: seven columns in 358px give 44.8px each, where the week column exists to show time and duration. A time grid is a desktop idiom - it answers "what clashes with what", and that question is asked with the eye wandering, and not with the finger covering what it touches.

**On the phone, the answer is another piece.** Appointments by day are a list, and the list is built from what already exists. A date with a value - due date, deadline, delivery - is the `Calendar`, which on native already paints per day through `DayPaint`. Whoever needs a time grid on the phone is asking for the desktop screen on a device that cannot hold it.
