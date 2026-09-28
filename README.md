# @rivocode/ui

RivoCode's design system. Accessible components on Base UI, authored styling in
Tailwind v4, and white-label tokens: no component knows what the brand color
is, it asks the theme.

That is what lets the same library dress RivoCode in one project and client X
in another, without editing any component.

## Installation

```bash
npm install @rivocode/ui lucide-react   # or pnpm add, yarn add, bun add
```

Public on npm, under the MIT license. No token or `.npmrc` needed.

`lucide-react` goes on the same line because the components import icons
straight from it. npm resolves that peer by itself; pnpm and yarn do not, and
without it `Sidebar`, `Pagination` and `DatePicker` break at runtime.

Tailwind comes in as a dev dependency:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

React 19, React DOM 19 and Tailwind 4 are peer dependencies, that is, the
consuming project controls the version.

## Wire Tailwind into the build

Installing the plugin is not enough, it has to be in the list. Without it the
build passes with no error and generates a CSS without a single library class:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

## The two CSS lines

In the project's CSS file:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";

@source '../node_modules/@rivocode/ui/dist';
```

The `@source` line is not optional and it is the one that breaks most. Without
it, the project's Tailwind does not scan the library's components, does not
generate the classes they use, and everything shows up **with no style at
all**, silently. Adjust the relative path to the folder of your CSS file.

The `preset` brings the tokens, the two themes and the brand fonts. If the
project already has its own typography, import only the token files and write
your theme, as described in "Client theme".

## The Provider

```tsx
import { RivoProvider, Button } from "@rivocode/ui";

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <Button>Acao primaria</Button>
    </RivoProvider>
  );
}
```

| Prop      | Values                                      | What it is for                                                   |
| --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `theme`   | `rivocode-dark`, `rivocode-light`, `system` | `system` follows the operating system's preference               |
| `density` | `comfortable`, `compact`                    | `compact` shrinks the height of every control, for operations screens |
| `scope`   | `global`, `local`                           | `global` dresses the whole page. `local` dresses only this tree  |
| `dir`     | `ltr`, `rtl`                                | in `rtl` Base UI mirrors whatever depends on side                |

Use `scope="local"` when the design system comes into an existing project and
cannot leak style to the rest of the page. In that mode the Provider also
creates its own container for dialog, menu and tooltip, which render outside
the tree and would come out without a theme if left loose at the end of the
document.

## Vocabulary for your layout

The preset exposes the tokens as Tailwind utilities, so the layout you write
speaks the same language as the components:

| Family          | Utilities                                                                                |
| --------------- | ---------------------------------------------------------------------------------------- |
| Surfaces        | `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-overlay`                                 |
| Text            | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled`                         |
| Accent          | `bg-accent`, `text-accent-fg`, `text-accent-text`, `bg-accent-subtle`                    |
| Lines and focus | `border-border`, `border-border-strong`, `ring-ring`                                     |
| States          | `bg-success`, `text-success-text`, `bg-danger-subtle`, and the same for `warning` and `info` |
| Shape           | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill`                   |
| Typography      | `text-xs` to `text-3xl`, `font-sans`, `font-display`, `font-mono`                        |

**Fill and text are different tokens on purpose.** `bg-danger` is the red that
fills a button and takes `text-danger-fg` on top. `text-danger-text` is the red
that reads on the page background. No color serves both well: the one with
contrast as text cannot hold white text on top, and vice versa. The same goes
for the accent.

## The catalog

134 pieces. **The table below is not the index**: it cites each piece in one
line and says the difference between the ones that look alike, which is the
part usually missing. The full index, with each one's page and always up to
date, is at <https://ds.rivocode.com.br/llms.txt>.

### Typography

| Piece     | What it is for                                                                    |
| --------- | --------------------------------------------------------------------------------- |
| `Heading` | heading from `h1` to `h6`, with the size separate from the level                  |
| `Text`    | paragraph or passage in the theme's text tones; without `size` and `tone`, it inherits from the sentence |
| `Link`    | underlined anchor, `external` with a notice to whoever listens, and the router through `render` |
| `Highlight` | paints the searched term inside the text, accents not mattering: "sao" finds "São" |
| `Code`, `Kbd` | code inside the sentence, and a shortcut's key drawn as a key |
| `RelativeTime` | "há 2 minutos", "em 3 dias", with the full date on hover |

### Action

| Piece                   | What it is for                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| `Button`                | five variants, four sizes, pill shape                                |
| `IconButton`            | icon-only button: the required `label` becomes the name, optional tooltip |
| `Toggle`, `ToggleGroup` | a button that stays pressed: alignment, display mode, filter         |
| `Toolbar`               | gathers the controls into a single tab stop, with arrows between them |
| `ActionBar`             | bulk actions on the selection: says how many, clears, sticks to the foot of the area |
| `ScrollToTop`           | "Voltar ao topo" that appears after scrolling down and returns focus to `main` |
| `ButtonGroup`           | sibling buttons side by side, like "emitir" with the variants menu attached; not a part of `Button` |
| `Clipboard`             | copy a piece of data to take elsewhere, with the "copied" spoken to whoever listens |

### Field

| Piece                           | What it is for                                                             |
| ------------------------------- | -------------------------------------------------------------------------- |
| `Field`, `Input`                | field with label, help and error wired for accessibility                   |
| `Textarea`                      | several lines; height in number of rows, and `Input`'s `size`              |
| `PasswordInput`                 | password with the eye that reveals; the pair every project rebuilds        |
| `SearchInput`                   | search with the magnifier in place, without a hand-built `position: absolute` |
| `NumberField`                   | a number with plus and minus, when step and limit are known and the exact value matters |
| `Slider`                        | a value in a range when the exact number does not matter; if it does, it is `NumberField` |
| `OTPField`                      | verification code, one slot per digit; pasting the whole code spreads the digits |
| `MaskedInput`                   | CPF, CNPJ, CEP, phone, date, time, plate, card, boleto, hand-written pattern |
| `CurrencyInput`                 | money in integer cents, typed from the right, with sign and limit          |
| `SignaturePad`                  | signature with finger, pen or mouse, or the typed name; exports SVG and PNG |
| `PostalCodeField`               | CEP that looks up the address through the `lookup` you write, and fills in the rest |
| `InputGroup`                    | attaches `R$`, `.com.br` or a button to the field, without a double border |
| `Fieldset`                      | groups the fields that answer the same question: address, payment         |
| `Checkbox`                      | a standalone check box                                                     |
| `CheckboxGroup`                 | boxes that split a value into a list, with the "all" one in the mixed state |
| `Radio`, `RadioGroup`           | single choice when the options fit on screen                               |
| `Questionnaire`                 | one question at a time, with progress, skip, letter shortcut and submit: onboarding, survey, the agent asking for clarification |
| `Switch`                        | turns on and off **right away**; Checkbox only counts when the form is submitted |
| `Select`                        | single choice in a short, fixed list                                       |
| `Combobox`                      | choice in a long list or one coming from the server, with search and chips |
| `Autocomplete`                  | `Combobox`'s panel, but accepts what the person wrote outside the list     |
| `TagsInput`                     | tags the person writes, instead of choosing: labels, emails                |
| `TreeSelect`, `Tree`            | choice inside a tree; keeps the leaf, never the parent                     |
| `TransferList`                  | two lists, available and chosen, with search, multi-select and moving both ways |
| `DatePicker`, `DateRangePicker` | date and period: type or pick, with an optional Apply footer               |
| `TimeField`, `TimePicker`       | 24-hour time: typed, or typed with the picking panel                       |
| `Calendar`                      | the raw month, for whoever wants the calendar on their own screen          |
| `Rating`                        | star rating, with half stars and the read-only average spoken as "4,5 de 5" |
| `FileUpload`                    | the attach area: click, drag and validation; sending over the network is yours |
| `ColorPicker`                   | choosing a color, by swatch or by code, in a theme builder                 |
| `Editable`                      | in-place editing: the text becomes a field on click and comes back on confirm |
| `EventCalendar`                 | the agenda: what happens, when and for how long. `Calendar` picks a date; this one shows appointments in time |
| `Gantt`                         | the project schedule: tasks on a scale, dependencies as arrows, collapsible groups and editing by drag and keyboard |

### Floating

| Piece         | What it is for                                                         |
| ------------- | ---------------------------------------------------------------------- |
| `Dialog`      | modal window; docks at the bottom on a phone                           |
| `AlertDialog` | irreversible confirmation: does not close with Esc nor with a click outside |
| `Popconfirm`  | confirmation attached to the button that triggered it, without darkening the screen |
| `Sheet`       | a sheet that slides from the edge, with a drag gesture; it is the phone's menu |
| `Popover`     | anchored panel with free content                                       |
| `Tooltip`     | a hint, for a button that has only an icon                             |
| `PreviewCard` | a link's summary on hover: who the customer is, what the invoice is    |
| `Menu`        | actions menu, with groups and a destructive item                       |
| `ContextMenu` | the same content as `Menu`, opened by right click                      |
| `Toast`       | a notice that goes away, via `useToast()`; `ToastViewport` already comes in the Provider |
| `ImageViewer` | full-screen photo from the thumbnails, with zoom and arrows            |
| `Tour`        | guided tour: dims the rest, cuts out the target and explains in a bubble |

### Navigation

| Piece        | What it is for                                                           |
| ------------ | ------------------------------------------------------------------------ |
| `AppShell`   | the app skeleton: fixed header, `Sidebar`, `main`, skip link             |
| `Sidebar`    | sidebar that shrinks down to the icon column and becomes a sheet on a phone |
| `Tabs`       | tabs with a sliding underline; they scroll sideways when they do not fit |
| `Breadcrumb` | the path, which folds the middle into an ellipsis when it gets long      |
| `Pagination` | pages, with ellipsis; on a phone it becomes "3 de 12" with the arrows    |
| `Steps`      | the ruler of a staged form, with `useWizard()`                           |
| `Menubar`    | the File, Edit, View bar: several `Menu` side by side, coordinated       |
| `NavigationMenu` | a site's top navigation: lists places to go, and `Menu` lists actions |
| `Command`    | the command palette: a field, a list and the keyboard                    |
| `PageHeader` | the top of each route: breadcrumb, title, description and actions, always in the same order |
| `TableOfContents` | the "Nesta página" index: reads the headings and marks the section being read on scroll |

### Data

| Piece       | What it is for                                                   |
| ----------- | ---------------------------------------------------------------- |
| `Table`     | semantic table, with row selection                               |
| `DataTable` | table with the three query states: loading, error and empty      |
| `FilterBar`, `FilterChip` | the row of applied filters around the listing, with clear and count |
| `VirtualList` | a long list that draws only what fits in the frame             |
| `DescriptionList` | label and value pairs in a `<dl>`: the row's details sheet  |
| `Stat`      | the dashboard number: label, value, change and trend             |
| `Tracker`   | the strip of little squares per period: availability, issuances  |
| `Item`      | the list row: icon, text and action                              |
| `Badge`     | status badge, six tones                                          |
| `Indicator` | the count on top of something else: the bell, the tab, the avatar |
| `Avatar`    | a person's photo, with the initial behind it                     |
| `Timeline`  | what has already happened, in order, with who and when           |
| `QRCode`    | the text another's camera reads, in dark-on-light SVG in any theme |
| `PixCode`   | the Pix charge: QR, amount, recipient and the copy-and-paste that checks the CRC |

### Status

| Piece        | What it is for                                              |
| ------------ | ----------------------------------------------------------- |
| `Alert`      | a notice that stays, with the right screen reader role per tone |
| `Banner`     | page notice, in a strip at the top: maintenance, invoice, test |
| `CookieConsent` | LGPD cookie notice: refusing with the same weight as accepting, and the choice comes back for you to store |
| `Skeleton`   | placeholder while the data has not arrived                  |
| `Spinner`    | a wait with no expected end                                 |
| `Progress`   | a wait with a known end, which **moves to the end and finishes** |
| `Meter`      | capacity in use, which **goes up and down**: quota, limit   |
| `EmptyState` | empty state, with required description and way out          |
| `NotificationCenter` | the little bell with the spoken count and the list: read, mark, filter, load more |

### AI

In `@rivocode/ui/ai`, with no dependency to install and no AI SDK: the message
comes in by prop, and what the person does comes out by event.

| Piece          | What it is for                                                                    |
| -------------- | --------------------------------------------------------------------------------- |
| `PromptInput`  | the conversation field: Enter sends, Shift+Enter breaks the line; `Textarea` goes in the form |
| `Message`      | one turn, aligned by `role`, with copy, retry and the "arriving" state            |
| `Conversation` | the list that sticks to the end while the text arrives; `Timeline` looks back     |
| `ToolCall`     | the tool call, with status, input, output and approve or reject                  |
| `AILabel`      | the "IA" badge for generated content, with an explanation; record status is `Badge` |

### Drag and drop

In `@rivocode/ui/dnd`, behind `@dnd-kit/core` and `@dnd-kit/sortable`, which
only whoever imports this path installs. Both are controlled, and both move by
keyboard with announcements in Portuguese.

```sh
npm install @dnd-kit/core @dnd-kit/sortable
```

| Piece          | What it is for                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- |
| `SortableList` | the order only the person knows, dragged by the handle; ordering by a criterion is `sortable` in `DataTable` |
| `Kanban`       | cards that move between status columns, with a count and a limit that warns and does not lock |

### Structure

`Card`, `Separator`, `RivoProvider`, plus:

| Piece         | What it is for                                                         |
| ------------- | ---------------------------------------------------------------------- |
| `Accordion`   | sections that close each other                                         |
| `Collapsible` | a single block, without a frame and without coordination between siblings |
| `Spoiler`     | the start of a long text with "Ler mais", only when it overflows the height |
| `ScrollArea`  | its own scrollbar, for when the system's gets in the way of the design |
| `Stack`       | stacks in one direction, with the scale's gap that follows the density |
| `Grid`        | fixed columns or as many as fit by `minItemWidth`, without a media query |
| `Container`   | centered max width, with side breathing room, in five steps            |
| `Carousel`    | sideways slides by scroll-snap; `Tabs` if compared, `Grid` if it all fits |
| `ResizablePanelGroup` | areas with a draggable divider: N panels, nested, that collapse and remember the layout |
| `Splitter`    | the short form of the previous one for two areas, list and detail      |
| `AspectRatio` | holds the box's proportion before the content arrives                  |
| `Affix`       | sticks to the window with the house stacking, and reserves the `scroll-padding` so focus does not stop behind it |

Three things the library solves for you and that usually take work:

- **Portal with theme.** Dialog, menu, select and tooltip render outside the
  tree. The Provider creates a container that carries the theme, so they never
  appear unstyled, not even in scoped mode.
- **Toast wiring.** Provider, portal and viewport already live in the
  Provider. You call `useToast().add({...})` and that is it.
- **Stable identity of `useToast()`.** Base UI's manager returns a new object
  on every render, and a `useEffect` that depends on it goes into an infinite
  loop. Here it is stable.

## What the library decides on its own on a phone

Every component is designed at 390px before desktop, and some decisions are
built in instead of being left to you:

- A floating panel does not touch the screen edge.
- `Dialog` and `AlertDialog` dock at the bottom and take the full width.
- `Calendar` shows a single month, even when you ask for two.
- `DatePicker` swaps the anchored panel for a bottom sheet.
- `Sidebar` becomes a sheet from the left.
- A calendar day has a 44px target, against 36 on desktop.
- `Pagination` swaps the numbers for the arrows, `Breadcrumb` keeps the last
  two crumbs, `Steps` becomes a line of text with a progress bar.

`useMobile()` is exported, for the decisions your layout also needs to
make in JS.

## Forms

Zod and React Hook Form live in the `@rivocode/ui/form` subpath, with
**optional** peer dependencies: whoever does not use forms loads none of it.

```sh
npm install react-hook-form zod @hookform/resolvers
```

```tsx
import { Input, DatePicker, Button } from "@rivocode/ui";
import { Form, FormField, useZodForm, forDate } from "@rivocode/ui/form";
import { z } from "zod";

