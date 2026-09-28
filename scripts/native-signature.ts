/**
 * The signature of each piece in both packages, written once and checked.
 *
 * `check:parity` answers "does it exist on native?" and stops there. Whoever
 * ports a screen is already past that question: they know `Meter` exists, and
 * what eats the afternoon is finding out, one piece at a time, that `format`
 * was called `valueLabel` there, that `Timeline`'s `at` stopped accepting
 * `RelativeTime`, and that `MaskedInput`'s mask switches from `9` to `#`.
 *
 * None of those six cases was written down anywhere when they were measured,
 * on 2026-08-28, and all six break `tsc` at porting time. A compile error
 * finds the defect; it does not say what to write instead. This table does.
 *
 * ## What the guard measures, and what it does not
 *
 * The judgment - which web prop corresponds to which native prop - is human:
 * no cross-check of types finds out that `format` and `valueLabel` are the
 * same intent. What the machine checks is whether the row still describes the
 * code:
 *
 * 1. A prop cited on one side has to EXIST on that side.
 * 2. A row that says "web only" has to have the prop ABSENT on native, and
 *    vice versa. Without this the table would keep telling people to rewrite
 *    a call that already ports.
 * 3. A row with the same name on both sides has to have a DIFFERENT
 *    signature - by type or by requiredness. A row describing a divergence
 *    that ended is noise, and noise is the beginning of a table nobody reads.
 * 4. Every variant that exists on one side only - a same-name prop whose
 *    literals diverge - has to have a row. That is what caught `Spinner`,
 *    which nobody had cited: the web speaks `sm`/`md`/`lg` and native speaks
 *    `small`/`large`.
 * 5. Every web `classNames` that does not cross over whole - the piece exists
 *    on native and the prop is missing there, or the set of parts is
 *    different - has to have a `classNames` row, and the note has to name
 *    each missing part. Born on 2026-09-25: twenty native pieces were missing
 *    the web's `classNames` and no row said so, because the guard only
 *    demanded variant coverage. Whoever ported the screen wrote
 *    `classNames={{ indicator }}` and found out from `tsc`.
 *
 * Rules 4 and 5 are the divergence families that derive themselves, and
 * therefore the only ones whose COVERAGE the guard demands.
 *
 * What is left out, on purpose: a prop with a different name that nobody
 * declared here. Deriving that would be guessing intent, and the result would
 * be an exception list the size of the catalog - common pieces diverge on
 * almost every prop, because `defaultValue`, `render` and the web's
 * uncontrolled half simply do not exist on touch. Those general rules are
 * already in the page's prose; the table is for what remains.
 *
 * ## Where the two sides come from
 *
 * `apps/docs/src/component-props.json` (web) and
 * `apps/docs/src/native-props.json` (native), both generated from the
 * compiler and committed. The native one needs `examples/native` installed to
 * be GENERATED, and that is why it is an artifact: this way the check costs
 * two `JSON.parse` calls and fits in the gate. The header of
 * `scripts/native-catalog-props.ts` explains why it cannot be generated on
 * the spot.
 *
 * One limit inherited from the web catalog, worth knowing before writing a
 * row: `children`, `className`, `style` and `id` never appear there, and
 * neither does an own prop that has the same name as a DOM attribute - the
 * `Clipboard`'s `value` is required and is not in the JSON. A prop like that
 * cannot serve as an anchor, and the row is written from the other end.
 *
 * Run again:
 *
 *   bun run gen:signature            writes the section in native.md
 *   bun run check:signature          only checks, for the gate
 */
import { readFileSync, writeFileSync } from "node:fs";

import { countAtLeast } from "./scan";

const WEB_CATALOG = "apps/docs/src/component-props.json";
const NATIVE_CATALOG = "apps/docs/src/native-props.json";
const GUIDE = ".claude/skills/rivocode-ui/reference/native.md";
const SECTION_TITLE = "## The signature, prop by prop";

export type Row = {
  /**
   * The prop on the web, or `null` when the data does not come in through a
   * prop of that name there - composition, a child, or the element's raw
   * attribute.
   */
  web: string | null;
  /** The prop on native, or `null` when it does not exist there. */
  native: string | null;
  /** The table cell: one line, lowercase, no final period. */
  note: string;
};

export type Signature = {
  /** The piece's name on native, when it changes name. */
  nativePiece?: string;
  rows: Row[];
};

export type Prop = { name: string; type: string; required: boolean };
export type Catalog = Record<string, { props: Prop[] }>;

/* --------------------------------------------------------------------------
 * The judgment
 * ----------------------------------------------------------------------- */

