`@rivocode/ui-native` takes the design system to mobile speaking the **same
class vocabulary** as the web (`bg-bg`, `text-fg-muted`, `rounded-pill`)
through NativeWind, on top of the same tokens. No component knows the brand
color: it asks for a semantic role and the theme answers. Between the two house
themes the switch happens at runtime; dressing a client's color is a build
decision, and there is a whole section below on what that changes.

The catalog is born by **translation, not by porting**: each web piece was
judged in the platform's idiom before crossing over. That has two
consequences, and the second is the one that costs dearly when nobody writes it
down.

## Same name is not same API

Where the piece's name is the same, the **prop** name is too: `Avatar` takes
`fallback`, `OTPField` reports through `onValueComplete`, `ToggleGroup` accepts
several with `multiple`. And, without `multiple`, it releases the previous one,
as on the web. Up to 0.1.0 these three diverged (`initials`, `onComplete`,
`single` with the inverted meaning), and whoever wrote both screens of the
same product switched vocabulary midway.

Same name, however, **is not same signature**: none of the pieces that cross
over accepts the same JSX on both sides. Two rules explain almost all of the
difference.

**On native everything is controlled.** There is no root `defaultValue`,
`defaultChecked` or `defaultOpen`. The state lives in the app, and both props
of the pair are required:

```tsx
web     <Checkbox defaultChecked>ISS retido</Checkbox>
native  <Checkbox checked={retido} onCheckedChange={setRetido}>ISS retido</Checkbox>   both required
```

**The list comes through `items`, not composition.** The web assembles the
trigger, the panel and each option; native takes the array and draws the bottom
sheet, which has no anchored trigger to dress:

```tsx
web     <Select items={PERIODOS} defaultValue="30">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{/* one SelectItem per option */}</SelectContent>
        </Select>

native  <Select items={PERIODOS} value={periodo} onValueChange={setPeriodo} label="Período" />
```

The same goes for `RadioGroup`, `CheckboxGroup`, `ToggleGroup`, `Combobox` and
`Tabs`: where the web asks for children, native asks for `items`. And the
`label` that shows up there is not decoration: it is how the screen reader
announces the control, a role that on the web belonged to `SelectTrigger`.

The practical conclusion: **the screen does not copy from one side to the
other.** What gets reused is the class vocabulary, the token and the decision
of which piece to use. The JSX gets rewritten.

## The form comes in by another path

`Form`, `FormField`, the adapters and `useZodForm` live in
`@rivocode/ui-native/form`, not in the main index, with the same arrangement as
the web and for the same reason: `react-hook-form` is an **optional** peer, and
metro resolves imports per file. Inside the root index, an app that only wants
a `Button` would have to install `react-hook-form` for the bundle to close.

```tsx
import { Button, Input } from '@rivocode/ui-native'
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
```

Two differences bite on the first screen. **Nothing submits on its own**: there
is no `<form>`, `type="submit"` or Enter that submits, so `Form` hands over
submission as a function: `{({ submit, isSubmitting }) => …}`. And **the label
travels in the field**: on the web Base UI's `Field` links label and control
through `for`, and here there is no `for` and no `id`; `FormField` puts
`accessibilityLabel` and `invalid` inside the field, and the adapter carries
them to the control - as `label` on the pieces, which name themselves by it,
and as `accessibilityLabel` on `Input` and `Textarea`. Without that, a
`TextInput` under a label has no name for the screen reader.

## The chart comes in by another path, and brings a native peer

`ChartContainer`, `ChartDonut`, `ChartRadial`, `ChartGauge`, `ChartHeatmap`,
`ChartFunnel` and `ChartTreemap` live in `@rivocode/ui-native/chart`, by the
same rule as the form, except here the optional peer costs more than bytes:

```sh
npx expo install react-native-svg
```

```tsx
import { ChartContainer, ChartDonut, ChartGauge, ChartRadial } from '@rivocode/ui-native/chart'
```

`react-native-svg` is a **native module**: whoever does not draw charts does
not install it, does not link it into the iOS and Android project and does not
rebuild because of it. That is why the three pieces stay out of the root index,
and that is why `Sparkline` is still drawn with `View`, where it is: it is the
`chart` slot of `Stat`, `Stat` comes from the root, and bringing it here would
charge the peer to whoever only wanted a number inside a card.

