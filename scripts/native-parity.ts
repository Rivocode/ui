/**
 * Parity with React Native, written once and published in three places.
 *
 * Whoever plans a phone screen needs to tell apart two things the docs did
 * not: "we decided not to port" and "we have not got there yet". The old
 * table listed what translates and named four absences; the other twenty-odd
 * pieces simply did not appear, and an absence without a row reads as the
 * reader's oversight, not the library's.
 *
 * The bigger hole was something else: the table lived only in the guide.
 * Whoever opens `/componentes/meter` is deciding to use the Meter right now,
 * and the fact that it does not exist on the phone was on a page that person
 * did not open. That is why the same source writes both: the guide's table
 * and the "In React Native" section of every piece page.
 *
 * Run again:
 *
 *   bun run scripts/native-parity.ts            writes
 *   bun run scripts/native-parity.ts --check    only checks, for CI
 *
 * The `--check` mode fails in four situations, and all four are silent:
 *
 * 1. A catalog piece without a row here - someone published a new piece and
 *    the table stayed mute about it.
 * 2. A row here without a piece in the catalog - the table promises what
 *    does not exist.
 * 3. A `traduz`/`vira` row whose native name is NOT in any index of the
 *    native package - the table promises an import that breaks.
 * 4. A `fila`/`nao` row whose name IS ALREADY in a native index - the piece
 *    was ported and the docs keep sending the reader to the substitute.
 *
 * The truth is the code: `.design-sync/docs` and the native indexes. What is
 * written below is the judgment - why a piece does not cross over, and what
 * to use instead -, and no cross-check of indexes finds that out on its own.
 *
 * The state values (`traduz`, `vira`, `fila`, `nao`) are keys, not prose, and
 * stay as they are. The text that comes out of here is published prose: the
 * note in this table shows up on the page of every piece.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { scanAtLeast } from "./scan";

const DOCS = ".design-sync/docs";
/**
 * The native package's indexes - all SEVEN, and the six below are not a
 * detail.
 *
 * The form, the chart, copying and attaching live on their own paths
 * (`@rivocode/ui-native/form`, `/chart`, `/clipboard`, `/file-upload`) for
 * the same reason as on the web, where `Form` and `ChartContainer` also do not
 * come out of `src/index.ts`: each of them has an OPTIONAL peer behind it -
 * react-hook-form, react-native-svg, expo-clipboard, expo-document-picker -
 * and metro resolves imports per file. Inside the main index, whoever only
 * wants a Button would have to install all four.
 *
 * It is one subpath per PEER, not one per subject: clipboard and file-upload
 * would share a door called `/expo` nicely, and the installer's math says no
 * - whoever copies an NF-e access key does not attach a file.
 *
 * The sixth, `/ai`, is the written exception: it has no peer. What it costs
 * is weight, and on the phone weight is compilation - metro does not shake
 * trees, and everything the root index reaches goes into the app of whoever
 * only wanted a Button. The AI family only serves an app that talks to a
 * model, and the path is the same as the web's, `@rivocode/ui/ai`.
 *
 * The seventh, `/dnd`, has no peer either, but for another reason: on the web
 * it carries dnd-kit, and on the phone the gesture is the core's
 * `PanResponder`. The separate path exists so the import line is the same in
 * both packages (`@rivocode/ui/dnd` and `@rivocode/ui-native/dnd`), and so
 * the reorderable list does not land on the device of whoever only imports a
 * Button.
 *
 * Measuring only the root index, `--check` would say the Form had not ported
 * the day after it was ported.
 */
const NATIVE_INDEXES = [
  "native/src/index.ts",
  "native/src/form/index.ts",
  "native/src/chart/index.ts",
  "native/src/clipboard/index.ts",
  "native/src/file-upload/index.ts",
  "native/src/ai/index.ts",
  "native/src/dnd/index.ts",
];

type State =
  /** Exists on native with the same name. The API is almost never the same. */
  | "same"
  /** Exists under another name, and the other name is the whole piece. */
  | "renamed"
  /** Does not exist yet, and the intent is for it to exist. */
  | "queued"
  /** Will not exist, and the reason is in the note. */
  | "no";

type Row = {
  state: State;
  /** The native name, when it differs. Required in the `vira` state. */
  native?: string;
  /** The table cell: a short fragment, lowercase, no final period. */
  note: string;
  /**
   * The piece page's paragraph, when the assembled sentence is not enough.
   * Written where choosing wrong is expensive.
   */
  page?: string;
};

/**
 * `ButtonGroup` does not show up in the top-level piece scan: the site's
 * prefix rule (`apps/docs/src/parts.ts`) hands it to the `Button` page, along
 * with `CardHeader` and `DialogFooter`. But it is a control of its own, with
 * its own native decision, and being left out of the table by an accident of
 * spelling was exactly the silence this file exists to close.
 */
const PARTS_THAT_ARE_PIECES = new Set(["ButtonGroup"]);

/** Pieces the prefix rule would swallow and should not. Same as the site. */
const STANDALONE = new Set([
  "AlertDialog",
  "CheckboxGroup",
  "InputGroup",
  "Menubar",
  "NavigationMenu",
  "RadioGroup",
  "ResizablePanelGroup",
  "ToggleGroup",
  "TableOfContents",
  "TreeSelect",
]);

/** Where the prefix points to the wrong parent. Same as the site. */
const PARENT: Record<string, string> = {
  Tab: "Tabs",
  TabList: "Tabs",
  TabPanel: "Tabs",
  ChartTooltipContent: "ChartContainer",
  ChartLegendContent: "ChartContainer",
  InputPrefix: "InputGroup",
  InputSuffix: "InputGroup",
  InputAction: "InputGroup",
  Radio: "RadioGroup",
  ResizablePanel: "ResizablePanelGroup",
  ResizableHandle: "ResizablePanelGroup",
};

