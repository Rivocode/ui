---
category: Charts
---

# ChartContainer

The frame of every chart, on top of Recharts. Lives in `@rivocode/ui/chart`.

It publishes one CSS variable per series, named after the series: `emitidas`
in the `config` becomes `var(--color-emitidas)`, so the line, the bar and the
tooltip speak the same way and changing the color means touching a single
place. Without a declared color, the next one from the eight-color palette
comes in, in the order of the `config`.

Recharts does not read Tailwind classes and does not know our tokens, so the
bridge has to be through variables. Writing the color straight into `stroke`
works until the theme changes.

The height is up to the caller, by class: a chart without a defined height
disappears, because the container measures the parent. Where the frame
measures a width and no height, it warns in the console in development instead
of delivering an empty card. The warning waits for the layout to settle before
complaining, because the box measures zero for one frame on the normal path.

## A query's four endings

The same as `DataTable`'s, and `empty` is the same object: `title`,
`description`, `action` and `icon`. The action is strongly recommended: a chart
that only says "sem dados" pushes onto the person the work of guessing what to
do.

```tsx
<ChartContainer
  config={config}
  className="h-64"
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  empty={{
    title: 'Nenhuma nota em março',
    description: 'O gráfico começa a desenhar assim que a primeira for emitida.',
    action: <Button size="sm">Emitir nota</Button>,
  }}
>
  <LineChart data={meses}>{/* ... */}</LineChart>
</ChartContainer>
```

**The error says what failed.** `errorTitle` and `errorMessage` are the pair:
on a dashboard with four charts, "Não foi possível carregar o gráfico" four
times does not say which one went down, and in a product that does not speak
Portuguese it says nothing. Without them, the default text stays as always.
The two names are the same as `DataTable`'s, on purpose, and they carry over to
React Native with the same defaults. Only the type narrows to `string`, because
the native `Alert` title is a `Text`.