const schema = z.object({
  email: z.email("Escreva um email válido"),
  vencimento: z.date("Escolha a data"),
});

export function EmitirNota() {
  const form = useZodForm(schema, { defaultValues: { email: "" } });

  return (
    <Form form={form} onSubmit={(valores) => console.log(valores)}>
      <FormField name="email" label="E-mail" description="Para onde vai a nota">
        {(campo) => <Input {...campo} placeholder="voce@empresa.com" />}
      </FormField>

      <FormField name="vencimento" label="Vencimento">
        {(campo) => <DatePicker {...forDate(campo)} />}
      </FormField>

      <Button type="submit">Emitir</Button>
    </Form>
  );
}
```

`FormField` does not invent any `id`: what wires the label to the control is
Base UI's `Field`, through context. That is why every control in the catalog
goes through its `Field.Control`, `DatePicker` included.

The control comes through a function, and not by cloning the child, because
each one receives its value in a different way. For `Input` and `Textarea`,
spreading the field is enough. For the others, the adapters make the bridge:
`forDate`, `forValue` and `forChecked`.

`useZodForm` separates the input type from the output type. Without that a
`z.coerce.number()` lies about the field's type.

## Mask

The pattern uses `9` for a digit, `A` for a letter and `*` for both. The rest is
literal, and the mask inserts it by itself.

```tsx
import { CurrencyInput, MaskedInput } from "@rivocode/ui";