const PARITY: Record<string, Row> = {
  Accordion: {
    state: "same",
    note: "`value`, `defaultValue` and `onValueChange` on the root, through the `value` of each `AccordionItem`; one open at a time, as on the web (`multiple` allows several), and an item without `value` opens on its own. It opens with the arrow rotating and the body fading in, and with no motion when the system asks to reduce it",
  },
  Alert: {
    state: "same",
    note: "`title` is a prop and the body is a child; no `AlertTitle`/`AlertDescription`; `icon`, `onDismiss` and `labels` as on the web, and the icon can also come in as a function, in the tone's color",
  },
  AlertDialog: {
    state: "same",
    note: "`onConfirm`, `onCancel` and `labels` instead of composition, with the names of the `Popconfirm`; `tone` `danger` or `neutral`, and an `onConfirm` that returns a promise holds the modal in a waiting state until it settles; it does not close on a tap outside, as on the web",
  },
  AspectRatio: { state: "same", note: "numeric `ratio`, the same" },
  Carousel: {
    state: "same",
    note: "built on a horizontal `FlatList` with `pagingEnabled`; the list comes through `items` and `renderItem`, the `index` is controlled, and there is no `autoplay`",
    page:
      "Translates on top of the core's horizontal `FlatList`: with one slide at a time it pages by " +
      "the full width (`pagingEnabled`), and with more than one it settles slide by slide " +
      "(`snapToInterval`). The drag is the system's own, and `onIndexChange` arrives when the " +
      "scroll settles.\n\n" +
      "**The list comes through `items` and `renderItem`, and the `index` is controlled**, as in the " +
      "whole native package. `slidesPerView` is a single number: the phone's width does not change in the middle " +
      'of the screen, and the web\'s per-width object and `"auto"` do not cross over.\n\n' +
      "**There is no `autoplay`.** On touch, a row that moves on its own fights the finger that is " +
      "about to drag, and the pause button would sit a thumb's width away from the content " +
      'that moves. Without the dots, a "2 de 5" counter sits between the buttons, in a polite ' +
      "live region that tells the screen reader the new slide.\n\n" +
      "```tsx\n" +
      "<Carousel\n" +
      '  label="Planos"\n' +
      "  items={planos}\n" +
      "  index={index}\n" +
      "  onIndexChange={setIndex}\n" +
      "  renderItem={(plano) => <Card>{plano.nome}</Card>}\n" +
      "/>\n" +
      "```\n\n" +
      "The parts are styled through the same `classNames` as the web: `viewport`, `slide`, `footer`, `previous`, `next`, `indicators` and `indicator`. `pause` does not exist here, because there is no `autoplay`.",
  },
  Avatar: {
    state: "same",
    note: "remote `src` through the core's `Image`; `fallback` is required, because it is what shows while the photo downloads and if it fails",
  },
  Badge: {
    state: "same",
    note: "the same tones; the text is a child; it has NO `size`, because the native package has a single density",
    page:
      "Translates in the tones and the pill, and **without the web's `size`**. There, `sm` exists so the badge " +
      "fits in a `DataTable` row, which is a desktop thing and shrinks with density; here there is no " +
      "row that shrinks: the native `RivoProvider` already declares that `comfortable` is the only " +
      "height, because a touch target does not get smaller, and a second size would make this the only piece in the " +
      "package offering the compact mode the package decided not to have.\n\n" +
      "And the prop would cost more than it pays. To match the web it would have to be born at " +
      "`md`, which would enlarge every badge already published; being born at today's size would make " +
      '`size="md"` draw different things in the two packages, which is worse than not having the ' +
      "prop. The native badge is `text-xs`, fixed.",
  },
  Calendar: {
    state: "same",
    note: "month drawn by hand; `value`, `onValueChange`, `min` and `max` in ISO `yyyy-mm-dd`, which the web also accepts; displayed as `dd/mm/yyyy`; the new month fades in; `classNames` with the names of the web's `DayPicker`",
  },
  Card: {
    state: "same",
    note: "with `CardHeader`, `CardTitle`, `CardDescription` and `CardContent` (no `CardFooter`)",
  },
  ChartContainer: {
    state: "same",
    note:
      "lives in `@rivocode/ui-native/chart`; the four endings cross over with the same names, and the " +
      "drawing comes in as a function: there is no Recharts, no measuring container, and no `var(--color-series)`",
    page:
      "Translates, on its own path `@rivocode/ui-native/chart`, with the same arrangement as the " +
      "form and for the same reason: `react-native-svg` is an **optional** peer, and on the phone it is not just " +
      "bytes, it is a native module the app has to link and rebuild.\n\n" +
      "**What crosses over whole are the four endings.** `isLoading`, `isError`, `onRetry`, " +
      "`errorTitle`, `errorMessage`, `labels.retry`, `empty` and `data` have the same names and the same meaning, and the loading state draws " +
      "the same six uneven bars. Three type differences, all because text on native lives " +
      "inside a `Text`: `errorMessage`, `empty.title` and `empty.description` are `string`. " +
      "`empty.icon` crosses over, and also accepts the native `EmptyState`'s function. The " +
      "try-again button sits **outside** the alert: the native `Alert` has a title and a body, and the body is one " +
      "line of text.\n\n" +
      "**What changes is the drawing.** On the web the frame wraps a Recharts chart, which measures its parent " +
      "on its own and reads each series' color from `var(--color-series)`. Here there is no Recharts, no " +
      "measuring container and no live variable. So the frame measures with `onLayout`, resolves the " +
      "colors of the `config` and **hands both things** to whoever draws, the way the native `Form` hands over " +
      "`submit`:\n\n" +
      "```tsx\n" +
      '<ChartContainer config={SERIES} data={meses} className="h-56">\n' +
      "  {({ width, height, colors }) => (\n" +
      "    <Svg width={width} height={height}>…</Svg>\n" +
      "  )}\n" +
      "</ChartContainer>\n" +
      "```\n\n" +
      "The frame's `colors` is a **map keyed by the `config` key**, not an array: it is the " +
      "web's `var(--color-series)` in another vehicle, and whoever draws asks for the color of `receita` " +
      "by name, which is what survives someone reordering the `config`. The array is `PALETTE`, " +
      "and it is an array on both sides: it is the fallback order, where the color comes from for a series that did not " +
      "declare `color`. The difference is that here it is **exported**, because without a live variable " +
      "whoever draws by hand needs to reach it.\n\n" +
      "The measurement arrives **zeroed on the first frame** and real on the next: on the phone there is no " +
      "width before layout. `children` also accepts plain JSX, and that is how " +
      "`ChartDonut` and `ChartRadial` get the four endings without needing anything from the frame.\n\n" +
      "Two more rules, both because of what does not exist on this side. `config.color` asks for a " +
      "**token role** (`chart-1` to `chart-8`), not a CSS color: the color the piece receives is the " +
      "final value that goes into the drawing, and a hex written there would be the only thing on the screen " +
      "deaf to the client's theme. And `label` only applies in the function form: with a JSX child, the one " +
      "naming is the inner piece, and an `accessible` on top of it would close the donut's legend into a " +
      "single screen reader stop.\n\n" +
      "**Motion comes in two marks, because here there is no `Line` or `Bar` for the frame " +
      "to dress.** `ChartBar` is the bar (`x`, `y`, `width`, `height`, `fill`, `radius`) and " +
      "`ChartLine` is the line (`points` in px, `stroke`, `strokeWidth`, `baseline`), both on the " +
      "same `/chart` path. On mount they enter (the bar grows from its base; the line rises " +
      "from the `baseline`, or from the lowest point) and, when the value changes, they move to the new one with the " +
      "duration and curve of the tokens (`duration-slow`, `ease`), through Reanimated over " +
      "`react-native-svg`: the same decision as the web, that the chart draws itself on appearing and " +
      'moves when the data changes. With "reduce motion" they are born in place and jump. The line ' +
      "moves point by point " +
      "when the count is the same as before, and swaps all at once when it is not. Whoever draws with " +
      "raw `Rect` and `Path` still can, and it stays still.",
  },
  ChartDonut: {
    state: "same",
    note:
      "the legend is the control: with no tooltip to open on touch, tapping the row lights the slice, and the " +
      "written center stays in the middle; `format` accepts a formatter name or a function, as on the web, " +
      "the ends are square, and `empty` takes the donut's place when there is no data",
    page:
      "Translates, in `@rivocode/ui-native/chart`, with the same props: `valueKey`, `nameKey`, " +
      "`config`, `thickness`, `legend`, `centerValue`, `centerLabel` and `format`, which accepts the " +
      "name of a house formatter (`currencyShort`, `percent`) or a function, as on the web. " +
      "One type change: the center is `string`, not `ReactNode`.\n\n" +
      "**What really changes is how a slice is read.** On the web the pointer rests on the ring and the tooltip, " +
      "opened outside the hole, says name and value, with the total fixed in the middle. On touch there is no " +
      "resting, and the equivalent gesture lives in the **legend**, not in the slice: tapping a row lights " +
      "its slice, and the row itself already says name and value. The written center (`centerValue` and " +
      "`centerLabel`) is always visible, the same decision as the web; only when there is no center does the empty " +
      "middle show the slice being read. Tapping again clears the reading.\n\n" +
      "Each row's number is what arrived, negative included: only the arc uses the zero floor, " +
      "because a slice has no negative size. The background ring is always drawn, in the " +
      "border token, and with no slice at all the drawing announces nothing to the screen reader. With `empty` " +
      "(`{ title, description, action?, icon? }`, the `ChartContainer` format), an empty list or " +
      "a zero sum shows the empty state in place of the donut.\n\n" +
      "The slice is not the target, and the reason is arithmetic: a 190px ring has about 600px of " +
      "circumference to split among up to six slices, and a 2% slice gets twelve (the same math " +
      "that removed the per-square tooltip from the `Tracker`). The legend row is 44px tall and as wide as the screen.\n\n" +
      "**And screen reading does not use the `Tracker` trick.** There the 90 periods became a single " +
      "`adjustable` stop, because 90 stops inside a card are an obstacle. Here there are at most " +
      "six slices (beyond that the donut stops informing and a horizontal bar reads better), and six " +
      "stops with name and value are better than one adjustable, because each one is also the button " +
      "that lights the slice. Different count, different answer. With `legend={false}` the drawing becomes " +
      "an image whose name carries the slices **and the values**: without a legend and without a tooltip, the data would be " +
      "unreachable.\n\n" +
      "One drawing difference, and it is measured: the slice ends are **square**. The " +
      "web's `cornerRadius` comes from Recharts, which trims the corner of a filled slice; here the " +
      "slice is a stroked arc, and the round cap SVG offers extends the stroke by almost twelve " +
      "degrees on each side at the default thickness: a 5% slice would look like 11%.\n\n" +
      "The motion is the web's: the donut is born complete and, when the data changes, each slice moves " +
      "from the old angle to the new one with the duration and curve of the tokens, through Reanimated. With " +
      '"reduce motion", the change is instant.',
  },
  ChartRadial: {
    state: "same",
    note:
      "crosses over almost whole, because it never had a tooltip; `color` is a token role and the name comes from " +
      "what is written in the middle, not just the percentage",
    page:
      "Translates almost whole, in `@rivocode/ui-native/chart`, and it is the chart piece that changes least: " +
      "**it never had a tooltip**. The value lives in the middle of the arc, as text, since the web. What the finger " +
      "would do here, the eye has already done. `value`, `max`, `sweep`, `variant` and `segments` cross over " +
      "unchanged, the dashed arc included.\n\n" +
      "Two type changes, the same as the donut: `centerValue` and `centerLabel` are `string`, and " +
      "`color` is a token role (`chart-3`, `success`), not a CSS color.\n\n" +
      'The accessibility role is `image`, like the web\'s `role="img"`, and the two neighbors ' +
      "explain why: the native `Meter` had already refused `progressbar`, which makes the screen reader " +
      "announce a progress indicator for a measure that goes up and down, and `adjustable`, which " +
      "would promise that the gesture changes the value. The name carries the number, so hearing the piece is hearing the " +
      "measure. Without `label`, it is built from what is written in the middle (the value **and** the line " +
      'below), not just the percentage as on the web: "82 por cento" alone does not say percent of what.\n\n' +
      "The smooth arc moves to the new value as on the web, and is born in place; `segmented` lights the " +
      "dashes all at once, also as on the web.",
  },
  ChartFunnel: {
    state: "same",
    note:
      "same props, with `color` as a token role; each stage is one " +
      "stop with name, number and rate in the same sentence",
    page:
      "Translates, in `@rivocode/ui-native/chart`, and it is the chart piece that needs " +
      "`react-native-svg` least: the bars are `View`s, and the rate math is the same function as the web, " +
      "generated in `native/src/shared/`. `valueKey`, `nameKey`, `align`, `formatRate`, " +
      "`showOverall`, `labels` and `format`, with a formatter name or a function, cross over " +
      "unchanged.\n\n" +
      "One type change, the same as the donut: `color` is a token role (`chart-2`), not a CSS " +
      "color. And one reading change: on the web the piece is an ordered list " +
      "and the screen reader reads the name, the number and the rate in pieces; here **each stage is a single " +
      'stop**, with all three in the same sentence ("Cadastros: 400, 40% da etapa anterior"), because the ' +
      "phone's screen reader moves from element to element and three stops per stage would triple " +
      "the path. There is no `label`: on touch there is no list name, and the card's title plays that " +
      "role.\n\n" +
      "The bars grow from zero on appearing and move to the new width when the data changes, " +
      'through Reanimated and with the motion tokens; with "reduce motion", they are born in place.' +
      "\n\nThe parts are styled through the same `classNames` as the web: `stage`, `bar` and `rate`. With `empty` " +
      "(the `ChartContainer` format), an empty list or a zero sum shows the empty state in place " +
      "of the bars.",
  },
  ChartGauge: {
    state: "same",
    note:
      "crosses over almost whole, like `ChartRadial`; the band scale goes into the accessible name, " +
      "because there is no separate description on touch",
    page:
      "Translates, in `@rivocode/ui-native/chart`, with the same props: `value`, `max`, `bands`, " +
      "`sweep`, `centerValue`, `centerLabel`, `label`, `format`. The bands are the same, with `tone` " +
      "`success`, `warning` or `danger`, and they paint the same `-text` roles as the web: the measurement of the " +
      "arc over the track is the same on both sides, and it is in the native contrast map.\n\n" +
      "One type change, the donut's and the arc's: `centerValue` and `centerLabel` are `string`. " +
      "And one reading change: on the web the band scale goes in a " +
      "separate description, linked by `aria-describedby`; the phone has no such channel, so " +
      'it goes at the end of the accessible name ("72 de 100, Atenção. Bom de 0 a 60; Atenção de 60 a ' +
      '85; Crítico de 85 a 100"). The role is `image`, for the same reason as `ChartRadial`.\n\n' +
      "The arc and the needle move together to the new value, through Reanimated, and are born in place with " +
      '"reduce motion".' +
      "\n\nThe parts are styled through the same `classNames` as the web: `value` and `label`, the two texts in the middle. `arc` does not port as a part: the arc is drawn in the `Svg`, and `react-native-svg` does not take classes.",
  },
  ChartHeatmap: {
    state: "same",
    note:
      "the grid becomes a single `adjustable` stop, like the `Tracker`, and the finger picks the cell; with no " +
      "tooltip, the reading lives in a line below",
    page:
      "Translates, in `@rivocode/ui-native/chart`, with the same props: `rowKey`, `columnKey`, " +
      "`valueKey`, `rows`, `columns`, `domain`, `labels`, `legend`, `format`. The scale is the same, " +
      "five steps of a single color, and the alphas come from the same constant as the web, generated in " +
      "`native/src/shared/`. Zero paints the first step and a cell with no data has a dashed " +
      "border, the same.\n\n" +
      "One type change: `color` is a token role (`chart-3`).\n\n" +
      "**What changes is how a cell is read.** On the web the pointer rests and the tooltip opens, and the screen " +
      "reader navigates a hidden table. On the phone there is no tooltip and no table: the finger taps or " +
      "drags over the grid and picks the cell under it, which gets an outline, and the row, the " +
      "column and the number appear written below the grid. For the screen reader the grid is " +
      "**a single `adjustable` stop**, which moves cell by cell with the swipe up and down gesture, " +
      "the same decision as the `Tracker`: one hundred and sixty-eight stops inside a card would be " +
      "an obstacle, and the value of each one goes whole into `accessibilityValue`.\n\n" +
      "At most six column labels appear, not by measured width as on the web: the " +
      "phone screen is always narrow, and a label that does not appear is still spoken in the reading." +
      "\n\nThe parts are styled through the same `classNames` as the web: `grid`, the stop that receives the drag, `cell` and `legend`. " +
      "With `empty` (the `ChartContainer` format), a grid with no number or all zeros gives way " +
      "to the empty state; without it, an all-zero grid keeps painting the faintest step.",
  },
  ChartTreemap: {
    state: "same",
    note:
      "each category is a button with name, value and share; tapping lights the outline and writes the " +
      "reading below, and the rule for the label that disappears is the same",
    page:
      "Translates, in `@rivocode/ui-native/chart`, with the same props: `valueKey`, `nameKey`, " +
      "`config`, `format`. The geometry is the same function as the web (the *squarified* one, generated in " +
      "`native/src/shared/`), and so is the label rule: name and value when both fit, only " +
      "the name when one line fits, nothing when not even the name fits, and nothing before `onLayout` " +
      "measures the box. The 30% ink with `fg` on top is the same, and the sixteen pairs are in the " +
      "native contrast map.\n\n" +
      "One type change: `config.color` is a token role, as in the whole family.\n\n" +
      "**What changes is how a category is read.** Here there are few (beyond a dozen the treemap " +
      "stops informing), and few categories become few stops: each rectangle is a button with " +
      "name, value and share, the donut legend's decision and not the `Tracker`'s. Tapping lights the " +
      "outline and writes the reading below, in place of the web's tooltip; tapping again clears it. That is " +
      "why there is no `label`: the web uses it to name the group and the hidden list, and on the phone neither " +
      "exists. The card's title plays that role." +
      "\n\nThe parts are styled through the same `classNames` as the web: `cell`, each category's block, and `label`, the name and value inside it. " +
      "With `empty` (the `ChartContainer` format), an empty list or a zero sum shows the empty " +
      "state in place of the blocks.",
  },
  Checkbox: {
    state: "same",
    note: "`checked` and `onCheckedChange` **required**; no `defaultChecked`; `indeterminate` as on the web; the check mark grows in when checked",
    page:
      "Translates, with a catch that bites on the first line: on native the `Checkbox` is " +
      "**always controlled**. `checked` and `onCheckedChange` are required and there is no " +
      "`defaultChecked`. Copying `<Checkbox defaultChecked>ISS retido</Checkbox>` from the " +
      "web does not compile.\n\n" +
      "**The third state crosses over.** `indeterminate` draws a dash in the filled box and " +
      "announces `mixed` to the screen reader; it wins over `checked` in the drawing, and a tap checks " +
      "everything. The select-all box is assembled by hand, because the web's `parent` does not exist " +
      "there: `indeterminate` when part of the list is checked, `checked` when all of it is.\n\n" +
      "**The spoken name is `label`, in place of the web's `aria-label`**, the same name the other " +
      "native pieces use. With `children` it is optional and replaces the text the screen reader " +
      "reads; without `children` it is required, and the type rejects a box with neither - the one that checks " +
      'a list row would be announced only as "caixa de seleção, marcado". Inside ' +
      "`FormField`, `forChecked` already provides the `label`." +
      "\n\nThe parts are styled through the same `classNames` as the web: `box`, `indicator` (the check mark or the dash) and `label`.",
  },
  CheckboxGroup: {
    state: "same",
    note: "`items` on the root and `value: string[]`; `label` names the set, in place of the web's `aria-label`",
    page:
      "Translates with `items` on the root and `value: string[]`, instead of one `Checkbox` per child, and " +
      "without the web's `allValues`/`parent`: the master box stays outside the group, and it is a " +
      "`Checkbox` with `indeterminate` when part of the list is checked.\n\n" +
      "**`label` is the web's `aria-label` under another name**, for the same reason as " +
      "`RadioGroup`: the list of boxes answers a question, and without the set's name each " +
      "box presents itself without saying which one. Naming also turns on the list role, because in React " +
      "Native there is no `group` role and a `View` with no role at all carries no name.",
  },
  Collapsible: {
    state: "same",
    note: "`label` in place of `CollapsibleTrigger` and `CollapsiblePanel`; `open`/`onOpenChange` or `defaultOpen`, as on the web; the same motion as the `Accordion`",
  },
  Combobox: {
    state: "same",
    note: "the list opens in a sheet with accent-insensitive search, and the sheet rises with the keyboard; `items` on the root, flat or in `{ label, items }` groups, not a `ComboboxItem` per child",
  },
  DatePicker: {
    state: "same",
    note: "opens the sheet with the month; stores ISO `yyyy-mm-dd`, which the web also accepts, and displays `dd/mm/yyyy`",
  },
  DescriptionList: {
    state: "same",
    note: "the borders come in through `Children`: Tailwind's divide utility does not exist in RN",
  },
  Dialog: {
    state: "same",
    note: "`open`, `onOpenChange` and `title` as props; no `DialogTrigger`. It opens with a fade, and with no transition when the system asks to reduce motion; the card rises into the space above the keyboard",
  },
  ImageViewer: {
    state: "same",
    note: "built on `Modal` and `FlatList` with `pagingEnabled`; controlled `index`, pinch through the core's `PanResponder`, no new peer",
    page:
      "Translates on top of the core's `Modal`, with the images in a horizontal `FlatList` with " +
      "`pagingEnabled`: swiping changes the image, and Android's back closes it. The " +
      "thumbnail grid is the same, built on the native `Grid`, and each thumbnail is an `imagebutton` " +
      "with the `alt` as its name. The `index` is controlled, as in the whole native package: " +
      "`onIndexChange` receives the index on opening and on navigating, and `null` on closing.\n\n" +
      "**Pinch comes from the core's `PanResponder`, not from react-native-gesture-handler.** " +
      "The package already requires reanimated, but not gesture-handler, and an image viewer " +
      "does not justify one more required peer for every app. Two fingers zoom in up to " +
      "`maxZoom`, one finger drags the zoomed photo, and a double tap doubles and undoes the zoom. " +
      "While zoomed, the row stops scrolling: the finger dragging the photo does not change the photo. The " +
      "plus, minus, previous and next buttons are still there, because the screen reader does not " +
      "pinch.\n\n" +
      "`caption` is a `string`, the neighbor on each side is requested ahead of time through `Image.prefetch`, and the " +
      '"3 de 8" counter sits in a live region that also says the new image\'s `alt`.\n\n' +
      "The stage is dark in both schemes, as on the web: the colors come from " +
      "`tokens.media`, not from the theme, so the `Modal` does not lighten in the light theme or in a " +
      "client theme. A disabled control follows the package rule, the whole " +
      "layer at 50%.\n\n" +
      "The parts are styled through the same `classNames` as the web, all eight: `thumbnails`, `thumbnail`, `viewer`, `toolbar`, `counter`, `stage`, `image` and `caption`. `className` styles the thumbnail grid, the same node as `thumbnails`, because the piece has no root: the grid and the `Modal` are siblings.",
  },
  EmptyState: {
    state: "same",
    note: "`description` required, for the same reason as the web; `icon` and `illustration` on both sides",
    page:
      "Translates, with `description` required for the same reason as the web, and with both " +
      "drawing slots: `icon` and `illustration`, both hidden from the screen reader.\n\n" +
      "**In React Native color does not flow down from the `View` to the SVG**, so `icon` also accepts " +
      "a function, which receives the `fg-subtle` of the theme currently painting and the same 32 as the web:\n\n" +
      "```tsx\n" +
      "<EmptyState\n" +
      "  icon={({ color, size }) => <Search color={color} size={size} />}\n" +
      '  title="Nada encontrado para esse filtro"\n' +
      '  description="Tente ampliar o período ou limpar o filtro de status."\n' +
      "/>\n" +
      "```\n\n" +
      "`illustration` forces nothing, as on the web: the size belongs to whoever draws, and the color comes " +
      "from the roles in `useRivo().colors`, never from a literal color. `title` and `description` are " +
      "`string`, because they live inside a `Text`.",
  },
  Field: {
    state: "same",
    note: "`label`, `description` and `error` as props, and `label` names the text field inside; `validate`, `validationMode` and `validationDebounceTime` with the web's name, signature and timing, and an explicit `error` wins over `validate`; `validate` receives the text of the text fields (`Input`, `Textarea`, `MaskedInput`, `InputGroup`, `PasswordInput`) and the value of the ones that open a sheet (`Autocomplete`, `Select`, `Combobox`, `DatePicker`), and the error is announced, lights their border and becomes the hint; in the sheet ones, closing the sheet is leaving the field, and `Concluir` and the submit key are the submit. Text that arrives later fades in",
  },
  FilterBar: {
    state: "same",
    note: "scrolls horizontally with the clear button anchored OUTSIDE what scrolls; the reserved row is one touch target tall; the edge with more hidden content becomes a 1pt rule, not a fade",
    page:
      "Translates, and this is where the piece is worth the most: a listing on the phone is where filtering hurts. The " +
      "drawing decisions had already been made with 390px in mind, so almost everything crosses over: it scrolls " +
      "horizontally, does not wrap and does not collapse into `+3`.\n\n" +
      "**The clear button stays OUTSIDE what scrolls.** If it scrolled along, the control that exists to " +
      "undo everything would be the only one that requires scrolling to the end to find. It anchors to the right " +
      'of the row, and the native `Button`\'s `size="sm"` already delivers the 44pt target on its own.\n\n' +
      "**The reserved row is now measured in fingers.** On the web it keeps the height of " +
      "`--rc-control-sm`; here it keeps 44pt, which is one touch target tall. There is no control " +
      "token on this side. The row has the same height empty and full, for the same reason as the " +
      "`Tracker`: the screen cannot jump when the first filter comes in.\n\n" +
      "The live region is a single `Text` that combines both roles, instead of the web's two nodes: " +
      "duplicating would open a dead `gap` in the row. `accessibilityLiveRegion` is Android's and the " +
      "web's; on iOS, where it does not exist, the same sentence goes out through `announceForAccessibility`, and " +
      "only when the count changes, like the live region.\n\n" +
      "**RTL was verified, and React Native itself solves most of it.** The row and the " +
      "chip are already mirrored by Yoga when the locale is right-to-left, and the " +
      "scroll's resting position already stops at the edge where reading starts: flipping again would be the " +
      "classic mistake of mirroring twice. The `contentOffset` that reaches JavaScript is " +
      "always a physical distance from the left, in both directions and on both " +
      "platforms, so the rule marks the physical side that has content beyond it, and does not " +
      "switch sides.\n\n" +
      "What needed math was the RESTING value. The code kept zero until the " +
      "first scroll event arrived: true in LTR, false in RTL, where the resting position is the end of the " +
      "content. On iOS the defect lasted forever as long as nobody dragged, because at " +
      "rest it emits no event at all, and the rule appeared on the wrong side.\n\n" +
      "**The edge fades on the web; here it is a rule.** `mask-image` does not exist in React " +
      "Native, and a real fade could only come in two ways. A new peer " +
      "(`expo-linear-gradient`, `MaskedView`), which a filter bar cannot demand, " +
      "because on the phone a peer is a native module to link and rebuild. Or a gradient painted " +
      "IN the color of the surface behind, which the piece has no way of knowing: in the dark theme, `surface` " +
      "over `bg` becomes a light smear over the chips. The gradient itself was even within " +
      "reach, because `react-native-css` compiles `linear-gradient` to the " +
      "`experimental_backgroundImage` that RN ships with; what is missing is the mask, and without " +
      "it there is no per-pixel alpha.\n\n" +
      "What remained: a 1pt rule in `border-strong` against the edge that has hidden content, " +
      "which appears and disappears on its own as the scroll moves, costs no width and " +
      "does not eat a drag that starts on it. It is the same cue, harder, and it is the same `inset 1px` " +
      "with which the `DataTable` marks the frozen column on the web.\n\n" +
      "The web's tab stop goes away, because there is no keyboard focus here. The parts are styled " +
      "through the same `classNames` as the web: `list` on the scrolling content, `item`, `chip`, `clear` " +
      "and `empty`, the last only on the reserved row.",
  },
  FilterChip: {
    state: "same",
    note: "the touch strip is 44pt and the painted pill stays at 28; `size` changes the drawing, never the target",
    page:
      "Translates, with the same vocabulary as the web: label, value and the remove button, no `tone`. " +
      "A filter is not a status, and six colored chips become a traffic light where nothing means anything." +
      "\n\n**The target grows without the chip getting fatter.** The root is a 44pt strip and the painted " +
      "pill is an absolute child inside it, so it stays at 28pt as on the web. The x " +
      "inherits the strip's 44 vertical points and gets horizontal `hitSlop`.\n\n" +
      "The strip was stretched instead of using vertical `hitSlop` for a platform reason: **on " +
      "Android a touch outside the parent's bounds is not delivered**. With the 28pt pill as the parent " +
      "of the button, the slack above and below would be discarded precisely on the device that lacks target the most. " +
      "Declared consequence: `size` changes only the drawn pill, never the strip's height: " +
      "the finger does not shrink along with the chip." +
      "\n\nThe parts are styled through the same `classNames` as the web: `label`, `value` and `remove`, the x's tap target.",
  },
  EventCalendar: {
    state: "no",
    note: "a time grid is a desktop idiom; on the phone the answer is the list, and the month is the `Calendar`",
    page:
      "Queued, and the queue is about GESTURE design, not time. Three of the four views port: " +
      "`agenda` becomes a `SectionList` (virtualization out of the box, the same argument that removed " +
      "`VirtualList` from the native catalog), `day` is a single 314px column, which is a real " +
      "column, and `month` survives at 51px per cell because the cell only needs to show that " +
      "something exists and roughly what.\n\n" +
      "**`week` does not port.** Seven columns in 358px give 44.8px each, and the week column exists " +
      "to show time and duration. At 44.8px it shows a colored rectangle, which is what " +
      "`month` already does better and cheaper. The web made the same decision for its own narrow " +
      'screen: below `sm`, `week` disappears from the switcher and `view="week"` resolves to `agenda`.\n\n' +
      "**The decision was made on 2026-08-27, and it is no.** It sat in `DECLARED_QUEUE` waiting for " +
      "a gesture decision; the design was written, measured, and its math decided against the piece. " +
      "It is in `docs/2026-08-27-event-calendar-nativo-desenho.md`, and remains valid as a " +
      "record of what was measured.\n\n" +
      "The cost is not spread evenly across the views, and that is what decides it. `agenda` and " +
      "`month` are cheap: one is a list, the other is a month grid, and both already have an answer in the " +
      "package. `day` and `week` are the whole piece - the time layout engine, the 44-point " +
      "target over a 12-point strip, the conflict between swiping to change the period and dragging " +
      "to read, and most of the twelve hundred lines. They cost 15 to 18% of the package, " +
      "compiled by metro in the app of anyone who imports a `Button`, because the native package publishes " +
      "SOURCE.\n\n" +
      "And what they would buy does not fit on the screen: seven columns in 358px give 44.8px each, where the " +
      "week column exists to show time and duration. A time grid is a desktop idiom - " +
      'it answers "what clashes with what", and that question is asked with the eye wandering, and ' +
      "not with the finger covering what it touches.\n\n" +
      "**On the phone, the answer is another piece.** Appointments by day are a list, and the list is built " +
      "from what already exists. A date with a value - due date, deadline, delivery - is the `Calendar`, which " +
      "on native already paints per day through `DayPaint`. Whoever needs a time grid on the phone " +
      "is asking for the desktop screen on a device that cannot hold it.",
  },
  Gantt: {
    state: "no",
    note: "a schedule chart is a desktop idiom; on the phone the day's task is a list, and the deadline is the `Calendar`",
    page:
      "Does not port, and it is a decision, by the same math that took `EventCalendar` off the phone. " +
      "`Gantt` exists to show duration and sequence side by side: the table on the left, the " +
      "scale on the right and the arrow between the two. At 358px the table keeps the title and nothing else, " +
      "and the week scale shows eleven days per screen; the dependency arrow links bars that " +
      "are almost never on the same screen at the same time. What remains is a list with colored " +
      "rectangles, and the list alone says that better.\n\n" +
      "**Editing is what settles the math.** The web already does not drag with the finger, because the " +
      "18px bar competes for the gesture with the frame's own sideways scroll, and it is the same conflict that " +
      "the `EventCalendar`'s `week` did not solve. A native `Gantt` without dragging would be an " +
      "expensive table; with dragging, it would be a gesture the house has already measured and refused.\n\n" +
      "**On the phone, the answer is another piece.** The day's task is a list, built with `Item` or " +
      "`DataList`, with start, end and owner written out; a deadline with a value is the `Calendar`, which " +
      "paints per day through `DayPaint`; and a task's progress is the `Progress`. Rescheduling is the " +
      "form with a `DatePicker`, which is what the finger does well.",
  },
  Fieldset: { state: "same", note: "`legend` as a prop" },
  Grid: {
    state: "same",
    note: "`columns`, `minItemWidth` in points and `gap`; the grid measures its own width to count the columns",
  },
  Input: {
    state: "same",
    note: "the border lights up on focus: there is no `focus-visible` on a touch screen; `onValueChange` receives the text, as on the web, and the `TextInput`'s `onChangeText` still works",
  },
  MaskedInput: {
    state: "same",
    note: "the same masks as the web (`cpf`, `cnpj`, `moeda`, the `9` of a hand-written mask); the value arrives clean, and the masked text comes in the second argument of `onValueChange`",
    page:
      "Translates, with the same masks: the ready-made names (`cpf`, `cnpj`, `cep`, `data`, `hora`, " +
      "`placa`, `cartao`, `telefone`, `boleto` and `moeda`) and the hand-written mask, with `9` " +
      "for a digit, `A` for a letter and `*` for both, come from a single file, shared " +
      "by both packages.\n\n" +
      "What changes is `value`: here it is the clean value, without punctuation and with letters in upper " +
      "case, because the mask belongs to the field and the data does not carry it. `onValueChange` delivers the " +
      "clean value first and the masked text in the second argument, which is what the web delivers " +
      "first. With `moeda`, the clean value is the same raw value as the web, the digits of what is on screen: `0,05` " +
      "delivers `005`, and `12,00` delivers `1200`.",
  },
  CurrencyInput: {
    state: "same",
    note: "the same cents, the same right-to-left typing and the same reading of pasted text; the field is controlled",
    page:
      "Translates, with the same math: the value in cents, typing that moves from right to " +
      "left, the `-` that adds and removes the sign and the reading of pasted text live in a single file, " +
      "shared by both packages. The field is controlled, like all of native: `value` and " +
      "`onValueChange` are required.\n\n" +
      "React Native does not report when the person pastes, so the field reads the selection from before the " +
      "change to know what went in on top. With `allowNegative`, the keyboard becomes the " +
      "numbers-and-punctuation one, which is the one with the sign on the iPhone. There is no `name`: a hidden " +
      "form does not exist on the phone.\n\n" +
      'The parts are styled through the same `classNames` as the web: `input` and `prefix`, the latter on the "R$" text.',
  },
  PostalCodeField: {
    state: "same",
    note: "the same `lookup` and the same four endings; the value is the digits, without punctuation",
    page:
      "Translates, with the same `lookup`, the same `onAddress` and the same four endings, and with the " +
      "lookup canceled when the CEP changes: the rule lives in a single file, shared by both " +
      "packages. The field is controlled, like all of native: `value` and `onValueChange` " +
      "receive the digits, without punctuation, and `onValueChange` brings the punctuated CEP in the " +
      "second argument.\n\n" +
      "The spinner sits at the end of the field, the message below it, and each state change goes out through the " +
      "system screen reader's announcement. The network failure's \"Tentar de novo\" is a " +
      "real button, with a full touch target.\n\n" +
      "The parts are styled through the same `classNames` as the web: `input`, `suffix`, `message` and `retry`. `suffix` only exists while the lookup runs, because here there is no check mark for the address found.",
  },
  Questionnaire: {
    state: "same",
    note: "controlled, with the questions through `items` (`single`, `multiple`, `text`); the same states and the same texts, no keyboard shortcut",
    page:
      "Translates, one question at a time and with the same states: a required one does not advance without " +
      "an answer, an optional one counts by answering or by skipping, and submitting goes back to the first " +
      "question that failed. The validation rule and the texts live in a single file, " +
      "shared by both packages, and `labels` replaces the same names.\n\n" +
      "The API is the touch one: everything is controlled (`item` and `onItemChange`, `value` and " +
      "`onValueChange`), and the questions come through `items`, each with `type` `single`, " +
      "`multiple` or `text`, and `other` for the other-answer field. There is no letter " +
      "shortcut, because there is no physical keyboard; the question change and the error go out through the " +
      "system screen reader's announcement, and the new question enters with the motion tokens.",
  },
  Tour: {
    state: "same",
    note: "built on `Modal` and `measureInWindow`, with the target by ref; the bubble is always a sheet, which moves to the top when the target is below, the step is controlled and there is no `interactive`",
    page:
      "Translates on top of the core's `Modal`, with no new peer: the target comes by ref and is measured by " +
      "`measureInWindow` when the step opens, and four bands with the theme's `overlay` surround the " +
      "cutout. The cutout subtracts where the `Modal`'s root starts in the window, and so it does not drop " +
      "by the height of the status bar on Android. The bubble is always a sheet, which is what the web " +
      "already does below 640px, with the same counter, the same buttons and the same texts, which " +
      "live in a single file, shared by both packages. The sheet sits at the bottom, and moves to " +
      "the top when the target is in the bottom half of the screen, so as not to cover the tab bar; there " +
      "it respects `topInset`, the top safe area. An empty ref, or one that is not a `View` with " +
      "`measureInWindow`, skips the step, with the same warning in development.\n\n" +
      "Three differences, and all three are about touch. The step is controlled (`step` and `onStepChange` " +
      "required), like the whole native package. There is no `interactive`: the `Modal` is another window, " +
      "and a tap does not pass through to the screen behind. And there is no automatic scroll, because React " +
      "Native has no `scrollIntoView`: the screen does the scrolling, in `onStepChange`, with " +
      "`scrollTo({ animated: false })` on the `ScrollView`, and the piece measures again on the next " +
      "frame. Android's back skips the tour, like `Esc` on the web.\n\n" +
      "The parts are styled through the same `classNames` as the web: `mask` (the four bands around the cutout), `counter`, `title`, `description` and `footer`. `spotlight` does not exist here: the cutout is the gap between the bands, not a node that can be styled.",
  },
  Menu: {
    state: "same",
    note: "bottom sheet with `actions`, never an anchored popup; `children` opens on long press; `classNames` with `trigger`, `content` and `item`",
  },
  NumberField: {
    state: "same",
    note: "becomes a stepper (minus, value, plus), which is the touch idiom; `min` starts at 0, not unbounded as on the web",
    page:
      "Translates, and becomes a stepper: minus, value, plus, which is the touch idiom. **`min` starts " +
      "at 0**, and on the web it starts unbounded. It is not an oversight: the iPhone's numeric keyboard " +
      "(`number-pad`) has no minus sign, so a negative number could only arrive through the " +
      "minus button, and a field that goes below zero by tapping but does not let you type the " +
      "same value is worse than a field that stops at zero. To accept negatives, pass a " +
      "negative `min`: the stepper goes down to it, the field accepts a typed minus sign and " +
      "switches to a keyboard that has the sign.\n\n" +
      "While typing, `max` applies on each key and `min` only on leaving the field: with `min={10}`, " +
      "typing 25 passes through 2 without becoming 10. With a fractional `step` the keyboard becomes " +
      "`decimal-pad`, comma and period both work as the separator, as on the web, and the step keeps " +
      "its decimal places: 0,2 plus 0,1 gives 0,3. Plus and minus start from what is typed, " +
      "and a value that arrives from outside in the middle of typing appears at once. The rest of the API also changes (on native everything " +
      "is controlled), and the [parity table](/react-native) says what changes piece by piece.",
  },
  OTPField: {
    state: "same",
    note: "visible boxes, one hidden field: keyboard, SMS autofill and screen reader see just one; the digit grows in; `label` names the field",
  },
  PageHeader: {
    state: "same",
    note: "`title`, `description`, `badge` and `actions` as props; `classNames` with the web's five parts",
  },
  Progress: {
    state: "same",
    note: "`value` from 0 to 100 and `label`; `showValue` and `format` as on the web; the bar moves to the new value; `classNames` with the web's four parts",
  },
  QueryBoundary: {
    state: "same",
    note: "same names and same order; text becomes `string`, and `classNames` with `loading`, `error` and `empty`",
    page:
      "Translates with the same prop names and the same order: **error wins over loading**, and empty " +
      "only counts after the response has arrived. `children` also accepts a function here, which is " +
      "what justifies the piece existing: it delivers the data already without `undefined`, and kills the `!` the " +
      "screen used to write.\n\n" +
      "Four type differences, all because text on native lives inside a `Text`: " +
      "`errorTitle`, `errorMessage`, `empty.title` and `empty.description` are `string`. " +
      "`empty.icon` crosses over, and also accepts the native `EmptyState`'s function, which delivers the color " +
      "and the size. It is the same note the `ChartContainer` already carries.\n\n" +
      "**`classNames` ports with the web's names:** `loading`, `error` and `empty`. `className` " +
      "still styles the three endings, as on the web, and each part styles only its own: the frame that " +
      "reserves the height applies equally to all three, but the error that asks for a border cannot carry the " +
      "border to the skeleton. With no descendant selector in React Native, the part is the only " +
      "way to style one ending without styling the others.\n\n" +
      "The generic skeleton stays in the piece, and does not come from the caller: without it, `isLoading` without " +
      "`skeleton` would collapse the screen to zero height and it would jump when the data arrived. On the " +
      "phone this hurts more, because there is no scroll bar or network indicator to " +
      "explain the wait.",
  },
  RadioGroup: {
    state: "same",
    note: "`items` on the root; there is no standalone `Radio`; `label` names the group, in place of the web's `aria-label`; the dot grows in",
    page:
      "Translates with `items` on the root: there is no standalone `Radio` to compose, and everything is controlled.\n\n" +
      "**`label` is the web's `aria-label` under another name.** The page over there already demanded it: without a " +
      "name, the group exists for the finger and not for the screen reader. Here there was no way to " +
      "demand it, and the hole was worse than a missing prop: the form subpath's `forValue` " +
      "already delivered `accessibilityLabel`, but the type is closed and a JSX spread " +
      "does not check excess properties, so the name was **silently discarded with " +
      "TypeScript green**. Today `forValue` delivers the `FormField`'s label also as " +
      "`label`, and the group comes out named without repeating the text.\n\n" +
      "It draws nothing: the visible text belongs to the `Field`, as with `Select` and `Combobox`.",
  },
  RivoProvider: {
    state: "same",
    note:
      "`theme` switches at runtime only between the two house themes, and a client theme is a " +
      "BUILD decision; `density` does not exist: a touch target does not shrink, and `comfortable` is the only " +
      "height; and it gains `fonts`, which the web does not have",
    page:
      "Translates, and gains a prop that does not exist on the web: `fonts`. In the browser the three " +
      "families arrive through the tokens CSS; on the phone there is no font CSS, and loading a " +
      "font file is the app's decision, not the library's. The app loads them with " +
      "`expo-font` and declares the names once (`<RivoProvider fonts={{ sans: 'Manrope', " +
      "display: 'Poppins', mono: 'JetBrainsMono' }}>`), and the whole catalog starts " +
      "wearing them. Without the prop, everything comes out in the system font and nothing breaks. Also pass " +
      "`expo-font`'s `isFontLoaded={isLoaded}`: a missing font name fails silently in " +
      "React Native, and this return value is what makes the provider warn in `__DEV__`.\n\n" +
      "**`density` does not exist here, and it is not a parity omission.** A touch target does not " +
      "shrink on a finger screen: `comfortable` is the only height, and the prop left the API.\n\n" +
      "**And `theme` switches the whole screen only between the two house themes.** " +
      "`rivocode-dark`, `rivocode-light` and `system` switch in the same frame, because the colors " +
      "were compiled as `light-dark()` and the provider only flips the `Appearance` scheme. " +
      "A client theme **does not change any class's color** at runtime: " +
      "the `react-native-css` compiler bakes the hex into the rule (`.bg-accent` becomes " +
      '`{"backgroundColor":"#d4f34a"}`, literally), and in the 56 KB of compiled CSS not a single ' +
      "occurrence of `--` remains. There is no live variable to redefine after the build.\n\n" +
      "**The theme map left the provider.** It only reached whoever reads color through JS " +
      "- `ChartDonut`, `ChartRadial`, the `Button`'s spinner, the `Switch`'s track -, and the result was a " +
      "donut in one theme and a button in another, side by side. One half that disagrees with the other is " +
      "worse than none: the provider now resolves the 45 roles by reading the compiled " +
      "CSS, one `bg-` class per role, so context and class always say the same " +
      "color. The re-read also happens when the app declares the scheme inside an " +
      "effect, after mounting - before that the palette was read once and froze, and " +
      "half the screen came out in one scheme and half in the other. With the map left without a purpose, it was " +
      "removed: `theme` accepts only `rivocode-dark`, `rivocode-light` and `system`, and the " +
      "`scheme` prop left with it, because it was what chose the map's scheme.\n\n" +
      "**The path that works is the app's CSS, before compiling - and now it styles the " +
      "whole screen, charts included:** override the roles " +
      "in an `@theme` in your `global.css`, after `@rivocode/ui-native/theme.css`, and run " +
      "`npx rivocode-ui-native-css` again. It has an architectural ceiling: `light-dark()` " +
      "has two slots, so it is **two themes per build**, one light and one dark. A single-client " +
      "app fits easily; a showcase of five themes, like the web's, needs five " +
      "bundles. The [themes guide](/temas) has the step by step.",
  },
  SearchInput: { state: "same", note: "`value` and `onValueChange` required" },
  Select: {
    state: "same",
    note: "few fixed options; `items` and `label` on the root, and the list opens in a bottom sheet, in sections when `items` comes in groups",
    page:
      "Translates, and the way to write it is different. On the web `Select` asks for `items` on the root **and** " +
      "the four parts (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`); on " +
      "native it is a single tag (`<Select items={…} value={…} onValueChange={…} " +
      'label="Período" />`), and the list opens in a bottom sheet, which is the ' +
      "platform's idiom for choosing. `label` is required: it is through it that the screen reader " +
      "announces the trigger, a role that on the web belonged to `SelectTrigger`.\n\n" +
      "Families of options come in through the same `items`, in `{ label, items }` groups - the shape " +
      "the web's `items` also accepts. The sheet becomes a `SectionList`, and each group's `label` " +
      "is announced as a header, in place of `SelectGroupLabel`.",
  },
  Separator: { state: "same", note: "only the horizontal line" },
  Sheet: {
    state: "same",
    note: "only the bottom behavior, which was already the web's narrow mode; it slides up, and with no transition when the system asks to reduce motion; with a field inside, the sheet rises along with the keyboard",
  },
  Skeleton: {
    state: "same",
    note: "same placeholder, same token, and the same 2 s pulse; still with reduce motion",
  },
  Rating: {
    state: "same",
    note: "a single adjustable control for the screen reader, with a controlled `value`; each star has a 44pt target, and the icon comes in as a function",
    page:
      "Translates, with the same `max`, `allowHalf`, `clearable`, `readOnly` and `size`. `value` is " +
      "controlled, as in the whole native package, and without `onValueChange` the piece only displays.\n\n" +
      "**For the screen reader, the stars are a single control.** On the web the choice is a " +
      "`radiogroup` with one option per star; here the group is `adjustable`, the same contract as the " +
      '`Slider`: VoiceOver and TalkBack say "Avaliação, 3 estrelas", and the swipe up and ' +
      "down gesture moves one star (half, with `allowHalf`). Five focus stops for a rating " +
      "would be five navigation swipes to reach the submit button.\n\n" +
      "**Each star's touch target is always 44pt.** `size` changes only the drawing. With " +
      "`allowHalf`, a tap on the reading-start half gives a half star: the left one, " +
      "or the right one when the device reads right to left. The fill also " +
      "starts on that side, and the swipe up gesture still raises the rating. There is no preview: on touch " +
      "there is no hover.\n\n" +
      "The default star is the ★ character in the theme color, because the package ships no icons. For " +
      "another drawing, the function receives the already resolved color, the size and the layer: " +
      "`icon={({ color, size }) => <Heart color={color} fill={color} size={size} />}`.\n\n" +
      "```tsx\n" +
      "<Rating value={nota} onValueChange={setNota} allowHalf />\n" +
      "```\n\n" +
      "The parts are styled through the same `classNames` as the web: `item`, `empty` and `filled`. The last two style the house star, which is text; with `icon`, the color arrives through the function.",
  },
  SignaturePad: {
    state: "same",
    note:
      "lives in `@rivocode/ui-native/chart`, because it draws with `react-native-svg`; the stroke is the same " +
      "file as the web, the gesture is `PanResponder`, and PNG is left out because there is no canvas",
    page:
      "Translates, on the `@rivocode/ui-native/chart` path: the paper is drawn with " +
      "`react-native-svg`, which is already that path's peer, and the house rule is **one subpath per " +
      "peer**, not one per subject. Whoever only uses a `Button` does not come to need SVG because " +
      "of the signature.\n\n" +
      "**The stroke is the same on both sides, line by line.** The curve smoothing, the width " +
      "that varies with speed and pressure, the typed name in cursive and the exported SVG " +
      "live in `src/shared/` and cross over by mirror: a signature made on the phone opens the same on the " +
      "web, with the same `value`. The gesture is the core's `PanResponder`, which does not yield the touch to " +
      "scrolling in the middle of a stroke; `onDrawingChange` reports when the finger starts and ends, so the " +
      "surrounding `ScrollView` can turn off `scrollEnabled`. Touch force, when the device " +
      "measures it, comes in as pressure.\n\n" +
      "**It exports only SVG.** `signatureToSvg` comes from here with the token's ink, dark in both " +
      "themes; PNG does not port, because React Native has no canvas. Whoever needs an image " +
      "rasterizes the SVG on the server, or captures the area with a screenshot library. " +
      "`value` is controlled, there is no `name` (a hidden form does not exist on the phone), and the " +
      "type-your-name mode is still there: the default cursive is Snell Roundhand on iOS and `cursive` on " +
      "Android.\n\n" +
      "```tsx\n" +
      "import { SignaturePad } from '@rivocode/ui-native/chart'\n\n" +
      "<SignaturePad\n" +
      "  value={assinatura}\n" +
      "  onValueChange={setAssinatura}\n" +
      "  onDrawingChange={(desenhando) => setRolagem(!desenhando)}\n" +
      "/>\n" +
      "```\n\n" +
      "The group's name is `label`, in place of the web's `aria-label`, and without it " +
      "`labels.group` applies. Inside `FormField`, `forValue` already delivers the `label`.\n\n" +
      "The parts are styled through the same `classNames` as the web: `pad`, `placeholder`, `actions` and `input`. `baseline` does not port as a part: the baseline is a stroke inside the `Svg`, and `react-native-svg` does not take classes.",
  },
  Slider: {
    state: "same",
    note: "moves by gesture and responds to screen reader actions; a single value, `label` required, and `showValue` and `format` as on the web; `classNames` with the web's six parts",
  },
  Sparkline: {
    state: "same",
    note: "`line` and `bar` work on both sides; `area` is left out (it needs a filled polygon, and the native drawing is `View`)",
    page:
      "Translates: `@rivocode/ui-native` exports `Sparkline`, and it is what the native `Stat`'s `chart` slot " +
      "was waiting for. It is drawn with `View`, without SVG, and that decides what " +
      'crosses over: `variant="line"` and `variant="bar"` mean the same thing in both ' +
      "worlds, and **`area` does not port**: an area wants a filled polygon, which `View` does not do. " +
      "Two other differences, both deliberate: the stroke draws 2px instead of 1.5 (at 1.5 " +
      "it disappears on a phone screen in daylight) and the width comes from the parent, with the height in " +
      "`height`. **Without `label` it is hidden from the screen reader on purpose**: a line " +
      'without a description says nothing to whoever cannot see it, and announcing "image" would be worse than ' +
      "staying silent. And it enters **only by fading in**, as on the web, at `duration-base`: it does not draw itself " +
      'or move when the data changes, and with "reduce motion" it appears still.',
  },
  Spinner: {
    state: "same",
    note: "`sm`, `md` and `lg` and the same `label`; `sm` and `md` are the small spin of the `ActivityIndicator`",
  },
  Stack: {
    state: "same",
    note: "same props, minus `render`; the gap is the comfortable scale, because on touch there is no compact density",
  },
  Stat: {
    state: "same",
    note: "`value` already formatted, a numeric `delta` written by the web's `deltaFormat`, and the `chart` slot that the native `Sparkline` fills",
  },
  Switch: {
    state: "same",
    note: "`checked` and `onCheckedChange` required; the track is the system's, painted by token, and the thumb slides with the platform's own animation; `label` is the spoken name, required without `children`; `classNames` only with `label`, because the thumb belongs to the platform",
  },
  Tabs: {
    state: "same",
    note: "only the segmented box, through `items`; page sections are the native router's job; the active tab's background slides between the tabs",
    page:
      "Translates halfway, on purpose. The native `Tabs` is **only** the box " +
      '(`variant="segmented"` on the web): `items`, `value`, `onValueChange`, no `TabList`, ' +
      "`Tab` or `TabPanel`. A tab that switches the page's section is not a piece on the phone (it is the router's tab " +
      "bar), and insisting on a tab drawn on top of that gives two competing " +
      "navigations on the same screen.",
  },
  Textarea: {
    state: "same",
    note: "`rows` is the initial height and the field grows; `onValueChange` receives the text, as on the web and in `Input`",
    page:
      "Translates: `rows` is the initial height and the field grows with the content, as on the web. The " +
      "web's `size` does not cross over: it only matches the padding, the text size and the minimum height " +
      "with the neighboring `Input`, and on native `Input` also has a single height.\n\n" +
      "The text arrives through `onValueChange`, with the same name as the web and the rest of the native " +
      "fields. The `TextInput`'s `onChangeText` still works and is called along with it, and it is " +
      "what `@rivocode/ui-native/form`'s `forText` relies on, the same for `Input` and " +
      "for `Textarea`.",
  },

  Autocomplete: {
    state: "same",
    note: "`value` is the text and accepts what is not in the list; `items` as text on the root, flat or in `{ label, items }` groups, and the field opens in a sheet that rises with the keyboard",
    page:
      "Translates, and what is specific to `Autocomplete` came along: `value` is the typed " +
      "text, and what is not in the list counts. On native it is controlled (`value` and " +
      "`onValueChange` required) and the suggestions come in through `items` on the root, as text, " +
      "flat or in `{ label, items }` groups - in place of `AutocompleteInput` with the " +
      "`Combobox` panel as a child. `label` is required: it is the name the screen reader " +
      "announces and the sheet's title.\n\n" +
      "The field opens in a bottom sheet, with the text at the top and the suggestions right below, and " +
      "not in a list attached to the field. The keyboard is what decides this: when open, it covers the " +
      "bottom half of the screen, and the list of a field at the foot of the form would be born " +
      "hidden. The sheet rises with it, like the `Combobox`'s. Each keystroke reaches " +
      "`onValueChange`, tapping a suggestion fills the text and closes, and **Concluir** closes " +
      "with what was typed. The suggestion count is announced on each change, like the web's " +
      "live region. There is no inline completion: `mode` does not exist.",
  },
  DataTable: {
    state: "renamed",
    native: "DataList",
    note: "`filter`, `selectable` and selection through `value`/`onValueChange` port with the same name; sorting and `pageSize` are left out by design",
    page:
      "Becomes `DataList`. A table does not exist on the phone: what crosses over is the " +
      "state machine (loading, error, empty, data) in the same order, with error winning over " +
      "loading and empty counting only after the response has arrived. The texts of those endings are " +
      "configured with the web's names: `errorTitle`, `errorMessage`, `labels.retry` and " +
      "`noResultsMessage`, all `string` because text here lives inside a `Text`. Only the " +
      "default of `errorTitle` differs: here there is none, because the list's alert was born as a single " +
      "line, and that line is `errorMessage`. Of the four opt-ins " +
      "from here, two port with the same prop name (`filter` and `selectable`, with the selection " +
      "in `value` and `onValueChange`) and **two do not " +
      "port by design**: sorting and `pageSize`. A clickable header does not exist without a " +
      'header, and on the phone sorting is a "sort by" `Menu` that the screen builds on ' +
      "top of the list. In place of the columns, `renderItem`. And that is why `filter` wants a " +
      "`filterValue`, since nobody can read text from inside the JSX you return.",
  },
  ToastViewport: {
    state: "renamed",
    native: "useToast",
    note:
      "nothing is mounted: the `RivoProvider` already brings the wiring, and the hook is the same, with the four " +
      "functions: `add` returns the `id`, `type` picks the tone in the `Alert`'s vocabulary, " +
      "`timeout: 0` keeps the toast until `close(id)`, and `update` and `promise` rewrite the toast " +
      "that is on screen. Here `title` and `description` are `string`, because the toast is read " +
      "aloud, and there is no x: the toast does not receive touches, so one that stays leaves through `close`. " +
      "Without `timeout`, it leaves after 4 seconds, not the web's 5. The web's `actionProps`, which puts the undo inside the toast, does not exist here for the same reason as the x: the toast does not receive touches, and undo on the phone lives on the screen itself. The toast slides up and down with the " +
      "web's durations, and appears still when the system asks to reduce motion",
  },

  QRCode: {
    state: "same",
    note:
      "lives in `@rivocode/ui-native/chart`, because it draws with `react-native-svg`; the encoder is the " +
      "same, the ink and the paper are fixed, and only the `logo` is styled by part",
    page:
      "Translates, on the `@rivocode/ui-native/chart` path: the code is drawn with " +
      "`react-native-svg`, and the house rule is **one subpath per peer**, not one per subject. " +
      "Drawing with `View` would cost hundreds of boxes per code, one per run of dark " +
      "modules, and the Pix of a charge exceeds two thousand modules.\n\n" +
      "**The encoder is the same on both sides, line by line**: it lives in `src/shared/` and " +
      "crosses over by mirror, so version, mask and error correction do not diverge. The native test " +
      "rasterizes the path the piece draws and decodes it back, like the web's.\n\n" +
      'The colors do **not** come from the theme: the modules are `tokens.code["code-ink"]` and the paper ' +
      '`tokens.code["code-paper"]`, dark on light in both schemes, on a plate with rounded ' +
      "corners. They do not go through the app's CSS or through the `RivoProvider`'s `colors`, so " +
      "no client `@theme` inverts the code by accident. " +
      "`level`, `size` and `logo` have the same contract as the web: with `logo` the level starts at H, and with another " +
      "level the mark does not appear. Of the web's parts, only `logo` ports: `code` is the `Svg`, and " +
      "`react-native-svg` does not take classes; the rest is styled through the root.\n\n" +
      "```tsx\n" +
      "import { QRCode } from '@rivocode/ui-native/chart'\n\n" +
      '<QRCode value={link} label="QR Code para consultar a nota 4813" />\n' +
      "```",
  },
  PixCode: {
    state: "same",
    note:
      "lives in `@rivocode/ui-native/chart`, alongside `QRCode`; copying comes in through `renderCopy`, " +
      "because `Clipboard` lives on another path",
    page:
      "Translates, on the `@rivocode/ui-native/chart` path, because the QR is the native `QRCode`, " +
      "drawn with `react-native-svg`. The pure functions (`buildPixPayload`, " +
      "`parsePixPayload` and `isValidPixKey`) come from the root: they ask for no peer, and the file is " +
      "the same as the web, through the shared code mirror. The amount is formatted without `Intl`, " +
      "the same on both sides.\n\n" +
      "**Copying comes in through `renderCopy`.** The native `Clipboard` lives in " +
      "`@rivocode/ui-native/clipboard` because of `expo-clipboard`, and the house rule is " +
      "**one subpath per peer**: if the piece imported it, whoever draws a QR would have to install " +
      "the clipboard module. The function receives the copy-and-paste code and is only called when " +
      "there is something to copy (not loading, not expired, not with a wrong CRC), so the button disappears " +
      "along with the code. The text is `selectable` regardless, and a long press copies even without the button.\n\n" +
      "```tsx\n" +
      "import { PixCode } from '@rivocode/ui-native/chart'\n" +
      "import { Clipboard } from '@rivocode/ui-native/clipboard'\n\n" +
      "<PixCode\n" +
      "  payload={cobranca.pixCopiaECola}\n" +
      "  renderCopy={(payload) => <Clipboard value={payload}>Copiar código</Clipboard>}\n" +
      "/>\n" +
      "```\n\n" +
      "The parts are styled through the same `classNames` as the web: `code`, `amount`, `receiver` and `payload`. `copy` does not port: the button is what `renderCopy` returns, and whoever writes it already styles it.",
  },
  Clipboard: {
    state: "same",
    note:
      "lives in `@rivocode/ui-native/clipboard`; the confirmation is double: the button changes its name and a " +
      "toast speaks, because a label changed under the finger is not re-announced",
    page:
      "Translates, on its own path `@rivocode/ui-native/clipboard`, with the same arrangement as `form` " +
      "and `chart` and for the same reason: `expo-clipboard` is an **optional** peer, and on the phone it is not " +
      "just bytes, it is a native module the app links and rebuilds (`npx expo install expo-clipboard`). " +
      "It has a path **separate** from `FileUpload` on purpose: whoever puts a copy button next " +
      "to an NF-e access key attaches no file at all, and an index shared by both " +
      "would charge for both.\n\n" +
      "**The confirmation becomes double, where on the web one was enough.** The rule does not change: copying is the " +
      "action with no visible result, and without confirmation the person taps again out of doubt. What changes " +
      "is how it arrives. The button still changes its icon and accessible name, as there; and the " +
      "piece **also** fires a toast, because here changing the `accessibilityLabel` of a " +
      "`Pressable` that is already under focus **is not re-announced** by either VoiceOver or " +
      "TalkBack: whoever does not see the icon turn into a check mark would learn nothing. The toast the " +
      '`RivoProvider` already mounts lives in an `accessibilityLiveRegion="polite"` (on iOS, where it does not ' +
      "exist, the same text goes out through the system announcement), and it is the only channel on this screen that speaks " +
      "on its own. `toast={false}` turns it off, for the screen that copies several things " +
      "in a row and does not want a stack of toasts.\n\n" +
      "**When it did not copy, nothing is confirmed**, as on the web: Expo's `setStringAsync` returns " +
      "`false` when the clipboard refuses (the case of the web pass, outside a secure " +
      "context), and on iOS and Android it always resolves `true`.\n\n" +
      "Without `children` the button is only the icon, and then the target is a full 44px, without depending on `hitSlop` " +
      "to get there. The icon is drawn with `View`, like the `PasswordInput`'s eye.\n\n" +
      "**`variant` is the `Button`'s, and accepts the same five names as the web**: `primary`, " +
      "`secondary` (the default), `ghost`, `outline` and `danger`, each with the background and the label " +
      "of the native `Button` of that variant. In the two filled ones, `primary` and `danger`, the " +
      "confirmation check mark comes out in the label color, not in the success green: measured, the green sits at " +
      "1.41:1 on the dark theme's `accent` and at 1.08:1 on the light theme's `danger`, against the 3:1 " +
      "an icon requires.",
  },
  Code: {
    state: "same",
    note:
      "the snippet wraps along with the sentence around it, and a long press copies (`selectable`); " +
      "its own scrolling belongs to `CodeBlock`, which is still out",
    page:
      "Translates, and it goes inside a `Text`: `Abra o <Code>app.json</Code>` wraps along " +
      "with the sentence around it. **The horizontal scroll the queue promised was never on this " +
      "side:** a scroll bar inside a paragraph is a trap for the finger scrolling the screen, " +
      "and whoever needs it is `CodeBlock` (an API response, a log line), which is another piece and " +
      "has not ported yet. The argument is the reverse of this one: there, breaking a JSON in the middle changes what " +
      "is written, and here breaking a long path in the middle is right, because the alternative is " +
      "stretching the whole screen. The font size is not written: the nested `Text` inherits the one from the outer " +
      "text, which is what the web's `0.9em` said. And `selectable` comes on, because the long " +
      "press is the native gesture for copying. On Android the one selecting is the outer `Text`, and there " +
      "it is the one that needs to carry the prop.",
  },
  ColorPicker: {
    state: "same",
    note:
      "comes from the root; controlled, and with no arrows: each swatch is a 44px target with the 32 drawing " +
      "inside, and there are six per row, not ten",
    page:
      "Translates, and comes from the root index: there is no peer behind it. Both web inputs " +
      "cross over whole: the **swatches**, for choosing by looking, and the **hex field**, " +
      "for whoever already has the value in the brand manual. `normalizeColor` is the same on both sides, " +
      "line by line: `#0f8`, `BFDD3A` and `  #D4F34A  ` all come out as six lowercase digits " +
      "with a hash.\n\n" +
      "**Three things change, and all three come from the finger.** It is controlled, without `defaultValue`, like every " +
      "piece here. **There is no arrow navigation** (no `Home`, no `End`, no single tab " +
      "stop), and so `columns` stops being the arrows' step and becomes only the " +
      "drawing: the default drops from ten to **six per row**, because ten 44px targets with an 8 " +
      "gap would give 512px on a 390 screen. And each swatch is a **44px target with the colored 32 " +
      "drawing inside**: a pretty color grid too small for the thumb is the classic " +
      "defect of this piece. The selected mark is still **outside**, for the same reason as the " +
      "web: a symbol drawn over the swatch is illegible on half of the possible colors, and there is no " +
      "token that guarantees contrast against a value the person made up.\n\n" +
      '**The field asks for the plain alphanumeric keyboard** (`keyboardType="default"`), not the ' +
      "numeric one: hex has `a` to `f` and a hash, and no number keyboard has both " +
      'things. What it turns off is what the system would do on its own: `autoCapitalize="none"` ' +
      "so `bfdd3a` does not become `Bfdd3a`, and `autoCorrect={false}` so the autocorrect does not swap six " +
      "meaningless letters for the closest word.\n\n" +
      "Whoever cannot see the color hears it through two paths: each swatch's `accessibilityState.checked`, " +
      "and the text of the field itself, which has its own name (`Código hexadecimal da cor`). The preview " +
      "next to it is hidden from the screen reader: it repeats in color what the field says in text, and color " +
      "cannot be heard. With `hideInput`, the swatch state becomes the only channel.\n\n" +
      "The parts are styled through the same `classNames` as the web, all six: `label`, `swatches`, `swatch` (each swatch's 44px target), `field`, `preview` and `input`.",
  },
  DateRangePicker: {
    state: "same",
    note: "one month in a sheet, with both ends on the same grid and in ISO `yyyy-mm-dd`, which the web also accepts; the piece orders the taps, and only a closed range comes out, with `null` on Limpar, as on the web",
    page:
      "Translates, with a single design: **one month, in a bottom sheet, with the range painted on the " +
      "grid itself**. The web's two side-by-side months do not fit (390px split in half " +
      "gives 27px cells, and the minimum touch target is 44), and two `DatePicker`s in sequence, " +
      "which is what this table told you to do until now, lose precisely what makes the piece " +
      "exist: both ends on the same grid, with the days in between painted. **Validating " +
      "end-before-start is no longer your job**: tapping 20 and then 5 gives back 5 to 20, because the " +
      "piece orders the two ends instead of discarding the first tap, and `Aplicar` stays " +
      "disabled while the second is missing. That is why the type changed: the `DateRange` here has " +
      "**required** `from` and `to`, both as ISO `yyyy-mm-dd`, and empty is `null` - " +
      "the same `IsoDateRange` the web accepts and returns when it receives the value as text, and the " +
      "same contract as the web in both formats: `onValueChange` only receives a closed " +
      "range, and `null` on Limpar. A half range comes out of neither " +
      "package: whoever wants to follow along reads the summary the sheet itself writes above the " +
      "month. No `confirm`: the sheet always confirms, because a tap outside it is the gesture of " +
      "giving up and cannot count as applying.",
  },
  Editable: {
    state: "same",
    note:
      "a **long** press opens it, the keyboard's return key confirms and there is a visible `Cancelar`: " +
      "leaving the field does not save, unlike the web",
    page:
      "Translates, with both gestures swapped. And the two were the whole piece on the web, so it is worth reading " +
      "before porting the screen.\n\n" +
      "**A long press opens it**, not a tap. It is the gesture the system already uses to act " +
      "on text, and the choice is defensive: on a reading panel the finger touches everything " +
      "while scrolling, and with a short tap opening the field the keyboard came up on its own at every " +
      "bump. For screen reader users the gesture does not exist, so the piece also declares " +
      'a `longpress` accessibility action called "Editar", which appears in the rotor.\n\n' +
      "**Leaving the field does not save.** On the web, clicking outside confirms; here there is no clicking outside: there is the " +
      "keyboard hiding, and `Cancelar` itself takes focus off the field before running, so " +
      "a `blur` that saved would save the draft on the way to canceling it. Nothing leaves here without " +
      "explicit confirmation (the keyboard's return button) and nothing is lost without `Cancelar`, " +
      "which is visible next to the field because without Escape there is no invisible exit.\n\n" +
      "The rest is the usual contract: `value` and `onValueChange` **required**, no " +
      "`defaultValue`, and `label` required. Closed, the piece announces `label` and value together, " +
      'because "Nome do cliente" alone makes the person open editing just to find out what ' +
      "is in there." +
      "\n\nThe parts are styled through the same `classNames` as the web: `preview`, the area you hold to edit, and `input`, the open field.",
  },
  FileUpload: {
    state: "same",
    note:
      "lives in `@rivocode/ui-native/file-upload`; the drop area becomes a button, because on the " +
      "phone there is no dropping; `accept` speaks MIME and the size is formatted without `Intl`",
    page:
      "Translates, on its own path `@rivocode/ui-native/file-upload`: `expo-document-picker` is an " +
      "**optional** peer and a native module (`npx expo install expo-document-picker`), and it has a path " +
      "separate from `Clipboard` by the same math: the house rule is **one subpath per peer**, and " +
      "not one per subject. What does not change is the main thing: **the piece still knows nothing about the network**. " +
      "It validates `accept` and `maxSize` on input, delivers the accepted ones in `onSelect` and the rejected ones " +
      "in `onReject`, each rejection with its reason ready for a message.\n\n" +
      "**The drop area becomes a button, and that is the whole piece changing shape.** On the phone " +
      "there is no dragging: nothing can be dropped anywhere, and the web's 96px dashed rectangle " +
      'is, letter for letter, the idiom of "drop here": drawing it on a touch screen promises ' +
      "a gesture the device does not have. Take away the dropping, and what remains of that box is a button with " +
      "a lot of empty space around it: **the space was the drop target, not the affordance**. So " +
      "the button remains, at a control height. And the height it gives back goes to the **list**, which is " +
      "where the file appears, uploads, fails and is removed. `hint` still exists, and goes into the " +
      "button's spoken name for the same reason that on the web it lives inside the `<button>`: whoever listens to " +
      'the screen needs to know "XML ou PDF, até 5 MB" before opening the picker, not after being ' +
      "rejected.\n\n" +
      "**`accept` speaks MIME.** Expo's picker filters by type (`text/xml`, `image/*`), not " +
      "by extension: an `.xml` sent there would match nothing and open an empty dialog. So " +
      "the dotted extension still works (in the validation on the way back, against the file name), " +
      "but it does not go to the system. And what comes back is not a `File`: it is a `PickedFile` " +
      "(`uri`, `name`, `size?`, `mimeType?`), with the local `uri` the app uses to upload. **" +
      "`size` may be missing**, because not every Android file provider reports it, and so " +
      "`maxSize` only rejects what it managed to measure. Closing the picker returns `canceled` and no " +
      "callback fires, like closing the web picker's window.\n\n" +
      "`FileUploadList` and `FileUploadItem` cross over with the same contract (`progress` from 0 to " +
      '100 becomes an announced bar, `error` wins over progress and offers "Tentar de novo"), with two ' +
      "platform differences: the name truncation is `numberOfLines`, which there is a prop and not a class, and " +
      'the size is formatted **without `Intl`** ("47,1 KB", with the comma written by hand).',
  },
  Form: {
    state: "same",
    note: 'lives in `@rivocode/ui-native/form`; `Form` hands over `submit` instead of waiting for a `type="submit"`, and there is one more adapter, `forText`',
    page:
      "Translates, on its own path `@rivocode/ui-native/form`, with the same arrangement as the web and for the " +
      "same reason: `react-hook-form` is an optional peer. `useZodForm` is identical, line by " +
      "line, because there is no browser in it.\n\n" +
      "**What changes is who triggers the submit.** In React Native there is no `<form>`, no " +
      '`type="submit"` and no Enter that submits: nothing is implicit. So `Form` ' +
      "hands the submit to whoever draws the button (`children` can be a function that receives " +
      "`{ submit, isSubmitting }`), and still accepts plain JSX for when the button lives " +
      "outside, in a fixed bar at the foot of the screen.\n\n" +
      "**And the bridge to the control changes.** On the web, Base UI's `Field` links label, help and " +
      "error to any control inside it, through context; here the context is " +
      "narrower: the native `Field` carries to the text fields (`Input`, `Textarea`, " +
      "`InputGroup`, `MaskedInput`) the label, as `accessibilityLabel` when the caller " +
      "did not pass another, the error, as a hint, and the `validate` validation. The field that " +
      "`FormField` delivers carries two more things anyway, `accessibilityLabel` and " +
      "`invalid`, and the adapters put them on the control: the pieces named by `label` " +
      "do not read the context, and without this they would be left **with no name at all** for the screen reader. " +
      "`FormField`'s `label` is required here for the same reason.\n\n" +
      "The adapter delivers the label under the name the piece reads. Native pieces are named by " +
      "`label`, and `forValue`, `forChecked` and `forDate` deliver it that way; `forText` " +
      "delivers it as `accessibilityLabel`, because `Input` and `Textarea` are the platform's " +
      "`TextInput`. `forValue` carries both, because it also serves a text field with its own " +
      "value, like `CurrencyInput`.\n\n" +
      "There are four adapters. `forValue`, `forChecked` and `forDate` have the web's name and " +
      "job. `forDate` now converts empty to `null` and speaks ISO, which is " +
      "what the native `DatePicker` and `DateRangePicker` ask for. The fourth is native-only: " +
      "`forText`, for `Input` and `Textarea`, because `TextInput` calls `onChangeText` with the " +
      "raw string and not with an event: spreading the field on it would store in the form an " +
      "event object that does not exist. It carries the `ref` along, and then `form.setFocus()` " +
      "really works: `TextInput` has `focus()`. And it translates the field's `disabled` to " +
      "`editable={false}`, because `TextInput` does not read `disabled`.",
  },
  NotificationCenter: {
    state: "same",
    note: "the list opens in a `Sheet`; `open` is controlled, the bell comes in through `icon`, and the row calls `onItemPress` in place of `href`",
    page:
      "Translates, with the list in a `Sheet` that rises from the bottom, which is what the web already does on the " +
      "phone. `items`, `unreadCount`, `onMarkRead`, `onMarkAllRead`, the filter, `hasMore`, " +
      "`onLoadMore`, `isLoadingMore`, `isLoading` and `labels` have the same name and the same " +
      "meaning, and the texts come from the same source.\n\n" +
      "**`open` is controlled**, with `onOpenChange`, as in the whole native package. **The bell " +
      "comes in through `icon`**, because the package ships no icons, and the form that paints in the " +
      "button's color is the function: `icon={({ color, size }) => <Bell color={color} size={size} />}`.\n\n" +
      "**The row is not a link.** On the phone the router is what navigates, so the notification has no " +
      "`href`: `onItemPress` receives the item and decides where to go. Opening still " +
      "counts as reading, and the sheet closes.\n\n" +
      'The count is the button\'s name ("3 notificações não lidas"), and when it changes the ' +
      "screen reader hears the new sentence through the system announcement.\n\n" +
      "```tsx\n" +
      "<NotificationCenter\n" +
      "  items={notificacoes}\n" +
      "  open={aberto}\n" +
      "  onOpenChange={setAberto}\n" +
      "  icon={sino}\n" +
      "  onItemPress={abrir}\n" +
      "  onMarkRead={marcar}\n" +
      "/>\n" +
      "```\n\n" +
      'The parts are styled through the same `classNames` as the web: `trigger`, `panel`, `header`, `filters`, `list`, `item` and `empty`. `className` stays on the bell button, the same node as `trigger`. `footer` does not exist here: "Carregar mais" sits directly in the sheet, with no strip of its own.',
  },
  Indicator: {
    state: "same",
    note: "`label` is required: the pill is a single screen reader stop, and what it says is the sentence, never the number",
    page:
      "Translates, and what changes is who carries the accessible name. On the web the number is hidden from the " +
      "reader and a reader-only text goes next to it; on native the whole pill is ONE accessibility " +
      "element, and `label` (required here) is what it announces. The reader reads the " +
      'child ("Notificações, botão") and then the pill ("3 notificações"), and never a ' +
      'stray "3" between the two. Wrapping child and pill in a single element would fix the ' +
      "reading and break touch, because the inner button would no longer be reachable. The " +
      "ring that separates the pill from what is underneath becomes a border in the background color: `ring` does not " +
      "exist in React Native, and a border there takes space inside the box.\n\n" +
      "The pill is styled through `classNames.badge`, the same name as the web.",
  },
  InputGroup: {
    state: "same",
    note: "`prefix`, `suffix` and `actions` are props and the frame draws the field itself; no `size`",
    page:
      "Translates, and the shape changes along with it: on the web the frame is composition (`InputGroup` outside, " +
      "`Input`, `InputPrefix` and `InputAction` inside) and it disarms the field's border with " +
      "a descendant selector. That selector does not exist in React Native, and whoever wrote the " +
      "same tree there would get two nested borders with no way to remove the inner one. That is " +
      "why the native frame draws the field: `value`, `onValueChange`, `prefix`, `suffix` and " +
      "`actions` are its props. There is no `size`: control height is single on native, because " +
      "a touch target does not shrink.\n\n" +
      "The inner pieces become `classNames` parts, with their names: `input`, `prefix`, " +
      "`suffix` and `action`.",
  },
  Item: {
    state: "same",
    note: "`title`, `description`, `media` and `actions` as props; ellipsis truncation is `numberOfLines`, which there is a prop and not a class",
    page:
      "Translates, and it does not compete with `DataList`: that one resolves a query's four endings and " +
      "hands each row to `renderItem` with no opinion about what is inside it. `Item` is " +
      "that inside, and serves equally well a two-choice list in a sheet, which has no " +
      "query at all. The web's composition (`ItemMedia`, `ItemContent`, `ItemTitle`, " +
      "`ItemDescription`, `ItemActions`) becomes four props, by the same rule as `PageHeader`: " +
      "the slots are always the same, and no prop lets you swap the column order by " +
      "accident. With `onPress` the whole row becomes a target, with a 44px minimum height, but when " +
      "there are `actions`, the target becomes only the text area, otherwise the accessible `Pressable` on " +
      "top would swallow the button on the right as a screen reader stop. Inside a `DataList` " +
      "with `onRowPress`, do not pass `onPress`: one `Pressable` inside another holds the touch in " +
      "the inner one, and the row would respond here and never there.",
  },
  Meter: {
    state: "same",
    note: "`format` as on the web, and ready-made text in `valueLabel` when the measure already comes written; the bar moves to the new value",
    page:
      "Ported. The value text comes from `format`, with the same formatter names as the web " +
      "(`percent`, `currencyShort`, `integer`...) or a function, and applies on screen and in the announcement. " +
      "Native-only is `valueLabel`, for a measure that already arrives written, and it wins over `format` " +
      "when both come. The accessibility role changes, and for a reason: React Native " +
      "has no equivalent of `meter`, so the piece announces itself as text with a value, and never " +
      "as `progressbar`, which is precisely the mistake it exists to avoid." +
      "\n\nThe parts are styled through the same `classNames` as the web: `label`, `value`, `track` and `indicator`.",
  },
  PasswordInput: {
    state: "same",
    note: "the button changes its name with the state (`labels.show`/`labels.hide`), and leaving the field hides it again; `classNames` with `wrapper`, `input` and `action`",
  },
  RelativeTime: {
    state: "same",
    note: "the clock ports, with a step per unit and a redo when returning from the background; without `Intl`, the text is always numeric",
    page:
      "Translates clock and all: receiving ready-made text would have been cheaper to write and " +
      "would have handed the problem back to the screen, which is where it came from. The step follows the " +
      "unit, as on the web: thirty seconds while counting minutes, one hour once counting " +
      "days, and never one second. Hours advance every five minutes, not every one: the " +
      'difference between "há 1 hora" and "há 2 horas" is not worth one timer per minute times the ' +
      "mounted rows. Two things are native-only. The text redoes itself when returning from the background, because " +
      'while the app sleeps the JS timer does not run and the screen would reopen saying "há 2 minutos" ' +
      "three hours later. And the text is always numeric: `Intl.RelativeTimeFormat` does not exist " +
      'in Hermes, the plural is written by hand, and where the web says "ontem" native says "há 1 ' +
      'dia". `cutoff` and `now` are the same, and the date it shows comes in the format of ' +
      "`formatDate`. What does not cross over is the exact instant: on the web it lives in the `title` of the " +
      "`<time>`, and on touch there is no `title` and nowhere to rest the pointer. When the exact date " +
      "matters, it needs to be written on the screen.",
  },
  Steps: {
    state: "same",
    note: "only the web's narrow mode (text and bar), and so no `onStepChange`; `useWizard()` crosses over whole; the bar moves and the new step fades in",
    page:
      'Translates, and what ports is **the narrow mode the web already drew**: the "Passo 2 ' +
      "de 4\" line, the step's title and the progress bar. The dot track does not cross over " +
      "because it had already been measured and rejected below 640px: five steps on a " +
      '390px strip give 60px of label per step, and "Conferir os itens" becomes "Confe…" five ' +
      "times in a row. The description, which the web's narrow mode hides for lack of width, " +
      "appears: here the current step is the only one on screen.\n\n" +
      "That is why there is no `onStepChange`: it only existed on the wide track, and without dots there is nothing " +
      "to tap. Going back is the `WizardFooter` button, and skipping a step is still `goTo`.\n\n" +
      "`useWizard()` crosses over **whole and identical**: it is `useState` and three index " +
      "calculations, with no DOM and no media query. Leaving the step to the native router would trade one " +
      "screen state for five routes, and a wizard is not navigation: the steps share " +
      "a single form, the device's back cannot lose what was already typed, and " +
      '"Conferir" is not an address anyone should open directly. Whoever wants one route per ' +
      "step still can, because `goTo` accepts the index the router sends. " +
      "`WizardFooter` always stacks, in written order (back on top, forward below, " +
      "where the thumb is), and each button's `w-full`, which on the web arrives through a child " +
      "selector, here is React Native's default `alignItems: stretch`.",
  },
  TagsInput: {
    state: "same",
    note: "Enter and a typed separator close the chip; Backspace on an empty field does not port; a new chip grows in and a removed one fades out",
    page:
      "Translates, with one gesture fewer. Enter closes the chip and so does the typed separator, but " +
      "it is read from the text, not from the key, because Android's `onKeyPress` does not arrive for the " +
      "system keyboard. It is that same event that was missing for Backspace on an empty field " +
      "to remove the last chip, and so it does not port: on the phone a chip is removed by its x, which " +
      "already needed to exist for the finger. The rest is the same: the piece is controlled, a repeated one does not " +
      "go in twice and leaving the field closes whatever was half written. The x's name comes " +
      "through `labels.remove`, as on the web." +
      "\n\nThe parts are styled through the same `classNames` as the web: `field`, `tag`, `remove` and `input`.",
  },
  TimeField: {
    state: "same",
    note: "types with a mask and a numeric keyboard; the arrows become two step buttons, in the `NumberField` mold",
    page:
      "Translates, and it is still the TYPING field: whoever clocks in writes `0800` faster " +
      "than they open a panel, and the system's numeric keyboard is the idiom for that.\n\n" +
      '**The value rules cross over whole.** `"HH:MM"` in 24h, empty is `""`, and only a complete time ' +
      "notifies whoever listens. `25:99` is not silently fixed to `23:59`: it marks " +
      "invalid on the same keystroke and goes back to the last valid one on leaving. Fixing it silently is worse, " +
      'because nobody checks a value the field "accepted". `step` governs the steps and the ' +
      "options, never validation, so `14:07` with `step={30}` is still a legitimate time.\n\n" +
      "**Both sides gained the step button, and native got there first.** Arrows do not exist " +
      "on touch, and `step` needed to keep meaning something; instead of inventing a " +
      "gesture, the piece put on the mold the house already has for stepping with a finger, the `NumberField`'s `[−][field][+]`. " +
      "The web had the same hole on a phone, and adopted it later: there the buttons " +
      "only appear below 640px, because on desktop the arrow is already the door and takes no pixels. Here " +
      "they are always there, because desktop does not exist. Both call the same calculation, so they land " +
      "on the same grid starting from midnight; the difference is the target, 48pt here against 44 there.\n\n" +
      "Dropped: `defaultValue` (here everything is controlled), `name` (a hidden form does not exist in " +
      "React Native) and `size` (the native `Input` has no size vocabulary).",
  },
  TimePicker: {
    state: "same",
    note: "trigger plus bottom sheet with two columns; it does NOT embed the TimeField, unlike the web",
    page:
      "Translates as a trigger plus a **bottom sheet**, which is the house decision for panels on the " +
      "phone. Two scrollable columns for the same reason as the web, which weighs more here: `step={5}` " +
      "in a single list is 288 rows to scroll with the thumb. Each option is 48pt, above the " +
      "required 44pt, and the column scrolls to the chosen time each time it opens.\n\n" +
      "**The structural difference, and it is not aesthetic:** on the web the clock lives INSIDE the " +
      "field; here it does not. A `TextInput` inside a `Pressable` swallows the parent's touch, and the " +
      "trigger needs to be a single target for the screen reader. Every native picker in the house " +
      "(`DatePicker`, `DateRangePicker`, `Select`, `Combobox`, `TreeSelect`) is already trigger plus " +
      "sheet, and the split comes out cleaner than on the web: `TimeField` is typing, `TimePicker` is " +
      "tapping.\n\n" +
      "The hour does not close the sheet and keeps the minute; the minute closes it. `labels` loses `open` and " +
      "`title`, because here the required `label` already names the trigger AND titles the sheet, the " +
      "same arrangement as `DateRangePicker`." +
      "\n\nThe parts are styled through the same `classNames` as the web: `trigger`, `panel` (the sheet), `column` and `option`. `field` does not exist here: the clock does not live inside a field, and the trigger is already `trigger`.",
  },
  Timeline: {
    state: "same",
    note:
      "the events come through `items`, with `tone` and `pending` on each; `at` is ready-made text, and each " +
      "event is a single screen reader stop, with the position written in the label",
    page:
      "Translates, with the list through `items`: each event carries `title`, `at`, `by`, `description`, " +
      "`tone` and `pending`, and the `TimelineItem` composition does not cross over (the same rule as " +
      "`RadioGroup` and `Select`). **The timestamp is text, not a `RelativeTime`**: each event is " +
      "a single screen reader stop and its label is built from that text, so a " +
      "live clock inside it would keep moving on screen while the label stayed stuck at the time " +
      "it was built. And an audit trail cannot say two different times. For the " +
      "timestamp, `formatDate`. **The order, which the web's `<ol>` delivers for free, is written out**: there is no " +
      'list item role in React Native, so each event announces "3 de 5: Nota ' +
      'autorizada, 12/03 às 14:22, por Ana Duarte", one sentence with what changed, when and by ' +
      "whom, instead of three VoiceOver stops that do not say the subject. And nothing is tappable: a " +
      "trail is read, and the 9px marker would never be a finger target. Whoever wants to open the detail of " +
      "an event puts in an `Item` with `onPress`.",
  },
  Tracker: {
    state: "same",
    note: "the whole strip is a single target: the finger drags and the period being read appears on the line below; each point's `label` is `string`",
    page:
      "Translates, and both sides arrived at the same design: **the whole strip is a single target**. " +
      "Native got there first out of necessity, and the web followed it. There, each point mounted a " +
      "`Tooltip`, and a tooltip is a portal: 365 days were 365 portals mounted so that at most one " +
      "would appear. Here not even that way out existed, because a tooltip opens on resting the pointer, and " +
      "swapping each square for a `Pressable` would not solve it either: 90 periods in 358px give " +
      "4px per square, six times less than the minimum touch target.\n\n" +
      "**What does not cross over is the bubble.** On the web the reading comes out in a single `Tooltip` that follows " +
      "pointer and keyboard; here it lives in a fixed line below the strip. The finger rests and " +
      "drags, a thin mark follows, and the period being read appears on that line, which exists from " +
      "the first frame, " +
      "showing the most recent period: the space stays reserved, the screen does not jump on the first " +
      'tap, and the most recent is what the question "did it get worse yesterday?" wants to read first.\n\n' +
      "Screen reading changes shape too. The hidden list with the 365 texts, which on the " +
      "web is cheap, here would be 365 VoiceOver stops inside a card; the strip is a single " +
      "stop, of the adjustable kind (the same contract as the `Slider`), and each step announces the " +
      "text of one period. No data is unreachable and none becomes an obstacle. That is why each point's " +
      "`label` is `string`, not `ReactNode`: it goes whole into the strip's accessible " +
      "value, and there is no way to read the text back from a `ReactNode`." +
      "\n\nThe parts are styled through the same `classNames` as the web: `track`, the strip that receives the drag, and `cell`. `label` does not port as a part: on the web it is hidden text, and here the name goes only into the strip's `accessibilityLabel`, with no node to style.",
  },
  VirtualList: {
    state: "no",
    note: "the platform already virtualizes: `FlatList` and `FlashList` do this out of the box",
    page:
      "Does not port, and it is not queued: **the platform already solves it**. React Native's `FlatList` " +
      "virtualizes out of the box, and the `DataList` here already uses it underneath. A piece of ours on top " +
      "would be a wrapper of a wrapper, and would demand maintenance to reimplement what the system " +
      "delivers, with worse performance, because `FlatList` runs part of the work off the JavaScript " +
      "bridge.\n\n" +
      "What the web had of its own, and that `FlatList` does not give by itself, are the four endings and the " +
      "honest count for the screen reader. Both are already in `DataList`: use it for a " +
      "long list that came from a query, and raw `FlatList` for a long list you already have " +
      "in hand.",
  },
  Popconfirm: {
    state: "renamed",
    native: "AlertDialog",
    note: "becomes `AlertDialog`; on the phone confirmation is modal and does NOT cancel on a tap outside",
    page:
      "Becomes `AlertDialog`. An anchored panel is not a touch idiom: a 20rem question attached " +
      "to a trash button against the right edge at 390px goes off screen or covers the row that " +
      "is about to be deleted. The web itself already recognizes this: below 640px `Popconfirm` stops " +
      "being a panel and becomes a bottom sheet, which is exactly what native has.\n\n" +
      "**One contract difference, and it is deliberate:** on the web dismissing CANCELS (`Esc`, " +
      "clicking outside and the button, all three call `onCancel`), because there the distracted gesture leads to the " +
      "safe result. The native `AlertDialog` does not close on a tap outside, as the web's does " +
      "not either. So the way out on the phone is the cancel button, written and visible: without Escape there " +
      "is no invisible exit, and it is the same rule `Editable` follows. `onCancel` has the same " +
      "name, and here it is called by the cancel button and Android's back.\n\n" +
      "The action in progress ports with the same names: whoever returns a promise in `onConfirm` gets the " +
      "same waiting button and the same lock against the second tap, and the modal only closes when " +
      "it resolves. So does `tone`: `danger` is the default, and `neutral` paints the primary button " +
      "for what can be undone. The texts live in the same `labels`, with the same keys: " +
      "`confirm`, `cancel`, `busy` and `blocked`.",
  },
  Tree: {
    state: "same",
    note:
      "one level at a time, stacked: tapping a branch pushes the inner level and the header " +
      "shows the path and goes back; no indentation, no search",
    page:
      "Translates, and the rule survives whole: **the leaf is what counts**. Checking a branch checks all " +
      "the leaves under it, and what comes out in `onValueChange` is always a list of leaves.\n\n" +
      "**The drawing is what does not port.** On the web the open levels appear at the same time, one indent " +
      "per level; at 390px the third level starts past the middle of the screen and the node's name fits in " +
      "four letters. The piece becomes illegible precisely where it is most useful. Here it is **one level " +
      "at a time**: tapping a branch pushes the inner level, and the header shows the path " +
      '("Financeiro › Contas a pagar", truncated from the front, because the part that matters is the ' +
      "last one) and goes back one level.\n\n" +
      "Two consequences of stacking. **A branch has two targets**: tapping the name enters, and the " +
      'box beside it checks the whole branch: with a single target there was no way to check "Financeiro" ' +
      "without visiting the seven leaves inside. And **the branch box uses the mixed state**, as on the " +
      "web: with some of the leaves checked, it draws the dash and announces `mixed`, and tapping it " +
      "checks the whole branch. The exact count does not appear on screen, as on the web; it goes in the branch's spoken " +
      'name ("Financeiro, 7 itens, 2 escolhidos"), because that is how you enter it.\n\n' +
      "Out, by decision: `filter` (searching inside a tree flattens the levels, and a flattened list " +
      "with search is already `Combobox`), `open`/`onOpenChange` (there is no open and closed, there is " +
      "the level where the finger is) and the node's `label`, which here is `string`. It is built into the " +
      "spoken label and the path, and there is no way to read the text back from a `ReactNode`.",
  },
  TreeSelect: {
    state: "same",
    note:
      "the `Tree` inside a sheet, with the draft count and `Aplicar` in the footer; leaving " +
      "through the side gives up",
    page:
      "Translates: it is the native `Tree` inside the bottom sheet, with the same level navigation. And " +
      "that is why it solves what the two chained `Select`s, which this page used to tell you to use, " +
      "never solved: the depth is not fixed, and the second `Select` only knew how to exist after " +
      "someone chose in the first.\n\n" +
      "**The footer is the half the web does not need to have.** On desktop the panel sits next to the " +
      "trigger, and the trigger counts how many there were; under a sheet there is no trigger in sight, so the " +
      "count lives in the footer, next to `Aplicar`, and it counts the **draft**, which is the only " +
      'number that answers "how many have I checked?" while the person is still checking. The ' +
      "text comes from the same summary as `Select` and `Combobox`, on purpose.\n\n" +
      "**Leaving through the side gives up**, and `Aplicar` is the only door that confirms, the same " +
      "split as `DateRangePicker`: a tap on the dimmed background is the gesture of someone who " +
      "changed their mind, and it cannot count as applying. No `searchable`, for the reason on the " +
      "`Tree` page.",
  },

  Breadcrumb: {
    state: "no",
    note: "the way back is the router's back button",
    page:
      "Does not port. The path to where the person is, on the phone, is the router's back button " +
      "plus the screen's title. Drawing a trail on top of that duplicates the " +
      "navigation and eats the width the title needs.",
  },
  Button: {
    state: "same",
    note: "controlled contract; `hitSlop` on `sm`, because a 32px target cannot be tapped without help. It sinks slightly on press, and does not sink when the system asks to reduce motion",
  },

  IconButton: {
    state: "same",
    note: "`label` required, the same name as the web; `sm` gets `hitSlop` up to a 44pt target; no `tooltip`, because on touch there is no hovering",
    page:
      "Translates, with the name required the same way and under the same name: `label`, and the type " +
      "rejects the button without it. `accessibilityLabel` does not come in: there is only one name, `label`, and it " +
      "is what becomes the `Pressable`'s `accessibilityLabel`.\n\n" +
      "**The touch target is never below 44pt.** `md` is the 44 square and `lg` the 48; " +
      "`sm` draws 32 and gets a `hitSlop` of 6 on all four sides, which gives back the 44 without " +
      "growing the drawing. The variants are those of the native `Button` (`primary`, `secondary`, " +
      "`ghost`, `outline`, `danger`), read from the same classes: only `shape` does not " +
      "cross over, for the same reason as there.\n\n" +
      "**There is no `tooltip`.** The tooltip appears on resting the pointer, and on touch there is no resting. " +
      "If the icon does not read on its own, the button needs text: use `Button`.\n\n" +
      "The icon comes in as a child, and the form that paints in the variant's color is the function, because " +
      "color does not flow down from the `View` to the SVG:\n\n" +
      "```tsx\n" +
      '<IconButton label="Excluir nota" variant="ghost" onPress={excluir}>\n' +
      "  {({ color, size }) => <Trash2 color={color} size={size} />}\n" +
      "</IconButton>\n" +
      "```",
  },

  Banner: {
    state: "same",
    note: "`title` and `description` as text; the icon is optional and comes in as a function, because the package ships no icons",
    page:
      "Translates, with the same four tones, the same `title`, `description`, `actions` and " +
      '`onDismiss`, and the x with the same accessible name ("Fechar aviso"). `title` and ' +
      "`description` are `string`, because text on native lives inside a `Text`.\n\n" +
      "**Urgency goes out through a live region.** `danger` and `warning` come out with " +
      '`accessibilityRole="alert"` and an immediate announcement; `info` and `success` come out in a polite ' +
      "live region, which waits for the current sentence to finish. It is the same split as the web's `role`. On iOS, where " +
      "the live region does not exist, title and description go out through the system announcement: for the urgent " +
      "tones also on appearing, and for all four on every text change.\n\n" +
      "**The icon does not come on its own.** The native package ships no icon library, so " +
      "`icon` is optional and the form that paints in the tone's color is the function: " +
      "`icon={({ color, size }) => <TriangleAlert color={color} size={size} />}`. The actions " +
      "sit below the text, which is where they fit in the phone's width.\n\n" +
      "The parts are styled through the same `classNames` as the web, all six: `icon`, `content`, `title`, `description`, `actions` and `dismiss`.",
  },

  ActionBar: {
    state: "same",
    note: "the same `count`, `onClear` and the same sentence; it sticks above the bottom safe area, which comes in through `bottomInset`",
    page:
      "Translates, with the same `count`, the same `onClear` and the same sentence with the right plural. The " +
      "actions come in as children, and the buttons' text is the native `Button`'s.\n\n" +
      "**It sticks above the bottom safe area.** The package does not depend on " +
      "`react-native-safe-area-context`, so the height of the system bar comes in through " +
      "`bottomInset`: `bottomInset={useSafeAreaInsets().bottom}`. The bar sits on top of the " +
      "list, in `absolute`, and whoever mounts it leaves breathing room at the end of the list so the last " +
      "row does not end up under it.\n\n" +
      "**The count is announced.** The sentence goes out through the system screen reader's announcement, and " +
      "the bar slides up on entering and down on leaving with the motion tokens, with no slide when the " +
      "system asks to reduce motion.\n\n" +
      "The parts are styled through the same `classNames` as the web: `bar`, `count` and `clear`, and `className` styles the same panel as `bar`. `actions` does not exist here: the actions are direct children of the panel, with no box of their own.",
  },

  Toggle: { state: "same", note: "`pressed` and `onPressedChange`" },

  ToggleGroup: {
    state: "same",
    note: "`items` on the root; `multiple` for several, the same name and the same meaning as the web",
  },

  ButtonGroup: {
    state: "no",
    note: "`Tabs` and `ToggleGroup` cover the case; a button against a button becomes a single target for the finger",
  },
  Command: {
    state: "no",
    note: "a command palette is a desktop gesture: a field, a list and the keyboard",
    page:
      "Does not port. The command palette is a desktop gesture (it opens by shortcut, moves by arrow, " +
      "confirms by Enter), and none of the three exists on touch. On the phone the equivalent " +
      "door is the router's search screen, with the field at the top and the result leading " +
      "straight to the screen.",
  },
  ContextMenu: {
    state: "renamed",
    native: "Menu",
    note: "the long press is the phone's right click: the target area goes as the `Menu`'s `children`",
    page:
      "Becomes `Menu`, not a new piece: the right-click menu is, on the phone, the long press, and " +
      "what opens the action sheet is already `Menu`. Pass the target area as its `children` — " +
      "what on the web is `ContextMenuTrigger` — and it calls `onOpenChange(true)` on long press, " +
      "with `classNames.trigger` for the layout the children require. Screen reader users " +
      "enter through the same door: the area exposes the `longpress` action, which VoiceOver and " +
      "TalkBack offer in the actions menu, so the gesture is never the only path.",
  },
  CookieConsent: {
    state: "no",
    note: "an app has no cookies; tracking consent on the phone is the platform's prompt, App Tracking Transparency on iOS",
    page:
      "Does not port, by decision. An app has no browser cookie to ask permission for: " +
      "tracking consent on the phone is the platform's own prompt, App Tracking " +
      "Transparency on iOS, requested through `expo-tracking-transparency`, and the data declaration " +
      "in the store on Android. A panel drawn by the library on top of that would be a second " +
      "request for the same thing.\n\n" +
      "If the app opens web pages in a `WebView`, the notice is the page's, which runs the " +
      "web `@rivocode/ui`.",
  },
  Kbd: {
    state: "no",
    note: "there is no keyboard to draw",
    page:
      "Does not port. The piece draws a key, and the phone has no physical keyboard for the key " +
      "to represent: `⌘K` on a touch screen promises a gesture that does not exist. What on the web " +
      "is a shortcut, on the phone is a visible button.",
  },
  Menubar: {
    state: "no",
    note: "a desktop idiom; native navigation is the router's tab bar and drawer",
  },
  NavigationMenu: {
    state: "no",
    note: "a desktop idiom; native navigation is the router's tab bar and drawer",
  },
  Pagination: {
    state: "no",
    note: "a phone list scrolls; choosing the page number is a desktop gesture",
  },
  Popover: {
    state: "no",
    note: "an anchored panel the finger itself covers: use `Sheet`",
    page:
      "Does not port. A panel anchored to the trigger is a narrow-screen problem before it is " +
      "a touch problem: it is born under the finger that opened it and has nowhere to " +
      "escape. In React Native the equivalent is `Sheet`, which rises from the bottom and does not compete " +
      "for space with anything.",
  },
  PreviewCard: {
    state: "no",
    note: "it appears on resting the pointer, and there is no resting on touch",
  },
  ScrollArea: {
    state: "same",
    note:
      "the scroll bar is still the system's; what the piece brings on the phone is the keyboard: it scrolls to the focused " +
      "field and pins a `footer` that rises with it",
    page:
      "Translates, and changes subject on the way. On the web the piece exists because of the **scroll bar**: the system's " +
      "takes up width on Windows and draws differently on each platform. On the phone the scroll bar is the " +
      "system's and stays that way, and the scrolling problem that hurts is another: **the keyboard covers the field**. " +
      "A form at the end of the screen disappears under it, and the submit button stays hidden until someone " +
      "closes the keyboard to find it.\n\n" +
      "So the native `ScrollArea` is the form screen. Underneath it is the `KeyboardAwareScrollView` " +
      "from `react-native-keyboard-controller`: on focusing a field, the scroll moves until it stops " +
      "`bottomOffset` points above the keyboard (16 by default), in the same frame the keyboard " +
      "rises, on both systems. A tap on a list item does not close the keyboard " +
      '(`keyboardShouldPersistTaps="handled"`).\n\n' +
      "```tsx\n" +
      "<ScrollArea\n" +
      '  contentContainerClassName="gap-4 p-5"\n' +
      "  footer={<Button onPress={emitir}>Emitir nota</Button>}\n" +
      ">\n" +
      '  <Field label="Descrição">…</Field>\n' +
      "</ScrollArea>\n" +
      "```\n\n" +
      "`footer` is the action pinned below the scroll, and it **rises with the keyboard**: the submit " +
      "button is always in view. Its height goes into the math of where the focused field stops, " +
      'so no field stays hidden behind the button. With "reduce motion" on, the ' +
      "footer jumps straight above the keyboard instead of following it; the scroll to the field " +
      "still happens, because without it the field stays covered.\n\n" +
      "There is no `horizontal`: a row of cards that scrolls sideways is a plain `ScrollView`, and has no field " +
      "for the keyboard to cover. `react-native-keyboard-controller` is a peer of the package, and the " +
      "`KeyboardProvider` it asks for already comes inside `RivoProvider`.\n\n" +
      "The scrolling content is styled through `contentContainerClassName`, the name `ScrollView` " +
      "already gives it, and the `footer` strip through `classNames.footer`.",
  },
  TableOfContents: {
    state: "no",
    note: "an app screen has no side index: long text on the phone becomes sections in a list that opens each one, or `Tabs`",
    page:
      "Does not port, by decision. The page index is a desktop idiom: it lives in a column beside " +
      "the text, and on the phone there is no column beside it. Long text on an app screen is " +
      "split before it reaches an index: each section becomes a router screen opened from " +
      "a list, or a `Tabs` tab, and the screen's title says where the person is.\n\n" +
      "The screen reader also already has its own index: the VoiceOver rotor and TalkBack's reading " +
      "controls jump from heading to heading in any `Text` with " +
      '`accessibilityRole="header"`, which is what the native package\'s `Heading` writes.',
  },
  ScrollToTop: {
    state: "no",
    note: "the platform already provides it: tapping the status bar on iOS and tapping the router's tab again scroll the list up",
    page:
      "Does not port, by decision: the phone already scrolls the list up out of the box. On iOS, tapping the status " +
      "bar takes the screen's `ScrollView` and `FlatList` to the top (that is `scrollsToTop`, " +
      "on by default), and in Expo Router and React Navigation tapping again on the tab " +
      "the person is already on does the same, with `useScrollToTop(ref)` on the list. A floating " +
      "button on top of that would be a third path to the same gesture, covering the " +
      "corner where the screen's main action lives.\n\n" +
      "There is no focus to give back: touch navigation has no Tab that continues from the end of the " +
      "page.",
  },
  Affix: {
    state: "no",
    note: "the platform already provides it: a sibling of the `ScrollView` with `position: absolute` does not scroll with it, and what sticks while scrolling is the list's `stickyHeaderIndices`",
    page:
      "Does not port, by decision: in React Native, sticking is the out-of-the-box behavior. There is no " +
      "window that scrolls; what scrolls is the `ScrollView` or the `FlatList`, and a `View` with " +
      "`position: absolute` written next to it, not inside it, stays still on screen while the " +
      "list runs underneath. There is no portal to open and no ancestor `transform` to escape.\n\n" +
      "For the title that sticks while the list scrolls, the list already has `stickyHeaderIndices` and " +
      "`stickySectionHeadersEnabled`. And the action that follows the whole screen at the bottom is " +
      "`ActionBar`, which translates and already accounts for the safe area through `bottomInset`.",
  },
  AppShell: {
    state: "no",
    note: "the app skeleton on the phone is the router: tab bar, drawer and the stack's title bar",
    page:
      "Does not port, by decision. On the phone the application skeleton is not drawn by the " +
      "component library: it is the router (Expo Router, React Navigation) that builds the tab " +
      "bar, the drawer, each screen's title bar and the safe area, with the back gesture, " +
      "the history and each tab's state for free. A shell of ours on top of that would be a " +
      "second skeleton competing for the same screen edges.\n\n" +
      "What the web shell solves for accessibility also already comes from the system: " +
      "VoiceOver and TalkBack announce the tab bar and the screen's title, and there is no skip " +
      "link for those navigating by touch. The top of each screen is still `PageHeader`, " +
      "which translates.",
  },
  Sidebar: {
    state: "no",
    note: "a desktop idiom; native navigation is the router's tab bar and drawer",
    page:
      "Does not port. The sidebar is the navigation skeleton of a wide screen; on the phone " +
      "that role is played by the router's tab bar and drawer (Expo Router, React " +
      "Navigation), which bring edge gesture, history and tab state for free. A " +
      "hand-drawn drawer on top of that loses all three.",
  },
  ResizablePanelGroup: {
    state: "no",
    note: "a panel you drag to split the width is a desktop idiom; on the phone each area is a router screen, or a sheet on top",
    page:
      "Does not port, for the same reason as `Splitter`, which on the web is built on top of this family. " +
      "Three resizable columns ask for a wide screen and a fine pointer: on a phone " +
      "held upright there is no width to split, and dragging a 1px line with a finger is not a gesture " +
      "that exists. The areas become router screens (Expo Router, React Navigation), and the panel " +
      "that collapses becomes a `Sheet`. The layout saved by `autoSaveId` has nothing to save there.",
  },
  Splitter: {
    state: "no",
    note: "two areas side by side do not fit on a narrow screen; on the phone the list and the detail are two router screens",
  },
  Table: {
    state: "no",
    note: "there is no table on the phone; the query becomes `DataList`",
  },
  Toolbar: {
    state: "no",
    note: "a desktop editing surface: a single tab stop and arrow navigation, which touch does not have",
  },
  Container: {
    state: "no",
    note: "the phone is already narrower than the smallest step; the side breathing room is the screen's padding, inside the safe area",
    page:
      "Does not port, and it is not queued. `Container` limits the width of a page that can be " +
      "1920px, and its smallest step, `sm`, is 36rem: wider than any phone held upright. " +
      "On touch it would be just side breathing room, and the breathing room of a native screen does not belong to a " +
      "piece, it belongs to the screen: a `View` with `px-4` inside the safe area, or the " +
      "`ScrollArea`'s `contentContainerClassName`. To arrange what goes inside, " +
      "`Stack` and `Grid` port.",
  },
  Tooltip: {
    state: "no",
    note: "hover does not exist on touch; the label needs to be on the screen",
    page:
      "Does not port, and there is no substitute: the tooltip appears on resting the pointer, and on touch there is no " +
      "resting. What on the web was an icon with a tooltip becomes, on the phone, an icon with a " +
      "label written next to it, or an `accessibilityLabel`, which solves it for the screen " +
      "reader and does not solve it for whoever can see.",
  },
  Heading: {
    state: "same",
    note: '`level` and `size` with the same names and the same scale; it comes out as a `Text` with `accessibilityRole="header"`, and the phone\'s screen reader does not announce the level',
    page:
      "Translates, with the same `level`, `size` and `truncate` as the web, and the same size for each " +
      'level when `size` is not given. It comes out as a `Text` with `accessibilityRole="header"`, in the provider\'s ' +
      "`display` family.\n\n" +
      "**The level is not announced.** VoiceOver and TalkBack say “cabeçalho” and stop there: there is no " +
      "`h1` to `h6` on touch. `level` is still required anyway, for two reasons: " +
      "it decides the size when `size` is not given, and the screen ports from the web without rewriting the " +
      "call.",
  },
  Link: {
    state: "same",
    note: '`Text` with `accessibilityRole="link"`; a tap opens the `href` through `Linking`, and `onPress` takes the place of the web\'s `render`, for the router',
    page:
      'Translates, as a `Text` with `accessibilityRole="link"`, and so it goes inside the sentence ' +
      'as on the web: `<Text>Veja o <Link href="…">espelho</Link>.</Text>` wraps along ' +
      "with the surrounding text. `tone` has the same four values, and the underline is fixed.\n\n" +
      "**`onPress` is what navigates, not a `render`.** There is no anchor in React Native to " +
      "swap for the router's, so the web's composition becomes a callback: " +
      '`onPress={() => router.push("/notas")}`. Without `onPress`, a tap opens the `href` through ' +
      "`Linking`, which is the path for `https:`, `mailto:` and `tel:`.\n\n" +
      "**`external` draws the arrow and warns through the hint**, the `accessibilityHint`, which the screen " +
      "reader reads after the name; the text is `labels.external`, and the default is “Abre fora do app.”. " +
      "When the child is plain text, the accessible name is that text, without the arrow. There is no `underline`: " +
      "on touch there is no hovering, and the underline is always the running text's.",
  },
  Text: {
    state: "same",
    note: "the same `Text` the other pieces wear, with `size`, `tone`, `weight`, `truncate` and `lineClamp`; without them, it inherits from the outer `Text`",
    page:
      "Translates, and the native `Text` is the same primitive the package's other pieces already " +
      "wear, now with `size`, `tone`, `weight`, `truncate` and `lineClamp`, the same names " +
      "and the same values as the web. `truncate` and `lineClamp` become `numberOfLines`.\n\n" +
      "**Without the new props, it inherits, as on the web.** A `Text` inside another `Text` takes " +
      "the outer one's size and color, and that is what makes a bold snippet in the middle of a sentence " +
      "work. The difference is at the top: React Native does not inherit color from `View`, so an " +
      "outer paragraph without `tone` comes out in the device's default color, not the theme's. Pass " +
      "`tone` on the outer `Text`.\n\n" +
      "There is no `render`: the phone's element is always `Text`, and a block is a `View` around it.",
  },
  Highlight: {
    state: "same",
    note: "built on `Text`, with the same `query` and the same accent-insensitive rule; `classNames.mark` as on the web",
    page:
      "Translates, on top of the package's `Text`, with the same `query` and the same accent-insensitive rule. Each " +
      "match is a nested `Text` with the same solid `warning` background, the `warning-fg` ink and the " +
      "semibold weight, and the outer one accepts all the `Text` props (`size`, `tone`, `weight`, " +
      "`lineClamp`).\n\n" +
      "Each match's class goes in `classNames.mark`, as on the web. " +
      "`matchesSearch` also comes from the native package, so the filter and the highlight use the same " +
      "rule.",
  },
  Spoiler: {
    state: "same",
    note: "the same `maxHeight`, `open` and `labels`; the fade is painted in the `fadeOver` color, because there is no mask",
    page:
      "Translates, with the same `maxHeight`, `open`, `defaultOpen`, `onOpenChange` and " +
      "`labels`, and the same button that only appears when the content overflows. The button states its state " +
      "through `accessibilityState.expanded`.\n\n" +
      "**Collapsed, the screen reader hears that the text is cut.** `overflow` hides only " +
      "from sight, and TalkBack and VoiceOver read the whole block. So the collapsed content " +
      'becomes a single element for the reader, with the hint "Texto cortado. Toque em Ler mais para ' +
      'ver o resto."; when open, the hint goes away. A link inside the collapsed block does not receive its own focus ' +
      "until it opens.\n\n" +
      "**The fade is painted, not a mask.** React Native has no mask without a new " +
      "dependency, so the last 40 points get bands in the background color, with increasing " +
      "opacity. The color comes from `fadeOver` (`bg`, `surface` or `surface-raised`, `bg` without the " +
      "prop): set the background the block sits on, otherwise the fade shows up as a band.\n\n" +
      "`className` goes on the root, and the parts are styled through the same `classNames` as the web: " +
      "`content` (the box that clips) and `trigger` (the button).",
  },
  TransferList: {
    state: "same",
    note: "the two lists stack, each with its own move buttons; the same `items`, `value` and `labels`",
    page:
      "Translates, with the same `items`, `value`, `onValueChange`, `searchable`, `disabled` and " +
      "`labels`, and the same count and announcement sentences.\n\n" +
      "**The lists stack, and each has its own buttons.** On the phone there is no width " +
      "for two columns with buttons in the middle: the top list is the available one, the bottom one the " +
      "chosen one, and each ends with “Mover selecionados para …” and “Mover todos para …”. " +
      "Each row is a checkbox with a 44-point target, and the list scrolls internally " +
      "from 288 points. The announcement goes out through the system screen reader.\n\n" +
      "The parts are styled through the same `classNames` as the web: `panel`, `header`, `search`, `list`, `option`, `actions` and `empty`. Since the buttons live in each list, `actions` styles the row below each one, not a column in the middle.",
  },
  PromptInput: {
    state: "same",
    note: "lives in `@rivocode/ui-native/ai`; controlled (`value` and `onValueChange` required), and submitting is only through the button, because the phone keyboard's return key breaks the line",
    page:
      "Translates, on its own path `@rivocode/ui-native/ai`, with the same `streaming`, " +
      "`onStop`, `attachments`, `actions`, `maxLength`, `showCount`, `labels` and the same " +
      'accessible names ("Mensagem", "Enviar mensagem", "Parar resposta").\n\n' +
      "**The counter arrives through the field.** The hint (`labels.hint`) and the spelled-out count " +
      "(`labels.count`) go in the field's `accessibilityHint`, and the visible number stays out of the " +
      "accessibility tree. On hitting `maxLength`, the screen reader announces " +
      "`labels.limit`, once per arrival at the ceiling. The default hint talks about the return key, " +
      "which here breaks the line.\n\n" +
      "**It is controlled.** `value` and `onValueChange` are required, like every field in the " +
      "package, and clearing the field after `onSubmit` is the caller's job.\n\n" +
      "**Submitting is only through the button.** On the phone keyboard, the return key of a " +
      "multi-line field breaks the line, and that is what the person expects of it; there is no Shift to " +
      "separate the two gestures. The field grows up to `maxRows` lines (8, without the prop, as on the web) and scrolls " +
      "internally.\n\n" +
      "The parts are styled through the same `classNames` as the web: `attachments`, `textarea`, `footer`, `count` and `submit`, which also styles the stop button in its place.",
  },
  Message: {
    state: "same",
    note: "lives in `@rivocode/ui-native/ai`; `onCopy` in place of `copyValue`, because copying needs `expo-clipboard`, which lives on another path",
    page:
      "Translates, on its own path `@rivocode/ui-native/ai`, with the same `role`, the same " +
      "alignment, the same `author`, `avatar`, `streaming`, `onRetry`, `actions` and `error`. " +
      "In `streaming` the message announces `busy` and hides the actions, as on the web.\n\n" +
      "**Copying is yours.** The web copies on its own through `copyValue`; here the piece has `onCopy`, " +
      "because the phone's clipboard is `expo-clipboard`, a peer that lives in " +
      "`@rivocode/ui-native/clipboard` and that the AI path cannot charge to whoever copies " +
      "nothing. Loose text in `children` becomes `Text` in the house body; a node comes in as " +
      "it came, for whoever renders markdown.\n\n" +
      "The parts are styled through the same `classNames` as the web: `avatar`, `bubble`, `content`, `indicator`, `error` and `actions`. `content` styles the `Text` that wraps loose text; a node that arrives ready comes in as it came.",
  },
  Conversation: {
    state: "same",
    note: "lives in `@rivocode/ui-native/ai`; the list comes through `items`, `renderItem` and `keyExtractor`, on top of an inverted `FlatList`",
    page:
      "Translates, on its own path `@rivocode/ui-native/ai`, on top of an inverted `FlatList`: " +
      "the end of the conversation is the start of the list, so whoever is there stays there when the text " +
      'grows, with no math at all. Scrolling up shows the same "Ir para o fim" button, and the ' +
      "list holds the reading position while the new message arrives below.\n\n" +
      "**The list comes through `items`**, like the whole package: `renderItem` draws a message and " +
      "`keyExtractor` gives the key. The order is the web's (newest last), and the inversion " +
      "belongs to the piece. `empty` with `suggestions` and `onSuggestion` cross over with the same " +
      "names.\n\n" +
      '**The new message is announced**, like the web\'s `role="log"`: on Android through the live ' +
      "region, and on iOS through the system announcement, once per message and only when `streaming` " +
      "ends. The spoken text is the loose text `renderItem` returns; whoever draws the message " +
      "through their own component says the sentence in `announcement`, and `null` there waits.\n\n" +
      "The parts are styled through the same `classNames` as the web: `viewport` on the `FlatList`, `content` on its `contentContainerClassName`, `empty`, `suggestions` and `scrollButton`.",
  },
  ToolCall: {
    state: "same",
    note: "lives in `@rivocode/ui-native/ai`; the same five states with mark and text, input and output in mono font, and approve and reject outside the panel",
    page:
      "Translates, on its own path `@rivocode/ui-native/ai`, with the same `name`, `status`, " +
      "`input`, `output`, `error`, `onApprove`, `onReject`, `labels`, `defaultOpen`, `open` and " +
      "`onOpenChange`. `title` and `error` are `string`, because text on native lives inside " +
      "a `Text`.\n\n" +
      "**Color is still not the only signal.** The package ships no icons, so each state " +
      "comes out with a text mark (○, ✓, ✕, !) before the name, and `running` gets the spinner. The " +
      "trigger tells the screen reader the tool's name and the state.\n\n" +
      "The parts are styled through the same `classNames` as the web, all six: `trigger`, `name`, `status`, `panel`, `error` and `actions`.",
  },
  AILabel: {
    state: "same",
    note: "lives in `@rivocode/ui-native/ai`; the explanation opens in a `Sheet`, not an anchored panel, and is a `string`",
    page:
      "Translates, on its own path `@rivocode/ui-native/ai`, with the same `text`, `label`, " +
      "`tone`, `size`, `explanation` and `title`.\n\n" +
      "**The explanation opens in a `Sheet`.** A panel anchored to the badge would sit under the finger " +
      "that tapped it, the same reason `Popover` does not port. That is why there is no `side`, and " +
      "`explanation` is a `string`: it becomes the sheet's description.",
  },
  SortableList: {
    state: "same",
    note: "lives in `@rivocode/ui-native/dnd`, with no peer: the gesture is the core's `PanResponder`, and only the handle drags; the screen reader moves through actions, one step at a time",
    page:
      "Translates, on its own path `@rivocode/ui-native/dnd`, with the same `items`, `getKey`, " +
      "`renderItem`, `onReorder`, `getLabel`, `handle`, `orientation`, `disabled` and `labels`.\n\n" +
      "**No new peer.** The gesture is React Native's `PanResponder`, the same as the `Slider`'s, and " +
      "not react-native-gesture-handler: dragging by the handle, on a single axis, is a gesture the " +
      "core solves on its own. The handle is 44pt and holds the gesture until the finger lifts (it does not yield to " +
      "the screen's scroll in the middle of a drag), and the rest of the row keeps scrolling the list, as " +
      "with iOS's reorder handle. That is why, on the phone, **only the handle drags**: with the whole row " +
      "as a handle, every touch to scroll would become a drag.\n\n" +
      '**The screen reader does not drag: it moves.** Each handle brings two actions, "Mover para ' +
      'cima" and "Mover para baixo" (or left and right, horizontally), and each one moves one ' +
      'step and announces the new position with the same text as the web: "Item Nota 1043 movido para a ' +
      'posição 3 de 8". The drag also announces on picking up, at each position and on dropping.\n\n' +
      "During the drag a copy of the item follows the finger over the list, and the neighbors make " +
      "room with the tokens' `base` duration, with no motion when the system asks to " +
      "reduce it. `handleProps` are the gesture and the actions, to spread on a `View` of your own with " +
      "`handle={false}`.",
  },
  Kanban: {
    state: "no",
    note: 'the board is a desktop idiom: at 390px one column fits, and taking the card to another is a "Mover para" menu, not a drag',
    page:
      "Does not port, and it is not queued: it is a decision. **The board exists for the eye to see the columns side " +
      "by side**, and at 390px one fits. Dragging a card to the next column means holding " +
      "the finger while the row scrolls under it to a column that is not yet on screen, " +
      "and the finger that drags is the same one that would need to scroll. In the phone's browser the " +
      "web `Kanban` still stands, with the row scrolling one column at a time and the card " +
      "leaving its place only after the finger holds it, but that is the fallback for someone who opened a desktop " +
      "screen on the phone, not the design of an app.\n\n" +
      "**On the phone, each column is a list, and changing columns is an action.** The columns become " +
      "`Tabs` (or sections of a `DataList`), the order within the column is the `SortableList` from " +
      '`@rivocode/ui-native/dnd`, and each card gets a `Menu` with "Mover para" and the names of the ' +
      "other columns. It is the same `onMove({ itemId, from, to, index })` as the web on the side that " +
      "holds the state, and it is the path the screen reader would take anyway.",
  },
  RichTextEditor: {
    state: "no",
    note: "editing formatted text on touch is another engine (WebView or a native library, with a native module peer) and the toolbar is a desktop surface; the phone writes with `Textarea` and reads what the web saved with `RichTextView`",
    page:
      "Does not port, by decision, and it is not queued: the question left to decide is not about gesture, " +
      "it is about the engine.\n\n" +
      "**The web editor does not cross over.** It is Tiptap on top of ProseMirror, which lives on the " +
      "browser's `contenteditable`, and React Native has no `contenteditable`. The two " +
      "ways out are another product: a `WebView` with the same editor inside, which brings " +
      "`react-native-webview` as a native module peer, a keyboard and selection that are not the " +
      "system's, and text the screen reader reads through the page's path and not the " +
      "app's; or a native rich text library, which neither reads nor writes the same " +
      "document. Neither is the same piece with another API.\n\n" +
      "**And the toolbar is a desktop surface.** It is a `Toolbar`, which also does not port: a " +
      "single tab stop with arrows between the buttons, over a selection made with the pointer. " +
      "On touch, formatting a snippet means selecting with the finger that covers the snippet, and fifteen " +
      "buttons do not fit above the keyboard.\n\n" +
      "**On the phone, the answer is to split the work.** What gets written on the phone is short " +
      "text, and the field is `Textarea`. What was written formatted on the web is read with " +
      "`RichTextView`, which ports with no peer and reads the same HTML and the same JSON.",
  },
  RichTextView: {
    state: "same",
    note: "in the main index, with no `WebView` and no peer: the same reader as the web builds each block as a `View` and each mark as a `Text`, and a link opens through `Linking`",
    page:
      "Translates, in the main index `@rivocode/ui-native`, with the same `value` and `empty`. " +
      "It reads the HTML from `onValueChange` and the JSON from `onJsonChange` of `RichTextEditor` through the " +
      "**same reader as the web**, which is pure code shared between the two packages: there is no " +
      "`WebView`, no peer, and nothing in the content executes.\n\n" +
      "Each block becomes a `View` and each mark becomes a nested `Text`: the heading is `Heading` (and " +
      "announces itself as a header), a numbered list starts from the saved `start`, a quote comes out in the " +
      "muted tone with a left border, a code block in a selectable mono font, and " +
      "a link is `Link`, which opens through `Linking` and only with `http`, `https`, `mailto`, `tel` " +
      "or a relative address.\n\n" +
      "**It does not live in a subpath.** On the web it comes from `@rivocode/ui/editor` because it shares the " +
      "path with the editor; on the phone there is no editor, so there is no peer to separate, and the piece " +
      "lives alongside `Text`.",
  },
};