**The retry button is translatable too.** `labels.retry` (default "Tentar de
novo") names the button that runs `onRetry`, with the same key and the same
default in the query components. Without it, a dashboard in English came out
with the title translated and the button in Portuguese.

**The wait is announced out loud.** `aria-busy` on a node without a role is not
read by any screen reader: it describes the state of a region, and only
reaches whoever is already inside it. Whoever was waiting heard silence, and
the arrival of the data, which swaps the whole screen, said nothing either. The
four siblings publish the same live region (`role="status" aria-live="polite"`,
marked with `data-rc-status`), which says "Carregando…" while the query has not
returned and "Conteúdo carregado" when it returns. It exists before the text
changes and is the same node from the first state to the last: a region born
with its text already inside does not trigger any announcement.

The frame already had a live region before this one, and the two coexist: the
active point's, which copies the tooltip when Recharts moves from point to
point via the keyboard, and the wait's. `data-rc-status` and
`data-rc-active-point` tell them apart.

**The point count comes from the chart itself.** The frame reads the `data` of
the Recharts child, so in the form above there is no need to repeat it. Pass
`data` here only when the points do not live in the direct child
(`<ScatterChart>` with the `data` on `<Scatter>`) or when the drawn series is
not the one that decides emptiness.

Before this, emptiness required `empty` **and** `data`, and whoever passed only
the first never saw the state they had asked for: the chart drew axes over
nothing, with no error at all. Where the frame still finds no point to count,
it warns in the console in development instead of staying silent.

**Without `empty`, an empty list shows a short notice**, "Sem dados no
período", in place of axes over nothing. The text is changed via
`labels.noData`. `empty` is still the right path when the screen knows how to
say why and what to do next.

**The `config` key becomes the variable name**, `var(--color-<key>)`, when it
is made of letters, digits, `-` and `_`. A key with a space, a dot or a slash
("Receita total", "v1.2") is not a valid CSS variable name: before, the whole
declaration was discarded by the browser and the series came out black, with
no warning. Now the frame replaces what does not fit with `_` and appends a
short suffix that tells "a b" from "a.b"; it, the legend and the tooltip use
the same name, and nothing changes for whoever paints through the frame. To
write `var(--color-...)` by hand, prefer a simple key.

The Recharts pieces the library dresses come out of the same import:
`LineChart`, `Line`, `BarChart`, `Bar`, `AreaChart`, `Area`, `PieChart`, `Pie`,
`Cell`, `XAxis`, `YAxis`, `CartesianGrid` and `ReferenceLine`.

## Area gradient

A flat area competes with the line that bounds it: the full color below weighs
as much as the stroke above, and in a two-series chart the one behind
disappears behind the one in front.

```tsx
function Faturamento() {
  return (
    <ChartContainer config={config} className="h-64">
      <AreaChart data={meses}>
        <ChartAreaGradient id="faturamento" series={['faturado']} />
        <Area
          dataKey="faturado"
          stroke="var(--color-faturado)"
          fill={areaGradient('faturamento', 'faturado')}
        />
      </AreaChart>
    </ChartContainer>
  )
}
```

The gradient's `id` comes from this chart's `id`. Without it, two charts on the
same page with the same series name would paint one with the other's gradient,
because an SVG `id` is global to the document.

## Motion

The frame handles motion on its own, and no mark needs a prop for it. Every
`Line`, `Bar`, `Area`, `Pie`, `Radar`, `RadialBar` and `Scatter` it wraps comes
out with three props set:

- **`animationDuration`** read from `--rc-duration-slow`, and
  **`animationEasing`** read from `--rc-ease`, at the frame's own computed
  value. Recharts interpolates in JavaScript and cannot see CSS variables;
  that is why the frame reads the token after mounting and hands over the
  number. The Recharts default (1500 ms, `ease`) does not show up anywhere.
- **`isAnimationActive`** on before the mark mounts, and off with "reduce
  motion": **the first time it appears with data, the chart draws itself, and
  after that it moves when the data changes.**

The second is the owner's decision, and replaces the previous one, in which the
chart was born ready. The bar grows from the base, the line and the area reveal
from the left, the donut and the arc sweep from zero. A chart that arrives
after `isLoading`, the error or the empty state also enters drawing: the
skeleton was the wait, and the drawing is the data arriving. After that, what
motion informs is the **change**: the filter changed, the month turned, and the
bar that moves from the old value to the new one shows how much it changed.
There is a single duration, `--rc-duration-slow`, for entering and for
changing: Recharts restarts the animation when the duration changes, and
changing the number after the entrance would make the chart draw itself twice.

**On the server the chart does not draw.** Recharts only paints after
measuring the box, so the SSR HTML comes out with the frame, the legend and the
announcement, and without the SVG. The frame reads the tokens in a layout
effect, before the measurement arrives, and the first mark that mounts on the
client already mounts animated: there is no frame with the finished drawing
that then disappears to grow again. The error `Alert` and the empty
`EmptyState` enter with their own motion.

A mark with `isAnimationActive={false}` stays still: the frame only turns on
what nobody turned off. `animationDuration` and `animationEasing` written by
hand also win.

`useChartMotion()` is still exported and returns the same trio, for whoever
draws with Recharts **outside** the frame:

```tsx
const motion = useChartMotion()

<Line dataKey="pagas" stroke="var(--color-pagas)" {...motion} />
```

Inside `ChartContainer` it is unnecessary, and spreading it changes nothing:
the frame dresses the mark the same way. Outside it, the entrance depends on
the mark mounting after the first effect, which is what happens with a chart
inside a `ResponsiveContainer`, which only draws after measuring. In a chart
with fixed width and height, the mark mounts in the same frame as the hook, is
born ready and only moves when the data changes.

## The Recharts pieces exported from here

`Area`, `AreaChart`, `Bar`, `BarChart`, `Line`, `LineChart`, `Pie`, `PieChart`,
`Cell`, `Scatter`, `ScatterChart`, `Radar`, `RadarChart`, `RadialBar`,
`RadialBarChart`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`,
`CartesianGrid`, `XAxis`, `YAxis`, `ZAxis`, `LabelList`, `Rectangle`,
`ReferenceLine` and `ReferenceArea`.

The list is curated, not an `export *`. Recharts' `Tooltip` and `Legend` do
**not** come out from here: ours already wrap both, and the name would collide
with the catalog's `Tooltip`.

## The axes

`ChartXAxis` and `ChartYAxis` wrap Recharts' with the theme's color, font and
spacing, and with the house `format`: `format="dayMonth"` on the time axis,
`format="currencyShort"` on the value axis. Without them, each screen writes
its own `tickFormatter` and one axis reads differently from another: R$ 12.400
here, 12400 there, 12,4k on the third.

## In React Native

Translates, on its own path `@rivocode/ui-native/chart`, with the same arrangement as the form and for the same reason: `react-native-svg` is an **optional** peer, and on the phone it is not just bytes, it is a native module the app has to link and rebuild.

**What crosses over whole are the four endings.** `isLoading`, `isError`, `onRetry`, `errorTitle`, `errorMessage`, `labels.retry`, `empty` and `data` have the same names and the same meaning, and the loading state draws the same six uneven bars. Three type differences, all because text on native lives inside a `Text`: `errorMessage`, `empty.title` and `empty.description` are `string`. `empty.icon` crosses over, and also accepts the native `EmptyState`'s function. The try-again button sits **outside** the alert: the native `Alert` has a title and a body, and the body is one line of text.

**What changes is the drawing.** On the web the frame wraps a Recharts chart, which measures its parent on its own and reads each series' color from `var(--color-series)`. Here there is no Recharts, no measuring container and no live variable. So the frame measures with `onLayout`, resolves the colors of the `config` and **hands both things** to whoever draws, the way the native `Form` hands over `submit`:

```tsx
<ChartContainer config={SERIES} data={meses} className="h-56">
  {({ width, height, colors }) => (
    <Svg width={width} height={height}>…</Svg>
  )}
</ChartContainer>
```

The frame's `colors` is a **map keyed by the `config` key**, not an array: it is the web's `var(--color-series)` in another vehicle, and whoever draws asks for the color of `receita` by name, which is what survives someone reordering the `config`. The array is `PALETTE`, and it is an array on both sides: it is the fallback order, where the color comes from for a series that did not declare `color`. The difference is that here it is **exported**, because without a live variable whoever draws by hand needs to reach it.

The measurement arrives **zeroed on the first frame** and real on the next: on the phone there is no width before layout. `children` also accepts plain JSX, and that is how `ChartDonut` and `ChartRadial` get the four endings without needing anything from the frame.

Two more rules, both because of what does not exist on this side. `config.color` asks for a **token role** (`chart-1` to `chart-8`), not a CSS color: the color the piece receives is the final value that goes into the drawing, and a hex written there would be the only thing on the screen deaf to the client's theme. And `label` only applies in the function form: with a JSX child, the one naming is the inner piece, and an `accessible` on top of it would close the donut's legend into a single screen reader stop.

**Motion comes in two marks, because here there is no `Line` or `Bar` for the frame to dress.** `ChartBar` is the bar (`x`, `y`, `width`, `height`, `fill`, `radius`) and `ChartLine` is the line (`points` in px, `stroke`, `strokeWidth`, `baseline`), both on the same `/chart` path. On mount they enter (the bar grows from its base; the line rises from the `baseline`, or from the lowest point) and, when the value changes, they move to the new one with the duration and curve of the tokens (`duration-slow`, `ease`), through Reanimated over `react-native-svg`: the same decision as the web, that the chart draws itself on appearing and moves when the data changes. With "reduce motion" they are born in place and jump. The line moves point by point when the count is the same as before, and swaps all at once when it is not. Whoever draws with raw `Rect` and `Path` still can, and it stays still.
