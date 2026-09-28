# Building a native screen with ui-native

React Native speaks the **same vocabulary** as the web (`bg-bg`, `text-fg-muted`,
`rounded-pill`) through NativeWind, on top of a `theme.css` generated from the
same tokens (`bun run gen:native` at the root). No component knows the brand
color here either.

The components live in `native/src` and the example app in `examples/native`
(`bunx expo start --ios`). The app's CSS is precompiled:
`node scripts/build-css.mjs` inside the app: if you added a new class, run it
again.

## Theme: the two house themes switch at runtime, the client's is build time

`theme="rivocode-dark" | "rivocode-light" | "system"` switches the whole screen
at runtime, because those colors were compiled as `light-dark()` and the
provider only flips `Appearance`. **A client theme does not work like that, and
assuming it does costs a day.**

- **Class color only changes at BUILD time.** The `react-native-css` compiler
  hardcodes the value inside the rule (`.bg-accent` becomes
  `{"backgroundColor":"#d4f34a"}`), and not a single `--` is left in the
  compiled CSS. So no theme object passed at runtime ever changed a class's
  color.
- **The theme map LEFT the provider.** It only reached whoever reads color
  through JS (`ChartDonut`, `ChartRadial`, the spinner of `Button` and
  `Spinner`, the `Switch` track, `Sparkline`, the fields' hint text), and the
  symptom was a MIXED screen: a donut from one theme and a button from another,
  side by side. The provider started resolving the 45 roles by reading the
  compiled CSS, one `bg-` class per role, so context and class always say the
  same color. The `theme` prop accepts only `rivocode-dark`, `rivocode-light`
  and `system`, and the `scheme` prop left together with the map, because it
  was what chose its scheme.
- **The ceiling is two themes per build.** `light-dark()` has two slots. One
  client per app fits; a showcase of five themes needs five bundles.

The path that works: override the roles in an `@theme` in the app's
`global.css`, after `@rivocode/ui-native/theme.css`, and precompile again.

```css
@import "@rivocode/ui-native/theme.css";
@import "tailwindcss/utilities.css";

@theme {
  --color-accent: #2563eb;
  --color-accent-fg: #ffffff;
  --color-bg: light-dark(#f7f8fa, #0d1220);
  /* ...and the other roles the brand changes. */
}
```

This alone dresses the whole screen, charts included: the class paints the new
color, and the piece that reads color through JS reads the same color from the
same CSS. Do not pass any map in the `theme` prop, and never promise a runtime
brand switch on a native screen.

## Same name is not same API

Where the piece's name is the same, the prop's name is too (`Avatar fallback`,
`OTPField onValueComplete`, `ToggleGroup multiple`). **The signature is not.**
No piece accepts the same JSX on both sides, because of two rules:

- **On native everything is controlled**: no `defaultValue`,
  `defaultChecked`, `defaultOpen`.
  `<Checkbox checked={x} onCheckedChange={setX}>ISS retido</Checkbox>`, both
  required. The exception is what opens and closes in place, `Accordion` and
  `Collapsible`: they accept both modes, optional `value`/`open` next to
  `defaultValue`/`defaultOpen`.
- **The list comes through `items`, not composition**: `RadioGroup`,
  `CheckboxGroup`, `ToggleGroup`, `Combobox`, `Tabs` and `Select` receive the
  array and draw the sheet: `<Select items={…} value onValueChange label />`,
  without `SelectTrigger`/`SelectContent`/`SelectItem`. `label` is required
  because it is what the screen reader announces.

**The spoken name is `label`, always**, in place of the web's `aria-label`:
`Select`, `Slider`, `IconButton`, `Checkbox` and `Switch` with no text beside
them (`<Checkbox label="Selecionar a nota" … />`, and the type refuses the box
without `children` and without `label`), `OTPField`, `SignaturePad`.
`accessibilityLabel` only appears where the piece IS the platform's
`TextInput` (`Input`, `Textarea`, `CurrencyInput`, `PasswordInput`) and on
`Item`, whose row already speaks its own text and it only swaps the phrase.

Never promise that the web screen "will run on the phone": what is reused is
the class vocabulary, the token and the choice of piece. The JSX is rewritten.

**The part is dressed by the same name as on the web.** `className` dresses the
root, as there, and a native piece that accepts `classNames` uses the keys from
the web page's "Parts" section: `<Banner classNames={{ title: 'font-rc-strong' }} />`
is written the same in both packages. The consumer's class comes last in `cn`
and beats the piece's. Three limits, all from React Native:

- **A part native does not draw stays out of the type**, and does not become an
  invented node: `Carousel`'s `pause` (there is no `autoplay`), `Tour`'s
  `spotlight` (the cutout is the gap between the strips), `QRCode`'s `code`,
  `SignaturePad`'s `baseline` and `ChartGauge`'s `arc` (they live inside the
  `Svg`, which takes no class), `Switch`'s `thumb` (the thumb belongs to the
  platform). Each one has a line in the table below.
- **Text color does not flow down from `View` to `Text`.** On a part that is a
  box (`Spoiler`'s `trigger`, `Carousel`'s `footer`), `text-*` does not paint
  the text inside; dress the part that is the `Text` itself (`title`,
  `counter`, `message`).

There is no `<part>ClassName` prop: the part is dressed only through
`classNames`, and that also holds where the web composes pieces and native
draws everything in one - `InputGroup`'s `input`, `prefix`, `suffix` and
`action`; `Menu`'s `trigger`, `content` and `item`; `ScrollArea`'s `footer`.
The exception is `ScrollArea`'s `contentContainerClassName`, which is the name
`ScrollView` already gives the scrolling content.

Not every piece has `classNames` here. One that has it on the web and not here
has a line in the table below saying why, and `bun run check:signature` demands
the line: without it, the piece is dressed only by the root without anyone
being told.

What is left over from these two rules - a prop that changes name, a type that
changes shape, a variant that exists on one side only - is in the next
section's table, piece by piece. Read the row before rewriting the call: the six
cases that cost the most time (`SearchInput`, `MaskedInput`, `Timeline`,
`Sparkline`, `Popconfirm` and `Meter`) were discovered one by one, in `tsc`,
because they were written nowhere.

## The signature, prop by prop

**195 signature divergences in 88 pieces.** The two rules above (everything controlled, lists through `items`) hold across the whole catalog; what is here is what is left over from them — a prop that changes name, a type that changes shape, and a variant that exists on one side only. `—` means there is no equivalent prop on that side. All three columns are checked against both packages by `bun run check:signature`.

