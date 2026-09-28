---
category: Data
---

# Gantt

The project schedule: tasks with a start and an end on a timeline, with the
table beside it, dependencies as arrows and editing by drag and by keyboard.

The question it answers is one of sequencing: **what needs to finish before
what, and what slips if this task slips**. The table on the left is the list
you read; the timeline on the right is the same list put to scale, where
duration becomes width and dependency becomes an arrow.

```tsx
const [tasks, setTasks] = useState(projeto)

<Gantt
  label="Implantação do ERP"
  tasks={tasks}
  defaultScale="week"
  onTaskChange={(task, change) =>
    setTasks((atual) =>
      atual.map((item) =>
        item.id === task.id ? { ...item, start: change.start, end: change.end } : item,
      ),
    )
  }
/>
```

A task is a small object, and the color vocabulary is the house's closed one:

```ts
type GanttTask = {
  id: string
  title: string
  start: Date
  end: Date
  progress?: number
  dependsOn?: string[]
  group?: string
  assignee?: string
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
}
```

## The end is exclusive, and a milestone is a task with no duration

`end` is the **instant the task ends**, and not its last day. A task from
October 12 to 18 ends on 19/10 at midnight, and that is how the bar covers the
seven whole days. The "Fim" column and the screen reader show the last day
covered, 18/10, because that is what the person says out loud.

The choice has a single reason, and it is the milestone: **a milestone is a
task with `end` equal to `start`**, zero duration, drawn as a diamond. With an
inclusive end, a one-day task and a milestone would be the same object.
Whoever stores the last day in the database adds a day before handing it over.

An `end` with a time is valid: a task that ends at noon on the 18th draws half
a column on that day and is still "12 a 18 de outubro".

## The three scales

| Scale | One day is | The header | The arrow moves |
|---|---|---|---|
| `day` | 40px | month on top, day with the weekday initial below; weekends shaded | one day |
| `week` | 18px | month on top, the Monday of each week below | one week |
| `month` | 5px | year on top, month below | one month, by the start; the end comes along and the duration in days does not change |

On the month scale the arrow shifts the start, and the end is recomputed with
the same duration in days. A start on the 31st falls on the last day of a
shorter month, and a one-day task on January 30 still has one day in February:
it does not become a milestone nor lose a day along the way.

