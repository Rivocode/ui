# @rivocode/ui-native

RivoCode's design system pieces in React Native: the **same class vocabulary**
as the web (`bg-bg`, `text-fg-muted`, `rounded-pill`) through NativeWind, on the
same tokens. No component knows the brand color: it asks for a semantic role
and the theme answers. Between the two house themes the switch happens at
runtime; dressing a client's color is a build decision, and the section below
says exactly what that changes.

The whole documentation lives at <https://ds.rivocode.com.br>; the native usage
guide at <https://ds.rivocode.com.br/react-native.md>.

## Installation

```sh
npx expo install nativewind@preview react-native-css react-native-reanimated react-native-keyboard-controller
npm install -D tailwindcss @tailwindcss/postcss postcss
npm install @rivocode/ui-native
npx rivocode-ui-native-init
```

**It is `nativewind@preview`, and not `nativewind`.** NativeWind's `latest` tag
still points to `4.2.6`, and this package's peer is `>=5.0.0-preview.1`:
`npx expo install nativewind` installs v4, the peer warning scrolls off the
screen along with the rest of the `npm` output, and what shows up afterwards is
v4 trying to compile a CSS written for v5. The `preview` tag is the one
NativeWind publishes for the 5 line.

`react-native-reanimated` is neither decoration nor an optional peer:
`react-native-css` requires it at bundle time, and without it metro stops at
`Unable to resolve module react-native-reanimated` from a file you never
imported. It brings `react-native-worklets` along, which `babel-preset-expo`
wires by itself. The pieces also use it directly, which is why it is a declared
peer (`>=4`): it is what makes `Button` and `Toggle` sink on touch, `Toast`
rise and fall, `Accordion` open with the arrow rotating, the active tab's
background slide, the bars of `Progress`, `Meter` and `Steps` move, `Field`'s
error fade in, the mark of `Checkbox` and `RadioGroup` grow and `Skeleton`
pulse.
Every animation uses the web's durations and curve (`tokens.scales["duration-*"]`
and `tokens.easings`) and respects the system's "reduce motion", read in real
time: with it on nothing animates, and `Dialog` and `Sheet` open without a
transition.

`react-native-keyboard-controller` is also a required peer, and it is what
keeps the keyboard from covering the field. There is nothing to mount:
`RivoProvider` already brings the `KeyboardProvider` inside, and if your app
already had one outside, it reuses yours instead of mounting a second. With it,
`Sheet` (and what opens in it: `Select`, `Combobox`, `Autocomplete`, `Menu`,
`DatePicker`, `TimePicker`, `TreeSelect`) and `Dialog` rise with the keyboard
frame by frame, and the form screen is `ScrollArea`, which scrolls to the
focused field and pins the submit button in a `footer` that rises along. With
"reduce motion" on, the sheet and the footer jump straight to the final place,
without following the keyboard. It comes included in the SDK 57 Expo Go, and
`npx expo install` picks the version for your SDK. Do not use React Native's
`KeyboardAvoidingView` on top of the pieces: it accounts for the keyboard a
second time.

### The seven files, and what each one holds

`npx rivocode-ui-native-init` writes the whole recipe and prints what it did:

```
@rivocode/ui-native recipe in my-app/:

  = babel.config.js       does not exist, and that is how it has to be
  + postcss.config.mjs    created
  + metro.config.js       created
  + global.css            created
  + nativewind-env.d.ts   created
  ~ app.json              expo.userInterfaceStyle: "light" -> "automatic"
  + package.json          browserslist added

  = required peers       all 5 are in package.json

The precompiled CSS is still missing, and it does not come from here because it
depends on your code: run `npx rivocode-ui-native-css` and import `generated.css`
at the top of App.tsx, above the provider.
```


`+` is a new file, `~` is a JSON key changed with the old value in view, `=` is
what was already right, and `!` is what it did **not** touch. A file that is
born whole and already exists with other content is never silently rewritten:
it comes out as `!`, the command ends with code 1, and only `--force` makes the
recipe win - because rewriting a `babel.config.js` or a `postcss.config.mjs`
erases another library's configuration and the app breaks in a place that does
not seem related to this command. `--dry-run` shows the plan without writing
anything.

