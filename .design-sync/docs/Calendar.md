---
category: Forms
---

# Calendar

The bare month, for whoever wants the calendar on the screen itself.

It is the only component in the catalog with an outside foundation,
`react-day-picker`, and it comes in only as an engine: none of its style sheets
is imported, the whole drawing comes from our tokens. The default locale is
`pt-BR`.

At phone width it shows a single month, even when more are asked for, and the
day gets a 44px target. On screens narrower than that, below about 360px, the
day shrinks with the screen so the seven columns fit without horizontal
scrolling: at 320px each day is about 38px, still above the 24 of WCAG 2.5.8.

## Value

The selected day comes in through `value` and goes out through
`onValueChange`, as in every picker in the catalog and as in
`@rivocode/ui-native`. The value can be a `Date` or `yyyy-mm-dd` text, and the
component answers in the format it received: whoever passes text gets text,
and the same call compiles in both packages.

```tsx
const [vencimento, setVencimento] = useState<string | null>(null)

<Calendar
  value={vencimento}
  onValueChange={setVencimento}
  min="2026-09-01"
  max="2026-12-31"
/>
```

Without state of your own, `defaultValue` gives the initial day and the
calendar keeps the selection on its own, in the same two formats and answering
in the same format, like `DatePicker`:

```tsx
<Calendar defaultValue="2026-09-25" onValueChange={(dia) => console.log(dia)} />
```

The text is read as a calendar day, not as an instant: `"2026-09-25"` is
September 25 in any time zone. JavaScript's `new Date("2026-09-25")` reads
midnight UTC, which in Brasília is still the 24th.

`min` and `max` are inclusive and accept the same two formats. Days outside
them are disabled, and navigation stops at the month of each end. Tapping the
selected day again does not deselect it.

A single date is always `value` and `onValueChange`, with no `mode`. Several
separate dates and a range go through `react-day-picker`'s `mode`, `"multiple"`
or `"range"`, with `selected` and `onSelect`; there `min` and `max` also accept
a number, which is the minimum and maximum number of days in the selection.

```tsx
<Calendar mode="range" selected={periodo} onSelect={setPeriodo} min="2026-01-01" />
```

Changing month animates: the new month comes in from the side the person moved
toward, in 200ms, and with "reduce motion" on the change is instant.
`animate={false}` turns it off.

## In React Native

Translates: `@rivocode/ui-native` exports `Calendar` - month drawn by hand; `value`, `onValueChange`, `min` and `max` in ISO `yyyy-mm-dd`, which the web also accepts; displayed as `dd/mm/yyyy`; the new month fades in; `classNames` with the names of the web's `DayPicker`. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