| Piece | On the web | In React Native | What changes in the call |
| --- | --- | --- | --- |
| `AILabel` | `explanation` | `explanation` | `string`, which becomes the description of the `Sheet` where the explanation opens |
| `AILabel` | `side` | — | the explanation opens in a `Sheet`, which has no side |
| `Accordion` | — | `children` | the root only stacks; the item is what has props |
| `ActionBar` | `position` | — | there is no `sticky` or `fixed`: the bar is always `absolute` over the list, at the foot of the screen |
| `ActionBar` | — | `bottomInset` | the bottom safe area comes in as a number, `useSafeAreaInsets().bottom`, because the package does not depend on `react-native-safe-area-context` |
| `ActionBar` | `finalFocus` | — | on touch there is no keyboard focus to give back when the bar leaves |
| `ActionBar` | `classNames` | `classNames` | no `actions`: the actions are direct children of the panel, and `className` styles the same panel as `bar` |
| `Alert` | — | `title` | the title becomes a prop; on the web it is `AlertTitle` as a child |
| `AlertDialog` | — | `title` | `title` and `description` become required props, in place of `AlertDialogTitle` and `AlertDialogDescription` |
| `AlertDialog` | — | `onConfirm` | the confirming button is `onConfirm` plus `labels.confirm`, not an `AlertDialogClose` in the footer |
| `AlertDialog` | `open` | `open` | `open` and `onOpenChange` are required, and it does not close on a tap outside |
| `Autocomplete` | `value` | `value` | `value` and `onValueChange` are required, and the value is always the text (`string`) |
| `Autocomplete` | `mode` | — | there is no inline completion: the sheet filters the suggestions and the person taps or keeps typing |
| `Autocomplete` | — | `label` | the field's name becomes a required prop, and it is the sheet's title; on the web it is the `AutocompleteInput`'s `aria-label` |
| `Avatar` | `fallback` | `fallback` | becomes required: it is what takes the place while the photo downloads, and it is what comes back if the photo fails |
| `Banner` | `description` | `description` | `title` and `description` become `string`: text on native lives inside a `Text` |
| `Banner` | `icon` | `icon` | no default icon, because the package ships no icons; the function receives the tone's color and the size |
| `Button` | `size` | `size` | `xl` does not port: native has `sm`, `md` and `lg`, and `lg` is already the call to action on touch. An icon-only button is `IconButton` on both sides |
| `Button` | `shape` | — | no pill: the radius is the token's, the same on every button |
| `Calendar` | `mode` | — | single date only, which on the web is the path without `mode`: a range is `DateRangePicker`, and multiple loose dates do not port |
| `Calendar` | `classNames` | `classNames` | the `DayPicker` names, only those that have a node in the hand-drawn month: no `months`, `month`, `month_caption`, `week`, `outside`, `hidden`, the range `range_*` ones or the animation ones |
| `Carousel` | — | `items` | the slides come through `items` and `renderItem`, not as children |
| `Carousel` | `index` | `index` | becomes required, with `onIndexChange`: there is no `defaultIndex` |
| `Carousel` | `slidesPerView` | `slidesPerView` | number only: the per-width object and `"auto"` do not port |
| `Carousel` | `autoplay` | — | on touch a row that moves on its own fights the finger; there is no rotation and no pause |
| `Carousel` | `classNames` | `classNames` | no `pause`, because there is no `autoplay` |
| `ChartContainer` | — | `children` | `children` is a function and receives `{ width, height, colors }`: there is no `ResponsiveContainer` to measure for you, and the measurement arrives zeroed on the first frame |
| `ChartContainer` | `empty` | `empty` | the empty state's `title` and `description` are `string`, not `ReactNode`; `icon` crosses over, and also accepts the native `EmptyState`'s function |
| `ChartContainer` | `errorTitle` | `errorTitle` | `errorTitle` and `errorMessage` become `string` |
| `ChartDonut` | `centerValue` | `centerValue` | `centerValue` and `centerLabel` become `string` |
| `ChartGauge` | `classNames` | `classNames` | no `arc`: the arc is a stroke inside the `Svg`, and `react-native-svg` does not take classes |
| `ChartRadial` | `color` | `color` | on the web it is any CSS color; on native it is a token role (`chart-1`…`chart-8`), otherwise the piece is deaf to the theme |
| `Checkbox` | `parent` | — | a group's parent is assembled by hand, with `indeterminate` and the children's state: the native `CheckboxGroup` has no `allValues` |
| `Checkbox` | — | `label` | the spoken name is `label`, in place of `aria-label`; without `children` it is required, and the type rejects a box with neither |
| `Clipboard` | — | `toast` | the spoken toast comes along and `toast={false}` turns it off: a label changed under the finger is not re-announced |
| `Code` | — | `children` | `children` is `string`, not `ReactNode`: the snippet is text |
| `Collapsible` | — | `label` | the header becomes `label`, in place of `CollapsibleTrigger` and `CollapsiblePanel` |
| `ColorPicker` | `label` | `label` | `label` is `string`: no `ReactNode`, as in every native piece |
| `Combobox` | `items` | `items` | `items` on the root and required, flat or in `{ label, items }` groups; no `ComboboxItem` per child |
| `Combobox` | — | `label` | `label` is required: it is what the screen reader announces, in place of `aria-label` |
| `Combobox` | — | `searchPlaceholder` | the sheet has its own search; `emptyMessage` is the empty list text |
| `Combobox` | `filter` | — | the filter belongs to the piece and ignores accents; it cannot be swapped |
| `ContextMenu` → `Menu` | — | `children` | `ContextMenuTrigger` becomes the `Menu`'s `children`, and the gesture is the long press, not the right click |
| `ContextMenu` → `Menu` | — | `actions` | the items become `actions`, in place of a `MenuItem` per child, and the sheet rises from the bottom |
| `ContextMenu` → `Menu` | — | `title` | the sheet has a required header: with no anchoring, it is what says what the menu is about |
| `ContextMenu` → `Menu` | `open` | `open` | `open` and `onOpenChange` are required, and `defaultOpen` does not exist |
| `Conversation` | — | `items` | the messages come through `items`, `renderItem` and `keyExtractor`, not through children; the order is the same, newest last |
| `Conversation` | `empty` | `empty` | `title` and `description` become `string`, and `icon` is the function that receives the color |
| `CurrencyInput` | `value` | `value` | becomes required, with `onValueChange`: there is no `defaultValue` |
| `DataTable` → `DataList` | `columns` | `renderItem` | there are no columns: `renderItem` draws the whole row |
| `DataTable` → `DataList` | `rowKey` | `keyExtractor` | same role, React Native's name |
| `DataTable` → `DataList` | `onRowClick` | `onRowPress` | same role, the touch name |
| `DataTable` → `DataList` | `labels` | `labels` | only `retry` and `selectRow`: with no pages and no header, there is no `selectAll`, `range`, `pagination`, `loading` or `loaded` |
| `DataTable` → `DataList` | `pageSize` | — | a phone list scrolls: no pages, and `virtual`, `rowHeight` and `maxHeight` go away with it |
| `DataTable` → `DataList` | — | `filterValue` | `filter` only searches what this function returns, because there is no column to take text from |
| `DataTable` → `DataList` | `classNames` | — | the row is what `renderItem` returns, and whoever writes it styles it: there is no `table`, `head` or `cell` |
| `DatePicker` | `disabledDays` | — | an individual blocked day does not port: the range is `min`/`max` |
| `DatePicker` | `confirm` | — | the sheet always confirms: choosing already closes it |
| `DatePicker` | — | `label` | `label` is required, and the field does not live inside a `Field` |
| `DateRangePicker` | `value` | `value` | `value` and `onValueChange` are required and ISO only: the web's `IsoDateRange`, which here is called `DateRange`; the contract is the same, a closed range or `null` |
| `DateRangePicker` | `numberOfMonths` | — | one month per sheet, always |
| `DateRangePicker` | `confirm` | — | the sheet always confirms: a tap outside it is giving up |
| `DescriptionItem` | `label` | `label` | `label` is `string`, and the body is still a child |
| `Dialog` | — | `title` | `title` is a required prop and `description` is a prop: no `DialogTitle` and no `DialogTrigger` |
| `Dialog` | `open` | `open` | `open` and `onOpenChange` are required: the caller is the one who opens it |
| `Editable` | `value` | `value` | `value` and `onValueChange` required; a long press opens it, and there is a visible `Cancelar` |
| `EmptyState` | `title` | `title` | `title` and `description` are `string` |
| `EmptyState` | `icon` | `icon` | also accepts a function that receives `color` and `size`, because color does not flow down from the `View` to the SVG |
| `Field` | — | `label` | `label`, `description` and `error` become props: no `FieldLabel`, `FieldDescription` and `FieldError` |
| `Fieldset` | — | `legend` | `legend` becomes a required prop, in place of `FieldsetLegend` |
| `FileUpload` | `onSelect` | `onSelect` | what comes back is a `PickedFile` with a local `uri`, not a `File`: `size` may be missing |
| `FileUpload` | `accept` | `accept` | accepts a list, and speaks MIME: it is what the system picker knows how to filter |
| `FileUpload` | `label` | `label` | `label` and `hint` are `string`, and the drop area becomes a button |
| `FilterBar` | `labels` | `labels` | `labels.empty` is `string`, and `labels.scroll` does not exist: the list is what scrolls |
| `FilterChip` | `value` | `value` | `value` is `string`: the pill does not take an element |
| `Form` | — | `children` | `children` is a function and receives `{ submit, isSubmitting }`: nothing submits on its own, because there is no `<form>` or `type="submit"` |
| `FormField` | `label` | `label` | `label` becomes required and is `string`: it is what becomes `accessibilityLabel` on the control |
| `FormField` | `description` | `description` | `description` is `string` |
| `IconButton` | `shape` | — | no pill: the radius is the token's, the same on every button |
| `IconButton` | `tooltip` | — | on touch there is no hovering; an icon that does not read on its own calls for a `Button` with text |
| `IconButton` | `tooltipSide` | — | goes away along with `tooltip` |
| `ImageViewer` | `index` | `index` | becomes required, with `onIndexChange`: there is no `defaultIndex`, and `null` is closed |
| `Indicator` | `label` | `label` | `label` becomes required: the pill is a single screen reader stop, and what it says is the sentence |
| `Input` | — | `font` | picks the font role, which the web resolves by class |
| `InputGroup` | — | `prefix` | `prefix`, `suffix` and `actions` become props: no `InputPrefix`, `InputSuffix` and `InputAction` |
| `InputGroup` | — | `value` | the frame draws the field itself: `value` and `onValueChange` belong to it, not to an `Input` inside |
| `InputGroup` | — | `classNames` | the parts that are pieces on the web are styled through `classNames`, with their names: `input`, `prefix`, `suffix` and `action` |
| `Item` | — | `title` | `title`, `description`, `media` and `actions` become props: no `ItemTitle`, `ItemDescription` and `ItemMedia` |
| `Item` | `interactive` | `onPress` | `onPress` is what makes the row tappable, not a boolean |
| `Link` | `render` | `onPress` | the router link comes in through a callback, `onPress={() => router.push("/notas")}`: there is no anchor to swap |
| `Link` | `underline` | — | the underline is fixed: with no pointer, there is no `hover` |
| `MaskedInput` | `value` | `value` | on the web `value` is the text WITH the mask; on native it is only the digits, and the mask belongs to the field |
| `Menu` | — | `actions` | the items become `actions`, in place of a `MenuItem` per child, and the sheet rises from the bottom |
| `Menu` | — | `title` | the sheet has a required header: with no anchoring, it is what says what the menu is about |
| `Menu` | — | `children` | there is no `MenuTrigger`: `children` is the area that opens on long press, and the three-dot button is yours |
| `Menu` | `open` | `open` | `open` and `onOpenChange` are required, and `defaultOpen` does not exist |
| `Menu` | — | `classNames` | what on the web is `MenuTrigger`, `MenuContent` and `MenuItem` is styled through `classNames`: `trigger`, `content` and `item` |
| `Message` | `copyValue` | `onCopy` | the button calls whoever copies, because `expo-clipboard` lives in `@rivocode/ui-native/clipboard` |
| `Message` | `error` | `error` | `string`: text on native lives inside a `Text` |
| `Meter` | `label` | `label` | `label` becomes required and is `string` |
| `NotificationCenter` | `open` | `open` | becomes required, with `onOpenChange`: there is no `defaultOpen` |
| `NotificationCenter` | — | `icon` | the bell comes in through `icon`, required, because the package ships no icons; the function receives the button's color |
| `NotificationCenter` | `onItemClick` | `onItemPress` | the row is not a link: with no `href` on the item, the router navigates from the item received |
| `NotificationCenter` | `defaultFilter` | — | the filter starts at `all`; `filter` with `onFilterChange` controls it |
| `NotificationCenter` | `align` | — | the list is always a bottom sheet, not a panel anchored to the bell |
| `NotificationCenter` | `classNames` | `classNames` | no `footer`: “Carregar mais” sits directly in the sheet |
| `NumberField` | `value` | `value` | `value` is `number` and never `null`: the stepper always has a number, and `min` starts at 0 because the iPhone's numeric keyboard has no minus sign |
| `NumberField` | `step` | `step` | no `"any"`: the stepper's step is a number |
| `NumberField` | — | `label` | `label` is required: it is what names the two step buttons |
| `OTPField` | `mask` | — | no hiding the digit, and no `autoSubmit`, `normalizeValue` or `validationType` |
| `OTPField` | — | `label` | the spoken name is `label`, in place of `aria-label`; without it, the reader says how many digits the code has |
| `PageHeader` | `breadcrumb` | — | the way back is the router's back button |
| `PageHeader` | — | `badge` | the pill next to the title becomes a prop |
| `PageHeader` | `titleAs` | — | there is no heading level: the header is a single screen reader stop |
| `PasswordInput` | `labels` | `labels` | `labels.show` and `labels.hide` are required together, because the button changes its name with the state |
| `PixCode` | — | `renderCopy` | the copy button comes from `@rivocode/ui-native/clipboard` through a function; on the web it is already inside, and that is why the `PixCodeLabels` here has no `copy` or `copied` |
| `PixCode` | `classNames` | `classNames` | no `copy`: the button is what `renderCopy` returns, and whoever writes it styles it |
| `Popconfirm` → `AlertDialog` | `trigger` | — | there is no anchoring: you draw your own button and control `open` |
| `Popconfirm` → `AlertDialog` | `description` | `description` | becomes a required `string`: the modal does not open without saying what is lost |
| `Popconfirm` → `AlertDialog` | `side` | — | `align`, `sideOffset` and `finalFocus` go away with it: the modal takes the middle of the screen |
| `Popconfirm` → `AlertDialog` | `classNames` | — | the native `AlertDialog` is not styled by class, not even at the root: `title`, `description`, `footer`, `confirm` and `cancel` are the modal's fixed design |
| `PostalCodeField` | `value` | `value` | becomes required and is only the digits; on the web it accepts the masked text |
| `PostalCodeField` | `defaultValue` | — | there is no internal state: the field is controlled |
| `Progress` | `min` | — | the scale is 0 to 100, and `max` goes away with it |
| `Progress` | `label` | `label` | `label` becomes required and is `string` |
| `PromptInput` | `value` | `value` | required, together with `onValueChange` and `onSubmit`: on native every field is controlled |
| `PromptInput` | `defaultValue` | — | no state of its own: clearing the field after submitting is the caller's job |
| `QRCode` | `classNames` | `classNames` | only `logo`: `code` is the `Svg`, and `react-native-svg` does not take classes |
| `QueryBoundary` | `empty` | `empty` | the empty state's `title` and `description` are `string`; `icon` crosses over, and also accepts the native `EmptyState`'s function |
| `QueryBoundary` | `errorTitle` | `errorTitle` | `errorTitle` and `errorMessage` become `string` |
| `Questionnaire` | — | `items` | the questions come through `items`, with `type` `single`, `multiple` or `text`, in place of `QuestionnaireItem` and the parts as children |
| `Questionnaire` | `item` | `item` | becomes required: the open question is always controlled, together with `onItemChange` |
| `Questionnaire` | `defaultItem` | — | there is no internal open-question state |
| `Questionnaire` | — | `value` | the answers are controlled; on the web they live in the form's `<input>`s |
| `Questionnaire` | `onSubmit` | `onSubmit` | becomes required and receives only the answers: there is no `FormData` outside the browser |
| `Questionnaire` | `shortcuts` | — | with no physical keyboard, there is no letter or number shortcut |
| `Questionnaire` | — | `onStatusChange` | a single one on the root, with the question's `name`; on the web it belongs to each `QuestionnaireItem` |
| `Rating` | `value` | `value` | becomes required: there is no `defaultValue`, and without `onValueChange` the piece only displays |
| `Rating` | `icon` | `icon` | it is a function, and receives `{ color, size, filled }`: color does not flow down from the `View` to the SVG |
| `Rating` | `name` | — | there is no `<form>` to carry the rating in a hidden field |
| `RivoProvider` | `density` | — | the prop does not exist: a touch target does not shrink, and `comfortable` is the only height |
| `RivoProvider` | `theme` | `theme` | only `rivocode-dark`, `rivocode-light` and `system`: a client theme is a BUILD decision |
| `RivoProvider` | — | `fonts` | the fonts come in through the provider, with `isFontLoaded` to hold the screen until they load |
| `RivoProvider` | `toastPosition` | — | the toast rises from the bottom, and `scope` and `dir` go away with it |
| `ScrollArea` | — | `classNames` | only `footer`, the strip pinned below the scroll; the scrolling content stays on the `ScrollView`'s `contentContainerClassName` |
| `SearchInput` | `onClear` | — | the clear button belongs to the piece itself, and it calls `onValueChange("")` |
| `SearchInput` | `shortcut` | — | there is no keyboard to draw the `Kbd` inside the field |
| `Select` | `items` | `items` | `items` on the root and required, flat or in `{ label, items }` groups; no `SelectTrigger`, `SelectContent` and `SelectItem` |
| `Select` | — | `label` | `label` is required: it is what the screen reader announces |
| `Select` | `value` | `value` | the value is `string` or `string[]`, not the web's generic item |
| `Sheet` | `side` | — | bottom only, which was already the web's narrow mode; `snapPoints` goes away with it |
| `Sheet` | — | `title` | `title` is a required prop and `description` is a prop |
| `SignaturePad` | `value` | `value` | becomes required: there is no `defaultValue`, and without `onValueChange` the piece only displays |
| `SignaturePad` | `name` | — | there is no `<form>` to carry the SVG in a hidden field |
| `SignaturePad` | — | `onDrawingChange` | reports the start and end of a stroke, so the surrounding `ScrollView` stops scrolling |
| `SignaturePad` | — | `label` | the group's name is `label`, in place of `aria-label`; without it `labels.group` applies |
| `SignaturePad` | `classNames` | `classNames` | no `baseline`: the baseline is a stroke inside the `Svg` |
| `Slider` | `value` | `value` | a single value: `number`, not `number[]` |
| `Slider` | `label` | `label` | `label` becomes required and is `string` |
| `Sparkline` | `variant` | `variant` | `area` does not port: it needs a filled polygon, and the native drawing is `View` |
| `Sparkline` | `color` | `color` | on the web it is any CSS color; on native it is a token role |
| `Sparkline` | — | `height` | the height is a prop, because there is no CSS to give it from outside |
| `Spoiler` | — | `fadeOver` | the fade is painted in the color of the background the block sits on, because touch has no mask |
| `Stat` | `value` | `value` | `value` is an already formatted `string`, with `currencyShort` and the other formatters the root exports |
| `Stat` | `deltaVariant` | — | the change is always text with an arrow, without the filled pill |
| `Stat` | `icon` | — | no icon, no `footer`, no `hint` and no `actions`: the card is label, value and change |
| `Steps` | `onStepChange` | — | only the web's narrow mode (text and bar), and it was never clickable |
| `Switch` | `value` | — | there is no native form to carry a value: the state is `checked` |
| `Switch` | `classNames` | `classNames` | only `label`: no `thumb`, because the thumb belongs to the platform's `Switch`, which does not take classes |
| `Switch` | — | `label` | the spoken name is `label`, in place of `aria-label`; without `children` it is required |
| `Tabs` | — | `items` | `items` on the root, in place of `TabList`, `Tab` and `TabPanel`: it is the segmented box, and the panel is yours |
| `Tabs` | `value` | `value` | the value is `string`, not the web's generic |
| `Text` | `render` | — | the element is always `Text`; a block is a `View` around it |
| `Text` | — | `font` | picks the font role, which the web resolves by class |
| `TimeField` | — | `label` | `label` is required, and the arrows become two step buttons |
| `TimePicker` | — | `label` | `label` is required, and the sheet has two columns: it does NOT embed the `TimeField` |
| `TimePicker` | `classNames` | `classNames` | no `field`: there is no typing field inside the trigger, and the trigger is `trigger` |
| `Timeline` | — | `items` | the events come through `items`, not through `TimelineItem` children |
| `Timeline` | — | `label` | `label` says what the timeline tells, and goes into the announcement of each stop |
| `TimelineItem` → `Timeline` | `at` | — | becomes `items[].at` and is an already written `string`: a live `RelativeTime` inside would leave the spoken label stuck at the time it was built |
| `TimelineItem` → `Timeline` | `tone` | — | `tone` and `pending` become fields of `items[]`, and so do `by` and `title` |
| `TimelineItem` → `Timeline` | `classNames` | — | the item becomes `items[]`, with no class per item: the native `Timeline` is styled only at the root, with no `marker`, `content`, `title` or `meta` |
| `Toggle` | `value` | — | there is no native form to carry a value: the state is `pressed` |
| `ToggleGroup` | — | `items` | `items` on the root, in place of a `Toggle` per child; `multiple` stays the same |
| `ToolCall` | `title` | `title` | `string`, like `error`: text on native lives inside a `Text` |
| `Tour` | `open` | `open` | becomes required, with `onOpenChange`: there is no `defaultOpen` |
| `Tour` | `step` | `step` | becomes required, with `onStepChange`: there is no `defaultStep`, and `onStepChange` is where the screen scrolls to the target |
| `Tour` | `interactive` | — | the `Modal` is another window, and a tap does not pass through the cutout to the target |
| `Tour` | `classNames` | `classNames` | no `spotlight`: the cutout is the gap between the four `mask` bands, not a node |
| `Tracker` | `classNames` | `classNames` | no `label`: the strip's name is only its `accessibilityLabel`, with no hidden text to style |
| `Tree` | `open` | — | there is no open state: one level at a time, and tapping a branch pushes the inner one |
| `Tree` | `filter` | — | no search inside the tree; `emptyMessage` is the nothing-found text |
| `Tree` | — | `label` | `label` is required: it is what names the level for the screen reader |
| `TreeSelect` | `searchable` | — | no search in the sheet |
| `TreeSelect` | — | `label` | `label` is required, and the footer brings the draft count and `Aplicar` |