export const SIGNATURES: Record<string, Signature> = {
  Alert: {
    rows: [
      {
        web: null,
        native: "title",
        note: "the title becomes a prop; on the web it is `AlertTitle` as a child",
      },
    ],
  },
  ActionBar: {
    rows: [
      {
        web: "position",
        native: null,
        note: "there is no `sticky` or `fixed`: the bar is always `absolute` over the list, at the foot of the screen",
      },
      {
        web: null,
        native: "bottomInset",
        note: "the bottom safe area comes in as a number, `useSafeAreaInsets().bottom`, because the package does not depend on `react-native-safe-area-context`",
      },
      {
        web: "finalFocus",
        native: null,
        note: "on touch there is no keyboard focus to give back when the bar leaves",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "no `actions`: the actions are direct children of the panel, and `className` styles the same panel as `bar`",
      },
    ],
  },
  AlertDialog: {
    rows: [
      {
        web: null,
        native: "title",
        note: "`title` and `description` become required props, in place of `AlertDialogTitle` and `AlertDialogDescription`",
      },
      {
        web: null,
        native: "onConfirm",
        note: "the confirming button is `onConfirm` plus `labels.confirm`, not an `AlertDialogClose` in the footer",
      },
      {
        web: "open",
        native: "open",
        note: "`open` and `onOpenChange` are required, and it does not close on a tap outside",
      },
    ],
  },
  Accordion: {
    rows: [
      { web: null, native: "children", note: "the root only stacks; the item is what has props" },
    ],
  },
  Autocomplete: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` and `onValueChange` are required, and the value is always the text (`string`)",
      },
      {
        web: "mode",
        native: null,
        note: "there is no inline completion: the sheet filters the suggestions and the person taps or keeps typing",
      },
      {
        web: null,
        native: "label",
        note: "the field's name becomes a required prop, and it is the sheet's title; on the web it is the `AutocompleteInput`'s `aria-label`",
      },
    ],
  },
  Avatar: {
    rows: [
      {
        web: "fallback",
        native: "fallback",
        note: "becomes required: it is what takes the place while the photo downloads, and it is what comes back if the photo fails",
      },
    ],
  },
  Banner: {
    rows: [
      {
        web: "description",
        native: "description",
        note: "`title` and `description` become `string`: text on native lives inside a `Text`",
      },
      {
        web: "icon",
        native: "icon",
        note: "no default icon, because the package ships no icons; the function receives the tone's color and the size",
      },
    ],
  },
  Button: {
    rows: [
      {
        web: "size",
        native: "size",
        note: "`xl` does not port: native has `sm`, `md` and `lg`, and `lg` is already the call to action on touch. An icon-only button is `IconButton` on both sides",
      },
      {
        web: "shape",
        native: null,
        note: "no pill: the radius is the token's, the same on every button",
      },
    ],
  },
  Spoiler: {
    rows: [
      {
        web: null,
        native: "fadeOver",
        note: "the fade is painted in the color of the background the block sits on, because touch has no mask",
      },
    ],
  },
  Tour: {
    rows: [
      {
        web: "open",
        native: "open",
        note: "becomes required, with `onOpenChange`: there is no `defaultOpen`",
      },
      {
        web: "step",
        native: "step",
        note: "becomes required, with `onStepChange`: there is no `defaultStep`, and `onStepChange` is where the screen scrolls to the target",
      },
      {
        web: "interactive",
        native: null,
        note: "the `Modal` is another window, and a tap does not pass through the cutout to the target",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "no `spotlight`: the cutout is the gap between the four `mask` bands, not a node",
      },
    ],
  },
  ImageViewer: {
    rows: [
      {
        web: "index",
        native: "index",
        note: "becomes required, with `onIndexChange`: there is no `defaultIndex`, and `null` is closed",
      },
    ],
  },
  IconButton: {
    rows: [
      {
        web: "shape",
        native: null,
        note: "no pill: the radius is the token's, the same on every button",
      },
      {
        web: "tooltip",
        native: null,
        note: "on touch there is no hovering; an icon that does not read on its own calls for a `Button` with text",
      },
      { web: "tooltipSide", native: null, note: "goes away along with `tooltip`" },
    ],
  },
  Carousel: {
    rows: [
      {
        web: null,
        native: "items",
        note: "the slides come through `items` and `renderItem`, not as children",
      },
      {
        web: "index",
        native: "index",
        note: "becomes required, with `onIndexChange`: there is no `defaultIndex`",
      },
      {
        web: "slidesPerView",
        native: "slidesPerView",
        note: 'number only: the per-width object and `"auto"` do not port',
      },
      {
        web: "autoplay",
        native: null,
        note: "on touch a row that moves on its own fights the finger; there is no rotation and no pause",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "no `pause`, because there is no `autoplay`",
      },
    ],
  },
  Calendar: {
    rows: [
      {
        web: "mode",
        native: null,
        note: "single date only, which on the web is the path without `mode`: a range is `DateRangePicker`, and multiple loose dates do not port",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "the `DayPicker` names, only those that have a node in the hand-drawn month: no `months`, `month`, `month_caption`, `week`, `outside`, `hidden`, the range `range_*` ones or the animation ones",
      },
    ],
  },
  ChartGauge: {
    rows: [
      {
        web: "classNames",
        native: "classNames",
        note: "no `arc`: the arc is a stroke inside the `Svg`, and `react-native-svg` does not take classes",
      },
    ],
  },
  ChartContainer: {
    rows: [
      {
        web: null,
        native: "children",
        note: "`children` is a function and receives `{ width, height, colors }`: there is no `ResponsiveContainer` to measure for you, and the measurement arrives zeroed on the first frame",
      },
      {
        web: "empty",
        native: "empty",
        note: "the empty state's `title` and `description` are `string`, not `ReactNode`; `icon` crosses over, and also accepts the native `EmptyState`'s function",
      },
      {
        web: "errorTitle",
        native: "errorTitle",
        note: "`errorTitle` and `errorMessage` become `string`",
      },
    ],
  },
  ChartDonut: {
    rows: [
      {
        web: "centerValue",
        native: "centerValue",
        note: "`centerValue` and `centerLabel` become `string`",
      },
    ],
  },
  ChartRadial: {
    rows: [
      {
        web: "color",
        native: "color",
        note: "on the web it is any CSS color; on native it is a token role (`chart-1`…`chart-8`), otherwise the piece is deaf to the theme",
      },
    ],
  },
  Checkbox: {
    rows: [
      {
        web: "parent",
        native: null,
        note: "a group's parent is assembled by hand, with `indeterminate` and the children's state: the native `CheckboxGroup` has no `allValues`",
      },
      {
        web: null,
        native: "label",
        note: "the spoken name is `label`, in place of `aria-label`; without `children` it is required, and the type rejects a box with neither",
      },
    ],
  },
  Clipboard: {
    rows: [
      {
        web: null,
        native: "toast",
        note: "the spoken toast comes along and `toast={false}` turns it off: a label changed under the finger is not re-announced",
      },
    ],
  },
  QRCode: {
    rows: [
      {
        web: "classNames",
        native: "classNames",
        note: "only `logo`: `code` is the `Svg`, and `react-native-svg` does not take classes",
      },
    ],
  },
  PixCode: {
    rows: [
      {
        web: null,
        native: "renderCopy",
        note: "the copy button comes from `@rivocode/ui-native/clipboard` through a function; on the web it is already inside, and that is why the `PixCodeLabels` here has no `copy` or `copied`",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "no `copy`: the button is what `renderCopy` returns, and whoever writes it styles it",
      },
    ],
  },
  Code: {
    rows: [
      {
        web: null,
        native: "children",
        note: "`children` is `string`, not `ReactNode`: the snippet is text",
      },
    ],
  },
  Collapsible: {
    rows: [
      {
        web: null,
        native: "label",
        note: "the header becomes `label`, in place of `CollapsibleTrigger` and `CollapsiblePanel`",
      },
    ],
  },
  ColorPicker: {
    rows: [
      {
        web: "label",
        native: "label",
        note: "`label` is `string`: no `ReactNode`, as in every native piece",
      },
    ],
  },
  Combobox: {
    rows: [
      {
        web: "items",
        native: "items",
        note: "`items` on the root and required, flat or in `{ label, items }` groups; no `ComboboxItem` per child",
      },
      {
        web: null,
        native: "label",
        note: "`label` is required: it is what the screen reader announces, in place of `aria-label`",
      },
      {
        web: null,
        native: "searchPlaceholder",
        note: "the sheet has its own search; `emptyMessage` is the empty list text",
      },
      {
        web: "filter",
        native: null,
        note: "the filter belongs to the piece and ignores accents; it cannot be swapped",
      },
    ],
  },
  ContextMenu: {
    nativePiece: "Menu",
    rows: [
      {
        web: null,
        native: "children",
        note: "`ContextMenuTrigger` becomes the `Menu`'s `children`, and the gesture is the long press, not the right click",
      },
      {
        web: null,
        native: "actions",
        note: "the items become `actions`, in place of a `MenuItem` per child, and the sheet rises from the bottom",
      },
      {
        web: null,
        native: "title",
        note: "the sheet has a required header: with no anchoring, it is what says what the menu is about",
      },
      {
        web: "open",
        native: "open",
        note: "`open` and `onOpenChange` are required, and `defaultOpen` does not exist",
      },
    ],
  },
  DataTable: {
    nativePiece: "DataList",
    rows: [
      {
        web: "columns",
        native: "renderItem",
        note: "there are no columns: `renderItem` draws the whole row",
      },
      { web: "rowKey", native: "keyExtractor", note: "same role, React Native's name" },
      { web: "onRowClick", native: "onRowPress", note: "same role, the touch name" },
      {
        web: "labels",
        native: "labels",
        note: "only `retry` and `selectRow`: with no pages and no header, there is no `selectAll`, `range`, `pagination`, `loading` or `loaded`",
      },
      {
        web: "pageSize",
        native: null,
        note: "a phone list scrolls: no pages, and `virtual`, `rowHeight` and `maxHeight` go away with it",
      },
      {
        web: null,
        native: "filterValue",
        note: "`filter` only searches what this function returns, because there is no column to take text from",
      },
      {
        web: "classNames",
        native: null,
        note: "the row is what `renderItem` returns, and whoever writes it styles it: there is no `table`, `head` or `cell`",
      },
    ],
  },
  DatePicker: {
    rows: [
      {
        web: "disabledDays",
        native: null,
        note: "an individual blocked day does not port: the range is `min`/`max`",
      },
      {
        web: "confirm",
        native: null,
        note: "the sheet always confirms: choosing already closes it",
      },
      {
        web: null,
        native: "label",
        note: "`label` is required, and the field does not live inside a `Field`",
      },
    ],
  },
  DateRangePicker: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` and `onValueChange` are required and ISO only: the web's `IsoDateRange`, which here is called `DateRange`; the contract is the same, a closed range or `null`",
      },
      { web: "numberOfMonths", native: null, note: "one month per sheet, always" },
      {
        web: "confirm",
        native: null,
        note: "the sheet always confirms: a tap outside it is giving up",
      },
    ],
  },
  DescriptionItem: {
    rows: [
      { web: "label", native: "label", note: "`label` is `string`, and the body is still a child" },
    ],
  },
  Dialog: {
    rows: [
      {
        web: null,
        native: "title",
        note: "`title` is a required prop and `description` is a prop: no `DialogTitle` and no `DialogTrigger`",
      },
      {
        web: "open",
        native: "open",
        note: "`open` and `onOpenChange` are required: the caller is the one who opens it",
      },
    ],
  },
  Editable: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` and `onValueChange` required; a long press opens it, and there is a visible `Cancelar`",
      },
    ],
  },
  EmptyState: {
    rows: [
      { web: "title", native: "title", note: "`title` and `description` are `string`" },
      {
        web: "icon",
        native: "icon",
        note: "also accepts a function that receives `color` and `size`, because color does not flow down from the `View` to the SVG",
      },
    ],
  },
  Field: {
    rows: [
      {
        web: null,
        native: "label",
        note: "`label`, `description` and `error` become props: no `FieldLabel`, `FieldDescription` and `FieldError`",
      },
    ],
  },
  Fieldset: {
    rows: [
      {
        web: null,
        native: "legend",
        note: "`legend` becomes a required prop, in place of `FieldsetLegend`",
      },
    ],
  },
  FileUpload: {
    rows: [
      {
        web: "onSelect",
        native: "onSelect",
        note: "what comes back is a `PickedFile` with a local `uri`, not a `File`: `size` may be missing",
      },
      {
        web: "accept",
        native: "accept",
        note: "accepts a list, and speaks MIME: it is what the system picker knows how to filter",
      },
      {
        web: "label",
        native: "label",
        note: "`label` and `hint` are `string`, and the drop area becomes a button",
      },
    ],
  },
  FilterBar: {
    rows: [
      {
        web: "labels",
        native: "labels",
        note: "`labels.empty` is `string`, and `labels.scroll` does not exist: the list is what scrolls",
      },
    ],
  },
  FilterChip: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` is `string`: the pill does not take an element",
      },
    ],
  },
  Form: {
    rows: [
      {
        web: null,
        native: "children",
        note: '`children` is a function and receives `{ submit, isSubmitting }`: nothing submits on its own, because there is no `<form>` or `type="submit"`',
      },
    ],
  },
  FormField: {
    rows: [
      {
        web: "label",
        native: "label",
        note: "`label` becomes required and is `string`: it is what becomes `accessibilityLabel` on the control",
      },
      { web: "description", native: "description", note: "`description` is `string`" },
    ],
  },
  NotificationCenter: {
    rows: [
      {
        web: "open",
        native: "open",
        note: "becomes required, with `onOpenChange`: there is no `defaultOpen`",
      },
      {
        web: null,
        native: "icon",
        note: "the bell comes in through `icon`, required, because the package ships no icons; the function receives the button's color",
      },
      {
        web: "onItemClick",
        native: "onItemPress",
        note: "the row is not a link: with no `href` on the item, the router navigates from the item received",
      },
      {
        web: "defaultFilter",
        native: null,
        note: "the filter starts at `all`; `filter` with `onFilterChange` controls it",
      },
      {
        web: "align",
        native: null,
        note: "the list is always a bottom sheet, not a panel anchored to the bell",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "no `footer`: “Carregar mais” sits directly in the sheet",
      },
    ],
  },
  Indicator: {
    rows: [
      {
        web: "label",
        native: "label",
        note: "`label` becomes required: the pill is a single screen reader stop, and what it says is the sentence",
      },
    ],
  },
  Input: {
    rows: [
      { web: null, native: "font", note: "picks the font role, which the web resolves by class" },
    ],
  },
  InputGroup: {
    rows: [
      {
        web: null,
        native: "prefix",
        note: "`prefix`, `suffix` and `actions` become props: no `InputPrefix`, `InputSuffix` and `InputAction`",
      },
      {
        web: null,
        native: "value",
        note: "the frame draws the field itself: `value` and `onValueChange` belong to it, not to an `Input` inside",
      },
      {
        web: null,
        native: "classNames",
        note: "the parts that are pieces on the web are styled through `classNames`, with their names: `input`, `prefix`, `suffix` and `action`",
      },
    ],
  },
  Item: {
    rows: [
      {
        web: null,
        native: "title",
        note: "`title`, `description`, `media` and `actions` become props: no `ItemTitle`, `ItemDescription` and `ItemMedia`",
      },
      {
        web: "interactive",
        native: "onPress",
        note: "`onPress` is what makes the row tappable, not a boolean",
      },
    ],
  },
  Link: {
    rows: [
      {
        web: "render",
        native: "onPress",
        note: 'the router link comes in through a callback, `onPress={() => router.push("/notas")}`: there is no anchor to swap',
      },
      {
        web: "underline",
        native: null,
        note: "the underline is fixed: with no pointer, there is no `hover`",
      },
    ],
  },
  Text: {
    rows: [
      {
        web: "render",
        native: null,
        note: "the element is always `Text`; a block is a `View` around it",
      },
      { web: null, native: "font", note: "picks the font role, which the web resolves by class" },
    ],
  },
  MaskedInput: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "on the web `value` is the text WITH the mask; on native it is only the digits, and the mask belongs to the field",
      },
    ],
  },
  Questionnaire: {
    rows: [
      {
        web: null,
        native: "items",
        note: "the questions come through `items`, with `type` `single`, `multiple` or `text`, in place of `QuestionnaireItem` and the parts as children",
      },
      {
        web: "item",
        native: "item",
        note: "becomes required: the open question is always controlled, together with `onItemChange`",
      },
      { web: "defaultItem", native: null, note: "there is no internal open-question state" },
      {
        web: null,
        native: "value",
        note: "the answers are controlled; on the web they live in the form's `<input>`s",
      },
      {
        web: "onSubmit",
        native: "onSubmit",
        note: "becomes required and receives only the answers: there is no `FormData` outside the browser",
      },
      {
        web: "shortcuts",
        native: null,
        note: "with no physical keyboard, there is no letter or number shortcut",
      },
      {
        web: null,
        native: "onStatusChange",
        note: "a single one on the root, with the question's `name`; on the web it belongs to each `QuestionnaireItem`",
      },
    ],
  },
  CurrencyInput: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "becomes required, with `onValueChange`: there is no `defaultValue`",
      },
    ],
  },
  PostalCodeField: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "becomes required and is only the digits; on the web it accepts the masked text",
      },
      {
        web: "defaultValue",
        native: null,
        note: "there is no internal state: the field is controlled",
      },
    ],
  },
  Menu: {
    rows: [
      {
        web: null,
        native: "actions",
        note: "the items become `actions`, in place of a `MenuItem` per child, and the sheet rises from the bottom",
      },
      {
        web: null,
        native: "title",
        note: "the sheet has a required header: with no anchoring, it is what says what the menu is about",
      },
      {
        web: null,
        native: "children",
        note: "there is no `MenuTrigger`: `children` is the area that opens on long press, and the three-dot button is yours",
      },
      {
        web: "open",
        native: "open",
        note: "`open` and `onOpenChange` are required, and `defaultOpen` does not exist",
      },
      {
        web: null,
        native: "classNames",
        note: "what on the web is `MenuTrigger`, `MenuContent` and `MenuItem` is styled through `classNames`: `trigger`, `content` and `item`",
      },
    ],
  },
  Meter: {
    rows: [{ web: "label", native: "label", note: "`label` becomes required and is `string`" }],
  },
  NumberField: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` is `number` and never `null`: the stepper always has a number, and `min` starts at 0 because the iPhone's numeric keyboard has no minus sign",
      },
      { web: "step", native: "step", note: 'no `"any"`: the stepper\'s step is a number' },
      {
        web: null,
        native: "label",
        note: "`label` is required: it is what names the two step buttons",
      },
    ],
  },
  OTPField: {
    rows: [
      {
        web: "mask",
        native: null,
        note: "no hiding the digit, and no `autoSubmit`, `normalizeValue` or `validationType`",
      },
      {
        web: null,
        native: "label",
        note: "the spoken name is `label`, in place of `aria-label`; without it, the reader says how many digits the code has",
      },
    ],
  },
  PageHeader: {
    rows: [
      { web: "breadcrumb", native: null, note: "the way back is the router's back button" },
      { web: null, native: "badge", note: "the pill next to the title becomes a prop" },
      {
        web: "titleAs",
        native: null,
        note: "there is no heading level: the header is a single screen reader stop",
      },
    ],
  },
  PasswordInput: {
    rows: [
      {
        web: "labels",
        native: "labels",
        note: "`labels.show` and `labels.hide` are required together, because the button changes its name with the state",
      },
    ],
  },
  Popconfirm: {
    nativePiece: "AlertDialog",
    rows: [
      {
        web: "trigger",
        native: null,
        note: "there is no anchoring: you draw your own button and control `open`",
      },
      {
        web: "description",
        native: "description",
        note: "becomes a required `string`: the modal does not open without saying what is lost",
      },
      {
        web: "side",
        native: null,
        note: "`align`, `sideOffset` and `finalFocus` go away with it: the modal takes the middle of the screen",
      },
      {
        web: "classNames",
        native: null,
        note: "the native `AlertDialog` is not styled by class, not even at the root: `title`, `description`, `footer`, `confirm` and `cancel` are the modal's fixed design",
      },
    ],
  },
  Progress: {
    rows: [
      { web: "min", native: null, note: "the scale is 0 to 100, and `max` goes away with it" },
      { web: "label", native: "label", note: "`label` becomes required and is `string`" },
    ],
  },
  QueryBoundary: {
    rows: [
      {
        web: "empty",
        native: "empty",
        note: "the empty state's `title` and `description` are `string`; `icon` crosses over, and also accepts the native `EmptyState`'s function",
      },
      {
        web: "errorTitle",
        native: "errorTitle",
        note: "`errorTitle` and `errorMessage` become `string`",
      },
    ],
  },
  RivoProvider: {
    rows: [
      {
        web: "density",
        native: null,
        note: "the prop does not exist: a touch target does not shrink, and `comfortable` is the only height",
      },
      {
        web: "theme",
        native: "theme",
        note: "only `rivocode-dark`, `rivocode-light` and `system`: a client theme is a BUILD decision",
      },
      {
        web: null,
        native: "fonts",
        note: "the fonts come in through the provider, with `isFontLoaded` to hold the screen until they load",
      },
      {
        web: "toastPosition",
        native: null,
        note: "the toast rises from the bottom, and `scope` and `dir` go away with it",
      },
    ],
  },
  ScrollArea: {
    rows: [
      {
        web: null,
        native: "classNames",
        note: "only `footer`, the strip pinned below the scroll; the scrolling content stays on the `ScrollView`'s `contentContainerClassName`",
      },
    ],
  },
  SearchInput: {
    rows: [
      {
        web: "onClear",
        native: null,
        note: 'the clear button belongs to the piece itself, and it calls `onValueChange("")`',
      },
      {
        web: "shortcut",
        native: null,
        note: "there is no keyboard to draw the `Kbd` inside the field",
      },
    ],
  },
  Select: {
    rows: [
      {
        web: "items",
        native: "items",
        note: "`items` on the root and required, flat or in `{ label, items }` groups; no `SelectTrigger`, `SelectContent` and `SelectItem`",
      },
      {
        web: null,
        native: "label",
        note: "`label` is required: it is what the screen reader announces",
      },
      {
        web: "value",
        native: "value",
        note: "the value is `string` or `string[]`, not the web's generic item",
      },
    ],
  },
  Sheet: {
    rows: [
      {
        web: "side",
        native: null,
        note: "bottom only, which was already the web's narrow mode; `snapPoints` goes away with it",
      },
      {
        web: null,
        native: "title",
        note: "`title` is a required prop and `description` is a prop",
      },
    ],
  },
  Rating: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "becomes required: there is no `defaultValue`, and without `onValueChange` the piece only displays",
      },
      {
        web: "icon",
        native: "icon",
        note: "it is a function, and receives `{ color, size, filled }`: color does not flow down from the `View` to the SVG",
      },
      {
        web: "name",
        native: null,
        note: "there is no `<form>` to carry the rating in a hidden field",
      },
    ],
  },
  SignaturePad: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "becomes required: there is no `defaultValue`, and without `onValueChange` the piece only displays",
      },
      {
        web: "name",
        native: null,
        note: "there is no `<form>` to carry the SVG in a hidden field",
      },
      {
        web: null,
        native: "onDrawingChange",
        note: "reports the start and end of a stroke, so the surrounding `ScrollView` stops scrolling",
      },
      {
        web: null,
        native: "label",
        note: "the group's name is `label`, in place of `aria-label`; without it `labels.group` applies",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "no `baseline`: the baseline is a stroke inside the `Svg`",
      },
    ],
  },
  Slider: {
    rows: [
      { web: "value", native: "value", note: "a single value: `number`, not `number[]`" },
      { web: "label", native: "label", note: "`label` becomes required and is `string`" },
    ],
  },
  Sparkline: {
    rows: [
      {
        web: "variant",
        native: "variant",
        note: "`area` does not port: it needs a filled polygon, and the native drawing is `View`",
      },
      {
        web: "color",
        native: "color",
        note: "on the web it is any CSS color; on native it is a token role",
      },
      {
        web: null,
        native: "height",
        note: "the height is a prop, because there is no CSS to give it from outside",
      },
    ],
  },
  Stat: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` is an already formatted `string`, with `currencyShort` and the other formatters the root exports",
      },
      {
        web: "deltaVariant",
        native: null,
        note: "the change is always text with an arrow, without the filled pill",
      },
      {
        web: "icon",
        native: null,
        note: "no icon, no `footer`, no `hint` and no `actions`: the card is label, value and change",
      },
    ],
  },
  Steps: {
    rows: [
      {
        web: "onStepChange",
        native: null,
        note: "only the web's narrow mode (text and bar), and it was never clickable",
      },
    ],
  },
  Switch: {
    rows: [
      {
        web: "value",
        native: null,
        note: "there is no native form to carry a value: the state is `checked`",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "only `label`: no `thumb`, because the thumb belongs to the platform's `Switch`, which does not take classes",
      },
      {
        web: null,
        native: "label",
        note: "the spoken name is `label`, in place of `aria-label`; without `children` it is required",
      },
    ],
  },
  Tabs: {
    rows: [
      {
        web: null,
        native: "items",
        note: "`items` on the root, in place of `TabList`, `Tab` and `TabPanel`: it is the segmented box, and the panel is yours",
      },
      { web: "value", native: "value", note: "the value is `string`, not the web's generic" },
    ],
  },
  TimeField: {
    rows: [
      {
        web: null,
        native: "label",
        note: "`label` is required, and the arrows become two step buttons",
      },
    ],
  },
  TimePicker: {
    rows: [
      {
        web: null,
        native: "label",
        note: "`label` is required, and the sheet has two columns: it does NOT embed the `TimeField`",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "no `field`: there is no typing field inside the trigger, and the trigger is `trigger`",
      },
    ],
  },
  Timeline: {
    rows: [
      {
        web: null,
        native: "items",
        note: "the events come through `items`, not through `TimelineItem` children",
      },
      {
        web: null,
        native: "label",
        note: "`label` says what the timeline tells, and goes into the announcement of each stop",
      },
    ],
  },
  TimelineItem: {
    nativePiece: "Timeline",
    rows: [
      {
        web: "at",
        native: null,
        note: "becomes `items[].at` and is an already written `string`: a live `RelativeTime` inside would leave the spoken label stuck at the time it was built",
      },
      {
        web: "tone",
        native: null,
        note: "`tone` and `pending` become fields of `items[]`, and so do `by` and `title`",
      },
      {
        web: "classNames",
        native: null,
        note: "the item becomes `items[]`, with no class per item: the native `Timeline` is styled only at the root, with no `marker`, `content`, `title` or `meta`",
      },
    ],
  },
  Tracker: {
    rows: [
      {
        web: "classNames",
        native: "classNames",
        note: "no `label`: the strip's name is only its `accessibilityLabel`, with no hidden text to style",
      },
    ],
  },
  Toggle: {
    rows: [
      {
        web: "value",
        native: null,
        note: "there is no native form to carry a value: the state is `pressed`",
      },
    ],
  },
  ToggleGroup: {
    rows: [
      {
        web: null,
        native: "items",
        note: "`items` on the root, in place of a `Toggle` per child; `multiple` stays the same",
      },
    ],
  },
  Tree: {
    rows: [
      {
        web: "open",
        native: null,
        note: "there is no open state: one level at a time, and tapping a branch pushes the inner one",
      },
      {
        web: "filter",
        native: null,
        note: "no search inside the tree; `emptyMessage` is the nothing-found text",
      },
      {
        web: null,
        native: "label",
        note: "`label` is required: it is what names the level for the screen reader",
      },
    ],
  },
  TreeSelect: {
    rows: [
      { web: "searchable", native: null, note: "no search in the sheet" },
      {
        web: null,
        native: "label",
        note: "`label` is required, and the footer brings the draft count and `Aplicar`",
      },
    ],
  },
  PromptInput: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "required, together with `onValueChange` and `onSubmit`: on native every field is controlled",
      },
      {
        web: "defaultValue",
        native: null,
        note: "no state of its own: clearing the field after submitting is the caller's job",
      },
    ],
  },
  Message: {
    rows: [
      {
        web: "copyValue",
        native: "onCopy",
        note: "the button calls whoever copies, because `expo-clipboard` lives in `@rivocode/ui-native/clipboard`",
      },
      {
        web: "error",
        native: "error",
        note: "`string`: text on native lives inside a `Text`",
      },
    ],
  },
  Conversation: {
    rows: [
      {
        web: null,
        native: "items",
        note: "the messages come through `items`, `renderItem` and `keyExtractor`, not through children; the order is the same, newest last",
      },
      {
        web: "empty",
        native: "empty",
        note: "`title` and `description` become `string`, and `icon` is the function that receives the color",
      },
    ],
  },
  ToolCall: {
    rows: [
      {
        web: "title",
        native: "title",
        note: "`string`, like `error`: text on native lives inside a `Text`",
      },
    ],
  },
  AILabel: {
    rows: [
      {
        web: "explanation",
        native: "explanation",
        note: "`string`, which becomes the description of the `Sheet` where the explanation opens",
      },
      { web: "side", native: null, note: "the explanation opens in a `Sheet`, which has no side" },
    ],
  },
};