/* --------------------------------------------------------------------------
 * What exists today, measured
 * ----------------------------------------------------------------------- */

/** The pieces with their own page on the site, by the site's own prefix rule. */
/**
 * The native queue, declared piece by piece - and it ONLY SHRINKS.
 *
 * The queue reached zero on 2026-08-26 and filled up again the same day, when
 * seven new pieces landed on the web at once. A queue that grows quietly is
 * the beginning of the native package becoming a promise: each piece looks
 * like a temporary delay, and a year later there are twenty "temporary" ones.
 * The rule became building both sides together, and whatever cannot be built
 * together has to be SAID here, with the reason, at the time.
 *
 * A new entry in this list is a conscious decision, not a dispatch: write why
 * the piece cannot be born on both sides on the same day. An entry that no
 * longer fires is an error, and the guard says to delete the line - that is
 * what keeps the list from becoming the place where the queue lives forever.
 */
const DECLARED_QUEUE: Record<string, string> = {};

async function catalogPieces() {
  const pages = (await scanAtLeast("*.md", 150, { cwd: DOCS })).map((file) =>
    file.replace(/\.md$/, ""),
  );

  const isPart = (name: string) => {
    if (STANDALONE.has(name) || PARTS_THAT_ARE_PIECES.has(name)) return false;
    const named = PARENT[name];
    if (named) return pages.includes(named);

    for (const other of pages) {
      if (other === name || !name.startsWith(other)) continue;
      if (!/^[A-Z]/.test(name.slice(other.length))) continue;
      return true;
    }
    return false;
  };

  return pages.filter((name) => !isPart(name));
}