Outside the table, one loss that repeats: **18 pieces lose `size` on native** — `Badge`, `Clipboard`, `Combobox`, `CurrencyInput`, `DatePicker`, `DateRangePicker`, `Input`, `InputGroup`, `MaskedInput`, `NumberField`, `PasswordInput`, `PostalCodeField`, `SearchInput`, `Select`, `Textarea`, `TimeField`, `TimePicker` and `TreeSelect`. A touch target does not shrink, and `comfortable` is the only height. This list is measured on every generation, not written by hand.

## Forms come in through another path

`Form`, `FormField`, the adapters and `useZodForm` live in
`@rivocode/ui-native/form`, not in the root index: `react-hook-form` is an
optional peer, and metro resolves imports per file.

```tsx
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
```

Two differences bite right away: **nothing submits by itself** (no `<form>`, no
`type="submit"`, no Enter: `Form` delivers `{ submit, isSubmitting }` through a
function), and **the label travels in the field** (no `for` nor `id`,
`FormField` puts `accessibilityLabel` and `invalid` on the row, and the adapter
carries them to the control: as `label` on the pieces, which are named by it,
and as `accessibilityLabel` on `Input` and `Textarea`).

## Charts too, and they bring a native peer

`ChartContainer`, `ChartDonut`, `ChartRadial`, `ChartGauge`, `ChartHeatmap`,
`ChartFunnel` and `ChartTreemap` live in `@rivocode/ui-native/chart` and
require `react-native-svg`, an **optional** peer and a native module, which the
app installs and links to the project only if it draws charts
(`npx expo install react-native-svg`). `QRCode` lives in the same path because
of the same peer, and `PixCode` with it: the rule is one subpath per peer, and
not one per subject. `PixCode`'s copy comes in through `renderCopy`, with the
`Clipboard` from `@rivocode/ui-native/clipboard`. `SignaturePad` also lives
here, because of the same peer, with `signatureToSvg` and `isSignatureEmpty`:
PNG does not port, because there is no canvas.