The drawn period comes from the tasks, with one unit of slack on each side;
`range` fixes it. The red line is today (`today`, or the device's clock), and
the frame opens scrolled to it. The "Hoje" button on the bar goes back there.

**The today line passes under the text.** The day label in the header and each
bar's label have a background, so the line, the grid and the arrows disappear
behind the letters instead of striking through them. A bar that has a
successor pushes its label 8px further, so the arrow leaving its end drops into
the gap and not onto the start of the name. And the month or year label, when
the column starts before the visible area, stays pinned next to the table and
shortens with an ellipsis to what is left of the column, instead of vanishing
halfway behind it.

## Editing: controlled, and never on its own

Editing only exists with `onTaskChange`. Without it the grid is read-only, and
says so (`aria-readonly`). With it:

- **dragging the bar** moves the whole task, day by day;
- **dragging an edge** changes the start or the end, with a floor of one day;
- **the arrows**, on the timeline cell, move one unit of the scale;
- **Shift with the arrows** changes the duration, from the end.

`onTaskChange(task, { start, end, kind })` receives the task as it was and the
new dates; `kind` is `move` or `resize`. **The piece changes nothing on its
own**: the bar only moves when `tasks` comes back changed. During the drag it
draws the preview, and on release calls the callback once. Whoever needs to
refuse (a locked task, a date outside the contract) simply does not apply it.

**The announcement follows what was applied, not what was requested.** After
each change a live region says the task and the new range, "Instalar servidor:
13 a 19 de outubro", and it reads from the `tasks` that came back. If whoever
controls it refuses, the screen reader does not hear a date that does not
exist.

**On touch there is no dragging.** With the finger, the frame scrolls; the bar
only drags with a mouse or a pen. Dragging an 18px bar on a timeline that also
scrolls sideways is the gesture conflict `EventCalendar` already decided not to
buy, and the answer is the same. On a phone editing is through the form the
app opens in `onTaskSelect`, or through the keyboard for whoever has one.

## Dependencies

`dependsOn` lists the `id`s that need to finish first. Each one becomes an
arrow from the end of the previous one to the start of this one, and the arrow
routes underneath when the successor starts earlier. **A violated dependency
becomes a dashed arrow**, in text red, and its cell says "depende de Comprar
hardware, e começa antes de ela terminar". The dashing exists so the
information does not depend on color.

The arrows run no critical path calculation and push nobody: the piece shows
the sequencing, and rescheduling the project is the app's rule.

## Groups, and hundreds of tasks

Tasks with the same `group` sit under a row that collapses, in the order the
first member appears. The group row shows the count and a line from the start
of the first to the end of the last. Collapsing is by clicking the name, by
`Enter`, or by the arrows, as in any tree; `collapsedGroups` and
`onCollapsedGroupsChange` control it from outside.

The rows are virtualized: five hundred tasks draw only the ones that fit in
the frame, and the grid keeps stating `aria-rowcount` with the real total. The
arrows are a single SVG, computed from the row's position and not from the
DOM, so the arrow to an off-screen task is still right when it appears.

## The table on the left, and the divider

The columns come from `columns`, in the requested order: the four house ones
by name (`title`, `start`, `end`, `assignee`) and your own columns with `cell`.
The title always goes in, and it is always first. Without `columns`, title,
start and end go in, and the assignee only goes in when some task has
`assignee`.

**The divider between the table and the timeline is neither `Splitter` nor
`ResizablePanelGroup`, and that is on purpose.** Both split the screen into
panels that each scroll on their own, and here the two halves are the same
row: with two scrolls, row 212 of the table and row 212 of the schedule drift
apart with every pixel of horizontal scrollbar, and virtualization would have
to be done twice and kept in sync. The piece has a single scroll, with the
table pinned to the left, and the divider measures its width with the same
contract as its siblings: `role="separator"`, arrows in steps of 16 pixels,
`Home` and `End` at the extremes.

## On a phone

At 390px only the title is left, at 160px, and the timeline scrolls sideways
**inside its own frame**: the page never scrolls sideways. The divider goes
away, because there is nothing to divide, and the row gets the 44px touch
target.

**Within the 160px the title wraps up to two lines**, which fit in the row's
44px, and only then truncates. The whole name stays in the row header's
`title`, on phone and desktop, and it is also what the screen reader
announces.

## Another language

Month and weekday names and the time come from `locale`, a BCP 47 tag
(`"en-US"`, `"es"`), and the default is `"pt-BR"`. The fixed words around them
come from `labels`: the bar's buttons, the scale names, what the screen reader
hears on each task and the count. Pass only the keys that change.

```tsx
<Gantt
  tasks={tasks}
  locale="en-US"
  labels={{
    today: 'Today',
    week: 'Week',
    progress: (percent) => `${percent}% done`,
  }}
/>
```

Each task's range is not a word, it is a phrase, and its order changes from
language to language: "12 a 18 de outubro" in Portuguese, "October 12 – 18" in
English. That is why `labels.range` receives the two days as `Date` and the
`locale`, and not two ready-made texts. Without it, Portuguese uses the phrase
with "a" and the other languages use `Intl.DateTimeFormat#formatRange`, which
already merges the repeated month. Swap it only when the `Intl` phrase does not
serve:

```tsx
<Gantt
  tasks={tasks}
  locale="en-US"
  labels={{
    range: (from, to, locale) => {
      const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
      return `${day.format(from)} through ${day.format(to)}`
    },
  }}
/>
```

## Accessibility

The piece is a real grid, and the reason is that it **is** a table: one row per
task, with columns that have names. It is a `treegrid` when there are groups
(the group row has `aria-expanded`, and its tasks have `aria-level="2"`,
position and set size) and a `grid` when there are none. The title is the row
header, and the timeline cell speaks what the drawing shows: "12 a 18 de
outubro, 40% concluído, depende de Comprar hardware". The table alternative is
not a second screen: it is the left column, which is already there for sighted
users.

The scaffolding (day labels, grid lines, the today line and the arrows)
renders `aria-hidden`. The arrow is spoken in the cell of the dependent, and
not in the one depended on, because that is where "começa antes de ela
terminar" makes sense.

**One tab stop for the whole grid**, with roving focus between cells, and the
focused cell never leaves the DOM, even when virtualized.

| Key | What it does |
|---|---|
| `↑` `↓` | row above and below, in the same column |
| `←` `→` in the table | previous and next cell |
| `←` `→` on the timeline | moves the task one unit of the scale, if `onTaskChange` exists; otherwise, goes back to the table |
| `Shift` `←` `→` on the timeline | shortens and lengthens from the end; a milestone has no duration and does not change |
| `←` `→` on a group | collapses and expands; when expanded, `→` goes to its timeline |
| `←` on the title of a task in a group | goes up to the group row |
| `Home` `End` | first and last cell of the row: `Home` is the way out of the timeline |
| `Ctrl` `Home` `End` | first and last row |
| `PageUp` `PageDown` | one frame up or down |
| `Enter` `Space` | expands and collapses the group, or fires `onTaskSelect` |
| `Esc` | cancels the drag in progress |

`←` and `→` follow the writing direction: in RTL, `←` moves the task later.
The editing instruction arrives through the cell's `aria-describedby`, and
states the unit of the current scale: "Setas movem uma semana, Shift com setas
muda a duração, Home volta ao título".

## The four outcomes

The same as `DataTable`, `VirtualList` and `EventCalendar`, in the same order
and with the same names: **error beats loading, and empty only counts after
the query has come back**. `isLoading` and `tasks === undefined` are the same
thing, and loading draws skeleton rows without faking any period header.
Without `empty`, the empty list draws the grid with only the header, and the
frame becomes a tab stop.

## Parts

`classNames` dresses each part without anyone reaching the inner node through
`[&>div>div]`:

- **`toolbar`**: the bar with "Hoje" and the scale selector.
- **`frame`**: the frame that scrolls.
- **`header`**: the header strip, pinned to the top.
- **`row`**: each row, task or group.
- **`cell`**: each table cell.
- **`timeline`**: the timeline cell of each row.
- **`bar`**: the bar of a task with duration.
- **`milestone`**: the milestone diamond.
- **`handle`**: the divider between the table and the timeline.

## What it does not do

1. **It does not fetch or save data.** `tasks` comes in, `onTaskChange` goes
   out.
2. **It does not compute the critical path or reschedule.** Moving a task does
   not push its successors; the dashed arrow shows the conflict, and the app
   decides.
3. **It does not create tasks or link dependencies through the drawing.**
   Dragging from one bar to another to create an arrow is application, not
   piece.
4. **It knows no holidays or business days.** The weekend is shaded on the day
   scale and that is all: the duration stays in calendar days.
5. **It knows no time zone**, for the same reason as `EventCalendar`:
   everything is `Date`, in local time.

## When not to use

**If what matters is the time of day, use `EventCalendar`.** A fifteen-minute
appointment, a scheduling clash on a Tuesday, a clinic's agenda: its time grid
shows hours and overlaps, and the `Gantt` one starts at the day. `Gantt`
answers "what comes before what"; `EventCalendar` answers "what clashes with
what".

**If the events have already happened, use `Timeline`.** It looks back, over a
single object, and its events are instants. `Gantt` looks forward, over a
project, and its tasks have duration and dependencies. An invoice's audit trail
drawn as a Gantt is a row of milestones with no arrows at all.

**If nobody needs to see duration or sequencing, use `Table`, or `DataTable`
when it comes from a query.** A list of tasks with due date, assignee and
status, sorted and filtered, is a table, and the table does that better and at
any width. `Gantt` only pays off when the answer is geometric: "this task is too
long", "this one starts before the other finishes".

**If they are steps of a flow the person goes through, use `Steps`.** The
stages of a sign-up have no date or duration.

## In React Native

Does not port, and it is a decision, by the same math that took `EventCalendar` off the phone. `Gantt` exists to show duration and sequence side by side: the table on the left, the scale on the right and the arrow between the two. At 358px the table keeps the title and nothing else, and the week scale shows eleven days per screen; the dependency arrow links bars that are almost never on the same screen at the same time. What remains is a list with colored rectangles, and the list alone says that better.

**Editing is what settles the math.** The web already does not drag with the finger, because the 18px bar competes for the gesture with the frame's own sideways scroll, and it is the same conflict that the `EventCalendar`'s `week` did not solve. A native `Gantt` without dragging would be an expensive table; with dragging, it would be a gesture the house has already measured and refused.

**On the phone, the answer is another piece.** The day's task is a list, built with `Item` or `DataList`, with start, end and owner written out; a deadline with a value is the `Calendar`, which paints per day through `DayPaint`; and a task's progress is the `Progress`. Rescheduling is the form with a `DatePicker`, which is what the finger does well.