<MaskedInput mask="cnpj" onValueChange={(comPontuacao, cru) => guardar(cru)} />
<MaskedInput mask="99-99/9999" />
<CurrencyInput value={centavos} onValueChange={setCentavos} />
```

**Store the raw value**, not the punctuated one: punctuation changes over time
and the data stops matching. Money is `CurrencyInput`, which delivers integer
cents, so the server receives an integer instead of a floating point; it also
reads a pasted value like `R$ 1.234,56`.

Ready patterns: `cpf`, `cnpj`, `cep`, `telefone`, `data`, `hora`, `placa`,
`cartao`, `boleto` and `moeda`. The phone switches pattern between landline and
mobile by itself, and the boleto switches from the bank line to the
utility-bill one when it starts with 8. `isValidBoletoLine` and `parseBoleto`
check the line and read from it the bank, the amount and the due date.

## Listing with query states

`DataTable` does not know React Query, and that is on purpose: three booleans
come in, and it works the same with a hand-written `fetch`, with SWR or with a
server component.

```tsx
<DataTable
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  rowKey={(nota) => nota.id}
  columns={[
    { key: "numero", header: "Número" },
    { key: "cliente", header: "Cliente" },
    { key: "valor", header: "Valor", align: "right", hideOnMobile: true },
  ]}
  empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