```tsx
import { ChartBar, ChartContainer, ChartDonut, ChartLine, ChartRadial, PALETTE, PixCode, QRCode } from '@rivocode/ui-native/chart'
import { SignaturePad, isSignatureEmpty, signatureToSvg } from '@rivocode/ui-native/chart'
```

Three things bite. **The frame measures and delivers**: `children` as a
function receives `{ width, height, colors }`, in place of
`ResponsiveContainer` and the `var(--color-series)`, and the measurement
arrives zeroed on the first frame. **On touch there is no tooltip**: the
donut's legend is the control, and tapping the row lights up the slice and
brings name and value to the center. **A series color is a token role**
(`chart-1` to `chart-8`), never a hex, or the piece goes deaf to the client's
theme: on the web the same prop accepts any CSS color because there it becomes
`var(--color-series)`, and here what the piece receives is already the final
value that goes into the drawing.

`PALETTE` is that list of the eight roles, in the order they should be used: a
series without `color` in `config` gets its next one, and it is what
`ChartDonut` walks slice by slice. Import it when your hand-drawn chart needs
the same order, instead of writing `chart-1` again in some corner.

**For the bar and the line to move, draw with `ChartBar` and `ChartLine`**,
from the same path, instead of raw `Rect` and `Path`. On mount they animate in
(the bar grows from the base, the line rises from the `baseline`, or from the
lowest point) and, when the data changes, they go to the new value with the
motion tokens, through Reanimated; with "reduce motion", they are born in
place and jump. The donut and the arc already do this on their own: they enter
sweeping from zero.

