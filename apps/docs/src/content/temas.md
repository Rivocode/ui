No component in the library knows the brand color. It asks for a role, "the
accent color", "the raised surface", and the theme answers. That is what lets
the same piece serve RivoCode in one project and a client in the next, without
touching a component.

## The three layers

```
Layer 1  palette     --rc-p-lima-500: oklch(...)       the raw color, with no opinion
Layer 2  contract    --color-accent: var(--rc-accent)  becomes bg-accent in Tailwind
Layer 3  theme       --rc-accent: var(--rc-p-lima-500) who plays the role, here
```

The **palette** is a dictionary of colors. The **contract layer** links each
role to Tailwind's vocabulary: every name there becomes a utility, so
`--color-surface` produces `bg-surface`, `text-surface` and `border-surface`,
inside the library and in the layout you write. The **theme** is the only layer
that decides which color plays which role.

Switching clients is rewriting layer 3. Nothing else.

## The two ready-made themes

```tsx
<RivoProvider theme="rivocode-dark">   {/* default */}
<RivoProvider theme="rivocode-light">
<RivoProvider theme="system">          {/* follows the operating system */}
```

With `system`, the Provider reads `prefers-color-scheme` and follows the change
while the page is open; it is not just the initial read.

The `data-rc-theme` the Provider writes also **paints the background and the
text color** of the element that carries it. With `scope="global"` that is the
page; with `scope="local"`, only that tree.

## Fill and text are different tokens

This is the distinction that saves the most time later:

```tsx
<div className="bg-danger text-danger-fg">Botão vermelho, texto por cima</div>
<p className="text-danger-text">Mensagem de erro sobre o fundo da página</p>
```

`bg-danger` is the red that **fills** and takes `text-danger-fg` on top.
`text-danger-text` is the red that **is read** on the background. No single
color does both well: the one with contrast as text cannot hold white text on
top, and the one that can is too light to read. The same goes for the accent,
for `success`, `warning` and `info`.

## Every role

A complete theme declares all of the ones below; if one is missing, the
component that uses it falls back to the previous theme's value, and the
symptom is usually an isolated RivoCode color in the middle of the client's
blue. After them come three finish roles (gradient, glow and glass) that are
the only optional ones.

### Surface

| Token | Class | What it dresses |
|---|---|---|
| `--rc-bg` | `bg-bg` | The page background |
| `--rc-surface` | `bg-surface` | Card, panel, field |
| `--rc-surface-raised` | `bg-surface-raised` | What stands out from the rest: menu, tooltip, table header |
| `--rc-overlay` | `bg-overlay` | The dark scrim behind a dialog and a sheet |

### Text

| Token | Class | What it dresses |
|---|---|---|
| `--rc-fg` | `text-fg` | Main text |
| `--rc-fg-muted` | `text-fg-muted` | Supporting text, secondary paragraph |
| `--rc-fg-subtle` | `text-fg-subtle` | Label, caption, column header |
| `--rc-fg-disabled` | `text-fg-disabled` | Disabled control |

### Accent

| Token | Class | What it dresses |
|---|---|---|
| `--rc-accent` | `bg-accent` | The brand fill: primary button, selection mark |
| `--rc-accent-hover` | - | The same with the pointer over it |
| `--rc-accent-active` | - | The same at the moment of the click |
| `--rc-accent-fg` | `text-accent-fg` | What is read **on** the accent |
| `--rc-accent-text` | `text-accent-text`, `bg-accent-text` | The accent that is read **on the background**: link, active item, the track of a switch that is on |
| `--rc-accent-subtle` | `bg-accent-subtle` | Faint background of a checked item, menu item under the pointer |

### Line, focus and row state

| Token | Class | What it dresses |
|---|---|---|
| `--rc-border` | `border-border` | The ordinary line |
| `--rc-border-strong` | `border-border-strong` | A control's border, which needs to be seen |
| `--rc-border-disabled` | `border-border-disabled` | A locked control's border, which needs to be seen **less** |
| `--rc-line-hover` | - | The border with the pointer over it |
| `--rc-ring` | `ring-ring` | The keyboard focus ring |
| `--rc-selected` | `bg-selected` | The chosen row in a table. A large area calls for low alpha |
| `--rc-skeleton` | `bg-skeleton` | The loading placeholder |

### States

Four families with four roles each, always in the same shape:

| Pattern | Class | What it dresses |
|---|---|---|
| `--rc-<state>` | `bg-<state>` | Fills |
| `--rc-<state>-fg` | `text-<state>-fg` | What is read on the fill |
| `--rc-<state>-text` | `text-<state>-text` | The color that is read on the page background |
| `--rc-<state>-subtle` | `bg-<state>-subtle` | Faint notice background |