After the files it checks the required peers in the app's `package.json` (the
ones this package's manifest does not mark as optional: `react`,
`react-native`, `nativewind`, `react-native-reanimated` and
`react-native-keyboard-controller`). If any is missing, it prints the
`npx expo install` with the missing names and ends with code 1: without
`react-native-keyboard-controller` the `RivoProvider` does not mount.

There are seven, each for a reason that bites:

1. **`babel.config.js`**. **The right thing is for it not to exist.** With no
   Babel file at all, `@expo/metro-config` falls back to `babel-preset-expo` on
   its own and wires the worklets plugin along. Writing one by hand with
   `presets: ["babel-preset-expo"]` **brings the app down**: in SDK 57 that
   preset lives in `node_modules/expo/node_modules` and does not resolve from
   the project root, and the bundle dies with `MODULE_NOT_FOUND` before the
   first module, in a stack that only mentions `@babel/core`. If your app
   already has one, it stays - but two lines of NativeWind's v4 recipe, which is
   still the first search result, no longer hold here and the command flags
   them by name: `jsxImportSource: "nativewind"`, which makes all JSX require
   `nativewind/jsx-runtime` - a file v5 does not have -, and the
   `nativewind/babel` preset, which adds the worklets plugin a second time.
2. **`postcss.config.mjs`**. The `@tailwindcss/postcss` plugin, and nothing
   else. It is what makes Tailwind run in the CSS pass; without it the file goes
   raw into the bundle, with the theme variables and **no generated utility**,
   and the screen renders unstyled, with no error and no clue - the same
   silence as a forgotten `@source` on the web.
3. **`metro.config.js`**. `withNativewind(config)`, which swaps metro's
   transformer for `react-native-css`'s.
4. **`app.json`**. `"userInterfaceStyle": "automatic"`, or iOS locks the
   appearance to light and the dark theme never arrives. The Expo template is
   born with `"light"`, so this is the key the command almost always changes.
5. **`package.json`**. `"browserslist": ["chrome 130", "safari 18",
   "firefox 130"]`. Without it the web pass Expo runs before the native
   compiler rewrites the tokens' `light-dark()` into a polyfill of orphan vars,
   and compilation dies with "Specifier, found ()". This file is what holds up
   the runtime switch between the two house themes.
6. **`global.css`**. The CSS source:

   ```css
   @import "tailwindcss/theme.css" layer(theme);
   @import "@rivocode/ui-native/theme.css";
   @import "tailwindcss/utilities.css";

   @source "./App.tsx";
   @source "./node_modules/@rivocode/ui-native/src";

   @source not inline("shadow");
   @source not inline("invert");
   @source not inline("filter");
   @source not inline("transform");
   ```

   The last four lines are not hygiene: Tailwind's scanner reads the code as
   text, and `shadow`, `invert`, `filter` and `transform` appear in the pieces'
   TypeScript as configuration keys and prop names, never as `className`.
   `.shadow` redeclares `--tw-shadow`, which the precompiled output already
   declared on `:root`, and a var declared twice brings down the native
   compiler with "expected an object-like struct named Specifier, found ()".
7. **`nativewind-env.d.ts`**. Two lines, and the first is the one your app's
   `tsc` demands:

   ```ts
   /// <reference types="nativewind/types" />

   declare module "*.css";
   ```

   This package publishes **source**, not `dist`: your app's `tsc` compiles our
   pieces together with your code. Without that reference, `className` does not
   exist in the props of `View`, `Text` and `Pressable`, and `tsc` fails the
   whole catalog with dozens of errors **inside `node_modules`** - and
   `skipLibCheck: true` **does not save you**, because it only skips `.d.ts`,
   and what is being compiled here is `.tsx`. It is a NativeWind requirement,
   and it holds for any library that publishes source with `className`. The
   second line is for the `generated.css` that `App.tsx` imports at the top. The
   file needs to be in your `tsconfig.json`'s `include`; the Expo template
   already reaches `**/*.ts`.

   On our side the other half is measured: `native/tsconfig.check.json`
   compiles the published source with `strict` and `noUncheckedIndexedAccess`
   on, so that an app that turns those flags on does not trip over our
   library's strictness.

The repository's `examples/native` runs this same recipe, and
`bun run check:recipe` goes red the day the two drift apart.

### The precompiled CSS

The app does not import `global.css`: it imports the **precompiled** one.
Generate it with