```tsx
<ChartContainer config={SERIES} data={meses} className="h-56">
  {({ width, height, colors }) => (
    <Svg width={width} height={height}>
      {meses.map((mes, index) => (
        <ChartBar key={mes.mes} x={index * 40} y={height - mes.total} width={24} height={mes.total} fill={colors.receita} />
      ))}
    </Svg>
  )}
</ChartContainer>
```

`Sparkline` stays out of this, at the root and drawn with `View`: it is the
`Stat`'s `chart` slot, and `Stat` comes from the root. It only fades in, in
both packages, and does not move on data change.

**Pieces animate in on mount, as on the web.** `Alert`, `EmptyState`,
`FileUploadItem` and `DataList`'s error notice rise 4px fading; `Stat`,
`Tracker`, `Timeline`, `Sparkline` and `DataList`'s list fade; `Indicator`'s
pill grows; the bar of `Progress` and `Meter` fills from zero. All in
`duration-base`, or `fast` on the pill and `slow` on the bar, and none of it
runs with "reduce motion". The frame (`Card`, `PageHeader`) stays still, and so
does a control in its initial state.

## Copy and attach: two paths, not one

`Clipboard` and `FileUpload` also require an optional peer, and each one lives
in its own subpath: **one subpath per peer, and not one per subject**. Whoever
puts a copy button next to an NF-e access key attaches no file at all, and a
shared index would demand both Expo modules from someone who uses only one.

```sh
npx expo install expo-clipboard        # @rivocode/ui-native/clipboard
npx expo install expo-document-picker  # @rivocode/ui-native/file-upload
```

```tsx
import { Clipboard } from '@rivocode/ui-native/clipboard'
import { FileUpload, FileUploadItem, FileUploadList } from '@rivocode/ui-native/file-upload'
```

Two things bite. **The copy confirmation is double**: the button changes name,
as on the web, and the piece **also** fires a toast, because an
`accessibilityLabel` swapped on a `Pressable` that is already under focus is
not re-announced by either VoiceOver or TalkBack, and the `RivoProvider` toast
is the only channel on this screen that speaks by itself (`toast={false}`
turns it off). And **the drop zone does not exist**: on a phone there is no
dragging, so what opens the picker is a control-height button, with the `hint`
inside the spoken name. `accept` speaks MIME, which is what the system picker
knows how to filter, and what comes back is a `PickedFile` with a local `uri`:
`size` may be missing, and `maxSize` only refuses what it measured.

## Parity, piece by piece

**134 pieces in the web catalog, measured against `native/src/index.ts`, `native/src/form/index.ts`, `native/src/chart/index.ts`, `native/src/clipboard/index.ts`, `native/src/file-upload/index.ts`, `native/src/ai/index.ts` and `native/src/dnd/index.ts` on 2026-09-28:** 104 translate with the same name, 4 translate under another, 0 are queued and 26 do not port by decision. The middle column separates the two absences, which is the distinction the table exists to make: `○` changes with time, `✕` does not. And `✔` does not mean copy and paste: the section above explains why.

