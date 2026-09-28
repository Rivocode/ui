## How to build with @rivocode/ui

RivoCode's white-label library. No component knows the brand color: it asks
for a semantic token and the theme answers. That is what lets the same piece
serve RivoCode in one project and another client in the next.

### Wrap everything in RivoProvider

Without it nothing has style, and `Dialog`, `Menu`, `Select`, `Tooltip` and the
toasts throw, because they read its context.

```tsx
import { RivoProvider, Button } from '@rivocode/ui'

<RivoProvider theme="rivocode-dark" density="comfortable">
  <Button>Salvar alteracoes</Button>
</RivoProvider>
```

- `theme`: `rivocode-dark` (default), `rivocode-light` or `system`.
- `density`: `comfortable` (default) or `compact`, for operations screens.
- `scope`: `global` dresses the page; `local` dresses only this tree and
  **paints the background**. In a preview and in an isolated card use `local`,
  or the content ends up light on light.

The Provider already carries inside it the tooltip provider, the toast wiring
and a portal container that carries the theme along. Do not mount any of them
by hand.

Inside the theme, any box's scrollbar comes out thin and in the border color
(`--rc-border-strong`), light or dark with the theme. The rule lives in the
`base` layer, so a class of yours wins: `[scrollbar-width:none]` hides the bar,
as the tabs and the carousel already do.

### The vocabulary, which is Tailwind v4's

Write layout with the same classes the components use. **Never write a
literal color or a numeric `z-index`.**

| Family | Classes |
|---|---|
| Surface | `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-overlay` |
| Text | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled` |
| Accent | `bg-accent`, `text-accent-fg`, `text-accent-text`, `bg-accent-subtle` |
| Line and focus | `border-border`, `border-border-strong`, `ring-ring` |
| State | `bg-success`, `text-success-text`, `bg-danger-subtle`, and the same for `warning` and `info` |
| Selection and loading | `bg-selected`, `bg-skeleton` |
| Machine-read code | `fill-code-ink`, `bg-code-paper`, `text-code-ink`: dark on light with the same value in every theme, and they are not theme roles |
| Media stage | `bg-media-stage`, `bg-media-control`, `text-media-fg`, `text-media-fg-muted`, `border-media-border`, `text-media-disabled`: dark in both themes with the same value, and they are not theme roles. They belong to the full-screen `ImageViewer` |
| Signature paper | `bg-signature-paper`, `fill-signature-ink`, `text-signature-guide`, `stroke-signature-guide`, `text-signature-disabled`: dark ink on light paper in both themes, and they are not theme roles. They belong to `SignaturePad`, so the exported signature does not come out inverted |
| Shape | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill` |
| Text | `text-xs` to `text-3xl`, `font-sans`, `font-display`, `font-mono` |
| Weight | `font-rc-regular`, `font-rc-medium`, `font-rc-strong`, `font-rc-bold`, `font-rc-display` |
| Shadow | `shadow-1`, `shadow-2`, `shadow-3` |
| Stacking | `z-[var(--rc-z-sticky)]`, and the peers `base`, `dropdown`, `overlay`, `dialog`, `popover`, `toast`, `tooltip` |
| Entrance | `animate-enter`, `animate-appear`, `animate-pop`, `animate-fill`, `animate-reveal` |

**Filling and writing text are different tokens.** `bg-danger` fills and takes
`text-danger-fg` on top. `text-danger-text` is the red that reads on the page
background. No color serves both jobs. The same goes for the accent:
`bg-accent` with `text-accent-fg`, or `text-accent-text` alone.

**There are eight stacking steps, and the two at the ends are yours.** The six
in the middle belong to the pieces - `Dialog` rises to `dialog` on its own,
`Menu` to `dropdown` - and you rarely write them. The ones your screen writes
are the other two: `--rc-z-base` to bring an element back to the content
plane, and `--rc-z-sticky` for **a header, a frozen column and an action bar
that sticks on scroll**. A sticky header with `--rc-z-dropdown` sits in front
of the menu it opens itself; that is the error the lack of this line has
already produced.

**What opens from inside a layer stays above it.** A `Select` inside a
`Dialog`, an `AlertDialog` opened by a button inside a `Popover`, a `Menu`
inside a `Sheet`: each piece that opens a layer reads the step of whoever
opened it and stays one above it - `max(<its own step>, <the opener's> + 1)`,
always on top of the `--rc-z-*`. Outside any layer, each one stays on its own
step, as before. The rule travels through the React tree: the floating element
has to be mounted INSIDE the layer's content (`DialogContent`,
`PopoverContent`, `SheetContent`...), and not beside it. `Tour` also reads the
DOM: with the target inside a `Dialog`, the mask rises above the dialog and the
rest of it goes dim and unclickable. `Toast` and `Tooltip` stay on top of
everything.

**Pieces animate in on mount, and the frame does not.** What arrives animates
in - the chart draws itself, the progress bar fills from zero, `Alert` and
`EmptyState` rise 4px fading, the `DataTable` body fades on leaving the
skeleton - and what is layout (`Card`, `PageHeader`, `Sidebar`) stays still. The
`Entrance` classes are the same ones the pieces use, for what you build outside
them: all last one token, go to zero with "reduce motion", run once per mount
and hold no state after finishing. `animate-none` turns it off on one instance.