```sh
npx rivocode-ui-native-css   # reads global.css, writes generated.css
```

and run it again every time you use a new class. Metro's pipeline trips on
`@import` and on `@property` inside the native compiler; the command delivers
an already resolved file and **fails with the var's name** when something would
not translate.

```tsx
import "./generated.css";
import { RivoProvider, Button } from "@rivocode/ui-native";

export default function App() {
  return (
    <RivoProvider theme="rivocode-dark">
      {/* rivocode-light and system too; between the house themes, changing the prop switches the screen at runtime */}
      <Button onPress={() => {}}>Começar</Button>
    </RivoProvider>
  );
}
```

## Derived tokens, never edited

The single source of the tokens is the repository's CSS (`src/tokens/`): that
is where the contrast guards bite. `tokens.json`, `tokens.ts` and `theme.css`
are generated by `bun run gen:native`, and `bun run check` fails if they
diverge. Each color comes out as `light-dark(light, dark)`: the native compiler
turns that into a `prefers-color-scheme` rule, and `RivoProvider` switches the
theme with an `Appearance.setColorScheme()`.

What does not translate is left out on purpose: box shadow (in RN it is
`elevation`/`shadow*`, the piece's decision), marketing `clamp()`, `z-index`,
and the compact density, because a touch target does not shrink on a finger
screen: there is no `density` in the native API, and `comfortable` is the only
height.

### Measuring your theme's contrast

The WCAG math that bites the house tokens travels in the package, and not only
its result. `@rivocode/ui-native/contrast` exports the same engine
`bun run check` uses - `checkThemeMap`, `contrastRatio` and `compose` - with the
whole pair table: the pairs that carry text, the 3:1 control boundary,
`Calendar`'s alpha over alpha, the destructive button's layer flattened by
`opacity` and the checked `Switch` track.

```js
import { checkThemeMap } from "@rivocode/ui-native/contrast";

for (const { ok, line } of checkThemeMap("acme", acmeTheme)) {
  if (!ok) console.error(line);
}
```

The file is generated from the repository's `src/lib/contrast.ts` and versioned
here, like `tokens.ts` and `theme.css`: a mirror, and not a second copy that
goes stale on its own. Whoever prefers the command line measures the same map
with `npx rivocode-ui check-theme acme.theme.ts`, from the web package, which
calls this same engine.

### Client theme: today it is a build decision, not a runtime prop

Three facts, and the first explains the other two.

**1. Class color only changes at build time.** The `react-native-css` compiler
resolves the token and hardcodes the value inside the rule: `.bg-accent`
becomes `{"backgroundColor":"#d4f34a"}`, literally, and in the 56 KB of
compiled CSS not **a single occurrence of `--`** is left. There is no live
variable on the device, so no theme object passed at runtime ever changed a
class's color. A client theme here is CSS generation, and not a runtime switch.
What switches at runtime are the two house themes, which were born inside the
`light-dark()` the compiler understands.

**2. The theme map LEFT the provider.** The theme object only reached whoever
reads the color through JS, from context: `ChartDonut`, `ChartRadial`, the
spinner of `Button` and `Spinner`, the `Switch` track, `Sparkline`, the fields'
hint text. Background, card, button, badge and border are classes, and kept
RivoCode's color: on screen that was a donut from one theme and a button from
another, side by side, with nothing red in the console beyond the `__DEV__`
warning.

One half that disagrees with the other is worse than none. The provider started
resolving the 45 roles **by reading the compiled CSS**, one `bg-` class per
role, and publishes them in the context the pieces already read: context and
class always say the same color. With that the map had nothing left to do and
was removed: the `theme` prop accepts only `rivocode-dark`, `rivocode-light`
and `system`, and the `scheme` prop left with it, because it was what chose the
map's scheme.

**3. The ceiling is two themes per build.** Each role comes out as
`light-dark(light, dark)`, and `light-dark()` has two slots: a light one and a
dark one. A single-client app fits easily, and it is the normal case. A
showcase of five themes, like the web one, **does not fit without five
bundles**. It is an architectural ceiling, not a pending item.

#### The path that works

Override the roles in the app CSS's `@theme`, before compiling. It is the same
layer 3 as the web, in the `--color-*` vocabulary the native compiler reads:

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
  /* ...and the other roles the brand changes. */
}