/* --------------------------------------------------------------------------
 * The measurement
 * ----------------------------------------------------------------------- */

const nativeNameOf = (piece: string) => SIGNATURES[piece]?.nativePiece ?? piece;

/** The literals of a string union, or `undefined` when the type is not one. */
export function literals(type: string): Set<string> | undefined {
  const found = new Set<string>();

  for (const part of type.split("|")) {
    const clean = part.trim();
    if (clean === "undefined" || clean === "null") continue;
    if (!/^"[^"]*"$/.test(clean)) return undefined;
    found.add(clean);
  }

  return found.size > 0 ? found : undefined;
}

/**
 * The variants that exist on one side only.
 *
 * It is the one divergence family that derives itself: a prop with the same
 * name on both sides, with a union of literals on both sides, and different
 * sets. That is why it is the one whose coverage the guard demands.
 */
export function variantGaps(web: Catalog, native: Catalog) {
  const gaps: { piece: string; prop: string; onlyWeb: string[]; onlyNative: string[] }[] = [];

  for (const piece of Object.keys(web).sort()) {
    const other = native[nativeNameOf(piece)];
    if (!other) continue;

    for (const prop of web[piece]!.props) {
      const twin = other.props.find((one) => one.name === prop.name);
      if (!twin) continue;

      const here = literals(prop.type);
      const there = literals(twin.type);
      if (!here || !there) continue;

      const onlyWeb = [...here].filter((one) => !there.has(one)).sort();
      const onlyNative = [...there].filter((one) => !here.has(one)).sort();
      if (!onlyWeb.length && !onlyNative.length) continue;

      gaps.push({ piece, prop: prop.name, onlyWeb, onlyNative });
    }
  }

  return gaps;
}

