---
name: rivocode-ui
description: Builds React screens with RivoCode's @rivocode/ui design system. Use when creating or changing any interface in this project - laying out a page, choosing between similar components, applying a theme, density or client color, writing a form, table or chart. Carries the library contract, the design decisions the tokens encode and the documentation address of each piece.
---

# Building UI with @rivocode/ui

RivoCode's white-label library, built on Base UI. **No component knows the
brand color**: it asks for a semantic role and the theme answers. That is what
lets the same piece serve RivoCode in one project and another client in the
next.

## Where to look for what

Read the file the work calls for, and only that one.

| Work | File |
|---|---|
| Start a new project: folders, shell, data, agent | <https://ds.rivocode.com.br/arquitetura.md> |
| Build a screen from scratch, from the request to the checked screen | [reference/method.md](reference/method.md) |
| Decide the flow: one screen or several, confirm or undo, error | [reference/fluxo.md](reference/fluxo.md) |
| Write the text: label, button, error message, empty state | [reference/texto.md](reference/texto.md) |
| Lay out the page, decide columns, spacing, responsive | [reference/layout.md](reference/layout.md) |
| Choose color, text tone, typography, depth, focus, icon | [reference/design.md](reference/design.md) |
| Choose between two similar pieces | [reference/components.md](reference/components.md) |
| Accessible name, target, focus, keyboard, heading order | [reference/a11y.md](reference/a11y.md) |
| Form with validation | [reference/forms.md](reference/forms.md) |
| Open and close, wait for typing, remember between visits, shortcut, infinite list | [reference/hooks.md](reference/hooks.md) |
| Chart and dashboard number | [reference/charts.md](reference/charts.md) |
| Conversation with an assistant, tool call, AI badge | [reference/ai.md](reference/ai.md) |
| Dress it in another client's color | [reference/theming.md](reference/theming.md) |
| React Native screen with ui-native | [reference/native.md](reference/native.md) |

## Before writing the first line

A new screen follows the loop in [reference/method.md](reference/method.md):
six steps, in order, and the check at the end. The four points below hold in
all of them.

1. **Check whether the piece already exists.** There are 134, and the catalog
   covers almost everything a product screen asks for. Writing a `<div>` with a
   border instead of a `Card`, or a native `<select>` instead of `Select`,
   breaks the theme and accessibility at once. Index at
   <https://ds.rivocode.com.br/llms.txt>.

2. **Read the piece's document before using it**, at
   `https://ds.rivocode.com.br/componentes/<kebab-name>.md`. It has the import,
   examples that run, the props table and the parts that make it up.
   `ToggleGroup` lives at `/componentes/toggle-group.md`.

3. **Never invent a prop.** If the document does not list it, it does not
   exist. A guess fails in `tsc` at best, and slips by unnoticed as a loose
   attribute in the DOM at worst. The table comes from the compiler, so it is
   the whole API, callbacks included: `onValueChange`, `onOpenChange`,
   `onCheckedChange`.

4. **Every listing has four endings**: data, loading, error and empty. `DataTable`
   and `ChartContainer` take all four by prop, and delivering only the happy
   path is delivering half the screen.
   [reference/components.md](reference/components.md) has the right order.

5. **Write the text, do not fill it in.** "Erro ao carregar", "Confirmar" and
   "Nenhum resultado" pass `tsc`, contrast and the tests, and help nobody.
   [reference/texto.md](reference/texto.md) has the shape of the three
   sentences every screen writes.

## The Provider, once, at the root

Without it nothing has style, and `Dialog`, `Menu`, `Select`, `Tooltip` and the
toasts throw, because they read its context.

```tsx
import { RivoProvider } from '@rivocode/ui'

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <InvoiceScreen />
    </RivoProvider>
  )
}
```

- `theme`: `rivocode-dark` (default), `rivocode-light` or `system`.
- `density`: `comfortable` (default) or `compact`, for operations screens.
- `scope`: `global` dresses the page; `local` dresses only that tree and paints
  its background. In a preview or an isolated card use `local`, or the content
  comes out light on light.