@source "./App.tsx";
@source "./node_modules/@rivocode/ui-native/src";
```

Run `npx rivocode-ui-native-css` again and the screen becomes the client's
**entirely**: the class paints the new color, and the piece that reads color
through JS reads the same color from the same CSS, because that is where the
provider takes it from. Do not pass any map in the `theme` prop. The step by
step is at <https://ds.rivocode.com.br/temas.md>.

#### Write only the palette: `rivocode-ui-native-theme`

The app's `@theme` has **45 roles** to fill, and writing all 45 by hand is
where the client theme starts to go stale. The role names, the contrast pairs,
the minimums, the alpha compositing and the format the native compiler accepts
are the library's knowledge, and, before this command, they lived in the app of
whoever dressed the client. The package's second binary brings that math back
inside:

```sh
npx rivocode-ui-native-theme acme.ts    # reads the palette, writes acme.theme.css
npx rivocode-ui-native-theme acme.ts saida.css
npx rivocode-ui-native-theme --roles    # what you write, what it derives (old name: --papeis)
```

You write **eight roles per scheme**, and nothing more:

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

The file can be `.ts`, `.js`, `.mjs` or `.json`; any of the 45 roles can be
written by hand there and the command stops deriving that one. The output goes
into `global.css` **after** the package's theme, and the precompiled output
comes out as always:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "@rivocode/ui-native/theme.css";
@import "./acme.theme.css";
@import "tailwindcss/utilities.css";
```

```sh
npx rivocode-ui-native-css
```

**It refuses to write a theme that does not pass contrast.** The measurement is
`@rivocode/ui-native/contrast`'s, the same engine as `bun run check`: the text
pairs, the 3:1 boundary, `Calendar`'s alpha over alpha, the destructive
button's layer flattened by `opacity` and the checked `Switch` track:

```
Contrast guard:
  light: 2 failure(s)
    accent-fg on accent  3.18:1 (min 4.5)
    accent-fg on accent-active  3.59:1 (min 4.5)  primary button under the finger
  dark: passes

Nothing was written: fix the contrast before generating the CSS.
```

Four things worth knowing before running it:

- **It never invents a new hue.** Deriving is reusing a color you wrote, or
  compositing its alpha: `accent-subtle` is your `accent` at 22%, `fg-muted` is
  your `fg` pulled 30% toward `bg`, `accent-fg` is the `fg`/`bg` tone that
  weighs more on the button. A wrongly derived role is worse than a requested
  one, so where reusing does not pass the measurement it **refuses and says the
  value that would pass**. `accent-text` and the four `*-text` are the typical
  cases, because they are the color that is read. The only declared exception
  is `chart-1` to `chart-8`, which fall back to RivoCode's series: a chart
  series is a categorical scale, and not brand identity. It is measured over
  **your** background, and fails if it does not fit.
- **Two themes per build, and the command explains the ceiling instead of
  ignoring it.** Each role comes out as `light-dark(light, dark)`, which has two
  slots. A third scheme in the file is refused with the reason: it is a third
  **bundle**, and not a third slot.
- **A new role in a new version is flagged.** The role list comes from the
  **installed** package's `tokens.json`, and not from a copy inside the
  command. When 0.4.0 brings a role, the command demands it by name the first
  time you run it, instead of the theme coming out half done and the piece
  inheriting RivoCode's color. A wrong name in the palette is also flagged, with
  a suggestion of the role you meant.
