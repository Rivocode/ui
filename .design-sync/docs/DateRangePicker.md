---
category: Forms
---

# DateRangePicker

A date range, for report and listing filters.

There is no typing here, and that is the deliberate difference from
`DatePicker`: a range mask asks for two dates in a single field, and the cost
of getting keyboard, pasting and reversed order right does not pay off.

The footer with Apply is on by default, unlike `DatePicker`, and the
difference is on purpose: a range takes two clicks. The first already closes a
one-day range and the second stretches it to the end, so without `confirm`
`onValueChange` would fire twice, and a listing filter would reload twice.

## Value

`value` and `defaultValue` accept ends as `Date` or as `yyyy-mm-dd` text, and
`onValueChange` answers in the format it received. The contract is one and the
same in both formats, and it is the one from `@rivocode/ui-native`: only a
**closed** range comes out, with `from` and `to` required (`DateRange` in
`Date`, `IsoDateRange` in text), and `null` when the selection is emptied. A
half-picked range stays in the calendar's draft until it gets its second end,
and never reaches the caller.

```tsx
const [periodo, setPeriodo] = useState<IsoDateRange | null>(null)

<DateRangePicker
  value={periodo}
  onValueChange={setPeriodo}
  min="2026-01-01"
  max="2026-12-31"
/>
```

With `Date`, the empty value that goes in is `undefined`, because `null` in
`value` is what picks the text format. Store `DateRange | null` and pass the
empty value on as `undefined`:

```tsx
const [periodo, setPeriodo] = useState<DateRange | null>(null)

<DateRangePicker value={periodo ?? undefined} onValueChange={setPeriodo} />
```

`min` and `max` are inclusive: they disable the days outside and stop
navigation at the month of each end, which is what a range filter needs to
stay within the open fiscal years. `showOutsideDays` and `locale` pass through
to the calendar, as in `DatePicker`.

## The second range extends, it does not restart

With a whole range on screen, the next day clicked **moves one of the ends of
the existing one**, instead of starting over. The rule is about position, not
order: a day before the start pulls the start back, and any day after it
becomes the new end - including a day in the middle of the range, which thus
shortens the range instead of opening a new one from there. It is the only
rule that throws no work away: the calendar has no way of knowing which of the
two ends the person meant to move, and guessing wrong would erase a date they
just picked.

To switch to a different range instead of stretching the current one there are
two doors, and it is good to know both before you need them. `Limpar` resets
the selection **and closes the panel** - and it does not clear just the draft:
it confirms the empty value, calling `onValueChange` with `null` without
waiting for `Aplicar`, in both formats, so a filter wired to it reloads empty
and reopening the panel is one more click. The other door closes nothing:
clicking exactly on one of the two ends turns the range into a one-day range
right there, and the next click already extends from that day.

With `confirm={false}` there is no footer, and therefore no `Limpar`: then the
end is the only way, and clicking the one-day range again is what empties it,
with the same `null`.

## In React Native

Translates, with a single design: **one month, in a bottom sheet, with the range painted on the grid itself**. The web's two side-by-side months do not fit (390px split in half gives 27px cells, and the minimum touch target is 44), and two `DatePicker`s in sequence, which is what this table told you to do until now, lose precisely what makes the piece exist: both ends on the same grid, with the days in between painted. **Validating end-before-start is no longer your job**: tapping 20 and then 5 gives back 5 to 20, because the piece orders the two ends instead of discarding the first tap, and `Aplicar` stays disabled while the second is missing. That is why the type changed: the `DateRange` here has **required** `from` and `to`, both as ISO `yyyy-mm-dd`, and empty is `null` - the same `IsoDateRange` the web accepts and returns when it receives the value as text, and the same contract as the web in both formats: `onValueChange` only receives a closed range, and `null` on Limpar. A half range comes out of neither package: whoever wants to follow along reads the summary the sheet itself writes above the month. No `confirm`: the sheet always confirms, because a tap outside it is the gesture of giving up and cannot count as applying.
