The library's tokens live in CSS, and that is how the pieces read them.
Designers do not read CSS: they read Figma variables, or a Tokens Studio set.
This page is the bridge. The three layers come out in the
[W3C Design Tokens Community Group](https://www.designtokens.org/tr/2025.10/)
format, in the stable 2025.10 specification, which both tools read without a
conversion plugin in between.

## What comes out

One file per layer, one per density and one per theme, plus the resolver that
says how to put them together:

| File | What it carries |
|---|---|
| `palette.tokens.json` | Layer 1: the raw palette, `palette.lima.500`, `palette.graphite.950` |
| `scales.tokens.json` | Typography, line height, stacking, focus, radius, letter spacing and motion |
| `density-comfortable.tokens.json` | Control height and breathing room in the comfortable density |
| `density-compact.tokens.json` | The same tokens, in the compact one |
| `rivocode-dark.tokens.json` | Layer 3 of the dark theme: the roles the pieces paint |
| `rivocode-light.tokens.json` | The same, in the light one |
| `rivocode.resolver.json` | The DTCG resolver: base, density and theme, in that order |

**The role still points to the palette.** In CSS, `--rc-accent` is
`var(--rc-p-lima-500)`; in JSON, `color.accent` is `{palette.lima.500}`.
Changing the lime in the palette changes the accent in the theme, in Figma as
in code. A role with its own alpha, like `color.accent-subtle`, comes out with
the full color, because the format has no alias with transparency.

Every token carries where it came from, in `$extensions`:

```json
"accent": {
  "$type": "color",
  "$value": "{palette.lima.500}",
  "$extensions": { "br.com.rivocode": { "css": "--rc-accent" } }
}
```

It is what links the variable the designer picked to the class the code
writes: `color.accent` is `--rc-accent`, which is `bg-accent`.

## Where to get them

From the site, without installing anything:

```bash
for file in palette scales density-comfortable density-compact rivocode-dark rivocode-light; do
  curl -sO "https://ds.rivocode.com.br/tokens/$file.tokens.json"
done
curl -sO https://ds.rivocode.com.br/tokens/rivocode.resolver.json
```

From the package, at the version the project installed:

```bash
ls node_modules/@rivocode/ui/dist/tokens
```

Or through the command, which writes the same files into a folder of yours:

```bash
npx rivocode-ui tokens --out tokens
```

## Your client's theme

The command reads the theme CSS the same way as `check-theme`, and exports your
theme in place of the house ones:

```bash
npx rivocode-ui tokens tema-acme.css --out tokens
```

Out come `acme-light.tokens.json` and `acme-dark.tokens.json`, one per
`[data-rc-theme="..."]` selector in the file, with the house palette, scale and
densities alongside. A role your theme points to the house palette becomes an
alias; one you wrote with your own color, in hex, `rgb()` or `oklch()`, comes
out converted to sRGB, with the `hex` along. A file without any theme selector
is refused: exporting the house in place of your theme would be green over
nothing.

## Tokens Studio

1. In **Settings**, pick the **W3C DTCG** format.
2. Load the whole folder. Each file becomes a set.
3. Always turn on `palette` and `scales`, one density and one theme. Without
   the palette on, every theme alias has no target.
4. In **Themes**, create one theme per combination: dark comfortable, light
   compact. `rivocode.resolver.json` already describes those combinations, for
   the tool that reads the resolver.

## Figma

Figma's variable import reads the same JSON:

1. Create the **Palette** collection and import `palette.tokens.json`. It comes
   first, because it is what the theme points to.
2. Create the **Theme** collection and import `rivocode-dark.tokens.json` and
   `rivocode-light.tokens.json`, one in each mode.
3. Create the **Density** collection the same way, with the two density files
   as modes.
4. Import `scales.tokens.json` into a single-mode collection.

Figma only has color, number, string and boolean variables. Color, dimension and
number become variables; shadow, curve and duration have no variable type
there, and are what Tokens Studio turns into styles.

## What does not fit the format

When it finishes, the command lists what was left out and why. In the house
themes these are three hooks that exist empty on purpose, `--rc-accent-image`,
`--rc-accent-shadow` and `--rc-overlay-filter`: they are `none` until a client
theme uses them, and `none` has no type in DTCG. When your theme gives
`--rc-accent-shadow` a shadow, it comes out as a shadow.

Two tokens come out approximated, with the CSS value kept in `$extensions`:

- **Letter spacing** (`tracking.display`, `tracking.tight`) is `em` in CSS, and
  the format only accepts `px` and `rem` for dimensions. It comes out as a
  number, which multiplies the font size.
- **The fluid title** (`text.display`, `text.hero`) is a `clamp()` that grows
  with the screen. It comes out at the maximum size, which is the one of the
  wide screen designers draw on.

## When not to use

The JSON is for the design tool. **The code keeps reading the CSS**:
`preset.css` is the source, and the JSON is generated from it on every
version. Do not build a theme for the browser from the JSON; write the theme
CSS, as [Themes and customization](/temas) teaches, and export from here to
Figma.