/>
```

Error beats loading, and empty only counts after the query has come back.
Without that order, a new search over an error flashes "no results" before
showing the problem.

## Formatted text

The editor lives in the `@rivocode/ui/editor` subpath, on Tiptap 3, with
optional peer dependencies: whoever does not write formatted text does not load
ProseMirror.

```sh
npm install @tiptap/react @tiptap/pm @tiptap/core @tiptap/starter-kit @tiptap/extensions
```

```tsx
import { Field, FieldLabel } from "@rivocode/ui";
import { RichTextEditor, RichTextView } from "@rivocode/ui/editor";

<Field>
  <FieldLabel>Descrição do serviço</FieldLabel>
  <RichTextEditor value={html} onValueChange={setHtml} maxLength={2000} />
</Field>

<RichTextView value={nota.descricao} empty="Sem descrição." />
```

The value is HTML, and the blank editor delivers an empty string.
`RichTextView` displays what was saved without `innerHTML` and without loading
Tiptap.

## Charts

Recharts lives in the `@rivocode/ui/chart` subpath, with an optional peer
dependency: whoever does not make charts does not load its 200 kB.

```sh
npm install recharts
```

The Recharts pieces the library dresses come out of the same import: without
that you would have the frame and nothing to put inside, and you would have to
get the Recharts version right by hand. Its `Tooltip` and `Legend` are left out
on purpose: ours already wrap both, and the name would collide with the
catalog's `Tooltip`.

```tsx
import {
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  useChartMotion,
  XAxis,
  YAxis,
  type ChartConfig,
} from "@rivocode/ui/chart";

