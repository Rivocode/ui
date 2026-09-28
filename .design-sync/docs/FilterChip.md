---
category: Structure
---

# FilterChip

An applied filter: the field, the value and the X that removes it.

```tsx
<FilterChip label="Cliente" value="Clínica São Lucas" onRemove={tirar} />
```

`label` renders in normal weight and `value` in medium weight. That is the
chip's hierarchy, and it is the only one: "Cliente" is the question, and what
gets read at a glance is the answer. Without `value` the chip becomes the field
alone, which works for a boolean filter: "Vencidas", "Com anexo".

## No status color, on purpose

It is a cousin of `Badge` and comes from the same design (the same pill, the
same border, the same two `size` heights), but it **has no `tone`**. A filter
is not a status: a row of six colored chips turns into a traffic light where
no color means anything, and the house rule is to use tone for meaning and
never for the color you want. Whoever needs color is describing a situation,
and for that there is `Badge`.

## The X's name

`labels.remove` receives the already assembled text and returns what the
screen reader hears. The default is "Remover filtro Cliente: Clínica São
Lucas" when the value is text, and "Remover filtro Cliente" when it is not.
There is no way to read the text back out of a `ReactNode`. It is the same
`labels.remove` as in `TagsInput` and `ComboboxChip`, and it exists for the
same reason: without it a row announces itself "Remover, Remover, Remover".

```tsx
<FilterChip
  label="Emissão"
  value="01/08 a 31/08"
  labels={{ remove: (filtro) => `Tirar o filtro ${filtro}` }}
  onRemove={tirar}
/>
```

The X draws at 12px, and the area the finger reaches is stretched by a
pseudo-element to the 24px of WCAG 2.5.8 (the same approach as the `Combobox`
and `TagsInput` chip, which does not fatten the pill).

## Without `onRemove` there is no X

That is how you show a filter the application locks: the person's branch, the
tenant, the period the closing fixed. It shows because it explains the result,
and it does not go away because leaving it is not the reader's choice.

## The chip does not handle focus

It unmounts when whoever renders it removes it from the list, and the X
unmounts with it: the focus that was on it falls back to `<body>` if nobody
chooses where it lands. Inside `FilterBar` that bill is already paid: it moves
focus to the next X, and from there to "clear". Outside it, whoever builds the
row inherits the bill.

## The value that does not fit

The value truncates with an ellipsis at 10rem and carries the whole text in
`title`. That is what stops a company's legal name from stretching the chip to
twice the screen on a 390px device, where it almost always lives inside a
`FilterBar` that scrolls horizontally.

That cut is **the chip's**, and it happens inside the pill. A chip cut off
vertically, in the middle of a letter and without an ellipsis, is not a defect
here: it is the edge of the `FilterBar` scroller, and it is the scroller that
fades to signal that the row continues.

## Parts

`classNames` dresses `label`, `value` and `remove`.

## When not to use

To say what status a row is in ("Paga", "Vencida", "Rascunho"), use `Badge`:
it describes the data, does not go away at the reader's will and has no X.
`FilterChip` describes a **slice of the list**, and removing it changes what
you see.

Inside a field that produces its own values, the right chip is the one from
`TagsInput` or from `Combobox` with `multiple`: there it is the field's value
and lives inside its frame, with the field's focus ring around it.
`FilterChip` lives outside any field.

And for a filter that toggles on and off in the same place, use `Toggle` or
`ToggleGroup`: the chip is the summary of a choice made elsewhere, not the
place to make it.

## In React Native

Translates, with the same vocabulary as the web: label, value and the remove button, no `tone`. A filter is not a status, and six colored chips become a traffic light where nothing means anything.

**The target grows without the chip getting fatter.** The root is a 44pt strip and the painted pill is an absolute child inside it, so it stays at 28pt as on the web. The x inherits the strip's 44 vertical points and gets horizontal `hitSlop`.

The strip was stretched instead of using vertical `hitSlop` for a platform reason: **on Android a touch outside the parent's bounds is not delivered**. With the 28pt pill as the parent of the button, the slack above and below would be discarded precisely on the device that lacks target the most. Declared consequence: `size` changes only the drawn pill, never the strip's height: the finger does not shrink along with the chip.

The parts are styled through the same `classNames` as the web: `label`, `value` and `remove`, the x's tap target.