/**
 * What `native/src/index.ts` really exports.
 *
 * Two people port pieces while this runs, so the list is always the current
 * one - and that is why `--check` exists: the minute a queued piece shows up
 * here, the docs that send the reader to the substitute start lying.
 */
function nativeExports() {
  const names = new Set<string>();

  for (const index of NATIVE_INDEXES) {
    const source = readFileSync(index, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");

    for (const block of source.matchAll(/export \{([\s\S]*?)\} from/g)) {
      for (const raw of block[1]!.split(",")) {
        const part = raw.trim();
        if (!part || part.startsWith("type ")) continue;
        names.add(
          part
            .split(/\s+as\s+/)
            .pop()!
            .trim(),
        );
      }
    }
  }

  return names;
}

/* --------------------------------------------------------------------------
 * The text
 * ----------------------------------------------------------------------- */

const SYMBOL: Record<State, string> = {
  same: "✔ translates",
  renamed: "✔ becomes",
  queued: "○ queued",
  no: "✕ does not port",
};

const nativeName = (piece: string, row: Row) => row.native ?? piece;

function stateCell(piece: string, row: Row) {
  if (row.state === "renamed") return `✔ becomes \`${nativeName(piece, row)}\``;
  return SYMBOL[row.state];
}

function table(pieces: string[]) {
  const rows = [
    "| Piece | In React Native | What to know before counting on it |",
    "| --- | --- | --- |",
  ];

  for (const piece of pieces) {
    const row = PARITY[piece]!;
    rows.push(`| \`${piece}\` | ${stateCell(piece, row)} | ${row.note} |`);
  }

  return rows.join("\n");
}

/** "a, b and c" - commas up to the second to last, the way a list is written in prose. */
function inWords(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function scoreboard(pieces: string[], _native: Set<string>, measured: string) {
  const count = (state: State) => pieces.filter((p) => PARITY[p]!.state === state).length;

  return (
    `**${pieces.length} pieces in the web catalog, measured against ` +
    `${inWords(NATIVE_INDEXES.map((file) => `\`${file}\``))} on ${measured}:** ` +
    `${count("same")} translate with the same name, ${count("renamed")} translate under another, ` +
    `${count("queued")} are queued and ${count("no")} do not port by decision. ` +
    "The middle column separates the two absences, which is the distinction the table exists " +
    "to make: `○` changes with time, `✕` does not. And `✔` does not mean copy and " +
    "paste: the section above explains why."
  );
}

/** The paragraph that goes into the piece page, when there is no hand-written one. */
function pageParagraph(piece: string, row: Row) {
  if (row.page) return row.page;

  const native = nativeName(piece, row);

  if (row.state === "same") {
    return (
      `Translates: \`@rivocode/ui-native\` exports \`${native}\` - ${row.note}. ` +
      "The API is not the same as the web's (on native everything is controlled), and the " +
      "[parity table](/react-native) says what changes piece by piece."
    );
  }

  if (row.state === "renamed") {
    return (
      `In React Native this piece is \`${native}\` - ${row.note}. ` +
      "The [parity table](/react-native) has the rest of the catalog."
    );
  }

  if (row.state === "queued") {
    return (
      `Not ported yet - ${row.note}. ` +
      "It is a current absence, not a decision: the [parity table](/react-native) separates " +
      "the two."
    );
  }

  return (
    `Does not port, by decision - ${row.note}. ` +
    "It is not queued: it will not exist. The [parity table](/react-native) gives the reason for " +
    "each one."
  );
}