- `toastPosition`: which of the six corners the toast appears in. Default
  `bottom-right`.

The Provider already mounts inside it the tooltip provider, the toast wiring and
a portal container that carries the theme along. **Do not mount any of them by
hand.**

The CSS goes in once, in the project's style file:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";

@source '../node_modules/@rivocode/ui/dist';
```

The `@source` line is not optional: without it Tailwind does not scan the
library's components, does not generate the classes they use, and the screen
shows up unstyled, with no error and no clue. The Tailwind plugin also has to
be in the plugin list of `vite.config.ts`, or the result is the same silence.

**The brand fonts are a separate import.** Manrope, Poppins and JetBrains Mono
no longer come inside the library CSS: whoever wants RivoCode's faces adds one
line, and whoever dresses another client simply does not write it, and then
none of our `.woff2` files is downloaded.

```css
@import "@rivocode/ui/fonts.css";   /* optional: RivoCode's faces */
```

For the client's font, install their family and declare the three tokens in the
theme selector, together with the colors. `theming.md` has the whole recipe.

## The class vocabulary

Write layout with the same classes the components use.

**Never write a literal color or a numeric `z-index`.** The library
repository's `check` fails on it, and in your project the effect is worse: the
piece stops responding to the client's theme.

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
| Signature paper | `bg-signature-paper`, `fill-signature-ink`, `text-signature-guide`, `stroke-signature-guide`, `text-signature-disabled`: dark ink on light paper in both themes, and they are not theme roles. They belong to `SignaturePad` |
| Shape | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill` |
| Typography | `text-xs` to `text-3xl`, `font-sans`, `font-display`, `font-mono` |
| Weight | `font-rc-regular`, `font-rc-medium`, `font-rc-strong`, `font-rc-bold`, `font-rc-display`: the intent, and the number comes from the theme |
| Shadow | `shadow-1`, `shadow-2`, `shadow-3` |
| Stacking | `z-[var(--rc-z-sticky)]`, and the peers `base`, `dropdown`, `overlay`, `dialog`, `popover`, `toast`, `tooltip` |

**Every piece accepts `className` on the root, and the consumer's class beats
the piece's** (merge by group: `h-14` knocks out the Button's `h-10`). It is the
path for the client wrapper (a file in their project, with tokens and never a
literal color), instead of a fork. In layered pieces, the prop's documentation
says what it dresses. The same contract holds in `@rivocode/ui-native`.

**Below the root, dress the part by name, with `classNames`.** The `Progress`
track, the `Slider` thumb, the `Checkbox` mark, the `DataTable` row and the
`DialogContent` backdrop have outside names, the same ones as the page's
"Parts" section:

```tsx
<Slider classNames={{ track: 'bg-accent-subtle', thumb: 'shadow-glow' }} />
<DialogContent classNames={{ backdrop: 'backdrop-blur-md' }} />
<DataTable classNames={{ row: 'hover:bg-accent-subtle' }} />
```

Never reach the part through a descendant variant (`[&_tbody_tr]`): that
couples the screen to the piece's inner tree, and a `div` that becomes a `span`
inside the library breaks the screen with no warning and no error. The color
rule is the same as for `className`: token, never a literal color.

**Filling and writing text are different tokens.** `bg-danger` fills and takes
`text-danger-fg` on top; `text-danger-text` is the red that reads on the page
background. No color serves both jobs.

**Control height comes from the density**, never hardcoded:
`h-[var(--rc-control-md)]`, with `sm` and `lg` available. Hardcoding `h-10`
breaks the compact density.

## Narrow first

Every component decides the narrow behavior before the wide one, and your
layout should do the same. `Sheet` docks at the bottom on a phone, the column
with `hideOnMobile` disappears, the tab row scrolls sideways instead of
wrapping.

Write the narrow version and add `sm:` and `lg:` on top, never the other way
around.

When the decision does not fit in a utility class, read the same breakpoint the
components read, instead of writing `640` again:

```tsx
import { useMobile } from '@rivocode/ui'

const isMobile = useMobile()
```

Inside a `SidebarProvider`, use `useSidebar().isMobile`, which is the same value
without a second media query subscriber. Both return `false` on the server.

Do not wire the `Sidebar`'s phone behavior by hand: below 640px it already
becomes a sheet, already starts closed and already closes when an item is
chosen.

## Money comes out abbreviated

`currencyShort` in indicators, tables, axes, legends and tooltips: `R$ 12,4K`.
`currency`, spelled out, is for where the cent is the subject, like the amount
the person confirms before issuing and the receipt afterwards.

Never type the already-abbreviated amount as text. Writing `R$ 12,4K` by hand
shows the result and hides the mechanism, and breaks on the first data change.

## The field comes from the data

Before writing an `Input`, ask what data it receives. CPF, CNPJ, phone, CEP,
license plate, boleto and card have a ready mask in `MaskedInput`; a date is
`DatePicker`, a time is `TimeField`, money is `CurrencyInput`, a verification
code is `OTPField` and a CEP that fills in an address is `PostalCodeField`. The
whole table, with the validator and what is stored for each, is in
[reference/components.md](reference/components.md).

Three rules hold for all of them:

- **The mask punctuates; the validator says whether the number exists**:
  `isValidCpf`, `isValidCnpj`, `isValidPlate`, `isValidBoletoLine`, in the
  schema, checked when leaving the field and not on every keystroke.
- **Store the raw value, not what the screen shows.** `MaskedInput`'s
  `onValueChange` delivers both, and the server understands the second; money
  goes in integer cents.
- **The right `autoComplete` and `inputMode`** let the phone autofill and open
  the number keyboard: `tel-national`, `email`, `cc-number`, `one-time-code`.

## What never to do

- A literal color in `className` or in `style`. Always a token.
- A numeric `z-index`. Always `z-[var(--rc-z-…)]`. There are eight steps, and
  the ones your screen writes are the ends: `--rc-z-sticky` for a header, a
  frozen column and a bar that sticks on scroll, `--rc-z-base` to go back to
  the content plane. The six in the middle belong to the pieces, which already
  rise on their own - and what opens from inside a layer (`Select` in a
  `Dialog`, `AlertDialog` in a `Popover`) rises above it, as long as it is
  mounted inside its content.
- A hardcoded control height. Always `var(--rc-control-…)`.
- Mounting `TooltipProvider`, `ToastViewport` or a portal container by hand.
  The Provider already did.
- Using `Toast` for what needs to stay visible, or `Dialog` for what must not
  be dismissable by clicking outside.
- Inventing a prop without checking the piece's `.md`.
- Writing the label of a `Checkbox`, `Radio` or `Switch` in a `<span>` beside
  it. Pass it as a child and they wrap themselves in a `<label>`.
- Repeating the same `ChartAreaGradient` `id` in two charts on the same page:
  an SVG `id` is global, and one paints with the other's gradient.
- Leaving a grid or flex item without `min-w-0` when there is wide content
  inside.
- `outline-none` without restoring `focus-visible:ring-2 focus-visible:ring-ring`.
- Using `placeholder` as if it were a label. It disappears on typing, and
  several screen readers do not announce it: the field ends up without a name.
- An icon-only button with no name. Use `IconButton`, which requires `label`.
- Interface text in English. **Code in English, content in PT-BR.** Ecosystem
  terms are not translated: it is "agents", not "agentes".

## Addresses

| What | Where |
|---|---|
| Index of everything | <https://ds.rivocode.com.br/llms.txt> |
| Everything in a single file | <https://ds.rivocode.com.br/llms-full.txt> |
| Full contract | <https://ds.rivocode.com.br/convencoes.md> |
| One piece | `https://ds.rivocode.com.br/componentes/<kebab-name>.md` |
| One guide | `https://ds.rivocode.com.br/<slug>.md`, like `/temas.md` |
| A whole system, assembled | <https://ds.rivocode.com.br/demonstracao> |
