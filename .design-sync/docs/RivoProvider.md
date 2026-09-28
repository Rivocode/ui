---
category: Foundation
---

# RivoProvider

The required root. Without it nothing has style.

`theme`: `rivocode-dark` (default), `rivocode-light` or `system`.
`density`: `comfortable` (default) or `compact`, which shrinks every control.
`scope`: `global` dresses the whole page; `local` dresses only this tree and
paints the background, for when the design system enters a project that already
exists.

It carries inside it the tooltip provider, the toast wiring and the portal
container that takes the theme along. Do not mount any of them by hand.

## The theme types

`RivoTheme` is the two house themes, `rivocode-dark` and `rivocode-light`.
`RivoThemeSetting` is what the `theme` prop accepts: the two house themes,
`system`, or the name of a client theme. `RivoResolvedTheme` is the theme after
`system` has already become one of the two.

The union accepts a free name on purpose. Without it, dressing a client ended
in a type error, and the project started out writing `as` at the system's entry
point, which is the worst possible place to teach that casting is normal.

`RivoDensity` is `comfortable` or `compact`. Both types show up when the choice
comes from outside, from a saved preference or from the client's configuration:

```tsx
const [theme, setTheme] = useState<RivoThemeSetting>('system')
const density: RivoDensity = usuario.prefereCompacto ? 'compact' : 'comfortable'

<RivoProvider theme={theme} density={density}>
```

## Writing direction

`dir="rtl"` mirrors whatever depends on a side: which arrow opens the submenu,
where `Select` aligns, where the side sheet comes in from and where the close
gesture goes. The provider writes `dir` on the root element and on the portal
container, so whatever renders in a portal flips too.

The layout stays with you, through Tailwind's logical classes: `ps-*` and
`pe-*` instead of `pl-*` and `pr-*`, `text-start` instead of `text-left`. A
mirrored component inside a page that still measures from the left looks worse
than a whole page with nothing mirrored.

## Reading what the provider decided

`useRivoContext()` returns the already resolved theme, the density and the
portal container. It serves the screen that needs to agree with the choice (the
logo that switches between light and dark, the third-party map that receives
the color as a prop, the portal of an outside piece that needs to be born
dressed):

```tsx
const { theme, density, portalContainer } = useRivoContext()
```

Outside the provider it throws, with the provider's name in the message. That
is on purpose: silence here becomes an unstyled screen nobody can explain.

## In React Native

Translates, and gains a prop that does not exist on the web: `fonts`. In the browser the three families arrive through the tokens CSS; on the phone there is no font CSS, and loading a font file is the app's decision, not the library's. The app loads them with `expo-font` and declares the names once (`<RivoProvider fonts={{ sans: 'Manrope', display: 'Poppins', mono: 'JetBrainsMono' }}>`), and the whole catalog starts wearing them. Without the prop, everything comes out in the system font and nothing breaks. Also pass `expo-font`'s `isFontLoaded={isLoaded}`: a missing font name fails silently in React Native, and this return value is what makes the provider warn in `__DEV__`.

**`density` does not exist here, and it is not a parity omission.** A touch target does not shrink on a finger screen: `comfortable` is the only height, and the prop left the API.

**And `theme` switches the whole screen only between the two house themes.** `rivocode-dark`, `rivocode-light` and `system` switch in the same frame, because the colors were compiled as `light-dark()` and the provider only flips the `Appearance` scheme. A client theme **does not change any class's color** at runtime: the `react-native-css` compiler bakes the hex into the rule (`.bg-accent` becomes `{"backgroundColor":"#d4f34a"}`, literally), and in the 56 KB of compiled CSS not a single occurrence of `--` remains. There is no live variable to redefine after the build.

**The theme map left the provider.** It only reached whoever reads color through JS - `ChartDonut`, `ChartRadial`, the `Button`'s spinner, the `Switch`'s track -, and the result was a donut in one theme and a button in another, side by side. One half that disagrees with the other is worse than none: the provider now resolves the 45 roles by reading the compiled CSS, one `bg-` class per role, so context and class always say the same color. The re-read also happens when the app declares the scheme inside an effect, after mounting - before that the palette was read once and froze, and half the screen came out in one scheme and half in the other. With the map left without a purpose, it was removed: `theme` accepts only `rivocode-dark`, `rivocode-light` and `system`, and the `scheme` prop left with it, because it was what chose the map's scheme.

**The path that works is the app's CSS, before compiling - and now it styles the whole screen, charts included:** override the roles in an `@theme` in your `global.css`, after `@rivocode/ui-native/theme.css`, and run `npx rivocode-ui-native-css` again. It has an architectural ceiling: `light-dark()` has two slots, so it is **two themes per build**, one light and one dark. A single-client app fits easily; a showcase of five themes, like the web's, needs five bundles. The [themes guide](/temas) has the step by step.