**Motion has intent names.** Duration: `duration-fast`, `duration-base`,
`duration-slow`. Curve: `ease-rc` (default), `ease-rc-enter` (what arrives),
`ease-rc-exit` (what leaves). Spring, with the duration of the same name:
`ease-rc-spatial duration-spatial` for position and size,
`ease-rc-expressive duration-expressive` for the same with more body, and
`ease-rc-effects duration-effects` for color and opacity, which must not
overshoot the target. Every duration goes to zero with "reduce motion". Never
`duration-150` nor `ease-[cubic-bezier(...)]`.

**Control height comes from the density**, never hardcoded:
`h-[var(--rc-control-md)]`, with `sm` and `lg` available.

### The font is a theme role, and comes in a separate file

`font-sans`, `font-display` and `font-mono` come from `--rc-font-sans`,
`--rc-font-display` and `--rc-font-mono`, and all three are declared **by the
theme**, in the same `[data-rc-theme="..."]` selector the colors are in. There
is no `:root` value underneath: a theme that does not declare a family ends up
with no family at all, just as a theme without `--rc-bg` ends up without a
background.

RivoCode's faces (Manrope, Poppins and JetBrains Mono) **no longer travel in
`styles.css`**. They have their own entry, and only whoever wants the brand
imports it:

```css
@import "@rivocode/ui/styles.css";
@import "@rivocode/ui/fonts.css";   /* optional: RivoCode's faces */
```

To dress a client's font, install their family and point the three tokens in
their theme selector, together with the colors. Without
`@rivocode/ui/fonts.css`, no RivoCode `.woff2` is downloaded:

```css
@import "@rivocode/ui/styles.css";
@import "@fontsource-variable/inter";

[data-rc-theme="cliente-acme"] {
  --rc-font-sans: "Inter Variable", system-ui, sans-serif;
  --rc-font-display: "Inter Variable", system-ui, sans-serif;
  --rc-font-mono: ui-monospace, SFMono-Regular, monospace;

  /* ...and the fifty color roles. */
}
```

That is how two clients with different fonts coexist in the same application:
each `data-rc-theme` carries its family, and the switch happens by selector,
like the color one.

### Weight is also a token, and has an intent name

The pieces do not write `font-medium` or `font-semibold`: they write the
intent, and the number lives in `--rc-weight-*`, with the house value in
`:root` and optional in the theme.

| Class | Token | House | When |
|---|---|---|---|
| `font-rc-regular` | `--rc-weight-regular` | 400 | body |
| `font-rc-medium` | `--rc-weight-medium` | 500 | label, button, tab, table header |
| `font-rc-strong` | `--rc-weight-strong` | 600 | strong emphasis in the body |
| `font-rc-bold` | `--rc-weight-bold` | 700 | rich text bold, marketing call-out |
| `font-rc-display` | `--rc-weight-display` | 600 | all text in `font-display` |

On your screen, use the same ones when the text has to follow the client's
font: `font-display font-rc-display` on a hand-built title takes the weight the
theme decided, and `font-semibold` stays hardcoded at 600 even if the family
does not have it. A theme that swaps the font redefines the weight in the same
selector:

```css
[data-rc-theme="cliente-acme"] {
  --rc-font-display: "Lato", system-ui, sans-serif;
  --rc-weight-display: 700;
}
```

The library's `cn` knows the five classes: `cn("font-rc-medium", className)`
with `font-rc-strong` in `className` keeps the second, and `font-display` next
to `font-rc-display` do not cancel each other. In React Native the five exist
with the same values, in the package's `theme.css`.

### The four subpaths

Besides the main package, four families live in subpaths and arrive through
the same global:

- **`@rivocode/ui/form`**, `Form`, `FormField`, `useZodForm` and the adapters
  `forDate`, `forValue`, `forChecked`: the name says the shape, and not the
  piece. The control comes through a function, not by cloning the child:

  ```tsx
  <FormField name="email" label="E-mail" description="Para onde vai a nota">
    {(campo) => <Input {...campo} />}
  </FormField>
  ```