/** The pieces that lose `size` on native. Derived, and so written by machine. */
export function sizeGone(web: Catalog, native: Catalog) {
  return Object.keys(web)
    .sort()
    .filter((piece) => {
      const other = native[nativeNameOf(piece)];
      if (!other) return false;
      if (!web[piece]!.props.some((prop) => prop.name === "size")) return false;
      return !other.props.some((prop) => prop.name === "size");
    });
}

/** The parts of a `classNames`, by the `Partial<Record<...>>` form or by the object literal. */
export function parts(type: string): Set<string> | undefined {
  const record = /^Partial<Record<(.+), string>>$/.exec(type.trim());
  if (record) return literals(record[1]!);

  const object = /^\{(.*)\}$/.exec(type.trim());
  if (!object) return undefined;

  const names = [...object[1]!.matchAll(/(\w+)\?:/g)].map((match) => `"${match[1]}"`);
  return names.length > 0 ? new Set(names) : undefined;
}

/**
 * The pieces whose `classNames` does not cross over whole.
 *
 * The second family that derives itself: the web has `classNames`, the piece
 * exists on native, and there either the prop is missing or the set of parts
 * is different. Whoever ports the screen writes
 * `classNames={{ indicator: ... }}` and finds out from `tsc`.
 */
export function slotGaps(web: Catalog, native: Catalog) {
  const gaps: { piece: string; absent: boolean; onlyWeb: string[]; onlyNative: string[] }[] = [];

  for (const piece of Object.keys(web).sort()) {
    const other = native[nativeNameOf(piece)];
    if (!other) continue;

    const here = web[piece]!.props.find((prop) => prop.name === "classNames");
    if (!here) continue;

    const twin = other.props.find((prop) => prop.name === "classNames");
    if (!twin) {
      gaps.push({ piece, absent: true, onlyWeb: [], onlyNative: [] });
      continue;
    }

    const mine = parts(here.type);
    const theirs = parts(twin.type);
    if (!mine || !theirs) continue;

    const onlyWeb = [...mine].filter((one) => !theirs.has(one)).sort();
    const onlyNative = [...theirs].filter((one) => !mine.has(one)).sort();
    if (!onlyWeb.length && !onlyNative.length) continue;

    gaps.push({ piece, absent: false, onlyWeb, onlyNative });
  }

  return gaps;
}