const config = {
  emitidas: { label: "Emitidas" },
  pagas: { label: "Pagas" },
} satisfies ChartConfig;

export function NotasPorMes({ dados }) {
  const movimento = useChartMotion();

  return (
    <ChartContainer config={config} className="h-64">
      <LineChart data={dados}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent config={config} />} />
        <Line dataKey="emitidas" stroke="var(--color-emitidas)" {...movimento} />
        <Line dataKey="pagas" stroke="var(--color-pagas)" {...movimento} />
      </LineChart>
    </ChartContainer>
  );
}
```

Three things `ChartContainer` solves:

- **The series color becomes a variable named after the series.** `emitidas`
  in `config` publishes `var(--color-emitidas)`, so the line, the bar and the
  tooltip speak the same way, and changing the color is touching one place.
  Without a declared color, the next one of the palette comes in, in `config`
  order. Recharts does not read Tailwind classes: the bridge has to be through a
  CSS variable.
- **Axis, grid and cursor come from the theme.** Recharts paints those three
  with its own color, and in the dark theme they disappear.
- **The tooltip is replaced entirely.** Recharts' comes out with a white
  background written as inline style, and no class fixes inline style.

The palette is eight colors per theme (`--rc-chart-1` to `--rc-chart-8`), and
they go through the contrast guard with their own minimum: **3:1 against the
surface**, which is the graphical object rule. A series color carries no text,
and demanding 4.5:1 of it would leave the whole palette too dark to tell apart.

`useChartMotion()` ties the animation to the system preference. The rest of the
catalog solves this through tokens, but Recharts interpolates in JS and no token
reaches it: without it, the only motion left on a screen with "reduce motion"
on is precisely the biggest one.

The height is yours, by class: a chart without a defined height disappears,
because the container measures the parent.

Besides the frame, the subpath brings seven ready charts. The last four are
drawn in-house, without Recharts, and do not go into `ChartContainer`: loading,
error and empty come from the `QueryBoundary` around them.

| Piece          | What it is for                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- |
| `Sparkline`    | the tiny axis-less line that fits inside a `Stat`: says whether it goes up or down, not how much   |
| `ChartDonut`   | parts of a whole, up to six, with the total in the hole and the list of slices below              |
| `ChartRadial`  | one measure against the goal: how much is left to get there, and going up is always better                 |
| `ChartGauge`   | a measure judged by named bands (on track, attention, critical), and going up can be worse |
| `ChartHeatmap` | the pattern in a row-by-column grid, like issuances by day and hour; an empty cell is not zero |
| `ChartFunnel`  | stages where each one is part of the previous, with the conversion rate written between them        |
| `ChartTreemap` | proportional area above six categories, where the donut stops informing                    |

## Application screen

```tsx
<SidebarProvider defaultOpen>
  <Sidebar>
    <SidebarHeader>RivoCode</SidebarHeader>
    <SidebarContent>
      <SidebarGroup label="Operação">
        <SidebarMenu>
          <SidebarMenuItem href="/painel" icon={<LayoutDashboard size={16} />} active>
            Painel
          </SidebarMenuItem>
          <SidebarMenuItem href="/notas" icon={<FileText size={16} />} badge={<Badge>4</Badge>}>
            Notas fiscais
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>

  <SidebarInset>
    <header>
      <SidebarTrigger />
    </header>
  </SidebarInset>
