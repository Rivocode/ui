---
category: Charts
---

# ChartTooltipContent

The tooltip that follows the pointer, dressed in our tokens. It goes in the
`content` of `ChartTooltip`.

It replaces the Recharts tooltip entirely, instead of painting over it: the
original ships with a white background and a gray border written as inline
styles, and no class can fix an inline style; in the dark theme it becomes a
white rectangle in the middle of the chart.

`formatValue` formats the number; use it for money and percentages.