| Piece | In React Native | What to know before counting on it |
| --- | --- | --- |
| `AILabel` | ✔ translates | lives in `@rivocode/ui-native/ai`; the explanation opens in a `Sheet`, not an anchored panel, and is a `string` |
| `Accordion` | ✔ translates | `value`, `defaultValue` and `onValueChange` on the root, through the `value` of each `AccordionItem`; one open at a time, as on the web (`multiple` allows several), and an item without `value` opens on its own. It opens with the arrow rotating and the body fading in, and with no motion when the system asks to reduce it |
| `ActionBar` | ✔ translates | the same `count`, `onClear` and the same sentence; it sticks above the bottom safe area, which comes in through `bottomInset` |
| `Affix` | ✕ does not port | the platform already provides it: a sibling of the `ScrollView` with `position: absolute` does not scroll with it, and what sticks while scrolling is the list's `stickyHeaderIndices` |
| `Alert` | ✔ translates | `title` is a prop and the body is a child; no `AlertTitle`/`AlertDescription`; `icon`, `onDismiss` and `labels` as on the web, and the icon can also come in as a function, in the tone's color |
| `AlertDialog` | ✔ translates | `onConfirm`, `onCancel` and `labels` instead of composition, with the names of the `Popconfirm`; `tone` `danger` or `neutral`, and an `onConfirm` that returns a promise holds the modal in a waiting state until it settles; it does not close on a tap outside, as on the web |
| `AppShell` | ✕ does not port | the app skeleton on the phone is the router: tab bar, drawer and the stack's title bar |
| `AspectRatio` | ✔ translates | numeric `ratio`, the same |
| `Autocomplete` | ✔ translates | `value` is the text and accepts what is not in the list; `items` as text on the root, flat or in `{ label, items }` groups, and the field opens in a sheet that rises with the keyboard |
| `Avatar` | ✔ translates | remote `src` through the core's `Image`; `fallback` is required, because it is what shows while the photo downloads and if it fails |
| `Badge` | ✔ translates | the same tones; the text is a child; it has NO `size`, because the native package has a single density |
| `Banner` | ✔ translates | `title` and `description` as text; the icon is optional and comes in as a function, because the package ships no icons |
| `Breadcrumb` | ✕ does not port | the way back is the router's back button |
| `Button` | ✔ translates | controlled contract; `hitSlop` on `sm`, because a 32px target cannot be tapped without help. It sinks slightly on press, and does not sink when the system asks to reduce motion |
| `ButtonGroup` | ✕ does not port | `Tabs` and `ToggleGroup` cover the case; a button against a button becomes a single target for the finger |
| `Calendar` | ✔ translates | month drawn by hand; `value`, `onValueChange`, `min` and `max` in ISO `yyyy-mm-dd`, which the web also accepts; displayed as `dd/mm/yyyy`; the new month fades in; `classNames` with the names of the web's `DayPicker` |
| `Card` | ✔ translates | with `CardHeader`, `CardTitle`, `CardDescription` and `CardContent` (no `CardFooter`) |
| `Carousel` | ✔ translates | built on a horizontal `FlatList` with `pagingEnabled`; the list comes through `items` and `renderItem`, the `index` is controlled, and there is no `autoplay` |
| `ChartContainer` | ✔ translates | lives in `@rivocode/ui-native/chart`; the four endings cross over with the same names, and the drawing comes in as a function: there is no Recharts, no measuring container, and no `var(--color-series)` |
| `ChartDonut` | ✔ translates | the legend is the control: with no tooltip to open on touch, tapping the row lights the slice, and the written center stays in the middle; `format` accepts a formatter name or a function, as on the web, the ends are square, and `empty` takes the donut's place when there is no data |
| `ChartFunnel` | ✔ translates | same props, with `color` as a token role; each stage is one stop with name, number and rate in the same sentence |
| `ChartGauge` | ✔ translates | crosses over almost whole, like `ChartRadial`; the band scale goes into the accessible name, because there is no separate description on touch |
| `ChartHeatmap` | ✔ translates | the grid becomes a single `adjustable` stop, like the `Tracker`, and the finger picks the cell; with no tooltip, the reading lives in a line below |
| `ChartRadial` | ✔ translates | crosses over almost whole, because it never had a tooltip; `color` is a token role and the name comes from what is written in the middle, not just the percentage |
| `ChartTreemap` | ✔ translates | each category is a button with name, value and share; tapping lights the outline and writes the reading below, and the rule for the label that disappears is the same |
| `Checkbox` | ✔ translates | `checked` and `onCheckedChange` **required**; no `defaultChecked`; `indeterminate` as on the web; the check mark grows in when checked |
| `CheckboxGroup` | ✔ translates | `items` on the root and `value: string[]`; `label` names the set, in place of the web's `aria-label` |
| `Clipboard` | ✔ translates | lives in `@rivocode/ui-native/clipboard`; the confirmation is double: the button changes its name and a toast speaks, because a label changed under the finger is not re-announced |
| `Code` | ✔ translates | the snippet wraps along with the sentence around it, and a long press copies (`selectable`); its own scrolling belongs to `CodeBlock`, which is still out |
| `Collapsible` | ✔ translates | `label` in place of `CollapsibleTrigger` and `CollapsiblePanel`; `open`/`onOpenChange` or `defaultOpen`, as on the web; the same motion as the `Accordion` |
| `ColorPicker` | ✔ translates | comes from the root; controlled, and with no arrows: each swatch is a 44px target with the 32 drawing inside, and there are six per row, not ten |
| `Combobox` | ✔ translates | the list opens in a sheet with accent-insensitive search, and the sheet rises with the keyboard; `items` on the root, flat or in `{ label, items }` groups, not a `ComboboxItem` per child |
| `Command` | ✕ does not port | a command palette is a desktop gesture: a field, a list and the keyboard |
| `Container` | ✕ does not port | the phone is already narrower than the smallest step; the side breathing room is the screen's padding, inside the safe area |
| `ContextMenu` | ✔ becomes `Menu` | the long press is the phone's right click: the target area goes as the `Menu`'s `children` |
| `Conversation` | ✔ translates | lives in `@rivocode/ui-native/ai`; the list comes through `items`, `renderItem` and `keyExtractor`, on top of an inverted `FlatList` |
| `CookieConsent` | ✕ does not port | an app has no cookies; tracking consent on the phone is the platform's prompt, App Tracking Transparency on iOS |
| `CurrencyInput` | ✔ translates | the same cents, the same right-to-left typing and the same reading of pasted text; the field is controlled |
| `DataTable` | ✔ becomes `DataList` | `filter`, `selectable` and selection through `value`/`onValueChange` port with the same name; sorting and `pageSize` are left out by design |
| `DatePicker` | ✔ translates | opens the sheet with the month; stores ISO `yyyy-mm-dd`, which the web also accepts, and displays `dd/mm/yyyy` |
| `DateRangePicker` | ✔ translates | one month in a sheet, with both ends on the same grid and in ISO `yyyy-mm-dd`, which the web also accepts; the piece orders the taps, and only a closed range comes out, with `null` on Limpar, as on the web |
| `DescriptionList` | ✔ translates | the borders come in through `Children`: Tailwind's divide utility does not exist in RN |
| `Dialog` | ✔ translates | `open`, `onOpenChange` and `title` as props; no `DialogTrigger`. It opens with a fade, and with no transition when the system asks to reduce motion; the card rises into the space above the keyboard |
| `Editable` | ✔ translates | a **long** press opens it, the keyboard's return key confirms and there is a visible `Cancelar`: leaving the field does not save, unlike the web |
| `EmptyState` | ✔ translates | `description` required, for the same reason as the web; `icon` and `illustration` on both sides |
| `EventCalendar` | ✕ does not port | a time grid is a desktop idiom; on the phone the answer is the list, and the month is the `Calendar` |
| `Field` | ✔ translates | `label`, `description` and `error` as props, and `label` names the text field inside; `validate`, `validationMode` and `validationDebounceTime` with the web's name, signature and timing, and an explicit `error` wins over `validate`; `validate` receives the text of the text fields (`Input`, `Textarea`, `MaskedInput`, `InputGroup`, `PasswordInput`) and the value of the ones that open a sheet (`Autocomplete`, `Select`, `Combobox`, `DatePicker`), and the error is announced, lights their border and becomes the hint; in the sheet ones, closing the sheet is leaving the field, and `Concluir` and the submit key are the submit. Text that arrives later fades in |
| `Fieldset` | ✔ translates | `legend` as a prop |
| `FileUpload` | ✔ translates | lives in `@rivocode/ui-native/file-upload`; the drop area becomes a button, because on the phone there is no dropping; `accept` speaks MIME and the size is formatted without `Intl` |
| `FilterBar` | ✔ translates | scrolls horizontally with the clear button anchored OUTSIDE what scrolls; the reserved row is one touch target tall; the edge with more hidden content becomes a 1pt rule, not a fade |
| `FilterChip` | ✔ translates | the touch strip is 44pt and the painted pill stays at 28; `size` changes the drawing, never the target |
| `Form` | ✔ translates | lives in `@rivocode/ui-native/form`; `Form` hands over `submit` instead of waiting for a `type="submit"`, and there is one more adapter, `forText` |
| `Gantt` | ✕ does not port | a schedule chart is a desktop idiom; on the phone the day's task is a list, and the deadline is the `Calendar` |
| `Grid` | ✔ translates | `columns`, `minItemWidth` in points and `gap`; the grid measures its own width to count the columns |
| `Heading` | ✔ translates | `level` and `size` with the same names and the same scale; it comes out as a `Text` with `accessibilityRole="header"`, and the phone's screen reader does not announce the level |
| `Highlight` | ✔ translates | built on `Text`, with the same `query` and the same accent-insensitive rule; `classNames.mark` as on the web |
| `IconButton` | ✔ translates | `label` required, the same name as the web; `sm` gets `hitSlop` up to a 44pt target; no `tooltip`, because on touch there is no hovering |
| `ImageViewer` | ✔ translates | built on `Modal` and `FlatList` with `pagingEnabled`; controlled `index`, pinch through the core's `PanResponder`, no new peer |
| `Indicator` | ✔ translates | `label` is required: the pill is a single screen reader stop, and what it says is the sentence, never the number |
| `Input` | ✔ translates | the border lights up on focus: there is no `focus-visible` on a touch screen; `onValueChange` receives the text, as on the web, and the `TextInput`'s `onChangeText` still works |
| `InputGroup` | ✔ translates | `prefix`, `suffix` and `actions` are props and the frame draws the field itself; no `size` |
| `Item` | ✔ translates | `title`, `description`, `media` and `actions` as props; ellipsis truncation is `numberOfLines`, which there is a prop and not a class |
| `Kanban` | ✕ does not port | the board is a desktop idiom: at 390px one column fits, and taking the card to another is a "Mover para" menu, not a drag |
| `Kbd` | ✕ does not port | there is no keyboard to draw |
| `Link` | ✔ translates | `Text` with `accessibilityRole="link"`; a tap opens the `href` through `Linking`, and `onPress` takes the place of the web's `render`, for the router |
| `MaskedInput` | ✔ translates | the same masks as the web (`cpf`, `cnpj`, `moeda`, the `9` of a hand-written mask); the value arrives clean, and the masked text comes in the second argument of `onValueChange` |
| `Menu` | ✔ translates | bottom sheet with `actions`, never an anchored popup; `children` opens on long press; `classNames` with `trigger`, `content` and `item` |
| `Menubar` | ✕ does not port | a desktop idiom; native navigation is the router's tab bar and drawer |
| `Message` | ✔ translates | lives in `@rivocode/ui-native/ai`; `onCopy` in place of `copyValue`, because copying needs `expo-clipboard`, which lives on another path |
| `Meter` | ✔ translates | `format` as on the web, and ready-made text in `valueLabel` when the measure already comes written; the bar moves to the new value |
| `NavigationMenu` | ✕ does not port | a desktop idiom; native navigation is the router's tab bar and drawer |
| `NotificationCenter` | ✔ translates | the list opens in a `Sheet`; `open` is controlled, the bell comes in through `icon`, and the row calls `onItemPress` in place of `href` |
| `NumberField` | ✔ translates | becomes a stepper (minus, value, plus), which is the touch idiom; `min` starts at 0, not unbounded as on the web |
| `OTPField` | ✔ translates | visible boxes, one hidden field: keyboard, SMS autofill and screen reader see just one; the digit grows in; `label` names the field |
| `PageHeader` | ✔ translates | `title`, `description`, `badge` and `actions` as props; `classNames` with the web's five parts |
| `Pagination` | ✕ does not port | a phone list scrolls; choosing the page number is a desktop gesture |
| `PasswordInput` | ✔ translates | the button changes its name with the state (`labels.show`/`labels.hide`), and leaving the field hides it again; `classNames` with `wrapper`, `input` and `action` |
| `PixCode` | ✔ translates | lives in `@rivocode/ui-native/chart`, alongside `QRCode`; copying comes in through `renderCopy`, because `Clipboard` lives on another path |
| `Popconfirm` | ✔ becomes `AlertDialog` | becomes `AlertDialog`; on the phone confirmation is modal and does NOT cancel on a tap outside |
| `Popover` | ✕ does not port | an anchored panel the finger itself covers: use `Sheet` |
| `PostalCodeField` | ✔ translates | the same `lookup` and the same four endings; the value is the digits, without punctuation |
| `PreviewCard` | ✕ does not port | it appears on resting the pointer, and there is no resting on touch |
| `Progress` | ✔ translates | `value` from 0 to 100 and `label`; `showValue` and `format` as on the web; the bar moves to the new value; `classNames` with the web's four parts |
| `PromptInput` | ✔ translates | lives in `@rivocode/ui-native/ai`; controlled (`value` and `onValueChange` required), and submitting is only through the button, because the phone keyboard's return key breaks the line |
| `QRCode` | ✔ translates | lives in `@rivocode/ui-native/chart`, because it draws with `react-native-svg`; the encoder is the same, the ink and the paper are fixed, and only the `logo` is styled by part |
| `QueryBoundary` | ✔ translates | same names and same order; text becomes `string`, and `classNames` with `loading`, `error` and `empty` |
| `Questionnaire` | ✔ translates | controlled, with the questions through `items` (`single`, `multiple`, `text`); the same states and the same texts, no keyboard shortcut |
| `RadioGroup` | ✔ translates | `items` on the root; there is no standalone `Radio`; `label` names the group, in place of the web's `aria-label`; the dot grows in |
| `Rating` | ✔ translates | a single adjustable control for the screen reader, with a controlled `value`; each star has a 44pt target, and the icon comes in as a function |
| `RelativeTime` | ✔ translates | the clock ports, with a step per unit and a redo when returning from the background; without `Intl`, the text is always numeric |
| `ResizablePanelGroup` | ✕ does not port | a panel you drag to split the width is a desktop idiom; on the phone each area is a router screen, or a sheet on top |
| `RichTextEditor` | ✕ does not port | editing formatted text on touch is another engine (WebView or a native library, with a native module peer) and the toolbar is a desktop surface; the phone writes with `Textarea` and reads what the web saved with `RichTextView` |
| `RichTextView` | ✔ translates | in the main index, with no `WebView` and no peer: the same reader as the web builds each block as a `View` and each mark as a `Text`, and a link opens through `Linking` |
| `RivoProvider` | ✔ translates | `theme` switches at runtime only between the two house themes, and a client theme is a BUILD decision; `density` does not exist: a touch target does not shrink, and `comfortable` is the only height; and it gains `fonts`, which the web does not have |
| `ScrollArea` | ✔ translates | the scroll bar is still the system's; what the piece brings on the phone is the keyboard: it scrolls to the focused field and pins a `footer` that rises with it |
| `ScrollToTop` | ✕ does not port | the platform already provides it: tapping the status bar on iOS and tapping the router's tab again scroll the list up |
| `SearchInput` | ✔ translates | `value` and `onValueChange` required |
| `Select` | ✔ translates | few fixed options; `items` and `label` on the root, and the list opens in a bottom sheet, in sections when `items` comes in groups |
| `Separator` | ✔ translates | only the horizontal line |
| `Sheet` | ✔ translates | only the bottom behavior, which was already the web's narrow mode; it slides up, and with no transition when the system asks to reduce motion; with a field inside, the sheet rises along with the keyboard |
| `Sidebar` | ✕ does not port | a desktop idiom; native navigation is the router's tab bar and drawer |
| `SignaturePad` | ✔ translates | lives in `@rivocode/ui-native/chart`, because it draws with `react-native-svg`; the stroke is the same file as the web, the gesture is `PanResponder`, and PNG is left out because there is no canvas |
| `Skeleton` | ✔ translates | same placeholder, same token, and the same 2 s pulse; still with reduce motion |
| `Slider` | ✔ translates | moves by gesture and responds to screen reader actions; a single value, `label` required, and `showValue` and `format` as on the web; `classNames` with the web's six parts |
| `SortableList` | ✔ translates | lives in `@rivocode/ui-native/dnd`, with no peer: the gesture is the core's `PanResponder`, and only the handle drags; the screen reader moves through actions, one step at a time |
| `Sparkline` | ✔ translates | `line` and `bar` work on both sides; `area` is left out (it needs a filled polygon, and the native drawing is `View`) |
| `Spinner` | ✔ translates | `sm`, `md` and `lg` and the same `label`; `sm` and `md` are the small spin of the `ActivityIndicator` |
| `Splitter` | ✕ does not port | two areas side by side do not fit on a narrow screen; on the phone the list and the detail are two router screens |
| `Spoiler` | ✔ translates | the same `maxHeight`, `open` and `labels`; the fade is painted in the `fadeOver` color, because there is no mask |
| `Stack` | ✔ translates | same props, minus `render`; the gap is the comfortable scale, because on touch there is no compact density |
| `Stat` | ✔ translates | `value` already formatted, a numeric `delta` written by the web's `deltaFormat`, and the `chart` slot that the native `Sparkline` fills |
| `Steps` | ✔ translates | only the web's narrow mode (text and bar), and so no `onStepChange`; `useWizard()` crosses over whole; the bar moves and the new step fades in |
| `Switch` | ✔ translates | `checked` and `onCheckedChange` required; the track is the system's, painted by token, and the thumb slides with the platform's own animation; `label` is the spoken name, required without `children`; `classNames` only with `label`, because the thumb belongs to the platform |
| `Table` | ✕ does not port | there is no table on the phone; the query becomes `DataList` |
| `TableOfContents` | ✕ does not port | an app screen has no side index: long text on the phone becomes sections in a list that opens each one, or `Tabs` |
| `Tabs` | ✔ translates | only the segmented box, through `items`; page sections are the native router's job; the active tab's background slides between the tabs |
| `TagsInput` | ✔ translates | Enter and a typed separator close the chip; Backspace on an empty field does not port; a new chip grows in and a removed one fades out |
| `Text` | ✔ translates | the same `Text` the other pieces wear, with `size`, `tone`, `weight`, `truncate` and `lineClamp`; without them, it inherits from the outer `Text` |
| `Textarea` | ✔ translates | `rows` is the initial height and the field grows; `onValueChange` receives the text, as on the web and in `Input` |
| `TimeField` | ✔ translates | types with a mask and a numeric keyboard; the arrows become two step buttons, in the `NumberField` mold |
| `TimePicker` | ✔ translates | trigger plus bottom sheet with two columns; it does NOT embed the TimeField, unlike the web |
| `Timeline` | ✔ translates | the events come through `items`, with `tone` and `pending` on each; `at` is ready-made text, and each event is a single screen reader stop, with the position written in the label |
| `ToastViewport` | ✔ becomes `useToast` | nothing is mounted: the `RivoProvider` already brings the wiring, and the hook is the same, with the four functions: `add` returns the `id`, `type` picks the tone in the `Alert`'s vocabulary, `timeout: 0` keeps the toast until `close(id)`, and `update` and `promise` rewrite the toast that is on screen. Here `title` and `description` are `string`, because the toast is read aloud, and there is no x: the toast does not receive touches, so one that stays leaves through `close`. Without `timeout`, it leaves after 4 seconds, not the web's 5. The web's `actionProps`, which puts the undo inside the toast, does not exist here for the same reason as the x: the toast does not receive touches, and undo on the phone lives on the screen itself. The toast slides up and down with the web's durations, and appears still when the system asks to reduce motion |
| `Toggle` | ✔ translates | `pressed` and `onPressedChange` |
| `ToggleGroup` | ✔ translates | `items` on the root; `multiple` for several, the same name and the same meaning as the web |
| `ToolCall` | ✔ translates | lives in `@rivocode/ui-native/ai`; the same five states with mark and text, input and output in mono font, and approve and reject outside the panel |
| `Toolbar` | ✕ does not port | a desktop editing surface: a single tab stop and arrow navigation, which touch does not have |
| `Tooltip` | ✕ does not port | hover does not exist on touch; the label needs to be on the screen |
| `Tour` | ✔ translates | built on `Modal` and `measureInWindow`, with the target by ref; the bubble is always a sheet, which moves to the top when the target is below, the step is controlled and there is no `interactive` |
| `Tracker` | ✔ translates | the whole strip is a single target: the finger drags and the period being read appears on the line below; each point's `label` is `string` |
| `TransferList` | ✔ translates | the two lists stack, each with its own move buttons; the same `items`, `value` and `labels` |
| `Tree` | ✔ translates | one level at a time, stacked: tapping a branch pushes the inner level and the header shows the path and goes back; no indentation, no search |
| `TreeSelect` | ✔ translates | the `Tree` inside a sheet, with the draft count and `Aplicar` in the footer; leaving through the side gives up |
| `VirtualList` | ✕ does not port | the platform already virtualizes: `FlatList` and `FlashList` do this out of the box |