const SECTION_TITLE = "## In React Native";

/**
 * Replaces the section if it already exists, appends it at the end if not.
 *
 * The replacement goes through a function, not a string: the `InputGroup`
 * note wrote `R$` and the `$` after it was read as a capture reference by
 * `replace` - the whole file showed up in the middle of the table, with no
 * error at all.
 */
function withNativeSection(markdown: string, paragraph: string) {
  const section = `${SECTION_TITLE}\n\n${paragraph}\n`;
  const existing = /\n## In React Native\n[\s\S]*?(?=\n## |$)/;

  if (existing.test(markdown)) return markdown.replace(existing, () => `\n${section}`);
  return `${markdown.replace(/\s*$/, "")}\n\n${section}`;
}

/**
 * Replaces the body of a guide section, from the title to the next `## `.
 *
 * The guide is still written by hand; what this file owns is the body of
 * this section, and only that.
 */
function withReplacedSection(markdown: string, title: string, body: string) {
  const target = new RegExp(`(^|\\n)${title}\\n[\\s\\S]*?(?=\\n## |$)`);
  if (!target.test(markdown)) {
    throw new Error(
      `Could not find the section "${title}". It is where the table is published:\n` +
        "write the title in the file, or fix the title here.",
    );
  }
  return markdown.replace(target, (_, before: string) => `${before}${title}\n\n${body}\n`);
}