- **`@rivocode/ui/chart`**, Recharts dressed by the theme.

  The frame is `ChartContainer`, which also receives the four endings of a
  query: `isLoading`, `isError`, `onRetry` and `empty`. **The height is yours,
  by class: a chart without a defined height disappears.**

  Each series' color comes from `config` and becomes a variable named after the
  series:

  ```tsx
  const config = { pagas: { label: "Pagas" } }

  <ChartContainer config={config} className="h-64">
    <LineChart data={dados}>
      <ChartXAxis dataKey="mes" />
      <ChartYAxis format="currencyShort" />
      <ChartTooltip content={<ChartTooltipContent config={config} />} />
      <Line dataKey="pagas" stroke="var(--color-pagas)" />
    </LineChart>
  </ChartContainer>
  ```

  | Piece | What for |
  |---|---|
  | `ChartXAxis`, `ChartYAxis` | Axes with the right default already, and `format` for the number |
  | `ChartTooltip`, `ChartTooltipContent` | The tooltip, with the name from `config` |
  | `ChartLegend`, `ChartLegendContent` | The legend. With `useSeriesToggle` it becomes a filter |
  | `ChartAreaGradient`, `areaGradient(id, series)` | Area gradient. The `id` is yours, and it has to be unique on the page |
  | `ChartDonut` | Donut with the total in the hole, and the list of slices below |
  | `ChartRadial` | The arc of a single measure: goal, quota, conversion |
  | `ChartGauge` | Gauge from 0 to `max` with bands (good, attention, critical) and the value written in the middle |
  | `ChartHeatmap` | Row-by-column grid, the color telling the size: issuances by day and hour |
  | `ChartFunnel` | The stages of a path, with the conversion rate from one to the next |
  | `ChartTreemap` | Area proportional to each category, with the label that disappears when it does not fit |
  | `Sparkline` | The tiny line that fits inside an indicator |

  `ChartContainer` takes care of motion on its own: every mark that animates
  (`Line`, `Bar`, `Area`, `Pie`, `Radar`, `RadialBar`, `Scatter`) comes out with
  `animationDuration` from `--rc-duration-slow`, `animationEasing` from
  `--rc-ease` and `isAnimationActive` on before the mark mounts, and off with
  "reduce motion". The first time it appears with data, the chart draws itself,
  and when the data changes each mark moves to the new value. A mark with
  `isAnimationActive={false}` stays still. `useChartMotion()` returns the same
  trio for whoever draws with Recharts outside the frame:

  ```tsx
  const movimento = useChartMotion()

  <Line dataKey="pagas" stroke="var(--color-pagas)" {...movimento} />
  ```

  `ChartDonut` and `ChartRadial` enter sweeping from zero and move to the new
  value the same way; `Sparkline` only fades on entering, and does not move on
  data change, because it appears by the dozen in a table.

  The four at the bottom do not use Recharts and do not go into
  `ChartContainer`: the four endings of a query come from the `QueryBoundary`
  around them. The `ChartHeatmap` scale is a single series color, in five ink
  steps; `ChartTreemap` writes the label in `fg` over the category color at
  30%, a pair the contrast guard measures in all eight series; and
  `ChartGauge` paints the bands with the `success-text`, `warning-text` and
  `danger-text` roles. None of the four depends on color alone: the number is in
  the tooltip, in a table or list hidden from view, or written on the screen.

  The axis and tooltip formatters are the same as the rest of the library's,
  and are right below.

  The Recharts pieces that come out of here: `Area`, `AreaChart`, `Bar`,
  `BarChart`, `Line`, `LineChart`, `Pie`, `PieChart`, `Cell`, `Scatter`,
  `ScatterChart`, `Radar`, `RadarChart`, `RadialBar`, `RadialBarChart`,
  `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `CartesianGrid`, `XAxis`,
  `YAxis`, `ZAxis`, `LabelList`, `Rectangle`, `ReferenceLine` and
  `ReferenceArea`. Its `Tooltip` and `Legend` do **not**: ours already wrap
  both, and the name would collide with the catalog's `Tooltip`.

**Series palette:** eight colors per theme, in `var(--rc-chart-1)` to
`var(--rc-chart-8)`, plus `var(--rc-chart-grid)` for the grid. Here the
variable comes before the property class: the stylesheet you receive is the
compiled one, and a utility class no component uses does not exist in it. The
variable always resolves.

- **`@rivocode/ui/ai`**, the pieces for a conversation with an assistant. It
  has no peer at all: it is a subpath because of WEIGHT, since only an app that
  talks to a model needs them, and it does not charge whoever builds invoices.
  **None knows an AI SDK**: the message comes in by prop, and what the person
  does comes out by event. Whoever talks to the model is your screen, with the
  SDK it already uses.

  ```tsx
  import { Conversation, Message, PromptInput, ToolCall, AILabel } from '@rivocode/ui/ai'

  <div className="flex h-[32rem] flex-col gap-3">
    <Conversation className="flex-1" empty={vazio} onSuggestion={enviar}>
      {mensagens.map((m) => (
        <Message key={m.id} role={m.role} streaming={m.streaming} copyValue={m.texto}>
          {m.texto}
        </Message>
      ))}
    </Conversation>
    <PromptInput streaming={respondendo} onSubmit={enviar} onStop={parar} />
  </div>
  ```

  | Piece | What for |
  |---|---|
  | `PromptInput` | The field: grows with the text, Enter sends, Shift+Enter breaks the line, and in `streaming` send becomes stop (`onStop`) |
  | `Message` | One turn: `role` `user`, `assistant` or `system` decides the look; `streaming` announces `aria-busy` and hides copy and retry |
  | `Conversation` | The scrollable list: sticks to the end while the text arrives, lets go when the person scrolls up, and is a polite `role="log"` |
  | `ToolCall` | The tool call: five states with icon and text, input and output in `CodeBlock`, and approve and reject in `approval` |
  | `AILabel` | The "IA" badge for generated content, with an optional explanation in a panel. `aiLabelVariants` comes along, for whoever needs the class |

  **The `Conversation` height is yours, by class**, like the chart's: without
  it the conversation grows and pushes the page.

- **`@rivocode/ui/dnd`**, drag and drop. Optional peer: `@dnd-kit/core` and
  `@dnd-kit/sortable`, installed by whoever imports this path, and by nobody
  else.

  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable
  ```

  ```tsx
  import { Kanban, SortableList } from '@rivocode/ui/dnd'

  <SortableList
    items={notas}
    getKey={(nota) => nota.id}
    getLabel={(nota) => `Nota ${nota.numero}`}
    onReorder={setNotas}
    renderItem={(nota) => nota.cliente}
  />
  ```

  | Piece | What for |
  |---|---|
  | `SortableList` | The list the person orders by hand: a handle with the grab icon, vertical or horizontal, and `handle={false}` with `handleProps` for the handle to be yours |
  | `Kanban` | The column board: card between columns and within them, count, a `limit` that warns and does not lock, an empty column that accepts drops |

  **Both are controlled.** The new order comes out ready in `onReorder`, and the
  board change comes out in `onMove({ itemId, from, to, index })`; whoever
  swaps `items` or `columns` is your screen. Without swapping, the item goes
  back in place.

  **The keyboard is not optional**: Space picks up, arrows move, Space drops,
  Esc cancels, and each step is announced in Portuguese ("Item Nota 1043
  movido para a posicao 3 de 8"). `getLabel` gives the name the announcement
  speaks, and `labels` swaps any phrase. The neighbors move with the tokens'
  spatial spring, and with "reduce motion" they swap places without sliding.

- **`@rivocode/ui/editor`**, formatted text, on Tiptap 3. The peers are
  OPTIONAL and only this path demands them: `@tiptap/react`, `@tiptap/pm`,
  `@tiptap/core`, `@tiptap/starter-kit` and `@tiptap/extensions`.

  ```tsx
  import { RichTextEditor, RichTextView } from '@rivocode/ui/editor'

  <Field>
    <FieldLabel>Descrição do serviço</FieldLabel>
    <RichTextEditor value={html} onValueChange={setHtml} maxLength={2000} />
  </Field>

  <RichTextView value={nota.descricao} empty="Sem descrição." />
  ```

  | Piece | What for |
  |---|---|
  | `RichTextEditor` | The field: toolbar with arrows and `aria-pressed`, shortcuts, link with a panel, `value` in HTML and optional `onJsonChange`, `maxLength` with a counter. The blank editor delivers `""`, and in a form the adapter is `forValue` plus `onBlur` |
  | `RichTextView` | Displays the saved HTML or JSON with the same typography, without `innerHTML` and without Tiptap: only the editor's blocks and marks, and links only `http`, `https`, `mailto`, `tel` or relative |

  **The editor does not mount on the server** (`immediatelyRender: false`): in
  its place comes the already formatted content, and it becomes editable when
  the JavaScript arrives. The HTML that reaches the server is user input like
  any other; displayed through a path other than `RichTextView`, run it through
  a sanitizer.

### Formatting the number

A single vocabulary, for the axis, the tooltip, the indicator, the table cell
and a control's label. They were born in the chart subpath and today come out
**also from the root**, because formatting money in a cell was never a chart
matter:

```tsx
import { currencyShort, percent, formatters } from '@rivocode/ui'
```

| Formatter | Writes |
|---|---|
| `currency` | `R$ 2.480,00` |
| `currencyShort` | `R$ 2,5K` |
| `currencyShortWords` | `R$ 2,5 mil` |
| `compact` | `12,4K` |
| `compactWords` | `12,4 mil` |
| `integer` | `1.240` |
| `percent` | `62%`, from the number as it is in the data |
| `monthShort` | `mar` |
| `dayMonth` | `12/03` |

`compact` abbreviates with a symbol, which is the dashboard convention and fits
in fewer pixels. `compactWords` and `currencyShortWords` write it out, which
reads better in running text. **Do not mix the two on the same screen.**

**Money comes out abbreviated.** Use `currencyShort` in indicators, tables,
axes, legends and tooltips. `currency`, which writes it out in full, is for the
place where the cent is the subject: the amount the person confirms before
issuing, and the receipt afterwards.

**The `format` prop accepts the name of one of them, or a function of yours.**
It exists on `Meter`, `Progress`, `Slider`, `ChartXAxis`, `ChartYAxis` and
`ChartDonut` - the type is `Format`, and `FormatName` is just the name. The
`formatters` object gathers all nine, for whoever builds the choice at runtime.
`@rivocode/ui-native` exports the same nine from the root, from the same file,
and `format` works the same on its `Meter`, `Progress`, `Slider`, `ChartDonut`
and on its `Stat`'s `deltaFormat`:

```tsx
<Meter value={72} format="percent" />
<ChartYAxis format="currencyShort" />
<Slider defaultValue={25} max={50} format={(valor) => `${valor} dias`} />
```

Date and mask have their own, for the same reason: `formatDate`, `parseDate`
and `applyDateMask` for `dd/mm/aaaa`, and `applyMask`, `applyPattern`,
`applyCurrencyMask`, `unmask`, `toCents` and `phonePatternFor` for the patterns
in `MASKS`. Formatting a CPF in a table cell does not need a field nearby.
`isValidCpf` and `isValidCnpj` check the check digits, with or without
punctuation and with the alphanumeric CNPJ. `isValidCnh`, `isValidVoterId`
(voter ID), `isValidPis` (PIS, PASEP, NIT and NIS), `isValidRenavam` (the
9-digit one still counts) and `isValidPlate` (the old one and Mercosul) follow
the same pattern: text with or without punctuation, `true` or `false`, and no
registry lookup. All of them also exist in native, with the same math, and the
site's "Documentos brasileiros" guide says what each one checks.

Pix has its three, in both packages and from the root: `buildPixPayload` builds
the static copy-and-paste code in the Central Bank's BR Code standard, with the
CRC16 at the end; `parsePixPayload` reads it back and returns `null` when the
CRC does not match; and `isValidPixKey` checks the key as the DICT stores it
(CPF and CNPJ without punctuation, e-mail in lowercase, mobile with `+55`,
random key with its hyphens). The drawing is `PixCode`.

Typed money is `CurrencyInput`: `value` and `onValueChange` in integer cents
(`number | null`, empty is `null`), `min` and `max` in cents that only mark it
invalid, `allowNegative` and `name` that puts the cents in a hidden field. In
`FormField`, `{...forValue(field)}`. Native has the same name, controlled.

An on-screen signature is `SignaturePad`: `value` and `onValueChange` with
`SignatureValue | null` (the strokes in `kind: "drawn"`, or the typed name in
`kind: "typed"`), empty is `null`, and `onValueChange` arrives at the end of
each stroke. The type-your-name mode is the alternative for whoever does not
draw, and it cannot be turned off. `signatureToSvg` and `signatureToPng`
export with the fixed ink, and `isSignatureEmpty` answers whether there is a
signature. In `FormField`, `{...forValue(field)}`. In native it lives in
`@rivocode/ui-native/chart`, because of `react-native-svg`, and exports only
the SVG.

The boleto has three: `isValidBoletoLine` checks the whole typeable line - the
bank one, 47 digits, with the three fields in modulo 10 and the general check
digit in 11, and the utility-bill one, 48 digits starting with 8, in the
modulo the third position asks for -, `boletoLineToBarcode` returns the
barcode's 44 digits or `null`, and `parseBoleto` returns `BoletoData` (`kind`,
`bank`, `amount` in cents, `dueDate`, `segment`, `line` and `barcode`) or
`null`. It also accepts the optical reader's 44 digits. The due-date factor
went back to 1000 on 22/02/2025, and the same factor serves two dates:
`parseBoleto` picks the one closest to today, and `{ today }` fixes the
reference day. `MASKS` gains the `boleto` pattern, which switches to the
utility-bill one when the first digit is 8, and the native `MaskedInput`
accepts the same name.