## How this table is kept

The table above and the **"In React Native"** section of each piece page come
from the same source, `scripts/native-parity.ts`:

```sh
bun run scripts/native-parity.ts            # rewrites both
bun run scripts/native-parity.ts --check    # only checks
```

`--check` fails when a new catalog piece has no row, when a row promises an
import that comes out of no index of the native package
(`native/src/index.ts`, `native/src/form/index.ts` and
`native/src/chart/index.ts`), and when a piece marked `○ na fila` **has
already been ported**, which is the silent case: the docs keep telling people
to use the substitute after the real piece has arrived. Ported a new piece to
native? Run the script and commit what it rewrites.

### The field comes from the data, as on the web

The table in [components.md](components.md) holds here with the same names:
`MaskedInput` with `mask="cpf"`, `"cnpj"`, `"telefone"`, `"placa"`, `"cartao"`
and `"boleto"`, `PostalCodeField`, `OTPField`, `CurrencyInput`, `DatePicker`,
`TimeField` and `NumberField` exist in `@rivocode/ui-native`, and the
validators (`isValidCpf`, `isValidCnpj`, `isValidPlate`, `isValidPixKey`) are
the same file on both sides. The keyboard already comes from the piece:
`MaskedInput` opens the numeric one when the pattern has only digits, and
`OTPField` and `PostalCodeField` already ask for the system's autofill
(`sms-otp`, `postal-code`). On the phone and card `MaskedInput`, pass React
Native's `autoComplete`: `tel` and `cc-number`.