const GUIDES = [
  { file: "apps/docs/src/content/react-native.md", title: "## Parity, piece by piece" },
  {
    file: ".claude/skills/rivocode-ui/reference/native.md",
    title: "## Parity, piece by piece",
  },
];

/* --------------------------------------------------------------------------
 * Run
 * ----------------------------------------------------------------------- */

const checking = process.argv.includes("--check");
const pieces = await catalogPieces();
const native = nativeExports();
const problems: string[] = [];

for (const [piece, row] of Object.entries(PARITY)) {
  if (!row.note.includes("\n")) continue;

  problems.push(
    `the note of \`${piece}\` has a line break, and a note is a table CELL.\n` +
      "    Markdown closes the table at the first break: from the next line on everything\n" +
      "    becomes running prose with the pipes showing, and the rest of the page falls apart.\n" +
      "    It happened on 08/27 and was caught on the published screen. Long prose goes in `page`,\n" +
      "    which is a paragraph; `note` fits on one line or it does not fit.",
  );
}

for (const piece of pieces) {
  if (!PARITY[piece]) {
    problems.push(
      `\`${piece}\` has a page in the catalog and no row in the parity table.\n` +
        "    A piece without a row reads as the reader's oversight: write its state in\n" +
        "    scripts/native-parity.ts.",
    );
  }
}