### What CSS does not reach

`useMobile()` is true below Tailwind's `sm`, at the same breakpoint the sidebar
uses to become a sheet and the calendar to show a single month. It is exported
so the application decides together, instead of writing its own `640` in some
corner: when each screen keeps its own number, one of them changes and the two
halves start to disagree about what a phone is.

```tsx
const isMobile = useMobile()

return isMobile ? <Sheet>{filtros}</Sheet> : <aside>{filtros}</aside>
```

`useMediaQuery(query)` is the general one, for any other question only JS
answers. **Layout is still a job for utility classes**: swapping
`grid-cols-3` for `grid-cols-1` is a matter for `sm:`, and not for a hook. The
hook is for what changes piece, not size. On the server it returns `false`,
and not a guess.

Inside a `SidebarProvider`, prefer `useSidebar().isMobile`: it is the same
value, and avoids a second subscriber to the same media query.

### Utility hooks

The root exports the hooks every screen rewrites, with no new dependency.
Before writing a `useEffect` with `setTimeout`, `addEventListener` or
`localStorage`, look here. All of them clean up timers, listeners and observers
on unmount, and all of them render on the server without touching `window`.

- **State:** `useDisclosure` (`[open, { open, close, toggle }]`),
  `useToggle`, `useCounter` (floor, ceiling, step), `useListState` (`append`,
  `prepend`, `insert`, `remove`, `reorder`, `swap`, `replace`, `update`,
  `filter`, all immutable), `useSetState` (merges the partial), `usePrevious`
  (the previous DIFFERENT value).
