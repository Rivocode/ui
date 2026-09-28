# Choosing the right piece

## Contents

- Choices that usually go wrong
- Every query has four endings

The catalog has 134 pieces. The index of all of them is at
<https://ds.rivocode.com.br/llms.txt>, and each one has its own document at
`https://ds.rivocode.com.br/componentes/<kebab-name>.md`, with the import,
examples that run and the props table.

## Choices that usually go wrong

| Situation | Right piece | Why |
|---|---|---|
| A notice that stays on screen | `Alert` | `Toast` goes away, and whoever was looking at another corner misses it |
| A whole-page notice: maintenance, overdue invoice, test mode | `Banner` | Full-width strip at the top of the area; `Alert` lives next to the passage it talks about |
| Guided walk through the screen on first access, one element at a time | `Tour` | Dims the rest, cuts out the target and traps focus in the bubble; becomes a bottom sheet on a phone. A hint about a single element is `Tooltip` or `Popover`, and news that does not stop the person is `Banner` |
| Icon-only button | `IconButton` | `label` is required and becomes the name; `tooltip` shows the hint without repeating the name |
| LGPD cookie notice | `CookieConsent` | Refusing weighs the same as accepting, it does not lock the page and Esc does not dismiss it; the choice comes back through `onDecision` and the app stores it. Never `AlertDialog`: a cookie wall is not free consent |
| Destructive confirmation | `AlertDialog` | It demands an answer; `Dialog` lets you close it by clicking outside |
| Choice among a few fixed options | `Select` | `Combobox` asks for typing without need |
| Long list, or one coming from the server | `Combobox` | It does not fit in the chooser's head |
| Turns on now, without confirming | `Switch` | `Checkbox` only counts when the form is submitted |
| Questions one at a time: onboarding, survey, triage, the agent asking for clarification | `Questionnaire` | Validates before moving on and only the optional one can be skipped; if the questions fit on one screen it is `Form`, and a step with several fields is `Steps` with `useWizard` |
| Which columns the listing shows | `MenuCheckboxItem` | Inside `Menu`: brings `aria-checked` and menu navigation, which a `Popover` with a `Checkbox` inside does not have |
| Sort by, inside the menu | `MenuRadioGroup` + `MenuRadioItem` | One order at a time; pass `closeOnClick` for the menu to close on choosing |
| Option list with real families | `SelectGroup` + `SelectGroupLabel` | If grouping is to tame a list that is too big, the remedy is `Combobox`, which searches |
| Mark one option among several | `ToggleGroup` | Keeps state and says so in aria |
| Sibling actions side by side | `ButtonGroup` | Does not keep state; they are actions, not a choice |
| Do the same thing to several marked rows | `ActionBar` | Comes in with the `DataTable` selection, says how many and clears; a single-row action stays in the row's `Menu` |
| Build a set from a long list, seeing what was left out | `TransferList` | Two lists with search and moving both ways; a short list is `CheckboxGroup`, and choosing without seeing the rest is `Combobox` with `multiple` |
| Show why the search result showed up | `Highlight` | Paints the term with accents not mattering; filter with `matchesSearch`, which is the same rule |
| Long text the person may want to read right there | `Spoiler` | Cuts by height and only shows "Ler mais" when it overflows; a closed block with its own title is `Collapsible` |
| Go anywhere by keyboard | `Command` | Palette on Ctrl+K, accent-insensitive search and by `keywords` |
| Show a shortcut in the text | `Kbd` | `mod` comes out `⌘` on Mac and `Ctrl` elsewhere |
| Smaller section heading without skipping a level | `Heading` with `size` | `level` decides the tag from `h1` to `h6`; `size` changes only the look, and the heading order stays whole |
| Secondary text, caption or a sentence in a status tone | `Text` with `tone` | Only the theme's text roles; without `size` and `tone`, it inherits from the surrounding sentence |
| Go to another page or another site | `Link` | Navigates; `Button` acts. `external` opens in another tab and tells whoever is listening, and the router comes in through `render` |
| File name, command or JSON key in the text | `Code` | `Kbd` promises "press this"; this one is for reading or copying |
| API response, log or configuration as a block | `CodeBlock` | Scrolls on its own, and `copyable` puts copy in the corner |
| Take a piece of data to another system | `Clipboard` | The confirmation is part of the piece: the button's accessible name changes |
| Charge by Pix: QR, amount and copy-and-paste | `PixCode` | Receives the ready copy-and-paste code and checks the CRC; build the static one with `buildPixPayload` |
| A link or code another device's camera reads | `QRCode` | SVG always dark on light, in any theme, on a plate with the 4-module margin; `label` required, and `logo` only with `level="H"` |
| "há 2 minutos" in a log, queue or notification | `RelativeTime` | Comes out in a `<time>`, with the exact date in `title` and a configurable cutoff |
| What has already happened to a thing, in order | `Timeline` | Looks back, with timestamp and author; `Steps` looks forward |
| Project schedule: what comes before what, and for how many days | `Gantt` | Table on the left, scale on the right and dependency arrows; editing controlled by `onTaskChange`. Time of day and schedule clashes are `EventCalendar` |
| The header bell with the notification list | `NotificationCenter` | Counts the unread in the button's name, opens a popover on desktop and a sheet on a phone, and fetches nothing: marking, filtering and loading more go out by callback |
| Count on top of the bell, the tab, the menu | `Indicator` | Positions itself, and the count is spoken and not only seen |
| Row of overlapping people | `AvatarGroup` | Cuts down to one letter and counts the excess as "+n" |
| Several cards or photos the person browses sideways | `Carousel` | Scrolls by scroll-snap, with buttons and keyboard; what is compared is `Tabs`, and what fits on screen is `Grid` |
| A photo the person needs to enlarge: property, inspection, receipt | `ImageViewer` | Full screen over the `Dialog`, with zoom, arrows and required `alt`; an image that only decorates the card is `AspectRatio` |
| A star rating, or the average others gave | `Rating` | `radiogroup` with one option per star and arrows; `readOnly` becomes a single image, "4,3 de 5". An exact number is `NumberField`, a continuous range is `Slider` |
| Signature on screen: acceptance, receipt, inspection | `SignaturePad` | Finger, pen or mouse, with the typed name in cursive for whoever does not draw; exports SVG and PNG with dark ink in both themes. "Li e aceito" without a signature is `Checkbox` |
| Money amount | `CurrencyInput` | Goes in and out in integer cents, types from the right and reads what is pasted; a quantity with a step is `NumberField` |
| CPF | `MaskedInput` | `mask="cpf"`, and the number is checked with `isValidCpf` in the schema, on leaving the field. Store the raw value, the second argument of `onValueChange`: just the 11 digits |
| CNPJ, including the alphanumeric one | `MaskedInput` | `mask="cnpj"` accepts letters in the first twelve positions and uppercases them; check with `isValidCnpj`. Store the raw value |
| CPF or CNPJ in the same field | `ToggleGroup` and `MaskedInput` | No pattern alternates between the two on its own: the person picks "Pessoa física" or "Pessoa jurídica" first, and `mask` switches together with the validator |
| Phone, landline or mobile | `MaskedInput` | `mask="telefone"` switches between landline and mobile on its own by digit count, 10 or 11; `autoComplete="tel-national"`. Store the digits, and a Pix key needs `+55` in front |
| CEP that fills in the address | `PostalCodeField` | Mask and lookup: completes the 8 digits, calls your `lookup` and delivers `onAddress`. A standalone CEP, without an address, is `MaskedInput` with `mask="cep"` |
| Date: due date, birth date, scheduling | `DatePicker` | Type it or pick it on the calendar, with `min`, `max` and `disabledDays`; a birth date takes `max` at today. `mask="data"` on a text field loses the calendar and the date validation |
| Time of day | `TimeField` | Goes in and out as `HH:mm`, with `min`, `max` and `step`; `mask="hora"` does not check whether the time exists |
| Card number | `MaskedInput` | `mask="cartao"` and `autoComplete="cc-number"`. The library does not check the card: the acquirer approves it |
| Vehicle plate, old or Mercosul | `MaskedInput` | `mask="placa"`; the shape is checked with `isValidPlate` |
| Boleto typeable line | `MaskedInput` | `mask="boleto"` switches to the utility-bill one on its own when it starts with 8; `isValidBoletoLine` checks and `parseBoleto` reads amount and due date |
| Single-use verification code that arrives by SMS | `OTPField` | One slot per digit, pastes the whole code and `autoComplete="one-time-code"` lets the phone fill it in by itself |
| Customer, contact or login e-mail | `Input` | `type="email"` and `autoComplete="email"`, no mask; the format is checked in the schema with `z.string().email()` |
| Form field for the Pix key: the person types or registers the key to receive or transfer | `Input` | No mask, because a Pix key can be CPF, CNPJ, e-mail, mobile or random; `isValidPixKey` checks after stripping punctuation. Showing the key for someone to copy is `Code` with `Clipboard`; charging with QR and copy-and-paste is `PixCode` |
| Quantity, installments, percentage | `NumberField` | A number with a step and the numeric keyboard; money never goes here, it is `CurrencyInput` |
| Password, with the eye that reveals | `PasswordInput` | The button says the action and not the state; leaving the field hides it again |
| Tags the person writes | `TagsInput` | Enter closes, Backspace removes the last one, a repeated one does not go in |
| Occurrence per period, in a strip | `Tracker` | Answers "did it get worse yesterday?"; fits in the footer of a `Stat` |
| List and detail side by side, with adjustable proportion | `Splitter` | The divider is a real `separator` and moves with the arrows; stacks on a phone |
| Three or more adjustable, nested areas that collapse or remember the layout | `ResizablePanelGroup` | With `ResizablePanel` and `ResizableHandle`; `Splitter` is its short form for two areas |
| Fix a value without leaving the screen | `Editable` | Escape undoes, leaving the field saves; closed it is a `button` |
| Choose a client's brand color | `ColorPicker` | A grid of swatches that moves by arrow and says which one is chosen, plus the hex pasted from the brand manual |
| Hold the height before the image | `AspectRatio` | Without it the row jumps when the image loads |
| Stack blocks with a gap that follows the density | `Stack` | `gap` is a scale (`xs` to `xl`), not pixels; `direction="row"` puts them side by side |
| Cards in columns that adjust to the screen | `Grid` | `minItemWidth` fits as many as there is room for, without a media query; `columns` fixes the number |
| Page reading width, centered | `Container` | `size` from `sm` to `xl`, side breathing room by token; web only |
| Split the page into sections | default `TabList` | The line underneath says "this part of the page" |
| See the same thing another way | `TabList variant="segmented"` | The little box does not promise a section |
| How much of a capacity is in use | `Meter` | `Progress` moves toward the end and finishes |
| A number judged by bands (on track, attention, critical) | `ChartGauge`, from `@rivocode/ui/chart` | `ChartRadial` measures against a goal and does not judge; `Meter` fits in one line and only says how much |
| The pattern in a row-by-column grid | `ChartHeatmap` | An empty cell is not zero; one state per period, in a single row, is `Tracker` |
| How many passed from each stage to the next | `ChartFunnel` | The rate comes out written; where the person is in a process is `Steps` |
| Proportion of many categories | `ChartTreemap` | Up to six, `ChartDonut` reads better; the label that does not fit disappears |
| Dashboard number with change and trend | `Stat` | The value arrives formatted; `Sparkline` comes in through the `chart` slot |
| Details sheet with label and value | `DescriptionList` + `DescriptionItem` | Comes out as a real `<dl>`; the value accepts `Badge` and `font-mono` |
| Search field with magnifier and shortcut | `SearchInput` | `type="search"`, Esc clears; `shortcut="mod+k"` only draws the shortcut |
| Attach a file, with drag and drop | `FileUpload` + `FileUploadList` | Validates `accept` and `maxSize` on entry; uploading is the app's job, the item shows `progress` and `error` |
| The skeleton of a new application: header, sidebar, content | `AppShell` | Mounts the house `Sidebar`, the fixed header with the sidebar button, the landmarks and the "Pular para o conteúdo" link; the top of each route is still `PageHeader` |
| Route top with breadcrumb, title and actions | `PageHeader` | The title is an `<h1>`; breadcrumb and actions come in through slots |
| "Nesta página" index of a long text | `TableOfContents` | Reads the `h2`/`h3` (or `items`), marks the section being read with `aria-current` and takes focus to the heading on click; `offset` discounts the fixed header. Navigating between routes is `Sidebar` |
| "Voltar ao topo" on a long page or list | `ScrollToTop` | Only exists after `threshold` pixels, scrolls up smoothly (a jump with reduce motion) and takes focus to `<main>`; `target` for a box that scrolls |
| An action or notice that stays still in the window while the page scrolls | `Affix` | `position` per side, stacking from `--rc-z-*`, and reserves the `scroll-padding` so focus does not stop behind it; the top that sticks inside the section is `sticky` |
| Listing with query states | `DataTable` | Receives loading, error and empty ready-made |
| Listing that sorts, searches, paginates or selects | `DataTable` with `sortable`, `filter`, `pageSize`, `selectable` | All opt-in and client-side; on the server, deliver the data ready and do not ask for the feature |
| Hand-built table | `Table` and its parts | Comes out as a real `<table>` |
| An order only the person knows: issuing queue, priority, stages | `SortableList`, from `@rivocode/ui/dnd` | Drags by the handle and by keyboard, and announces each position; ordering by a criterion (amount, date) is `sortable` in `DataTable`. Optional peer: `@dnd-kit/core` and `@dnd-kit/sortable` |
| Things that move between statuses: to issue, under review, issued | `Kanban`, from `@rivocode/ui/dnd` | Columns with count and `limit`, card between columns by keyboard; a status that is only read fits in a `Badge` column of `DataTable`. It does not port to native: there it is a list per column and a "Mover para" `Menu` |
| Field where the person writes to an assistant | `PromptInput`, from `@rivocode/ui/ai` | Enter sends and Shift+Enter breaks the line; `Textarea` goes along with the form and does not send on Enter |
| The conversation with an assistant | `Conversation` + `Message` | Sticks to the end while the text arrives and lets go when the person scrolls; `Timeline` looks back |
| Tool call, with approval | `ToolCall` | Status with icon and text, and approve or reject outside the panel; `Accordion` organizes text, not events |
| Mark AI-generated content outside the conversation | `AILabel` | The reader hears it spelled out and the explanation opens on tap; record status is still `Badge` |
| Delete, archive or remove a list item when it can be undone | `ToastViewport` | Do it right away and `useToast` offers "Desfazer" through `actionProps`, with a `timeout` longer than the default. Confirming first charges everyone to protect the mistake of a few |
| Undo the deletion, the archiving or the last action | `ToastViewport` | The undo lives in the toast that confirms the action: `actionProps` with `children: "Desfazer"` and the `onClick` that restores and closes the toast |
| Delete for good, cancel an invoice, issue: what cannot be undone | `AlertDialog` | Only here does confirmation pay for itself; the title names the object and the button says the effect. A small, local item is `Popconfirm` |
| Edit a field right in the table, the list or the detail, without opening a form | `Editable` | Click, edit, Enter saves and Esc undoes; the whole row with several fields is a `Sheet` beside the list |
| Show advanced options only when the person asks | `Collapsible` | Hides what few use without taking it out of the form; several sections that open one at a time are `Accordion` |
| Registration with many fields that do not depend on one another | `Fieldset` | A single form, in sections with titles, and not a wizard: breaking it into steps only hides the size. Steps only when a stage depends on the previous one |
| Staged flow where the choice in one changes the next, with review at the end | `Steps` | `useWizard` validates each step before moving on and `WizardFooter` holds back and next; the last stage is always review |
| Save the form draft and recover it on coming back | `Form` | Going back a step and a failed submit lose nothing, because the form stays in memory. Storing in the browser to survive a reload is a project decision: only what is not sensitive, with `useLocalStorage`, cleared on submit |
| Global search: find any screen, customer or invoice from anywhere in the app | `Command` | Ctrl+K from anywhere, with `keywords` for synonyms; the field that filters only the screen's list is `SearchInput` |
| Empty screen the first time, nothing registered yet | `EmptyState` | Says what will appear there and offers to create the first one; empty because of a filter offers to clear the filter, not to create |
| Open an item's detail over the screen, without leaving it and without losing the context behind | `Sheet` | A side sheet keeps the context; list and detail always side by side is `Splitter`, `Dialog` is for a short decision, and a new page is for a task that takes over the screen |

## Every query has four endings

Loading, succeeded, failed, came back empty. `DataTable` and `ChartContainer`
take all four:

```tsx
<DataTable
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  rowKey={(invoice) => invoice.id}
  empty={{
    title: 'Nenhuma nota por aqui',
    description: 'Quando você emitir a primeira, ela aparece nesta lista.',
  }}
  columns={[
    { key: 'number', header: 'Número' },
    { key: 'customer', header: 'Cliente' },
    { key: 'amount', header: 'Valor', align: 'right' },
    { key: 'status', header: 'Situação', hideOnMobile: true },
  ]}
/>
```

The empty-state description is required on purpose: "nenhum resultado" hands
the person the work of finding out why, and they almost never do.