for (const piece of Object.keys(PARITY)) {
  if (!pieces.includes(piece)) {
    problems.push(
      `\`${piece}\` has a row in the parity table and no page in the catalog.\n` +
        "    The table is promising a piece that does not exist.",
    );
    continue;
  }

  const row = PARITY[piece]!;
  const name = nativeName(piece, row);
  const exists = native.has(name);

  if ((row.state === "same" || row.state === "renamed") && !exists) {
    problems.push(
      `\`${piece}\` is marked "${stateCell(piece, row)}" and \`${name}\` is not exported from\n` +
        `    ${NATIVE_INDEXES.join(" nor ")}. The table promises an import that breaks.`,
    );
  }

  if ((row.state === "queued" || row.state === "no") && exists) {
    problems.push(
      `\`${piece}\` is marked "${stateCell(piece, row)}" and \`${name}\` IS ALREADY exported from\n` +
        `    ${NATIVE_INDEXES.join(" or ")}. The piece was ported: promote the row, or the docs keep\n` +
        "    telling people to use the substitute.",
    );
  }
}

for (const piece of pieces) {
  if (PARITY[piece]?.state !== "queued") continue;
  if (piece in DECLARED_QUEUE) continue;

  problems.push(
    `\`${piece}\` entered the native queue without being declared in DECLARED_QUEUE.\n` +
      "    A new web piece is born on both sides on the same day. If this one cannot, write\n" +
      "    the reason in DECLARED_QUEUE - the queue only grows by written decision.",
  );
}