- **`oklch()` goes straight in, and Tailwind 4's palette with it.** The math
  reads 3, 4, 6 and 8-digit hex, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`,
  `lab()`, `lch()`, `oklab()`, `oklch()` and `color()` in CSS's predefined
  spaces, and converts everything to sRGB before measuring. The CSS the command
  **writes** is still literal sRGB, because that is what the native compiler
  hardcodes. Still refused are `color-mix()` - which is math, and not a color -
  and a seed with alpha. A color outside the sRGB gamut is measured at the pixel
  the device shows, and the command says which roles fell there.

## Four subpaths, and one peer per door

Forms, charts, copying and attaching do not come out of the root index:

```tsx
import { Form, FormField, forText, useZodForm } from "@rivocode/ui-native/form";
import { ChartContainer, ChartDonut, ChartGauge, ChartRadial, PixCode, QRCode } from "@rivocode/ui-native/chart";
import { Clipboard } from "@rivocode/ui-native/clipboard";
import { FileUpload, FileUploadItem, FileUploadList } from "@rivocode/ui-native/file-upload";
```

Each door has **one** optional peer behind it, and metro resolves imports per
file: inside the main index, an app that only wants a `Button` would have to
install all four for the bundle to close. For the bottom three the price is
more than bytes: they are native modules, which the app links to the iOS and
Android project and rebuilds.

```sh
npx expo install react-native-svg         # only whoever draws charts or QR Codes
npx expo install expo-clipboard           # only whoever copies
npx expo install expo-document-picker     # only whoever attaches
```

**It is one subpath per peer, and not one per subject.** `Clipboard` and
`FileUpload` would share a door called `/expo` nicely, and the installer's math
says no: whoever puts a copy button next to an NF-e access key attaches no file
at all, and a shared index would demand the document picker from them.
`scripts/check-chart-boundary.ts`, at the repository root, guards the four
boundaries: nothing reachable from the root index may import from inside them.

## The font belongs to the app, and the provider only passes the name along

On the web the three families arrive through the token CSS. On the phone there
is no font CSS: the `.ttf`/`.otf` file goes into the app's bundle and the app
registers the family, with `expo-font`. That is why the library **loads no font
at all**: it receives the already registered names and applies them to the
whole catalog.

Without configuration, everything comes out in the system font and nothing
breaks. `mono` is the only one with a house default, because the system already
has it: Menlo on iOS, `monospace` on Android.

```tsx
import { useFonts, isLoaded } from "expo-font";
import { RivoProvider } from "@rivocode/ui-native";

export default function App() {
  const [ready] = useFonts({
    Manrope: require("./assets/Manrope.ttf"),
    Poppins: require("./assets/Poppins.ttf"),
    JetBrainsMono: require("./assets/JetBrainsMono.ttf"),
  });
  if (!ready) return null;

  return (
    <RivoProvider
      fonts={{ sans: "Manrope", display: "Poppins", mono: "JetBrainsMono" }}
      isFontLoaded={isLoaded}
    >
      {/* … */}
    </RivoProvider>
  );
}
```

`sans` dresses the running text, `display` the titles (Card, Dialog, Sheet,
PageHeader, Stat, Steps, Fieldset and the charts' center), and `mono` what
aligns by fixed width: `Code`, the `Timeline` timestamp, the `Calendar`'s
weekday initials, the `ColorPicker`'s hex field. Declaring only `sans` is
legitimate: `display` falls back to it, as the web stack does.

For your own screen to use the same families, `useRivoFonts()` returns the
three already resolved.

**This is not a subpath, and the rule above still holds.** A subpath exists to
contain a peer; here there is no peer: the library never imports `expo-font`,
not even as a type. The app imports it, the app loads it, and what crosses the
boundary is a string.

### A wrong name fails silently: the provider shouts for you

React Native ignores a family the device does not have: the text comes out in
the default font, with no error and no warning. That is how `font-mono` lived
for months compiled to `ui-monospace`, which is a CSS generic and exists
installed on no phone at all.

In `__DEV__`, `RivoProvider` flags what it can see on its own: a CSS stack with
commas (`"Manrope, system-ui, sans-serif"`: RN reads the whole line as a single
name), quotes inherited from CSS, `var(--…)`, an empty name, a generic family,
and `monospace` outside Android. What it **cannot** see on its own is the
device's font table. Hence `isFontLoaded`: pass `expo-font`'s `isLoaded` and
each declared name that did not reach the device comes out named in the
warning.

## The catalog

The web catalog crosses over by translation and not by port: `DataTable`
becomes `DataList`, `Sheet` only knows the bottom behavior, `Select` opens in a
sheet, and `Sidebar`, `Menubar` and `Tooltip` do not port (they are desktop
idioms). The full translation table is in the guide, and it is generated: how
many cross and how many do not port is read there, and not here.

## Versions

`@rivocode/ui-native` has its own number, and moves at its own speed, but the
rule is the same as the web's. From 1.0 on, strict semver: breaks only in a
major version; what is going away spends at least one minor version marked
`@deprecated` in the type, with the new path, and only leaves in the following
major version; a new prop and a new piece are a minor version; a fix is a patch
version.
