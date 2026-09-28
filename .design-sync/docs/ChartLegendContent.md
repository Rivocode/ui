---
category: Charts
---

# ChartLegendContent

The legend, with the name the `config` gave each series. It goes in the
`content` of `ChartLegend`.

Without it Recharts shows the raw data key, `qtd_emitidas` instead of
"Emitidas": a field name is not screen text.

In a pie every slice shares the same `dataKey`, and what tells one from another
is the `name`. The legend looks at both, in that order.