Where `<state>` is `success`, `warning`, `danger` or `info`. That is sixteen
tokens, and none of them is optional: an `Alert tone="warning"` without
`--rc-warning-subtle` comes out with no background.

Danger is the only state that also becomes a solid button, so `--rc-danger`
and `--rc-danger-fg` need button contrast, not just label contrast.

### Chart

| Token | What it dresses |
|---|---|
| `--rc-chart-1` to `--rc-chart-8` | The eight series, **in the order they should be used** |
| `--rc-chart-grid` | The background grid |

They have their own 3:1 guard against the surface. **A client theme that does
not declare them draws charts with no series color.**

In CSS always use `var(--rc-chart-1)`, never the `bg-chart-1` class: that class
does not exist in the compiled stylesheet, because Tailwind only generates what
it finds while scanning, and the result would be a color that never resolves,
silently.

### Shadow and brand typography

| Token | What it dresses |
|---|---|
| `--rc-shadow-1` to `--rc-shadow-3` | `shadow-1`, `shadow-2`, `shadow-3`: row, panel, overlay. Each one already carries the 1px hairline that separates the floating element from the page |
| `--rc-glow-accent` | `shadow-glow`: the accent's lantern, opt-in (landing hero and a CTA that deserves ceremony); no component turns it on by itself. For the **theme** to light up without each screen asking, see `--rc-accent-shadow` further on |
| `--rc-text-display` | Marketing title size, in `clamp()` |
| `--rc-text-hero` | Hero size, in `clamp()` |
| `--rc-font-sans` | `font-sans`: the body family, and the default for the whole tree |
| `--rc-font-display` | `font-display`: the display family, the one that carries the brand |
| `--rc-font-mono` | `font-mono`: the code family, numeric tables and `Kbd` |

The marketing steps live in the theme and not in the core on purpose: an
operations system never uses them, and a brand site wants its own. The glow
follows the same logic: in the dark theme the lime lights up, in the light one
its darkened tone does the shading, and a client theme decides its own glow.

**The font is a theme role, not a scale.** Both house themes declare the three
families, and a client theme that does not declare them ends up with **no
family at all**: the tree falls back to the browser font, exactly as happens
with a theme that forgets `--rc-bg`. There is no `:root` value underneath to
break the fall, and that is deliberate: a silent system font underneath would
make the gap look like a choice, and the client would find out months later
that half the screen never wore their brand.

RivoCode's families (Manrope, Poppins and JetBrains Mono) **no longer come
with `styles.css`**. Whoever wants the brand imports the separate faces file;
whoever wears another font installs theirs and never downloads ours:

```css
@import "@rivocode/ui/styles.css";
@import "@rivocode/ui/fonts.css";   /* only for whoever wants RivoCode's faces */
```

To dress the client's font, install the family and point the three tokens in
the same theme selector where you already declared the colors:

```css
@import "@rivocode/ui/styles.css";
@import "@fontsource-variable/inter";

[data-rc-theme="cliente-acme"] {
  --rc-font-sans: "Inter Variable", system-ui, sans-serif;
  --rc-font-display: "Inter Variable", system-ui, sans-serif;
  --rc-font-mono: ui-monospace, SFMono-Regular, monospace;

  /* …and the fifty color roles. */
}
```

Notice that `@rivocode/ui/fonts.css` does **not** show up there: that is how
two clients live together in the same application, each with its own family,
and neither of them loading RivoCode's 220 KB of `.woff2`.

The [theme builder](/tema) picks the three families from a curated Google Fonts
list and writes the CSS above on its own: the fontsource `@import` lines at the
top, the Google `<link>` commented out as an alternative, each role's fallback
stack and the `bun add` for the packages.

#### Load the font on the web without a flash

- **Preload only the body face.** It is the one that paints the first
  paragraph; the display and code ones can arrive later. With fontsource in
  Vite, the file has a fixed name inside the package and `?url` returns the
  hashed path:

  ```tsx
  import inter from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";

  <link rel="preload" href={inter} as="font" type="font/woff2" crossOrigin="anonymous" />
  ```

  The `crossOrigin` is not decoration: fonts are always downloaded in CORS
  mode, and a preload without it is discarded and downloaded again. Preloading
  all three competes for bandwidth with the CSS and the JavaScript, and delays
  exactly what it was supposed to speed up.
- **`font-display: swap`.** The text shows up right away in the fallback font
  and swaps when the family arrives, instead of staying invisible for up to
  three seconds. Fontsource already declares it that way, and the Google link
  needs `&display=swap`, which the builder writes.
- **Only the `latin` subset.** Portuguese fits entirely in it, accents and `ç`
  included. The variable package declares every subset with `unicode-range`,
  and the browser only downloads what the page uses; with the static one,
  import `latin-400.css`, `latin-600.css` and so on, instead of `400.css`,
  which also declares Cyrillic, Greek and Vietnamese.