Two decisions hold for the three pieces. **Nothing measures on its own**: in
place of `ResponsiveContainer` and the `var(--color-series)`,
`ChartContainer` measures with `onLayout`, resolves the colors from the
`config` and hands `{ width, height, colors }` to whoever draws, with the
measurement zeroed on the first frame, because on the phone there is no width
before layout. And **on touch there is no tooltip**: the donut puts each
slice's name and value in the legend, which is also the control: tapping the
row lights up the slice and sends the value to the middle of the ring, exactly
where the web opens the tooltip. The rest is in the table below.

## Copy and attach come in by two paths, not one

`Clipboard` and `FileUpload` close the same rule as the form and the chart, and
take the split one step further: **one subpath per peer, not one per
subject**.

```sh
npx expo install expo-clipboard        # @rivocode/ui-native/clipboard
npx expo install expo-document-picker  # @rivocode/ui-native/file-upload
```

```tsx
import { Clipboard } from '@rivocode/ui-native/clipboard'
import { FileUpload, FileUploadItem, FileUploadList } from '@rivocode/ui-native/file-upload'
```

The two could share a single door (`/expo`, say), and the math of whoever
installs says no. Whoever puts a copy button next to an NF-e access key does
not attach any file; a shared index would drag `expo-document-picker` into
their project, which is exactly the cost this arrangement exists not to
charge. An Expo module on mobile is not bytes: it is a build. The boundary of
the two is guarded along with the chart's and the form's, in both packages, by
`scripts/check-chart-boundary.ts`.

**The copy confirmation becomes double, where on the web one was enough.** The
piece's rule does not change: copying is the action with no visible result,
and without confirmation the person taps again out of doubt. What changes is
the channel it arrives through: the button swaps the icon and the accessible
name, as there, and the piece **also** fires a toast, because here swapping the
`accessibilityLabel` of a `Pressable` that already has focus **is not
re-announced** by any screen reader. Whoever does not see the icon turn into a
check mark would learn nothing; the toast that `RivoProvider` already mounts
lives in an `accessibilityLiveRegion="polite"` (on iOS, where it does not
exist, the same text goes out through the system announcement) and is the only
channel on this screen that speaks on its own. `toast={false}` turns it off,
for the screen that copies several things in a row. And when the clipboard
refuses (Expo's `setStringAsync` returns `false`, which does not happen on the
phone and does in the web pass), **nothing is confirmed**: lying that it
copied is worse than not confirming.

**And the drop zone does not exist.** On mobile nothing can be dragged
anywhere, and the web's dashed rectangle is, letter by letter, the idiom of
"drop here". Take away the drop, and what is left of that box is a button with
a lot of empty space around it: **the space was the drop target, not the
affordance**. So the native `FileUpload` is a control-height button, with the
`hint` inside the spoken name (whoever hears the screen needs to know "XML or
PDF, up to 5 MB" before opening the picker, not after being refused), and the
height it gives back belongs to the list. `accept` speaks **MIME**, which is
what the system picker knows how to filter. An extension with a dot still
counts in the validation on the way back, but does not go to the dialog, where
it would match nothing. What comes back is not a `File`: it is a `PickedFile`
with the local `uri` the app uses to upload, and whose `size` may be missing,
because not every Android file provider reports it. `maxSize` only refuses
what it managed to measure.

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

## Installation

In an Expo app:

```sh
npx expo install nativewind@preview react-native-css react-native-reanimated react-native-keyboard-controller tailwindcss @tailwindcss/postcss postcss
npm install @rivocode/ui-native
```

`react-native-keyboard-controller` is what keeps the keyboard from covering
the field, and it comes included in the SDK 57 Expo Go. The `KeyboardProvider`
it asks for **is already inside `RivoProvider`**: do not mount another. If
your app already had one outside, the provider reuses yours. The form screen is
`ScrollArea`, which scrolls to the focused field and pins the action in a
`footer` that rises with the keyboard; `Sheet` and `Dialog` rise on their own.

The `@preview` is not decoration: on npm NativeWind's `latest` tag is still
4.2.6, and this package asks for 5 (`nativewind: ">=5.0.0-preview.1"` in the
peer). Without the tag you install v4, and then the `metro.config.js` just
below does not even load: v5 exports `withNativewind`, v4 exports
`withNativeWind`, with a capital W, and the error that comes out is an
`undefined is not a function` that does not say where it came from. Know this
before you start: **NativeWind 5 is still a pre-release** and it is the only
path `@rivocode/ui-native` knows today, so going to production with it is going
to production on top of a preview.

Five files of the app take part, each for a reason that bites:

**1. `metro.config.js`**. NativeWind goes into the build:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

module.exports = withNativewind(getDefaultConfig(__dirname));
```

**2. `package.json`**. Modern browsers, pinned:

```json
"browserslist": ["chrome 130", "safari 18", "firefox 130"]
```

It is not about any browser: Expo runs a web pass over the CSS before the
native compiler, and without that field it rewrites the tokens' `light-dark()`
into a polyfill of orphan vars that kills the compilation. This line is what
holds up switching between the two house themes at runtime.

**3. `app.json`**. `"userInterfaceStyle": "automatic"`, otherwise iOS locks
the appearance to light and the dark theme never arrives.

**4. `global.css`**. The CSS source:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "@rivocode/ui-native/theme.css";
@import "tailwindcss/utilities.css";

@source "./App.tsx";
@source "./node_modules/@rivocode/ui-native/src";
```

The app **does not import `global.css`**: it imports the precompiled one.

```sh
npx rivocode-ui-native-css   # reads global.css, writes generated.css
```

The metro pipeline trips over `@import` and `@property` inside the native
compiler; the command delivers an already resolved file, and fails **with the
var's name** when something would not translate. Used a new class, run it
again.

**5. `nativewind-env.d.ts`**. TypeScript learns `className`:

```ts
/// <reference types="nativewind/types" />
```

The symptom is the new project opening with a wall of errors: *Property
`className` does not exist on type ...* on every `View`, `Text` and
`Pressable` you wrote, and on `@rivocode/ui-native`'s too (it was 167 in a
freshly created app). The cause is that `className` does not exist in React
Native: what adds it to the props is a module declaration that lives in
NativeWind, and it only enters the program if this file references it. None of
this shows at runtime (the app runs and the colors are right), so it is easy to
read the errors as the library's fault.