</SidebarProvider>
```

Closed means different things at each width: on desktop, shrunk down to the
icon column, with each item's name becoming a tooltip; on a phone, off screen,
and the sidebar becomes the sheet from the left. The shortcut is Ctrl+B, or
Cmd+B on Mac.

## Client theme

Copy `src/tokens/themes/rivocode-light.css`, change the values, and run the
guard:

```sh
bun run check:contrast
```

It measures every pair that carries text and fails if any falls below 4.5 to
1, or 7 to 1 on the main text. It exists to turn "I think it is readable" into a
number.

### `rivocode-ui check-theme`, in your project

The guard above runs **in here**. The theme you write runs **over there**, and
no guard in this folder reaches it. For your side of the boundary there is a
command, and it travels in the package:

```sh
npx rivocode-ui check-theme src/tema-acme.css
npx rivocode-ui check-theme src/temas/*.css --json   # the same thing, for CI
npx rivocode-ui check-theme acme.theme.ts            # the React Native map
```

It reads the files you pass, gathers the declarations by theme selector, and
demands the 55 required roles. It exits with code 1 if any is missing, so one
line in your pipeline holds the break before the deploy.

**And then it measures contrast, with the same math and the same pair table as
the guard above.** That is why it shows up twice in this section: the math
lives in a package module, and not in `scripts/`, so your theme is measured by
the code that measures ours - 76 pairs per theme, with the alpha composited
over the background it is drawn on before measuring. While that math stayed
outside the package, whoever wanted to measure their own theme wrote 220 lines
in the app: the role names, the pairs, the minimums and the alpha compositing.
The copy went stale silently, with a `compose` that did not see two of the
three alpha syntaxes and returned `NaN`.

The order of the two questions is not a detail: a missing role first, because
measuring the contrast of a role that does not exist falls back to the
inherited value and returns a pretty number by accident. If a role is missing,
the command stops there and does not measure.

**The extension says which theme shape you wrote.** `.css` is the web's layer 3.
`.ts`, `.mjs` and `.js` is the map with `light` and `dark` that
`@rivocode/ui-native`'s `RivoProvider` receives - the file that
`bun run gen:native --tema` writes. They are two formats of the same theme, and
a single command for both: two CLIs would diverge at the first fix only one of
them got. Whoever prefers to measure by code imports `checkThemeMap` from
`@rivocode/ui-native/contrast`.

**The message says what happens on the screen, and not just which token is
missing.** A missing `--rc-font-sans` is not a compile error: `tsc` passes,
Vite passes, and the whole page renders in the browser's font. That is how the
0.7.0 change, which moved `--rc-font-*` from the global layer into the theme
selector, arrived silently for whoever had a theme written for 0.6.x. The
command splits the missing ones into two lists, silent break and visible break,
and warns when the missing role **was born in a new version** - which is the
moment it can be fixed, at upgrade, and not months later.

The three finishing roles (`--rc-accent-image`, `--rc-accent-shadow` and
`--rc-overlay-filter`) are the only optional ones and do not count. Neither do
the shape tokens: they have a `:root` value underneath.

## Development

```sh
bun install
bun run check   # lint, types, color guard, contrast guard, tests
bun run shot    # generates the showcase in demo/dist/, desktop and phone
bun run serve   # opens the showcase at http://127.0.0.1:4173
```

### `bun link` duplicates React

When developing with `bun link`, the consuming project pulls React from inside
this folder instead of its own, and the page breaks with
`Cannot read properties of null (reading 'useState')`. It is not a package
defect: the published package does not carry React inside. It is the link.

In the consuming project's `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"] },
});
```

## Versions

From 1.0 on, strict semver: breaks only in a major version; what is going away
spends at least one minor version marked `@deprecated` in the type, with the
new path, and only leaves in the following major version; a new prop and a new
piece are a minor version; a fix is a patch version.

## Notes

- Base UI is the `@base-ui/react` package. The old name,
  `@base-ui-components/react`, stopped at a release candidate and should not be
  used.
- Publishing only happens when a person bumps the version number and closes the
  CHANGELOG: the tag is born by itself after the whole gate passes on that
  commit, and a merge of half-done work publishes nothing.
- The phone portrait comes from inside an iframe, in `demo/celular.html`, and
  not from the window size: Chrome on macOS does not open a window below 500px,
  and asking for 390 returned a photo cropped at 390 **with a 500 layout**.

## Documentation

<https://ds.rivocode.com.br>

Each piece also has a raw markdown address, for whoever reads with an agent
instead of the eye: `https://ds.rivocode.com.br/componentes/<kebab-name>.md`.
The index is at `/llms.txt`, and there is a ready skill at `/skill`.

## License

MIT. See [LICENSE](LICENSE).