- **Do not import `@rivocode/ui/fonts.css` alongside a client font.** It
  declares Manrope, Poppins and JetBrains Mono, and the bundler copies the
  files into the build even if the theme uses none of them. Worse: any part of
  the tree still dressed in the house theme (the screen before the client's
  provider mounts, a portal outside the scope) downloads RivoCode's faces and
  paints with them. That is two families per page and a font swap nobody
  ordered. If a role keeps the house font, import only its package, as the
  builder does.

#### Font weight is a token, and has an intent name

Changing the family without changing the weight is half a change. The house
Poppins has titles at 600; the client's font may have titles at 700, or no 600
at all. That is why the pieces do not write `font-medium` or `font-semibold`:
they write the intent, and the number lives in a token the theme can redefine.

| Token | Class | Default | What it dresses |
|---|---|---|---|
| `--rc-weight-regular` | `font-rc-regular` | 400 | The body, and the stretch that goes back to normal inside a label |
| `--rc-weight-medium` | `font-rc-medium` | 500 | Field label, button, tab, badge, table header, notice title |
| `--rc-weight-strong` | `font-rc-strong` | 600 | Strong emphasis in the body: the `Kanban` card title, `AiLabel`, `Text weight="semibold"` |
| `--rc-weight-bold` | `font-rc-bold` | 700 | The bold of rich text and `Text weight="bold"` |
| `--rc-weight-display` | `font-rc-display` | 600 | All text in `font-display`: `Heading`, the titles of `Card`, `Dialog`, `Sheet`, `PageHeader`, the `Stat` value |

The five live in `src/tokens/forma.css`, with a `:root` value underneath, and
are **optional** in the theme: whoever does not declare them keeps the house
weight. Declare them in the same selector as the colors and the families:

```css
[data-rc-theme="cliente-acme"] {
  --rc-font-display: "Lato", system-ui, sans-serif;
  --rc-weight-display: 700;   /* Lato has no 600 */
}
```

`font-rc-display` always goes alongside `font-display`: the first class picks
the family, the second the weight. Tailwind's classes (`font-medium`,
`font-semibold`) still compile for your screen, but they do not follow the
theme; use the intent ones when the text needs to follow the brand.

The [theme builder](/tema) does the math on its own: when you pick a family
without the weight a token asks for, it writes the token with the **closest
available** weight, by the same matching rule the browser uses. Lato in the
display role comes out with `--rc-weight-display: 700`, and DM Serif Display,
which only has 400, comes out with 400, instead of the browser drawing a
synthetic bold on top of it.

In React Native the five come out in the package's `theme.css` as
`--font-weight-rc-*`, with the same values, and an app `@theme` overrides them
before compiling, as it does with the colors.

### Finish: gradient, glass and glow

Three roles that do not paint color, but what goes on top of it. They are the
guide's **only optional ones**: absent, the gesture simply does not happen, and
that is how both house themes are born: all three declared as `none`.

| Token | Where it lands | The gesture |
|---|---|---|
| `--rc-accent-image` | `background-image` of whoever wears `bg-accent` | The accent as a gradient |
| `--rc-accent-shadow` | `box-shadow` of the same `bg-accent` | "In this theme the primary glows", without `shadow-glow` on any screen |
| `--rc-overlay-filter` | `backdrop-filter` of the scrim, `bg-overlay` | Frosted glass behind a dialog, a sheet and the command palette |

The finish travels with the role, not with the piece: whoever already wore
`bg-accent` gets the gradient and the glow, whoever already wore `bg-overlay`
gets the glass. That is what makes the scrim reachable: it is an inner node of
the portal, and `classNames={{ backdrop }}` solves **one screen**, while the
token solves the whole theme, in the four pieces that have a scrim, at once.

Four things to know before using it:

- **The class of whoever writes the screen still wins.** The rules are
  `:where()`, with zero specificity: a `bg-none` or a `shadow-none` in the
  `className` undoes the finish on that piece, and a `bg-linear-to-r` of yours
  replaces the theme's gradient.
- **The gradient covers the color.** `background-image` paints over
  `background-color`, so with an opaque gradient the Button's
  `hover:bg-accent-hover` happens underneath and nobody sees it. Give the
  gradient alpha and the hover shows through it again.
- **A disabled button is left out.** Button neutralizes the dead primary by
  swapping the background color, and the gradient would survive that swap; the
  rule excludes it. Loading is not disabled for this purpose: there the color
  still says which action is in progress.