- **Time:** `useDebouncedValue`, `useDebouncedCallback`,
  `useThrottledCallback` (with `cancel`, `flush`, `isPending`), `useInterval`
  and `useTimeout` (a `null` delay pauses), `useIdle`.
- **Browser:** `useLocalStorage` and `useSessionStorage` (JSON, default on the
  server, syncs across tabs through the `storage` event, falls back to memory
  if storage throws), `useClickOutside`, `useHotkeys` (`mod` is Cmd on Mac and
  Ctrl elsewhere; ignores text fields by default), `useInfiniteScroll`
  (sentinel, `hasMore`, `loading`), `useIntersection`, `useElementSize`,
  `useClipboard` (`copied` resets itself), `useReducedMotion`,
  `useDocumentTitle`, `useNetworkStatus`, `useMounted`, `useIsFirstRender`.

```tsx
const [query, setQuery] = useState('')
const [settled] = useDebouncedValue(query, 300)
const [opened, { open, close }] = useDisclosure()
```

The piece comes before the hook: `Popover`, `Menu`, `Dialog` and `Sheet`
already close on click outside, and `Clipboard` already is the copy button.
`useFocusTrap` does not exist on purpose: Base UI traps focus in modal
overlays.

In native, the root exports the twelve that do not depend on the browser,
generated from the same source as the web: `useDisclosure`, `useToggle`,
`useCounter`, `useListState`, `useSetState`, `usePrevious`,
`useIsFirstRender`, `useDebouncedValue`, `useDebouncedCallback`,
`useThrottledCallback`, `useInterval` and `useTimeout`.