Step 1's `withNativewind` generates the file the first time metro starts, with
this exact name (the `typescriptEnvPath` option changes the path). Write it by
hand when `tsc` runs before the app (CI, or the editor on a freshly downloaded
clone), and **do not put it in `.gitignore`**: without it versioned, the error
comes back on every clone.

## The Provider, once, at the root

```tsx
import "./generated.css";
import { RivoProvider, Button, useToast } from "@rivocode/ui-native";

export default function App() {
  return (
    <RivoProvider theme="rivocode-dark">
      <MyScreen />
    </RivoProvider>
  );
}
```

- `theme`: `rivocode-dark` (default), `rivocode-light` or `system`, which
  follows the device. **Between the two house themes, changing the prop changes
  the whole screen at runtime**: those colors were compiled as `light-dark()`,
  and the provider only flips Appearance's color scheme. The prop also accepts
  a client theme's map, and then the story is a different one: read the section
  below first.
- `density`: **does not exist in the native package.** A touch target does not
  shrink on a finger screen, and `comfortable` is the only height.
- `useToast` already comes wired, as on the web: no extra provider to mount.

## Client theme: a build decision, not a runtime prop

This is the most expensive difference between the two packages, and the one
most often assumed wrong. On the web layer 3 is read at runtime, and
`<RivoProvider theme="acme">` switches the whole page with it open. Not here.

**The class color only changes at build time.** The `react-native-css` compiler
resolves the token and bakes the value into the rule: `.bg-accent` becomes
`{"backgroundColor":"#d4f34a"}`, literal, and in the 56 KB of compiled CSS
there is **not a single occurrence of `--`** left. There is no live variable on
the device to redefine, and that is why no theme object passed at runtime ever
changed a class color.

**The theme map LEFT the provider.** It reached whoever reads the color through
JS, from context - `ChartDonut`, `ChartRadial`, the spinner of `Button` and
`Spinner`, the `Switch` track, `Sparkline`, the fields' hint text -, and did
not reach background, card, button, badge and border, which are classes: it
gave a donut from one theme and a button from another on the same screen, with
nothing red in the console besides the `__DEV__` warning.

One half that disagrees with the other is worse than none. The provider started
resolving the 45 roles **by reading the compiled CSS**, one `bg-` class per
role, and publishes on the same context the pieces already read: context and
class always say the same color. With that the map had nothing left to do and
was removed: the `theme` prop accepts only `rivocode-dark`, `rivocode-light`
and `system`, and the `scheme` prop went with it, because it was what picked
the map's scheme.

### The path that works

Override the roles in an `@theme` of yours in `global.css`, after the
package's `theme.css`, and precompile again. It is the same layer 3, in the
`--color-*` vocabulary the native compiler reads:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "@rivocode/ui-native/theme.css";
@import "tailwindcss/utilities.css";