- **The reach is `bg-accent` written directly**: primary button, progress bar.
  An accent that only arrives under a state, like the checkbox's
  `data-[checked]:bg-accent`, compiles under another class name and does not
  get the finish.

In React Native the three do not cross over: gradient and `backdrop-filter`
are not `View` properties, and the native theme generator silently ignores
them, as it already does with `box-shadow` and `clamp()`. They are web roles.

#### A futuristic theme, all three at once

```css
/* tema-neon.css */
[data-rc-theme="neon"] {
  color-scheme: dark;

  --rc-bg: oklch(16% 0.02 285);
  --rc-surface: oklch(21% 0.03 285);
  --rc-surface-raised: oklch(26% 0.03 285);

  /* With glass, the usual black scrim turns into mud: it lightens and blurs. */
  --rc-overlay: oklch(14% 0.04 285 / 0.55);
  --rc-overlay-filter: blur(10px) saturate(130%);

  --rc-accent: oklch(64% 0.21 300);
  --rc-accent-hover: oklch(70% 0.21 300);
  --rc-accent-active: oklch(58% 0.21 300);
  --rc-accent-fg: oklch(99% 0 0);

  /* Alpha on purpose: the gradient covers the color, and without it the
     Button's hover happens underneath, invisible. */
  --rc-accent-image: linear-gradient(
    135deg,
    oklch(64% 0.21 300 / 0.92),
    oklch(72% 0.16 200 / 0.92)
  );

  /* The glow stops being decoration each screen turns on and becomes an accent state. */
  --rc-accent-shadow: 0 0 28px oklch(64% 0.21 300 / 0.45);

  /* …and the fifty required roles. */
}
```

What changes on screen, without a line of component or page code: the primary
button comes out in a violet→cyan gradient and lights up on its own, and goes
back to flat purple when disabled; the scrim of `Dialog`, `AlertDialog`,
`Sheet` and `Command` becomes frosted glass.

### Shape and motion

Color is not the only thing a theme decides. Square corners and crisp motion
say "futuristic" before any color, and these tokens live in
`src/tokens/forma.css`, outside the scale, precisely so the theme can redefine
them:

| Token | What it decides |
|---|---|
| `--rc-radius-sm` to `--rc-radius-xl` | The corner of field, card, panel and dialog |
| `--rc-radius-pill` | The pill: switch, badge, avatar, bar |
| `--rc-duration-fast`, `--rc-duration-base`, `--rc-duration-slow` | The time of each transition |
| `--rc-duration-sheet`, `--rc-ease-sheet` | The time and curve of the side sheet, which follows the finger |
| `--rc-ease` | The curve of everything else: crisp and mechanical, or soft |
| `--rc-ease-enter`, `--rc-ease-exit` | The curve of what arrives and of what leaves |
| `--rc-ease-spatial`, `--rc-ease-expressive`, `--rc-ease-effects` | The three springs, with each one's duration. See Motion, just below |
| `--rc-tracking-display`, `--rc-tracking-tight` | The title's letter spacing |
| `--rc-weight-regular` to `--rc-weight-display` | The weight of each text intent. See "Font weight is a token", above |

Redefine them in the same theme selector, along with the color roles:

```css
[data-rc-theme="acme"] {
  --rc-radius-md: 0px;                          /* square corner */
  --rc-duration-base: 140ms;                    /* crisp motion */
  --rc-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

The order is already settled by the preset: `forma.css` comes before the
themes, and `:root` and `[data-rc-theme="x"]` have the same specificity, so the
theme wins.

### Motion

Motion has an intent name, not a number. The duration says how far the thing
travels; the curve says how it arrives.

| Duration | Utility | What for |
|---|---|---|
| `--rc-duration-fast`, 120ms | `duration-fast` | A state change: color, border, the mark that appears |
| `--rc-duration-base`, 200ms | `duration-base` | The panel that opens, the dialog that comes in |
| `--rc-duration-slow`, 320ms | `duration-slow` | What travels across the screen: a chart that draws itself, a bar that fills |
| `--rc-duration-sheet`, 450ms | `duration-sheet` | The side sheet, which follows the finger |

| Curve | Utility | What for |
|---|---|---|
| `--rc-ease` | `ease-rc` | The default: leaves fast and settles slowly |
| `--rc-ease-enter` | `ease-rc-enter` | What enters the screen: arrives braking |
| `--rc-ease-exit` | `ease-rc-exit` | What leaves: speeds up and vanishes, without pulling the eye back |
| `--rc-ease-sheet` | `ease-rc-sheet` | The side sheet |

The springs come from M3 Expressive, which separates what **moves** from what
only **changes appearance**. A spring that overshoots the target and comes back
is good for position and size, and bad for color and opacity: a color that
overshoots blinks.

| Spring | Utilities | What for |
|---|---|---|
| `--rc-ease-spatial`, `--rc-duration-spatial` | `ease-rc-spatial duration-spatial` | Position and size. It overshoots by a hair, and it is the default spring |
| `--rc-ease-expressive`, `--rc-duration-expressive` | `ease-rc-expressive duration-expressive` | The same, with more body: it overshoots by 1.5% and comes back. For the moment that deserves to be noticed |
| `--rc-ease-effects`, `--rc-duration-effects` | `ease-rc-effects duration-effects` | Color and opacity: arrives without overshooting |

```tsx
<div className="transition-[translate] duration-spatial ease-rc-spatial" />
```

The spring curve is a CSS `linear()`: the spring's position sampled at 41
points, from the start until it settles within a thousandth of the target. The
recipe for each one sits next to it, in `--rc-spring-spatial-damping` and
`--rc-spring-spatial-stiffness`, `--rc-spring-expressive-damping` and
`--rc-spring-expressive-stiffness`, `--rc-spring-effects-damping` and
`--rc-spring-effects-stiffness`: the damping (1 arrives without overshooting,
less than 1 overshoots and comes back) and the stiffness (stiffer, faster).
**The browser reads only the `linear()` and the duration.** The two numbers
are what React Native and Figma read, because neither of them has `linear()`.
If you changed the recipe in a theme, recompute the curve and the duration
along with it; in the library, a test redoes the math and flags the divergence
with the right line to paste.

When the person asks the system for less motion, **every** duration goes to
zero, the springs' included. The curve stays, but a 0ms transition has no
curve to show.

Six transitions in the catalog, in `Alert`, `DataTable`, `Sidebar`, `Table`
and `Toast`, still run on Tailwind's default curve, not `ease-rc`. Their
duration is already a token. Changing the curve changes what is seen, so they
stay as they are until someone looks at those five pieces again.

## What the theme needs to guarantee

The roles are not independent. These relationships need to hold, and the first
five are measured by `bun run check`. A theme that breaks them fails in CI, not
on the client's screen:

| Invariant | Why |
|---|---|
| `--rc-border-strong` at 3:1 against the surface | It is the boundary that identifies the control (WCAG 1.4.11). Below that the field does not stand out from the page |
| `--rc-border-disabled` above 1.6:1 against the surface, and 1.4× **below** `--rc-border-strong` | It is the only role with a ceiling as well as a floor. Too faint, the locked control vanishes; equal to the live one, it looks identical to the control that still responds, and WCAG 1.4.11 exempts inactive components from 3:1 precisely to open that band |
| `--rc-<state>-text` at 4.5:1 on `--rc-<state>-subtle` | It is the pair the person reads in the `Alert`, not the text against `--rc-bg`. The alpha is composited before measuring |
| `--rc-ring` at 3:1 against `--rc-bg` and against `--rc-surface` | Focus needs to show on both backgrounds, not just one |
| `--rc-accent-text` at 3:1 over `--rc-skeleton` **composited** on the background | It is the fill and the border of the `Slider` thumb against the empty track (WCAG 1.4.11). Tied, the full track weighs the same as the empty one and nobody reads how far it has gone. The track carries alpha, so the gray measured is what is left of it over the page and over the card |
| `--rc-skeleton` different from the surface | It is the placeholder of what is loading, and the body of `Avatar`. Equal to the surface, both vanish |

`--rc-surface` and `--rc-surface-raised` **can** be the same color: in the
house light theme both are pure white, and a white card on a gray page is the
pattern of nine out of ten dashboards. No component may depend on that
difference to exist visually; whoever needs its own body wears
`--rc-skeleton`, and whoever needs to say "locked" wears
`--rc-border-disabled`. Both tokens exist for the same reason: they are the way
out for whoever tripped over white on white and tried to solve it by raising
the surface.

## What does **not** go into the theme

Control height and breathing room live in `src/tokens/scales.css` and apply to
every theme. A theme that redefines `--rc-control-md` is solving density in
the wrong place; that is what `density="compact"` is for, and it changes the
whole scale at once. Text scale and stacking follow the same rule: they are
structure, and changing them would stop being a theme.

`--rc-code-ink` and `--rc-code-paper` live there too, for another reason: they
are the ink and the paper of machine-read code, `QRCode` and `PixCode`. Code
read by a camera is always dark on light, and the inverted reflection (a light
module on a dark background) is a QR code that some banking apps cannot read.
If the pair were a theme role, every client would have to declare two colors
whose only right answer is black and white, and a dark theme could invert the
code by accident. `check-theme` does not ask for them; if a theme declares them
anyway, it measures the ink on the paper at 15:1 and fails ink lighter than the
paper.

So do the `--rc-media-*`: they are the stage of the full-screen
`ImageViewer`, dark in both schemes, like the phone's gallery. If they were
theme roles, a client's light theme would lighten the photo screen by
accident. The house `check:contrast` measures the stage pairs (text at 4.5:1,
icon, outline and ring at 3:1) and fails a house theme that declares them.

The `--rc-signature-*` follow the same math: they are the `SignaturePad`'s
paper, dark ink on light paper in both schemes, because the exported signature
goes onto a white document and cannot come out light. `check:contrast` measures
the ink and the "Assine aqui" at 4.5:1, the baseline at 3:1, and fails ink
lighter than the paper and a house theme that declares them.

## A client theme, from start to finish

Say the client is blue.

**1. Declare the roles in a theme selector.** Only the roles; the palette can
be yours or ours:

```css
/* tema-acme.css */
[data-rc-theme="acme"] {
  color-scheme: dark;

  --rc-bg: oklch(21% 0.02 250);
  --rc-surface: oklch(26% 0.02 250);
  --rc-surface-raised: oklch(31% 0.02 250);
  --rc-overlay: oklch(0% 0 0 / 0.62);

  --rc-fg: oklch(97% 0.01 250);
  --rc-fg-muted: oklch(82% 0.01 250);
  --rc-fg-subtle: oklch(64% 0.01 250);
  --rc-fg-disabled: oklch(50% 0.01 250);

  --rc-accent: oklch(62% 0.19 250);
  --rc-accent-hover: oklch(66% 0.19 250);
  --rc-accent-active: oklch(58% 0.19 250);
  --rc-accent-fg: oklch(99% 0 0);
  --rc-accent-text: oklch(74% 0.16 250);
  --rc-accent-subtle: oklch(62% 0.19 250 / 0.14);

  --rc-border: oklch(100% 0 0 / 0.1);
  --rc-border-strong: oklch(100% 0 0 / 0.14);
  --rc-line-hover: oklch(100% 0 0 / 0.26);
  --rc-ring: oklch(62% 0.19 250);
  --rc-selected: oklch(62% 0.19 250 / 0.08);
  --rc-skeleton: oklch(100% 0 0 / 0.08);

  /* …and the four state families, the eight chart series,
     the three shadows and the two brand sizes. */
}
```

**2. Import it after the preset**, so your layer 3 wins:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";
@import "./tema-acme.css";

@source '../node_modules/@rivocode/ui/dist';
```