### The native package, and its five subpaths

`@rivocode/ui-native` is the same catalog in React Native, published as
**source**: the class vocabulary above is the same, through NativeWind, on the
same tokens. What crosses over is the class, the token and the choice of piece:
**the JSX is rewritten**. In native everything is controlled (no
`defaultValue`, no `defaultChecked`, no `defaultOpen`; the exception is
`Accordion` and `Collapsible`, which accept both modes) and the list comes
through `items`, and not by composition:
`<Select items={…} value onValueChange label />`, without `SelectTrigger` or
`SelectItem`.

**The class crosses over with the same address.** `className` dresses the
root, and a native piece that accepts `classNames` uses the same keys as the
web page's "Parts" section: `<Banner classNames={{ title: 'font-rc-strong' }} />`
is written the same in both packages, and the consumer's class beats the
piece's. A part native does not draw stays out of the type, and does not
become an invented node (`Carousel`'s `pause`, without `autoplay`; `QRCode`'s
`code`, which is `Svg` and takes no class). In React Native text color does
not flow down from `View` to `Text`: to paint text, dress the part that is the
text itself. There is no `<part>ClassName` prop in either package: where the
web composes pieces and native draws a single one, the pieces become parts
(`<InputGroup classNames={{ prefix }} />`, `<Menu classNames={{ trigger }} />`).
The exception is the native `ScrollArea`'s `contentContainerClassName`, the
name `ScrollView` already gives the scrolling content.

**The spoken name is `label` on native pieces**, in place of the web's
`aria-label`: `Checkbox` and `Switch` with no text beside them require
`label`, and `OTPField` and `SignaturePad` accept it. `accessibilityLabel`
stays only where the piece is the platform's `TextInput` and on `Item`, whose
row already has text.

The rule that shapes the package is **one subpath per peer, and not one per
subject**. Four peers are optional, and the peer decides where the door is: on
the phone an Expo module and `react-native-svg` cost **build**, and not just
bytes, and metro resolves imports per file. So whoever only wants a `Button`
cannot find any of them in the root index. Putting `Clipboard` and
`FileUpload` in a single door, an `/expo`, would charge the document picker to
whoever only copies an NF-e access key; that is why there are two. The written
exception is `/ai`, which has no peer and is its own path because of weight,
explained further below.

| Subpath | The peer it costs | What comes out of it |
|---|---|---|
| `@rivocode/ui-native/form` | `react-hook-form`, plus `zod` and `@hookform/resolvers` for `useZodForm` | `Form`, `FormField`, `useZodForm` and the adapters `forText`, `forValue`, `forChecked`, `forDate` |
| `@rivocode/ui-native/chart` | `react-native-svg` | `ChartContainer`, `ChartDonut`, `ChartRadial`, `ChartGauge`, `ChartHeatmap`, `ChartFunnel`, `ChartTreemap`, the `ChartBar` and `ChartLine` marks, `PALETTE`, and `QRCode` and `PixCode`, which draw with the same peer |
| `@rivocode/ui-native/chart` | `react-native-svg` | `ChartContainer`, `ChartDonut`, `ChartRadial`, the `ChartBar` and `ChartLine` marks, `PALETTE`, `QRCode`, `PixCode` and `SignaturePad` (with `signatureToSvg` and `isSignatureEmpty`), which draw with the same peer |
| `@rivocode/ui-native/clipboard` | `expo-clipboard` | `Clipboard` |
| `@rivocode/ui-native/file-upload` | `expo-document-picker` | `FileUpload`, `FileUploadList`, `FileUploadItem` |

```sh
npx expo install react-native-svg expo-clipboard expo-document-picker
```

**The form has one more adapter, `forText`**, because in native the field does
not return an event: `TextInput` delivers the text directly, and `forValue`
does not fit. And **nothing submits by itself**: without `<form>`, without
`type="submit"` and without Enter, `Form` delivers `{ submit, isSubmitting }`
through a function. The label travels in the field: without `for` or `id`,
`FormField` puts `accessibilityLabel` and `invalid` on the row, and the adapter
carries them to the control: as `label` on the pieces, which are named by it,
and as `accessibilityLabel` on `Input` and `Textarea`, which are the platform's
`TextInput`.

```tsx
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
```

**The chart has no Recharts, no CSS variable, and no container that
measures.** `ChartContainer` does all three by hand and **delivers**:
`children` as a function receives `{ width, height, colors }`, in place of
`var(--color-series)`, and the measurement arrives zeroed on the first frame.
The four endings of a query (`isLoading`, `isError`, `onRetry`, `empty`) cross
over with the same names, and the height is still yours, by class.

