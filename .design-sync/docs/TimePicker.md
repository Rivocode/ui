---
category: Forms
---

# TimePicker

`TimeField` with the time-choosing panel.

Same value, same format, same keyboard: everything the `TimeField` page says
about `"14:30"`, about `25:99`, about `step`, `min` and `max` still holds here.
What this piece adds is the clock in the corner of the field, and what it
opens.

```tsx
const [entrega, setEntrega] = useState('09:00')

<TimePicker value={entrega} onValueChange={setEntrega} min="08:00" max="18:00" step={30} />
```

## Two columns, not one list

The panel has a column of hours and one of minutes, not a single list of times.
A single list only seems simpler until `step={5}`, when it becomes 288 rows to
scroll; in two columns it is 24 and 12, and the hour is always the first
decision.

The minutes come from `60 / step`, so the step is most readable when it divides
60: 1, 5, 15 and 30 are the ones the piece was designed to serve.

The text above each column is its name: the column takes it through
`aria-labelledby`, and the text is `aria-hidden` so it is not read loose right
before the box is announced with the same word. Before, there were two: a
`<span>Hora</span>` and an `aria-label="Hora"`, said one after the other, in
both columns. Changing `labels.hours` or `labels.minutes` changes both at once,
because now it is a single text.

**The hour does not close the panel; the minute does.** The minute is the last
decision, and closing before it would force reopening the panel halfway through
the choices. Choosing another hour keeps the minute that was already chosen:
whoever changes 14:30 to 16 wants 16:30, not 16:00, even when the minute was
typed off the grid, because `14:07` was someone's choice. If the new hour
throws the time outside the window, it rests against the window's limit instead
of leaving it.

The keyboard arrow moves through the column and takes the selection along,
without closing anything; Enter and the click close when they are on the
minute. On opening, the column already scrolls to the chosen hour.

## The window trims the panel

`min` and `max` remove from the panel what is outside: with `min="08:00"` and
`max="10:00"` the hours column goes from 08 to 10, and at 10 only the minute
`00` remains. Trimming is better than offering and complaining later: the
delivery window is a store rule, not the person's mistake.

The window **trims the grid, it does not shift it**: with `min="08:10"` and
`step={15}`, the first time offered is `08:15`. The grid always starts from
midnight, so that `08:15` means the same thing across the whole screen. Whoever
needs `08:10` types it in the field, which accepts it.

## On the phone, the panel is a sheet

At 390px the panel does not fit anchored to the field, so it rises from the
bottom as a `Sheet`, through the same `CalendarPanel` that `DatePicker` uses.
The two columns split the full width, and each option has the height of a house
control: a finger target, not a mouse one. From the `sm` width up the panel is
a `Popover` anchored to the field again, aligned to the right.

## Parts

`className` dresses the frame that joins field and clock, because it is the one
that has the width. The rest comes in by part:

| Part | What it is |
|---|---|
| `field` | the typing field |
| `trigger` | the clock button, inside the field |
| `panel` | the floating panel, or the sheet on the phone |
| `column` | each of the two scrollable columns |
| `option` | each hour and each minute |

```tsx
<TimePicker className="w-56" classNames={{ column: 'max-h-40', option: 'font-mono' }} />
```

The texts the screen reader hears come in through `labels`, and each one has its
own default. Changing one does not erase the others:

```tsx
<TimePicker labels={{ open: 'Escolher o horário da coleta', title: 'Horário da coleta' }} />
```

## When not to use

If the screen is an operations one (time clock, timesheet entry, an import
checked row by row), use `TimeField`. Whoever types all day does not open a
panel, and the clock in the corner only takes up the field's width.

If the times are few and fixed ("manhã, tarde, noite", or the four windows the
carrier serves), use `Select`: there the options have names, and a name says
more than `08:00 - 12:00` written in two columns.

For a date, `DatePicker`; for a date range, `DateRangePicker`. This piece knows
no day at all, on purpose.

## In React Native

Translates as a trigger plus a **bottom sheet**, which is the house decision for panels on the phone. Two scrollable columns for the same reason as the web, which weighs more here: `step={5}` in a single list is 288 rows to scroll with the thumb. Each option is 48pt, above the required 44pt, and the column scrolls to the chosen time each time it opens.

**The structural difference, and it is not aesthetic:** on the web the clock lives INSIDE the field; here it does not. A `TextInput` inside a `Pressable` swallows the parent's touch, and the trigger needs to be a single target for the screen reader. Every native picker in the house (`DatePicker`, `DateRangePicker`, `Select`, `Combobox`, `TreeSelect`) is already trigger plus sheet, and the split comes out cleaner than on the web: `TimeField` is typing, `TimePicker` is tapping.

The hour does not close the sheet and keeps the minute; the minute closes it. `labels` loses `open` and `title`, because here the required `label` already names the trigger AND titles the sheet, the same arrangement as `DateRangePicker`.

The parts are styled through the same `classNames` as the web: `trigger`, `panel` (the sheet), `column` and `option`. `field` does not exist here: the clock does not live inside a field, and the trigger is already `trigger`.