**3. Dress the tree:**

```tsx
<RivoProvider theme="acme">
```

The prop accepts your theme's name, not just the two house ones. To keep the
choice in a selector, the type is `RivoThemeSetting` (the house ones, `system`
and the client's name), with autocomplete for the known ones preserved:

```tsx
const [theme, setTheme] = useState<RivoThemeSetting>("acme")
```

The `color-scheme` on the first line is not decoration: without it the browser
draws the scrollbar, the date field and the native menu in the wrong scheme,
and no token reaches those pieces.

**4. Check that no role is missing:**

```bash
npx rivocode-ui check-theme src/tema-acme.css
```

The command ships in the package and runs in **your** project, which is where
the theme lives. It reads the files you pass, groups the declarations by theme
selector, and asks for the fifty-five required roles. If any is missing it
exits with code 1, so one line in CI stops the break before the deploy:

```yaml
- run: npx rivocode-ui check-theme src/temas/*.css
```

Pass **all** the files that make up the theme at once. If you split color and
typography into two files, the command only joins them if both are in the same
call; what it did not read counts as missing. With `--json` the output becomes
an object with `ok` and the list of roles, for your pipeline to read without a
regex.

**5. And let it measure the contrast.** After completeness, the same command
measures the 76 pairs per theme: the text over the three backgrounds, WCAG
1.4.11's 3:1 control boundary, the focus ring, the eight series colors, the
checked `Switch` track and the pairs where the background is alpha and needs
to be composited before measuring. It is the same math and the same table the
design system holds itself to — it lives in a module of the package, not in a
scripts folder npm does not ship.

The order of the two questions is a decision: missing roles first, because
measuring the contrast of a role that does not exist falls back to the
inherited value and returns a pretty number by accident. If a role is missing,
the command stops before measuring.

**The math reads the modern color spaces, and converts everything to sRGB
before measuring.** 3, 4, 6 and 8-digit hex, `rgb()`, `rgba()`, `hsl()`,
`hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` and `color()` in
CSS's predefined spaces. Tailwind 4's palette is written in `oklch()`, so a
color copied from there goes straight in, without a converter — which was the
most common way to dress a client and the only one that came out **unmeasured**.

Two things are left out, both because no measurement is possible:
`color-mix()`, which is not a color but a calculation whose result depends on
the interpolation space and the hue method; and a CSS color name, like
`rebeccapurple`, because the package does not carry the name table. Those come
out unmeasured and the command fails, instead of staying green without having
looked — what is not measured is not promised.

**A color sRGB cannot reach is measured at the value the screen shows.**
Almost a third of Tailwind 4's palette — 82 of the 286 named colors — describes
a tone outside the sRGB gamut: `red-500`, `blue-500` and friends are in that
range. The browser clips the excess channel by channel when painting, and that
clipped pixel is what the person sees and what the math measures. The command
says which roles fell there, and to what value:

```
note   2 roles describe a tone outside sRGB. The screen clips the excess channel
       by channel, and the clipped value is what was measured — the same pixel
       the browser paints: accent (oklch(63.7% 0.237 25.331) → #fb2c36), ring (…)
```

Refusing would be easier and would say less: it would shut the door on
precisely the most copied colors there are, and the number that matters — the
contrast of what is on screen — is that of the clipped value.

**The React Native map goes through the same command.** The extension tells
the two forms apart: `.css` is the web's layer 3, and `.ts`, `.mjs` or `.js`
is the object with `light` and `dark` that `@rivocode/ui-native`'s
`RivoProvider` receives — the file `bun run gen:native --theme` writes.

```bash
npx rivocode-ui check-theme acme.theme.ts
```

In the native project the same table of pairs is in
`@rivocode/ui-native/contrast`, to measure in code without installing the web
package.

### What it says, and why it is not just the token name

"Missing `--rc-font-sans`" makes nobody fix anything. What does is the line
below it:

```
[data-rc-theme="neon"]   (src/tema-neon.css)
  52 of 55 roles. 3 missing.

  SILENT BREAKAGE, which is why nobody reports it:

    --rc-font-sans
      The whole page falls back to the browser font. There is no `:root` value
      underneath to break the fall, and that is on purpose: `tsc` compiles,
      Vite builds, and the only thing wrong is the screen.
      New role in 0.7.0: the three families left `src/tokens/scales.css`,
      which is a global layer, and moved inside the theme selector. A theme
      written for 0.6.x compiles, builds and renders with no family at all.
```

Three things it decides, and the reason for each:

- **It asks for the color roles too, not only the ones that break silently.**
  A theme without `--rc-accent` comes out obviously wrong; one without
  `--rc-font-sans` does not. Both fail, and the difference is in the
  presentation: the gaps come split into silent breakage and visible
  breakage. "Visible" means visible **on the screen that uses the role**, not
  on the one you opened to check. A missing `--rc-warning-subtle` only shows
  on the screen that has `Alert tone="warning"`, and it may be none of the
  three you looked at. Asking only for the font would teach that the rest is
  optional, and the rest is not.
- **It warns when the role was born in a new version.** That is the case of
  the font in 0.7.0 and of `--rc-border-disabled` in the same version: whoever
  wrote the theme for the previous version has no way of knowing something
  went missing, because nothing in the upgrade says so. Running the command
  right after bumping the version is the cheap moment to find out.
- **The output serves both readings.** Text for whoever is going to fix it,
  `--json` for whoever is going to automate it, and the exit code for both: 0
  when every theme is complete, 1 when a role is missing, and also 1 when no
  theme block was found in the files passed, so the command does not pass
  green for having looked at nothing.

The three finish roles are the only ones it does not ask for, because they are
the only optional ones. The shape tokens are left out too: they have a `:root`
value underneath, and missing one of them leaves nothing without a value.

## The same theme in React Native

The file you just wrote dresses both platforms, and **the source is one on
purpose**: a second place to maintain a client's color is how the promise
breaks in practice, not by decision, by silent drift six months later.

What changes is **when** the color is decided. On the web layer 3 is read at
runtime, and `<RivoProvider theme="acme">` switches the whole page with it
open. In React Native the `react-native-css` compiler resolves the token **at
build time** and bakes the value into the rule: `.bg-accent` becomes
`{"backgroundColor":"#d4f34a"}`, literal, and in the 56 KB of compiled CSS
there is **not a single occurrence of `--`** left. There is no live variable
to redefine afterwards.

Written once, for whoever is deciding now: **a client theme on native is CSS
generation, not a runtime switch.** What switches at runtime there are the two
house themes, because they were born inside the `light-dark()` the compiler
understands.

### The path that works: override the roles before compiling

An `@theme` of yours in the app's `global.css`, after the package's
`theme.css`, with the roles the brand changes. It is the same layer 3 as
always, written in the `--color-*` vocabulary the native compiler reads:

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

Then `npx rivocode-ui-native-css`, and the app imports `generated.css` as
always. From there on the screen belongs to the client wherever the class
paints: background, card, button, badge, border, chart series.

**And this path has a ceiling: two themes per build.** Each role comes out as
`light-dark(light, dark)`, and `light-dark()` has two slots, a light one and a
dark one. One client's app fits comfortably, and it is the normal case. A
showcase of five themes, like the one this site has on the web, **does not
fit**: that is five bundles. It is an architectural ceiling, not a pending
item.

### The app's `@theme` now dresses the WHOLE screen, charts included

Until 08/27/2026 this path dressed only half: the color painted by class
followed the brand, and the color the piece reads through JS - the
`ChartDonut` slice, the `Switch` track, the `Button` spinner - kept coming from
RivoCode's token map. The symptom **was not the missing brand: it was the mixed
screen**, and that is what cost a day of debugging.

Not anymore. `RivoProvider` resolves the 45 roles **by reading the compiled
CSS**, one `bg-` class per role, and publishes the result on the context the
pieces already read. So what you override in `@theme` reaches both sides at
once: class and context always say the same color.

### The `theme` prop no longer takes a map

```tsx
<RivoProvider theme="rivocode-dark">
```

**The map is gone.** It never reached the color painted by class, and keeping
one half that disagrees with the other was worse than having none. It went
through `@deprecated` and a `__DEV__` warning, and now it no longer exists: the
`theme` prop accepts only `rivocode-dark`, `rivocode-light` and `system`. The
`scheme` prop went with it, because it was what picked the map's scheme.

The generator still emits the map file -
`bun run gen:native --theme tema-acme.css` -, now only as a missing-role check
and as input to the contrast measurement. To dress the screen, use the
`@theme` above.

### The rule the pieces follow

A piece that paints outside the class (the `Switch` track, the `Button`
spinner, the `Sparkline` color, the `ChartDonut` slice) reads the roles from
the context (`useRivo().colors`), and never from `tokens.themes`. The context
now IS the compiled CSS, so reading from there is reading the same color the
class paints. Reading `tokens.themes` directly, the piece would go back to
disagreeing with the client's screen, and there is a test that fails if
anyone goes back to reading it directly.

In `react-native-web` - the bench where you inspect the tree and take
snapshots without a simulator - the read comes from the document's
`getComputedStyle`, not from `useCssElement`: there the class becomes a
`className` in the DOM, and the browser is what resolves `var()` and
`light-dark()`. Same color, same source, a different reader.

## How to ask an agent for this

This guide's raw address is
[`/temas.md`](https://ds.rivocode.com.br/temas.md). A prompt that usually
works:

```
Read https://ds.rivocode.com.br/temas.md and write the complete "acme" theme,
with all fifty roles. The brand is blue (#2563eb), dark background.
Then check the text-on-background contrast of each pair.
```

Asking for "all fifty roles" matters: without it the agent writes the ten
obvious ones and leaves charts and states without color, which is exactly the
silent failure the list above exists to prevent.

## The guards

The library repository has locks that run in `bun run check`, and they exist
because all of these failures are silent:

**Literal color.** No component may write `#d4f34a`, `bg-lime-400` or
`rgb(...)` directly. If it could, the client's theme would not reach that
piece, and the error would only show on their screen.

**Contrast.** The text pairs, the composited state pairs over their own
background, and 1.4.11's non-text boundary (in both themes, with the alpha
composited before measuring). A new theme should go through the same
measurement; it is the difference between "looks good on my monitor" and "it
can be read".

**Documented shape.** Every token a theme can declare needs to be cited in
this guide: the color roles and the shape ones. Without that the guide starts
lying silently, and the lie shows up months later, on a client's screen.

## Fine-tuning with className

Every piece (on the web and in React Native) accepts `className` at the root,
and **the user's class beats the piece's**: the merge is by Tailwind group, so
an `h-14` overrides Button's `h-10` and a `rounded-pill` overrides
`rounded-md`, instead of living alongside it.

```tsx
<Button className="h-14 rounded-pill">Assinar agora</Button>
```

That is what makes a client wrapper a small file in their project, instead of
a fork:

```tsx
// Acme's button, in Acme's repository
import { Button, type ButtonProps } from '@rivocode/ui'
import { cn } from './cn'

export function AcmeButton({ className, ...props }: ButtonProps) {
  return <Button className={cn('rounded-pill uppercase tracking-widest', className)} {...props} />
}
```

Two rules keep the gesture healthy:

- **Token, never a literal color.** The wrapper's `className` obeys the same
  rules as the piece: `bg-accent` answers to the client's theme,
  `bg-[#2563eb]` answers to nobody.
- **The root, not the parts.** `className` dresses the piece's outer element.
  On the layered pieces (Sheet, Dialog, Select), the prop's documentation says
  what it dresses (the panel, the trigger), and what belongs to the platform
  stays with the platform.
