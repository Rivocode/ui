# Charts: `@rivocode/ui/chart`

It does not come in the main package. It is an optional dependency, and it
arrives through the same provider. Install alongside: `recharts`.

Recharts dressed by the theme. Each series' color comes from `config` and
becomes a variable named after the series. **The height is yours, by class: a
chart without height disappears** - and the frame reports it in the console in
development, when it measures a width and no height.

```tsx
import {
  Area, AreaChart, CartesianGrid, ChartContainer, ChartTooltip,
  ChartTooltipContent, ChartXAxis, ChartYAxis, type ChartConfig,
} from '@rivocode/ui/chart'

const config: ChartConfig = { billed: { label: 'Faturado' } }

<ChartContainer config={config} className="h-72">
  <AreaChart data={months}>
    <CartesianGrid vertical={false} />
    <ChartXAxis dataKey="month" />
    <ChartYAxis format="currencyShort" />
    <ChartTooltip content={<ChartTooltipContent config={config} />} />
    <Area dataKey="billed" stroke="var(--color-billed)" fill="var(--color-billed)" />
  </AreaChart>
</ChartContainer>
```

`ChartXAxis` and `ChartYAxis` already come without the thick line and without
the 2015 tick mark. `format` accepts `currency`, `currencyShort`, `compact`,
`integer`, `percent`, `monthShort`, `dayMonth`, or a function of yours. All nine
are gathered in `formatters`, and **also come out of the root** `@rivocode/ui`:
formatting money in a table cell is not a chart matter, and importing from the
chart subpath to write a `Stat` drags recharts along for no reason.

`compact` abbreviates with a symbol, `12,4K`, `1,2M`, which is the dashboard
convention and fits in fewer pixels, and on an axis width is space taken from
the chart. `compactWords` and `currencyShortWords` write `12,4 mil`, which
reads better in running text. **Do not mix the two on the same screen.**

**Money comes out abbreviated.** `currencyShort` in indicators, tables, axes,
legends and tooltips. `currency`, spelled out, is for where the cent is the
subject: the amount the person confirms before issuing, and the receipt
afterwards.

| Piece | What for |
|---|---|
| `ChartAreaGradient` + `areaGradient(id, series)` | Area gradient. **The `id` is yours, and it has to be unique on the page** |
| `ChartDonut` | Donut with the total in the hole and the list of slices below |
| `ChartRadial` | The arc of a single measure: goal, quota, conversion |
| `ChartGauge` | Gauge from 0 to `max` with bands (`bands`) that judge the number: on track, attention, critical |
| `ChartHeatmap` | Row-by-column grid where color tells the size: issuances by day and hour |
| `ChartFunnel` | The stages of a path, with the conversion rate written between them |
| `ChartTreemap` | Area proportional to each category, with the label that disappears when it does not fit |
| `Sparkline` | The tiny line that fits inside an indicator |
| `ChartLegend` + `ChartLegendContent` | The legend, with the name that is in `config` |
| `useSeriesToggle` | The legend becomes a filter: clicking hides the series |
| `useChartMotion` | Duration and curve from the tokens, and "reduce motion", for a mark outside the frame |

Radar, scatter, polar and `LabelList` also come out of here. Recharts'
`Tooltip` and `Legend` do **not**: ours already wrap both.

Recharts does not animate through CSS, it interpolates in JS, and no token
reaches it on its own. **`ChartContainer` solves this for you**: every mark
inside it comes out with the `--rc-duration-slow` duration, the `--rc-ease`
curve, and the animation turned on before the mark mounts, and off with "reduce
motion". **The first time it appears with data, the chart draws itself**: the
bar grows from the base, the line and the area reveal themselves, and when the
data changes each mark moves from the old value to the new one. Going from the
skeleton, the error or the empty state to the data also enters drawing. Do not
write `isAnimationActive` or `animationDuration` on the mark.
`isAnimationActive={false}` written by hand still holds, for the mark that has
to stay still.

On the server the chart does not draw: Recharts only paints after measuring the
box, so the SSR HTML comes out with the frame, and the drawing is born on the
client, already entering. There is nothing to flash, because there was no
drawing before.

Outside the frame, spread `useChartMotion()`, which returns the same trio:

```tsx
const motion = useChartMotion()

<Line dataKey="paid" stroke="var(--color-paid)" {...motion} />
```

`ChartDonut` and `ChartRadial` enter sweeping from zero and move to the new
value on their own. `Sparkline` only fades in, at `--rc-duration-base`, and
does not move on data change: in a table it appears by the dozen, and twenty
rows drawing themselves at the same time are a wave crossing the screen.

`areaGradient` is a pure function on purpose. The first version took the `id`
from a context, and `<Area>`'s `fill` is evaluated in the outer render, where
that context does not exist yet; whoever wrote the obvious got a runtime error.

## Heatmap, gauge, funnel and treemap

The four are drawn in-house, without Recharts, and **do not go into
`ChartContainer`**: loading, error and empty come from the `QueryBoundary`
around them.

```tsx
import { ChartFunnel, ChartGauge, ChartHeatmap, ChartTreemap } from '@rivocode/ui/chart'

<ChartHeatmap data={emissoes} rowKey="dia" columnKey="hora" valueKey="total" label="Notas por dia e hora" />
<ChartGauge value={8.4} max={20} bands={[{ until: 5, tone: 'success', label: 'Em dia' }, { until: 20, tone: 'danger', label: 'Crítico' }]} />
<ChartFunnel data={adesao} valueKey="total" nameKey="etapa" label="Funil de adesão" />
<ChartTreemap data={porServico} valueKey="total" nameKey="codigo" label="Faturamento por serviço" className="h-72" />
```

- **`ChartHeatmap`**: `data` is long-form, one row per cell. A combination that
  does not come is an **empty cell** (dashed border), and `0` is a value (first
  step): do not swap one for the other. `rows` and `columns` give the order and
  bring in the row without records. `domain` fixes the scale when two grids are
  compared. `label` is required: it becomes the caption of the hidden table the
  screen reader reads.
- **`ChartGauge`** judges, `ChartRadial` measures against a goal, `Meter` only
  says how much. Use the gauge when the band has a name and going up can be
  worse.
- **`ChartFunnel`**: stages that are subsets of one another. Without that there
  is no conversion, and it is a horizontal bar.
- **`ChartTreemap`**: above six categories, where the donut stops informing. The
  height is yours, by class (default `h-64`).