`PALETTE` is the list of the theme's eight series roles (`chart-1` to
`chart-8`), in the order they should be used: a series without `color` in
`config` gets the palette's next one, and it is what `ChartDonut` walks slice
by slice. **A series color here is a token role, never a hex.** The web
accepts any CSS color in the same prop because there it becomes
`var(--color-series)` and the theme stays in command; here the color the piece
receives is the final value that goes into the drawing, and a `#22c55e` written
there would be the only thing on the screen that does not change when the
client switches theme.

```tsx
import { ChartBar, ChartContainer, ChartDonut, ChartLine, ChartRadial, PALETTE } from '@rivocode/ui-native/chart'
```

`ChartBar` and `ChartLine` are the marks that move: draw the bar and the line
with them, inside the frame's function, instead of raw `Rect` and `Path`. On
mount they animate in (the bar grows from the base, the line rises from the
`baseline`, or from the lowest point) and, when the data changes, they go to
the new value with the motion tokens, through Reanimated; with "reduce motion",
they are born in place and jump. The donut and the arc do the same on their
own, and `Sparkline` only fades on entering.

`Sparkline` stays out of this subpath, at the root and drawn with `View`: it is
the `Stat`'s `chart` slot, `Stat` comes from the root, and bringing it here
would charge `react-native-svg` to whoever only wanted a number in a card.

**Copying confirms twice.** `Clipboard` changes the button's name, as on the
web, and **also** fires a toast: an `accessibilityLabel` swapped on a
`Pressable` that is already under focus is not re-announced by either
VoiceOver or TalkBack, and the `RivoProvider` toast is the only channel on the
screen that speaks by itself (`toast={false}` turns it off).

**And the drop zone does not exist.** On a phone there is no dragging:
`FileUpload` opens the system picker through a control-height button, with the
`hint` inside the spoken name, and `accept` speaks MIME, which is what the
picker knows how to filter. What comes back is a `PickedFile` with a local
`uri`: `size` may be missing, and `maxSize` only refuses what it measured. The
list of what has already come in is `FileUploadList`, with one
`FileUploadItem` per file.

```tsx
import { Clipboard } from '@rivocode/ui-native/clipboard'
import { FileUpload, FileUploadItem, FileUploadList } from '@rivocode/ui-native/file-upload'
```

**The AI pieces live in `@rivocode/ui-native/ai`, one of the two paths
without a peer.** The peer rule still holds for the other four; this one
exists because of weight. Metro does not tree-shake: importing a `Button` from
the root index compiles everything it reaches, and the conversation with a
model cannot get into the app of someone who only issues invoices. It is the
same path as the web, swapping the package name.

```tsx
import { AILabel, Conversation, Message, PromptInput, ToolCall } from '@rivocode/ui-native/ai'
```

`Conversation` comes through `items`, `renderItem` and `keyExtractor`, over an
inverted `FlatList`; `PromptInput` is controlled and sends only through the
button, because the phone keyboard's return breaks the line; `Message` has
`onCopy` in place of `copyValue`, because copying belongs to `expo-clipboard`;
and the `AILabel` explanation opens in a `Sheet`.

**`SortableList` lives in `@rivocode/ui-native/dnd`, the other path without a
peer.** On the web it carries dnd-kit; here the gesture is core's
`PanResponder`, the same as `Slider`'s, and `react-native-gesture-handler` is
not required. The separate path exists so the import line is the same in both
packages. **Only the handle drags** (44pt, and it holds the gesture until the
finger leaves), because the whole row as a handle would turn every scroll
gesture into a drag; the screen reader moves through two actions, "Mover para
cima" and "Mover para baixo", with the same announcements as the web.

```tsx
import { SortableList } from '@rivocode/ui-native/dnd'
```

**`Kanban` does not port, by decision.** At 390px one column fits, and dragging
a card to the column that is not on screen fights the finger with the scroll.
In the app, each column becomes a list (`Tabs` or sections) and changing column
is a `Menu` with "Mover para"; the `onMove` on the side that keeps the state is
the same.

**A client theme here is a BUILD decision, and not a runtime prop.** The two
house themes switch with the screen open, because they were compiled as
`light-dark()` and the provider only flips `Appearance`. A client's color does
not: the `react-native-css` compiler hardcodes the token's value inside the
class, and `<RivoProvider theme={{ light, dark }}>` only reaches whoever reads
color through JS (the charts, the `Button` spinner, the `Switch` track),
leaving background, card, button, badge and border in the house color - the
screen comes out **mixed**, and not brandless. Dress the client by overriding
the roles in an `@theme` in the app's CSS before compiling, and pass the theme
map along so the JS half agrees. There are **two themes per build**, because
`light-dark()` has two slots. The step by step is at
<https://ds.rivocode.com.br/temas.md>.

The rest of the parity (what translates, what changes name and what does not
port by decision) is at <https://ds.rivocode.com.br/react-native.md>.

### Where the truth is

| What | Where |
|---|---|
| Index of everything | <https://ds.rivocode.com.br/llms.txt> |
| One piece, with props and examples | `https://ds.rivocode.com.br/componentes/<kebab-name>.md` |
| A theme's roles, all of them | <https://ds.rivocode.com.br/temas.md> |
| A whole system, assembled | <https://ds.rivocode.com.br/demonstracao> |

**Never invent a prop.** If the piece's `.md` does not list it, it does not
exist.

