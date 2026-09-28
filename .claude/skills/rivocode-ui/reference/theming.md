# Dressing it in another client's color

## Contents

- The three layers
- Why writing half a theme fails silently
- The font is also a theme role
- The pairs that need to pass contrast
- In React Native the client theme is build time, not runtime
- Where the full list is

## The three layers

1. **Palette** (`--rc-p-*`): the raw colors, without a role. Only the theme
   talks to it.
2. **Contract** (`@theme inline`, `--color-*`): what becomes a Tailwind class.
   You do not touch this to switch brands.
3. **Theme** (`[data-rc-theme]`, `--rc-*`): what binds a role to a color. **It
   is the only layer a new client writes.**

No component knows the brand color: it asks for a role and the theme answers.
That is what lets the same piece serve two clients.

## Why writing half a theme fails silently

There are **dozens of roles**. Writing only the obvious ones gives no error:
the missing role falls back to the previous theme's value, and an isolated
RivoCode color shows up in the middle of the client's brand, almost always in a
chart or a state nobody opened during development.

Write the whole theme at once, starting from the ready skeleton.

## The font is also a theme role

`--rc-font-sans`, `--rc-font-display` and `--rc-font-mono` live in the theme
selector, next to the colors, and do **not** have a `:root` value underneath. A
theme that forgets all three ends up with no family at all, exactly as a theme
that forgets `--rc-bg` ends up without a background. Always declare them.

RivoCode's faces come in a separate file, `@rivocode/ui/fonts.css`. A client
theme does **not** import that file: it imports the client's family and points
the three tokens at it.

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

Two clients with different fonts coexist in the same application through this
mechanism: the family switches by `data-rc-theme`, like the color.

Weight goes together with the family. `--rc-weight-regular`,
`--rc-weight-medium`, `--rc-weight-strong`, `--rc-weight-bold` and
`--rc-weight-display` have the house value in `:root` (400, 500, 600, 700 and
600) and are **optional** in the theme: declare only what the client's family
lacks. A title font without 600 asks for `--rc-weight-display: 700` (or the
closest weight it has), or the browser draws a synthetic bold.

## The pairs that need to pass contrast

The library repository has a guard that fails if a pair that carries text
falls below the standard. When writing a theme, ensure at least:

| Pair | Minimum |
|---|---|
| `--rc-fg` on `--rc-bg` and on `--rc-surface` | 7:1 |
| `--rc-fg-muted` and `--rc-fg-subtle` on both backgrounds | 4.5:1 |
| `--rc-accent-fg` on `--rc-accent` | 4.5:1 |
| `--rc-*-fg` on the `--rc-*` of the same family | 4.5:1 |
| `--rc-*-text` on `--rc-bg` and `--rc-surface` | 4.5:1 |

Remember the rule from `design.md`: the color that fills and the color that
writes are never the same. A theme that points `--rc-accent-text` at the same
value as `--rc-accent` produces invisible text on the accent itself.

## In React Native the client theme is build time, not runtime

The same CSS file dresses both platforms, but the **moment** the color is
decided changes, and this is where a day gets lost.

On the phone the `react-native-css` compiler resolves the token at build time
and hardcodes the value inside the rule: `.bg-accent` becomes
`{"backgroundColor":"#d4f34a"}`, and not a single `--` is left in the compiled
CSS. So no theme object passed at runtime ever changed a class's color.

It only changed whoever reads the color through JS: `ChartDonut`,
`ChartRadial`, the spinner of `Button` and `Spinner`, the `Switch` track,
`Sparkline`, the fields' hint text. Background, card, button, badge and border
kept RivoCode's color, and the result on screen **was not the missing brand: it
was the mixed screen**, a donut from one theme and a button from another.

**The map left the provider.** The provider resolves the 45 roles by reading the
compiled CSS, one `bg-` class per role, and publishes them in the context the
pieces already read: context and class always say the same color. The `theme`
prop accepts only `rivocode-dark`, `rivocode-light` and `system` - a theme
object no longer compiles -, and the `scheme` prop left with it, because it was
what chose the map's scheme.

The path that works is to override the roles in an `@theme` in the app's
`global.css`, after `@rivocode/ui-native/theme.css`, and precompile again with
`npx rivocode-ui-native-css`:

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

This alone dresses the whole screen: the class paints the new color, and the
piece that reads color through JS reads the same color from the same CSS. Do
not pass any map in the `theme` prop.

**And there is an architectural ceiling: two themes per build.** `light-dark()`
has two slots, a light one and a dark one. One client per app fits easily; a
showcase of five themes, like the web one, needs five bundles.

## Where the full list is

<https://ds.rivocode.com.br/temas.md> has the fifty roles, what each one
dresses, the ready skeleton to copy and how to apply it through
`data-rc-theme`.

Read that file before writing a theme. Do not guess a role name: they are
verified by a guard, and an invented name simply paints nothing.

## After writing, check

```bash
npx rivocode-ui check-theme caminho/do/tema.css
```

The command comes in the package and runs in the consuming project. It demands
the fifty-five required roles, exits with code 1 if any is missing, and the
message says what happens **on the screen** without each one. Also run it after
bumping the library version: a new role in a new version is the break nobody
sees, and that is how `--rc-font-*` caught whoever had a theme written for
0.6.x.

After completeness it **measures contrast** - 76 pairs per theme, with the same
math and the same table the library demands of itself, and with the alpha
composited over the background it is drawn on. The order matters: a missing
role first, because measuring what does not exist returns a pretty number by
accident.

The extension says which theme shape it is: `.css` for the web's layer 3, and
`.ts`, `.mjs` or `.js` for React Native's map with `light` and `dark`. In the
native project the same table is in `@rivocode/ui-native/contrast`, exporting
`checkThemeMap`, `contrastRatio` and `compose` - do not port the math by hand.