for (const piece of Object.keys(DECLARED_QUEUE)) {
  if (PARITY[piece]?.state === "queued") continue;

  problems.push(
    `\`${piece}\` is in DECLARED_QUEUE and is no longer queued.\n` +
      "    The list only shrinks: delete the line.",
  );
}

if (problems.length > 0) {
  console.error(`${problems.length} divergence(s) between the parity table and the code:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  process.exit(1);
}

const TODAY = new Date().toISOString().slice(0, 10);
const MEASURED = /(?<= on )\d{4}-\d{2}-\d{2}(?=:\*\*)/;
const sectionBody = (measured: string) =>
  `${scoreboard(pieces, native, measured)}\n\n${table(pieces)}`;
const outdated: string[] = [];

for (const guide of GUIDES) {
  const before = readFileSync(guide.file, "utf8");
  const kept = MEASURED.exec(before)?.[0];
  if (kept && before === withReplacedSection(before, guide.title, sectionBody(kept))) continue;
  const after = withReplacedSection(before, guide.title, sectionBody(TODAY));
  if (before === after) continue;
  if (!checking) writeFileSync(guide.file, after);
  outdated.push(guide.file);
}

for (const piece of pieces) {
  const path = `${DOCS}/${piece}.md`;
  const before = readFileSync(path, "utf8");
  const after = withNativeSection(before, pageParagraph(piece, PARITY[piece]!));
  if (before === after) continue;
  if (!checking) writeFileSync(path, after);
  outdated.push(path);
}

if (checking) {
  if (outdated.length > 0) {
    console.error(`${outdated.length} file(s) out of sync with the parity table:\n`);
    for (const file of outdated) console.error(`  ${file}`);
    console.error("\nRun `bun run scripts/native-parity.ts` and commit the result.");
    process.exit(1);
  }
  console.log(`${pieces.length} pieces checked: the table and the pages say the same thing.`);
} else {
  console.log(
    `${pieces.length} pieces in the table; ${outdated.length} file(s) rewritten.\n` +
      `Native index measured now: ${native.size} exports.`,
  );
}
