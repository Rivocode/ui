---
category: Charts
---

# ChartHeatmap

A grid of rows by columns in which each cell's color says the size of the
number: invoices issued by weekday and hour, tickets by team and week.

```tsx
<ChartHeatmap
  data={emissoes}
  rowKey="dia"
  columnKey="hora"
  valueKey="total"
  rows={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']}
  label="Notas emitidas por dia da semana e hora"
/>
```

`data` comes in long format, one row per cell, which is what a
`GROUP BY dia, hora` returns. `rows` and `columns` give the order and bring
into the grid the row that had no record at all: without them, the Sunday with
no issuing disappears from the table instead of showing up empty.

## The scale

There are five steps of a single color, from the thinnest to the fullest. The
strongest step is the series color itself (`var(--rc-chart-1)`, or the one in
`color`) and the four below are the same color as a thinner tint over the
background, so the scale follows the theme without any new color. The ruler
below shows the five steps between the smallest and the largest number.

The range comes from the data: from zero (or from the smallest value, if there
are negatives) to the largest. Two grids side by side that need to be compared
call for the **same ruler**, and that is what `domain` is for: without it, the
fullest step of each one means a different number.

The column labels show up every so often when they do not all fit: the
component measures the width of the cells, without the row-label column, and
leaves about forty pixels for each label it writes, so 24 hours in a phone card
come out every four, without ellipses. A label that does not show up is still
in the screen reader table.

The row label takes what it needs up to 40% of the grid, and never more than
`10rem`: a customer's long name ends in an ellipsis, and the rest of the width
goes to the cells. The full name is in the tooltip and in the table.

A grid without variation (all zero, or a `domain` with both numbers equal)
paints the thinnest step, not the fullest: with no difference to show, the grid
does not shout.

## Zero is not empty

A cell with `0` is a value, and paints the first step. A cell without data (a
combination that did not come in `data`, or came with `null`) has no tint at
all and carries a dashed border. The two read differently on purpose: "nobody
issued at 10 p.m." and "we did not collect 10 p.m." are different answers to
the same question, and a grid that paints both the same way lies in one of
them. The tooltip, the hidden table and the ruler say "Sem dado", or whatever
you write in `labels.empty`.

## Tooltip, keyboard and screen reader

The pointer over a cell opens the tooltip with the row, the column and the
number. The whole grid is **a single Tab stop**, and from there the arrows move
cell by cell (`Home` and `End` go to the ends of the row, and with `Ctrl` to
the ends of the grid), with the same tooltip open and the same text announced.
One hundred sixty-eight Tab stops inside a card would be an obstacle, and it is
the same decision as `Tracker`.

For the screen reader the drawing is not the source: next to it there is a
**real table**, visually hidden, with the caption you wrote in `label`, the row
and the column as headers and the number written in each cell. It is the one
navigated with table commands, and that is why `label` is required.

## The number does not go in the cell

In a seven-by-twenty-four grid the cell is twenty-something pixels, and the
number written there neither fits nor reads. It lives in the tooltip and in the
table. When the question is the exact number of each intersection, and not the
pattern, the right component is `DataTable`.

## Motion

The grid fades in, and when the data changes each cell changes step in
`--rc-duration-slow`. With "reduce motion", the change is abrupt.

## No data

`empty` is the same object as in `ChartContainer` and `DataTable`: `title`, a
required `description`, optional `action` and `icon`. It shows up in place of
the drawing when there is nothing to paint: an empty list, no cell with a
number, or all at zero. Without it, the grid draws only the rows and columns that `rows` and `columns` declare, all dashed.


A single row, one state per period, is `Tracker`: it shows whether each day was
good or bad, not how much. A single series over time is `LineChart` inside
`ChartContainer`, which shows the trend that color hides. And few categories
with the value as the subject are a horizontal bar: color is the least precise
way to compare two numbers, and the heatmap only pays off when the subject is
the **pattern** that shows up across the whole grid.

The component does not have a query's four endings: loading, error and empty
come from the `QueryBoundary` around it.

## In React Native

Translates, in `@rivocode/ui-native/chart`, with the same props: `rowKey`, `columnKey`, `valueKey`, `rows`, `columns`, `domain`, `labels`, `legend`, `format`. The scale is the same, five steps of a single color, and the alphas come from the same constant as the web, generated in `native/src/shared/`. Zero paints the first step and a cell with no data has a dashed border, the same.

One type change: `color` is a token role (`chart-3`).

**What changes is how a cell is read.** On the web the pointer rests and the tooltip opens, and the screen reader navigates a hidden table. On the phone there is no tooltip and no table: the finger taps or drags over the grid and picks the cell under it, which gets an outline, and the row, the column and the number appear written below the grid. For the screen reader the grid is **a single `adjustable` stop**, which moves cell by cell with the swipe up and down gesture, the same decision as the `Tracker`: one hundred and sixty-eight stops inside a card would be an obstacle, and the value of each one goes whole into `accessibilityValue`.

At most six column labels appear, not by measured width as on the web: the phone screen is always narrow, and a label that does not appear is still spoken in the reading.

The parts are styled through the same `classNames` as the web: `grid`, the stop that receives the drag, `cell` and `legend`. With `empty` (the `ChartContainer` format), a grid with no number or all zeros gives way to the empty state; without it, an all-zero grid keeps painting the faintest step.