export function validate(
  signatures: Record<string, Signature>,
  web: Catalog,
  native: Catalog,
): string[] {
  const problems: string[] = [];
  const covered = new Set<string>();
  // The `size` sentence under the table is DERIVED, and a hand-written row
  // saying the same is the copy that will diverge from it: the list measures,
  // the row does not.
  const gone = new Set(sizeGone(web, native));

  for (const [piece, signature] of Object.entries(signatures)) {
    const nativePiece = signature.nativePiece ?? piece;
    const here = web[piece];
    const there = native[nativePiece];

    if (!here) {
      problems.push(
        `\`${piece}\` has a signature row and is not in the web catalog.\n` +
          "    Either the piece left, or the name changed. The table is describing what does not exist.",
      );
      continue;
    }

    if (!there) {
      problems.push(
        `\`${piece}\` points to \`${nativePiece}\` on native, which is not in that catalog.\n` +
          "    Check the row's `nativePiece`, or the piece is no longer exported.",
      );
      continue;
    }

    if (signature.rows.length === 0) {
      problems.push(
        `\`${piece}\` has an entry with no rows.\n` +
          "    An empty entry says nothing and is not checked: delete it, or write the row.",
      );
      continue;
    }

    const seen = new Set<string>();

    for (const row of signature.rows) {
      const address = `\`${piece}\` (${row.web ?? "—"} → ${row.native ?? "—"})`;

      if (row.note.includes("\n")) {
        problems.push(
          `${address} has a line break in the note, and a note is a table CELL.\n` +
            "    Markdown closes the table at the first break and the rest of the page falls apart.",
        );
      }

      if (row.web === null && row.native === null) {
        problems.push(
          `${address} cites no prop on either side.\n` +
            "    A row like that cannot be checked: write at least one end.",
        );
        continue;
      }

      const key = `${row.web ?? ""}>${row.native ?? ""}`;
      if (seen.has(key)) {
        problems.push(`${address} is written twice in the same piece.`);
      }
      seen.add(key);

      const onWeb = row.web === null ? undefined : here.props.find((p) => p.name === row.web);
      const onNative =
        row.native === null ? undefined : there.props.find((p) => p.name === row.native);

      if (row.web !== null && !onWeb) {
        problems.push(
          `${address}: \`${piece}\` does not have the prop \`${row.web}\` on the web.\n` +
            `    The web catalog lists: ${here.props.map((p) => p.name).join(", ") || "(none)"}.\n` +
            "    A prop that no longer exists teaches a call that does not compile.",
        );
      }

      if (row.native !== null && !onNative) {
        problems.push(
          `${address}: \`${nativePiece}\` does not have the prop \`${row.native}\` on native.\n` +
            `    The native catalog lists: ${there.props.map((p) => p.name).join(", ") || "(none)"}.\n` +
            "    If the piece just changed, run `bun run gen:props:native` first.",
        );
      }

      // A row that says "one side only" has to have the prop ABSENT from the
      // other. Without this the table tells people to rewrite a call that
      // already crosses over unchanged.
      if (row.web !== null && row.native === null) {
        if (there.props.some((p) => p.name === row.web)) {
          problems.push(
            `${address}: the row says \`${row.web}\` does not exist on native, and \`${nativePiece}\` HAS that prop.\n` +
              "    Either the piece was ported after the row was written, or the row was born wrong.\n" +
              "    The prop crosses over: delete the row, or rewrite what changes in it.",
          );
        }
      }

      if (row.native !== null && row.web === null) {
        if (here.props.some((p) => p.name === row.native)) {
          problems.push(
            `${address}: the row treats \`${row.native}\` as a native thing, and \`${piece}\` HAS that prop on the web.\n` +
              "    Write the row from both ends, or delete it.",
          );
        }
      }

      if (row.web !== null && row.native !== null && row.web !== row.native) {
        if (there.props.some((p) => p.name === row.web)) {
          problems.push(
            `${address}: the row says \`${row.web}\` became \`${row.native}\`, and \`${nativePiece}\` has BOTH.\n` +
              "    A rename that did not happen: check which of the two is the real one.",
          );
        }
        if (here.props.some((p) => p.name === row.native)) {
          problems.push(
            `${address}: the row says \`${row.web}\` became \`${row.native}\`, and \`${piece}\` has BOTH on the web.\n` +
              "    A rename that did not happen.",
          );
        }
      }

      // The same name on both sides only becomes a row when the signature DIFFERS.
      if (row.web !== null && row.web === row.native && onWeb && onNative) {
        const same = onWeb.type === onNative.type && onWeb.required === onNative.required;
        if (same) {
          problems.push(
            `${address}: \`${row.web}\` has the SAME signature on both sides (\`${onWeb.type}\`).\n` +
              "    The divergence the row described is over: delete the row.\n" +
              "    A table with rows that no longer hold is the beginning of a table nobody reads.",
          );
        }
      }

      if (row.web === "size" && row.native === null && gone.has(piece)) {
        problems.push(
          `${address}: the derived sentence under the table already says \`${piece}\` loses \`size\`.\n` +
            "    A hand-written row repeating derived data is the copy that ages: delete the row.",
        );
      }

      covered.add(`${piece}.${row.web ?? row.native}`);
      if (row.native !== null) covered.add(`${piece}.${row.native}`);
    }
  }

  for (const gap of variantGaps(web, native)) {
    if (covered.has(`${gap.piece}.${gap.prop}`)) continue;

    const missing = [
      gap.onlyWeb.length ? `web only: ${gap.onlyWeb.join(", ")}` : "",
      gap.onlyNative.length ? `native only: ${gap.onlyNative.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    problems.push(
      `\`${gap.piece}.${gap.prop}\` has a variant that exists on one side only (${missing}),\n` +
        "    and no row says so. Whoever ports the screen writes the variant they know and\n" +
        "    finds out from `tsc`, one at a time. Write the row in SIGNATURES.",
    );
  }

  for (const gap of slotGaps(web, native)) {
    const row = signatures[gap.piece]?.rows.find((one) => one.web === "classNames");

    if (!row) {
      const what = gap.absent
        ? "and native does not have `classNames`"
        : `and the parts diverge (${[
            gap.onlyWeb.length ? `web only: ${gap.onlyWeb.join(", ")}` : "",
            gap.onlyNative.length ? `native only: ${gap.onlyNative.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join("; ")})`;
      problems.push(
        `\`${gap.piece}.classNames\` exists on the web ${what},\n` +
          "    and no row says so. Whoever ports the screen writes the part they know and\n" +
          "    finds out from `tsc`. Write the `classNames` row in SIGNATURES, or port the prop.",
      );
      continue;
    }

    const unnamed = [...gap.onlyWeb, ...gap.onlyNative]
      .map((part) => part.slice(1, -1))
      .filter((part) => !row.note.includes(`\`${part}\``));
    if (unnamed.length > 0) {
      problems.push(
        `\`${gap.piece}\` (classNames): the note does not name ${unnamed.map((part) => `\`${part}\``).join(", ")}.\n` +
          "    A part missing from one side is written by name, with the reason, so whoever ports does not have to search.",
      );
    }
  }

  return problems;
}

/* --------------------------------------------------------------------------
 * The text
 * ----------------------------------------------------------------------- */

function inWords(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function section(web: Catalog, native: Catalog): string {
  const pieces = Object.keys(SIGNATURES).sort();
  const rows = pieces.reduce((sum, piece) => sum + SIGNATURES[piece]!.rows.length, 0);
  const gone = sizeGone(web, native);

  const intro =
    `**${rows} signature divergences in ${pieces.length} pieces.** The two rules above ` +
    "(everything controlled, lists through `items`) hold across the whole catalog; what is here is what " +
    "is left over from them — a prop that changes name, a type that changes shape, and a variant that exists on one " +
    "side only. `—` means there is no equivalent prop on that side. All three columns " +
    "are checked against both packages by `bun run check:signature`.";

  const table = [
    "| Piece | On the web | In React Native | What changes in the call |",
    "| --- | --- | --- | --- |",
  ];

  for (const piece of pieces) {
    const signature = SIGNATURES[piece]!;
    const nativePiece = signature.nativePiece;
    const name = nativePiece ? `\`${piece}\` → \`${nativePiece}\`` : `\`${piece}\``;

    for (const row of signature.rows) {
      const left = row.web === null ? "—" : `\`${row.web}\``;
      const right = row.native === null ? "—" : `\`${row.native}\``;
      table.push(`| ${name} | ${left} | ${right} | ${row.note} |`);
    }
  }

  const size =
    `Outside the table, one loss that repeats: **${gone.length} pieces lose \`size\` on ` +
    `native** — ${inWords(gone.map((piece) => `\`${piece}\``))}. A touch target does not shrink, and ` +
    "`comfortable` is the only height. This list is measured on every generation, not written by hand.";

  return `${intro}\n\n${table.join("\n")}\n\n${size}`;
}

function withReplacedSection(markdown: string, title: string, body: string) {
  const target = new RegExp(`(^|\\n)${title}\\n[\\s\\S]*?(?=\\n## |$)`);
  if (!target.test(markdown)) {
    throw new Error(
      `Could not find the section "${title}" in ${GUIDE}. It is where the table is published:\n` +
        "write the title in the file, or fix the title here.",
    );
  }
  return markdown.replace(target, (_, before: string) => `${before}${title}\n\n${body}\n`);
}