@theme {
  --color-accent: #2563eb;
  --color-accent-hover: #3b82f6;
  --color-accent-fg: #ffffff;
  --color-bg: light-dark(#f7f8fa, #0d1220);
  --color-surface: light-dark(#ffffff, #141b2d);
  /* …and the other roles the brand changes. */
}

@source "./App.tsx";
@source "./node_modules/@rivocode/ui-native/src";
```

```sh
npx rivocode-ui-native-css
```

This alone dresses the whole brand, charts included: the class paints the new
color, and the piece that paints outside the class reads the same color from
the same CSS. Do not pass any map to the `theme` prop.

**And there is a ceiling: two themes per build.** `light-dark()` has two slots,
a light one and a dark one. One client's app fits comfortably, and it is the
normal case; a showcase of five themes, like this site's on the web, **does not
fit without five bundles**. It is an architectural ceiling, not a pending item.
The [themes guide](/temas) has the step by step and the full list of roles.

### Write only the palette, and the command writes the theme

The `@theme` above has 45 roles to fill in, and that is where the client theme
starts to go stale. The role names, the contrast pairs, the minimums, the alpha
compositing and the format the native compiler accepts are the library's
knowledge. Before this command they lived in the app of whoever dressed the
client: a real consumer wrote 220 lines for it, and ported the contrast math
with a silent defect in exactly the 12 roles that carry alpha.

The package's second binary brings that math back inside:

```sh
npx rivocode-ui-native-theme acme.ts    # reads the palette, writes acme.theme.css
npx rivocode-ui-native-theme acme.ts output.css
npx rivocode-ui-native-theme --roles    # what you write, what it derives (old name: --papeis)
```

You write **eight roles per scheme**, in a `.ts`, `.js`, `.mjs` or `.json`:

```ts
export const acme = {
  light: {
    bg: "#ffffff",
    surface: "#ffffff",
    fg: "#111111",
    accent: "#1d4ed8",
    success: "#0f6b52",
    warning: "#7a4a00",
    danger: "#b3261e",
    info: "#1d4ed8",
  },
  dark: {
    bg: "#101314",
    surface: "#191d1f",
    fg: "#f2f3f0",
    accent: "#8ab4f8",
    success: "#3ddc97",
    warning: "#f2b21c",
    danger: "#ff8a8a",
    info: "#8ab4f8",
  },
};
```

The output goes into `global.css` **after** the package theme, and the
precompiled file comes out as always:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "@rivocode/ui-native/theme.css";
@import "./acme.theme.css";
@import "tailwindcss/utilities.css";

@source "./App.tsx";
@source "./node_modules/@rivocode/ui-native/src";
```

```sh
npx rivocode-ui-native-css
```

Any of the 45 roles can be written by hand in the palette, and the command
stops deriving that one.

#### It refuses to write a theme that fails contrast

The measurement is `@rivocode/ui-native/contrast`'s, the same engine the
repository's `bun run check` uses: the pairs that carry text, the 3:1 control
boundary, `Calendar`'s alpha over alpha, the destructive button's layer
flattened by `opacity` and the checked `Switch` track.

```
Contrast guard:
  light: 1 failure(s)
    accent-fg on accent  2.45:1 (min 4.5)
  dark: passes

Nothing was written: fix the contrast before generating the CSS.
```

Nothing is written while a pair is below the minimum. A theme nobody measured
is exactly what this command exists to not let happen.

#### What it derives, and what it refuses to guess

Deriving here is **reusing a color you wrote, or compositing alpha from it**.
The command never invents a new hue:

| Roles | Where they come from |
|---|---|
| `surface-raised` | same as `surface` |
| `fg-muted`, `fg-subtle`, `fg-disabled` | `fg` pulled 30%, 38% and 55% toward `bg` |
| `border`, `border-strong`, `border-disabled`, `line-hover`, `skeleton`, `overlay` | alpha of `fg` on the house ladder |
| `accent-hover`, `accent-active` | `accent` one step lighter and one step darker |
| `accent-subtle`, `selected`, the four `*-subtle` | alpha of the matching color |
| `accent-fg` and the four `*-fg` | the `fg`/`bg` tone that weighs more over the fill, and pure white or black when neither reaches 4.5:1 |
| `ring` | same as `accent-text` |
| `chart-1` to `chart-8` | the RivoCode series, measured over **your** background |

Two choices in that table deserve their reason written down.

**`accent-text` and the four `*-text` are reused, and only when they pass.**
They are the color that is **read**: darkening the brand red one step without
saying so is a designer's decision, not a script's. So the command tries the
fill itself, and where it does not reach 4.5:1 over the three backgrounds it
**refuses and says the value that would pass**:

```
    light.accent-text was DERIVED: `accent` itself, and only when it passes 4.5:1; otherwise the command refuses.
      `accent-text: "#667524"` would pass - check that it is the brand color.
```

**`chart-1` to `chart-8` fall back to the RivoCode series.** It is the only
declared exception, and it is not a derivation: a chart series is a
categorical scale, not brand identity. Even as a default, it is measured over
**your** background, and fails if it does not fit. Write all eight in the
palette if the brand has its own.

#### A new role in a new version is flagged, instead of the theme breaking silently

The list of roles comes from the **installed** package's `tokens.json`, not
from a copy inside the command. When a new version brings a role, the command
asks for it by name the first time you run it:

```
1 role(s) with no value:
    light.accent-quiet  - new role in @rivocode/ui-native 0.4.0, and this command does not know how to derive it yet
```

Without that the new role would simply not come out in your `@theme`, the
class would fall back to the value in the package's `theme.css`, and the screen
would come out mixed: half the client's, half RivoCode's. A wrong name in the
palette is flagged the same way, with a suggestion of the role you meant.

#### `oklch()` goes in directly, and Tailwind 4's palette with it

This house's WCAG math reads 3, 4, 6 and 8-digit hex, `rgb()`, `rgba()`,
`hsl()`, `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` and
`color()` in CSS's predefined spaces, and converts everything to sRGB before
measuring. Tailwind 4's palette is written in `oklch()`: copy the color from
there and the command measures it, with no converter in between. The CSS it
**writes** is still literal sRGB, because that is what the native compiler
bakes — the conversion happens on the way in, not by your hand.

Two things are still refused, both because no measurement is possible:
`color-mix()`, which is not a color but a calculation whose result depends on
the interpolation space and the hue method, and a seed that carries alpha — a
seed is a solid color, because the alpha ladder of the derived roles comes out
of it.

A color that describes a tone outside the sRGB gamut — 82 of Tailwind 4's 286
named colors are in that range — is measured at the value the device shows:
the excess is clipped channel by channel, and the command says which roles
fell there and to what value.

#### The two-theme ceiling is in the error message, not only here

A third scheme in the file is refused with the reason, because whoever passes
three needs to **hear** why they do not fit:

```
3 schemes in acme.ts: light, dark, contrast.

    Two fit, and the ceiling is not our choice. Each role comes out as
    `light-dark(light, dark)`, and `light-dark()` has TWO slots: a light one
    and a dark one. [...]
    A third scheme is a third BUNDLE: run the command once per pair
    and pick the CSS at build time.
```

## Fine-tuning with className

As on the web, every piece accepts `className` at the root and the user's
class beats the piece's: `h-14` overrides Button's `h-12`, `rounded-pill`
overrides `rounded-md`. That is what allows a client wrapper in an app file,
without a fork. On the pieces with a sheet (Select, Combobox, DatePicker,
Sheet, Dialog, Menu), the prop's documentation says what it dresses, the
trigger or the panel. Remember the precompiler rule: a new class used in the
app calls for `npx rivocode-ui-native-css` again.

## Icons

The same Lucide as the web, through the sibling package:

```sh
npx expo install lucide-react-native react-native-svg
```

The names are the same (`Receipt` there is `Receipt` here), so the canonical
vocabulary of the [icons guide](/icones) holds in both worlds, and the
[searchable gallery](/icones) serves both. Inside the library's pieces the
state icons are still drawn with borders (the Checkbox check mark, the
Calendar chevrons): a piece does not carry an icon dependency, an app carries
one if it wants.

## What never to do

- A class with an arbitrary var (`h-[--rc-control-md]`) or `translate-*`: the
  current react-native-css compiler tolerates neither a live var nor the
  `translate` shorthand. Control height is fixed per size.
- Removing the modern `browserslist` from `package.json`. The error that shows
  up (`expected an object-like struct named Specifier`) does not say why; this
  line does.
- A text glyph as a state icon: the Checkbox check mark is a rotated border,
  because the font changes size between iOS and Android.
- Forgetting `accessibilityRole`/`accessibilityState` on a custom control.
  Every piece in the catalog already carries them.

## The full example

The repository has an Expo app in `examples/native` with all the pieces in use
on a product screen: dashboard, listing with detail in a Sheet, form,
destructive confirmation and the theme switch. `bunx expo start --ios` inside
it, and the simulator tells the rest.