## The keyboard is already handled

`react-native-keyboard-controller` is a required peer, and its
`KeyboardProvider` lives inside `RivoProvider`: do not mount another one (if the
app already had one outside, the provider reuses it). A screen with a field is
`ScrollArea`, which scrolls to the focused field; the submit action goes in the
`footer`, which rises with the keyboard and counts in where the field stops:

```tsx
<ScrollArea
  contentContainerClassName="gap-4 p-5"
  footer={<Button onPress={emitir}>Emitir nota</Button>}
>
  <Field label="Descrição">…</Field>
</ScrollArea>
```

`ScrollArea` takes the parent's height (`flex-1`), so the parent needs to have
a height. `react-native-safe-area-context`'s `SafeAreaView` is a third-party
component and **ignores `className`**: `<SafeAreaView className="flex-1">`
ends up without height, the scrolling disappears and the `footer` rises to the
top of the screen. Use `<SafeAreaView style={{ flex: 1 }}>`.

`Sheet` and `Dialog` (and what opens as a sheet: `Select`, `Combobox`, `Menu`,
`DatePicker`, `TimePicker`, `TreeSelect`) rise with the keyboard on their own.
With "reduce motion" on, the sheet and the footer jump to the final place
instead of following the keyboard.

## What never to do on native

- React Native's `KeyboardAvoidingView` or Reanimated's `useAnimatedKeyboard`
  around the pieces: the keyboard is already accounted for by them, and the
  second accounting pushes the screen twice. `useAnimatedKeyboard` is also
  deprecated in Reanimated 4.

- A class with an arbitrary var (`h-[--rc-control-md]`) or `translate-*`: the
  current react-native-css compiler tolerates neither a live var nor the
  `translate` shorthand. Control height is fixed per size until the upstream
  fix.
- Removing the modern `browserslist` from the app's `package.json`: without it,
  Expo's web pass rewrites the tokens' `light-dark()` into a var polyfill that
  kills compilation. It is what holds up the switch between the two house
  themes: `RivoProvider` accepts `rivocode-dark`, `rivocode-light` and
  `system`, and changing the prop switches the whole screen through
  `Appearance.setColorScheme()`.
- Promising a runtime client theme, or writing `theme={{ light, dark }}` in the
  prop: the object is no longer accepted, and it never dressed the whole
  screen. Class color is build time, and the path is in the theme section
  above.
- Writing `density` on a native screen: the prop **does not exist** in the
  package. A touch target does not shrink on a finger screen, and
  `comfortable` is the only height.
- A text glyph as a state icon (the Checkbox tick is a rotated border, because
  the font changes size between iOS and Android).
- Forgetting `accessibilityRole`/`accessibilityState` on a custom control.
- Aligning `TextInput` text by class **or** by prop: both fail, each in its own
  way. `text-center` becomes a prop at runtime and the app breaks with
  `path.split is not a function`; the `textAlign` prop is not in
  react-native-web's `forwardPropsList` and is silently discarded, so the field
  is born left-aligned on the web target. The path both targets read is
  `style={{ textAlign: "center" }}`. The same goes for logical shorthands
  (`border-x` generates `border-inline`, which does not exist there): write
  `border-l border-r`.
- Tailwind's divider utility (the one for borders between children): the child
  selector does not exist in RN. `DescriptionList` interposes borders through
  `Children`.
- Writing a class name in a comment: Tailwind's scanner reads raw source and
  generates the class. That is how a word in a comment brought down the build.
