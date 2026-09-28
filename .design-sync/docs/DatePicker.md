---
category: Forms
---

# DatePicker

A date field: you can type it and you can pick it on the calendar.

Typing comes first on purpose. Someone who fills in forms all day types
`03032026` faster than they navigate three months back.

Half-typed text does not become a date, and on leaving the field whatever did
not become a date goes back to the last valid one. `31/02` does not become
March 3rd.

With `confirm`, clicking a day becomes a draft and only Apply writes the value.
It starts off here and on in `DateRangePicker`, and the difference is on
purpose: a single date is picked in one click, and a range takes two, which
would make a filter without a footer reload twice. On a phone the panel becomes
a bottom sheet, through `CalendarPanel`.

## Value

`value` and `defaultValue` accept a `Date` or `yyyy-mm-dd` text, and
`onValueChange` answers in the format it received. In text, the call is the
same as in `@rivocode/ui-native`:

```tsx
const [vencimento, setVencimento] = useState<string | null>(null)

<DatePicker
  value={vencimento}
  onValueChange={setVencimento}
  min="2026-09-01"
  max="2026-12-31"
/>
```

In text, a field that is emptied answers `""`, like `TimeField`. With `Date`,
it answers `undefined`, which is what the piece always did. To start empty
without controlling the state, `defaultValue=""` picks the text format.

The text is read as a calendar day, not as an instant: `"2026-09-25"` is
September 25 in any time zone. JavaScript's `new Date("2026-09-25")` reads
midnight in UTC, which in Brasília is still the 24th, and that is why the piece
never passes the text through it.

`min` and `max` are inclusive. They apply to the calendar, which disables the
days outside and stops navigation at the month of each end, and to what is
typed: a date outside the window does not reach `onValueChange`, and on
leaving the field the text goes back to the last valid date. `disabledDays` is
for a one-off blocked day, such as a holiday, and applies the same way to what
is typed.

## Date and text

The three functions that bridge to `Date` ship with the package, because a
screen that shows a date outside a field needs the same rules:

| Function | What it does |
|---|---|
| `formatDate(data)` | `Date` to `dd/mm/aaaa`, and an empty string when there is no date |
| `parseDate(texto)` | `dd/mm/aaaa` to `Date`, and `undefined` for what is not a date |
| `applyDateMask(texto)` | The mask while typing: adds the slashes and stops at eight digits |

`parseDate` returns `undefined` for a date that does not exist. `31/02/2026`
does not become March 3rd, which is what `new Date` would do on its own and is
the source of half the wrong due dates in an invoicing system.

Everything here works in the browser's local date on purpose: the person chose
"March 3rd" on the calendar on their screen, not an instant in UTC.

## In React Native

Translates: `@rivocode/ui-native` exports `DatePicker` - opens the sheet with the month; stores ISO `yyyy-mm-dd`, which the web also accepts, and displays `dd/mm/yyyy`. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