### Versions

From 1.0 on, `@rivocode/ui` and `@rivocode/ui-native` follow strict semantic
versioning, each with its own number:

- **Breaks only in a major version.** Removing or renaming a prop, piece or
  export, changing a prop's default or a callback's shape is a break, and only
  ships in a major version.
- **What is going away becomes deprecated first.** The old prop keeps working
  with `@deprecated` in the type, saying the new path, for at least one minor
  version, and only leaves in the following major version.
- **A new prop and a new piece are a minor version.**
- **A fix is a patch version.**

A prop marked `@deprecated` is not used in new code: the piece's `.md` says the
name that stays.

### The state names

Each state idea has a single name, in both packages: the controlled one, the
initial one (where the piece knows how to keep itself) and the notification.

| The idea | The trio | Where |
|---|---|---|
| open or closed | `open`, `defaultOpen`, `onOpenChange` | `Collapsible`, `AccordionItem`, `Spoiler`, `Tour`, `ToolCall`, the `Dialog`s; on `Tree`, the list of open branches |
| the step of a sequence | `step`, `defaultStep`, `onStepChange` | `Tour`; `Steps` only controlled, through `useWizard` |
| the position in a collection | `index`, `defaultIndex`, `onIndexChange` | `Carousel`, `ImageViewer` |
| the page of a paginated list | `page`, `onPageChange` | `Pagination` |
| what was chosen or typed | `value`, `defaultValue`, `onValueChange` | fields, `Accordion`, `Tabs` |

`step` and `index` count from zero, because they are program positions. `page`
counts from one, because it is the number the person reads on the screen and
that the server receives in the query: `page={3}` is page 3, and converting in
both directions on every call is where the off-by-one error is born. `step` is
a step of a sequence that moves forward; `index` is a place in a collection
walked in any order, like the `Carousel` slide.

There is no `expanded`, `visible` or `current` for these ideas. `Accordion`
stays on `value` because what it keeps is which items are open, and not
whether one is; with `multiple` it lets several be open at the same time, and
without it opens one at a time, in both packages.

### A control's label comes as a child

`Checkbox`, `Radio` and `Switch` accept the text as a child and wrap themselves
in a `<label>`, so clicking the text also checks it:

```tsx
<Checkbox defaultChecked>ISS retido na fonte</Checkbox>
<Radio value="pix">Pix</Radio>
<Switch>Enviar o XML junto com o PDF</Switch>
```

Without a child only the control comes out, for when the label has its own
structure. Then the `<label>` around it is yours.

### Interface text lives in `labels`

The text the piece writes by itself - a button's name, what the screen reader
hears, a fixed phrase - is swapped through a single object, `labels`, in both
packages and with the same keys. Pass only the keys that change; the rest stays
at the Portuguese default:

```tsx
<Popconfirm
  trigger={<Button variant="ghost">Excluir</Button>}
  title="Excluir a nota 4813?"
  onConfirm={remove}
  labels={{ confirm: "Excluir" }}
/>
<QueryBoundary data={data} isError={isError} onRetry={refetch} labels={{ retry: "Try again" }}>
  {(invoices) => <InvoiceList invoices={invoices} />}
</QueryBoundary>
```

There is no loose prop ending in `Label` for interface text: the key is the old
prop's name without the `Label` (`retry`, `dismiss`, `confirm`, `cancel`,
`busy`, `submit`, `stop`, `scroll`, `swatches`, `external`, `empty`). What
stays outside `labels` is CONTENT, and remains a prop: the `label` that names
the field or the region, a notice's `title` and `errorTitle`, a chart's
`centerLabel`, a `Stat`'s `deltaLabel`, a `Slider`'s `thumbLabel`, the
`placeholder`.

Dates have two halves. The month name, the weekday and the time come from
`locale` (a BCP 47 tag), in `EventCalendar` and `Gantt`; the fixed words
around them - "Hoje", "+2 mais", "Dia inteiro", "12 a 18" - are `labels`.
Native has no `locale`: `Calendar`, `DatePicker` and `DateRangePicker` swap the
written month and the weekday initials through `labels.caption` and
`labels.weekdays`.

### The two tab shapes

`TabList` has `variant`. The underline, which is the default, says "this part
of the page". The little box, `variant="segmented"`, says "the same thing,
another way": screen width, preview and code, dark and light. Swapping one for
the other makes the control promise what it does not do.

### An example of the idiom

```tsx
<RivoProvider theme="rivocode-dark">
  <main className="min-h-screen bg-bg p-8 font-sans text-fg">
    <h1 className="mb-6 font-display text-3xl">Notas fiscais</h1>
    <Card>
      <CardHeader>
        <CardTitle>Resumo do mes</CardTitle>
        <CardDescription>Agosto de 2026</CardDescription>
      </CardHeader>
      <CardContent className="text-fg-muted">
        Doze notas processadas, tres pendentes.
      </CardContent>
      <CardFooter>
        <Button size="sm">Ver detalhes</Button>
        <Button size="sm" variant="ghost">Exportar</Button>
      </CardFooter>
    </Card>
  </main>
</RivoProvider>
```

The pill button (`shape="pill"`) and the `xl` size are for marketing pages. On
a product screen the default is the 8px corner.