/* --------------------------------------------------------------------------
 * Run
 * ----------------------------------------------------------------------- */

if (import.meta.main) {
  const checking = process.argv.includes("--check");

  const web = JSON.parse(readFileSync(WEB_CATALOG, "utf8")) as Catalog;
  const native = JSON.parse(readFileSync(NATIVE_CATALOG, "utf8")) as Catalog;

  countAtLeast(`pieces in ${WEB_CATALOG}`, Object.keys(web).length, 150);
  countAtLeast(`pieces in ${NATIVE_CATALOG}`, Object.keys(native).length, 60);

  const problems = validate(SIGNATURES, web, native);

  if (problems.length > 0) {
    console.error(`${problems.length} divergence(s) between the signature table and the code:\n`);
    for (const problem of problems) console.error(`  ${problem}\n`);
    console.error(
      "The table lives in scripts/native-signature.ts and is published in\n" +
        `${GUIDE}. It is what whoever ports a screen reads instead of opening the source:\n` +
        "a wrong row there costs more than no row at all.",
    );
    process.exit(1);
  }

  const before = readFileSync(GUIDE, "utf8");
  const after = withReplacedSection(before, SECTION_TITLE, section(web, native));
  const rows = Object.values(SIGNATURES).reduce((sum, one) => sum + one.rows.length, 0);

  if (checking) {
    if (before !== after) {
      console.error(`${GUIDE} is out of sync with the signature table.`);
      console.error("Run `bun run gen:signature` and commit the result.");
      process.exit(1);
    }
    console.log(
      `${rows} signature divergences checked against both catalogs, ` +
        `in ${Object.keys(SIGNATURES).length} pieces.`,
    );
  } else {
    if (before !== after) writeFileSync(GUIDE, after);
    console.log(`${GUIDE}: ${rows} divergences in ${Object.keys(SIGNATURES).length} pieces.`);
  }
}
