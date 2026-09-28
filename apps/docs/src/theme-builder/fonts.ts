/* ---------------------------------------------------------------------------
 * The families the builder offers
 *
 * The list is curated and built in: no call to the Google Fonts API, which
 * requires a key, and no family nobody checked. Each line was measured on
 * 2026-09-24 against three sources - the Fontsource public API (category,
 * weights, whether it is variable), the npm registry (the
 * `@fontsource-variable/*` or `@fontsource/*` package exists) and Google
 * Fonts css2 (the request with the listed weights answers 200). Each one's
 * `@expo-google-fonts/*` package also exists, and exports
 * `<Family without spaces>_<weight><Name>`, which is where the name in the
 * React Native snippet comes from.
 *
 * `weights` is the list of static faces the family publishes. For a variable
 * one, it is what the `wght` axis covers in steps of a hundred. Asking css2
 * for a weight the family does not have returns 400 and no face, which is why
 * the link only asks for the intersection with the weights the pieces use.
 * ------------------------------------------------------------------------- */

import TOKENS from '../../../../native/tokens.json'

export type FontRole = 'sans' | 'display' | 'mono'
export const FONT_ROLES: FontRole[] = ['sans', 'display', 'mono']

export type FontCategory = 'sans-serif' | 'serif' | 'monospace'

export type FontFamily = {
  id: string
  family: string
  category: FontCategory
  variable: boolean
  weights: number[]
}

const ALL = [100, 200, 300, 400, 500, 600, 700, 800, 900]
const from = (min: number, max: number) => ALL.filter((weight) => weight >= min && weight <= max)

const sans = (id: string, family: string, variable: boolean, weights: number[]): FontFamily => ({
  id,
  family,
  category: 'sans-serif',
  variable,
  weights,
})
const serif = (id: string, family: string, variable: boolean, weights: number[]): FontFamily => ({
  id,
  family,
  category: 'serif',
  variable,
  weights,
})
const mono = (id: string, family: string, variable: boolean, weights: number[]): FontFamily => ({
  id,
  family,
  category: 'monospace',
  variable,
  weights,
})

export const FAMILIES: FontFamily[] = [
  sans('inter', 'Inter', true, from(100, 900)),
  sans('roboto', 'Roboto', true, from(100, 900)),
  sans('open-sans', 'Open Sans', true, from(300, 800)),
  sans('lato', 'Lato', false, [100, 300, 400, 700, 900]),
  sans('montserrat', 'Montserrat', true, from(100, 900)),
  sans('poppins', 'Poppins', false, from(100, 900)),
  sans('nunito', 'Nunito', true, from(200, 900)),
  sans('nunito-sans', 'Nunito Sans', true, from(200, 900)),
  sans('source-sans-3', 'Source Sans 3', true, from(200, 900)),
  sans('work-sans', 'Work Sans', true, from(100, 900)),
  sans('dm-sans', 'DM Sans', true, from(100, 900)),
  sans('manrope', 'Manrope', true, from(200, 800)),
  sans('plus-jakarta-sans', 'Plus Jakarta Sans', true, from(200, 800)),
  sans('ibm-plex-sans', 'IBM Plex Sans', true, from(100, 700)),
  sans('figtree', 'Figtree', true, from(300, 900)),
  sans('outfit', 'Outfit', true, from(100, 900)),
  sans('rubik', 'Rubik', true, from(300, 900)),
  sans('public-sans', 'Public Sans', true, from(100, 900)),
  sans('lexend', 'Lexend', true, from(100, 900)),
  sans('space-grotesk', 'Space Grotesk', true, from(300, 700)),
  sans('sora', 'Sora', true, from(100, 800)),
  sans('barlow', 'Barlow', false, from(100, 900)),
  sans('onest', 'Onest', true, from(100, 900)),
  sans('geist', 'Geist', true, from(100, 900)),
  sans('instrument-sans', 'Instrument Sans', true, from(400, 700)),
  serif('playfair-display', 'Playfair Display', true, from(400, 900)),
  serif('merriweather', 'Merriweather', true, from(300, 900)),
  serif('lora', 'Lora', true, from(400, 700)),
  serif('fraunces', 'Fraunces', true, from(100, 900)),
  serif('dm-serif-display', 'DM Serif Display', false, [400]),
  serif('libre-baskerville', 'Libre Baskerville', true, from(400, 700)),
  serif('source-serif-4', 'Source Serif 4', true, from(200, 900)),
  serif('instrument-serif', 'Instrument Serif', false, [400]),
  serif('eb-garamond', 'EB Garamond', true, from(400, 800)),
  mono('jetbrains-mono', 'JetBrains Mono', true, from(100, 800)),
  mono('fira-code', 'Fira Code', true, from(300, 700)),
  mono('ibm-plex-mono', 'IBM Plex Mono', false, from(100, 700)),
  mono('source-code-pro', 'Source Code Pro', true, from(200, 900)),
  mono('roboto-mono', 'Roboto Mono', true, from(100, 700)),
  mono('space-mono', 'Space Mono', false, [400, 700]),
  mono('dm-mono', 'DM Mono', false, [300, 400, 500]),
  mono('geist-mono', 'Geist Mono', true, from(100, 900)),
]

/* ---------------------------------------------------------------------------
 * The weights the pieces ask for
 *
 * The pieces do not write `font-semibold`: they write the intent
 * (`font-rc-medium`, `font-rc-display`), and the number lives in
 * `--rc-weight-*`, in `forma.css`. The house value comes from the native
 * `tokens.json`, which is generated from that CSS, so the builder does not
 * have a second table that goes stale silently.
 *
 * Four of the five intents dress the body, and the display one dresses the
 * display family: it is against that family that each token is checked.
 * `Kbd` also asks for `font-rc-medium` in the code family, but the token is
 * one for all three, and the body is its main user.
 * ------------------------------------------------------------------------- */

export type WeightIntent = 'regular' | 'medium' | 'strong' | 'bold' | 'display'
export const WEIGHT_INTENTS: WeightIntent[] = ['regular', 'medium', 'strong', 'bold', 'display']

const SCALES = TOKENS.scales as Record<string, number>

export const HOUSE_WEIGHTS = Object.fromEntries(
  WEIGHT_INTENTS.map((intent) => [intent, SCALES[`weight-${intent}`]!]),
) as Record<WeightIntent, number>

export const WEIGHT_ROLE: Record<WeightIntent, FontRole> = {
  regular: 'sans',
  medium: 'sans',
  strong: 'sans',
  bold: 'sans',
  display: 'display',
}

export const weightToken = (intent: WeightIntent) => `--rc-weight-${intent}`
export const weightClass = (intent: WeightIntent) => `font-rc-${intent}`

/** The numbers the pieces ask for with the house theme, without repeats and in order. */
export const USED_WEIGHTS = [...new Set(Object.values(HOUSE_WEIGHTS))].sort((a, b) => a - b)

export const ROLE_CATEGORIES: Record<FontRole, FontCategory[]> = {
  sans: ['sans-serif', 'serif'],
  display: ['sans-serif', 'serif'],
  mono: ['monospace'],
}

export type FontChoice = 'house' | 'system' | (string & {})
export type FontState = Record<FontRole, FontChoice>

export const HOUSE_FONTS: FontState = { sans: 'house', display: 'house', mono: 'house' }

export function familyOf(id: string): FontFamily | undefined {
  return FAMILIES.find((family) => family.id === id)
}

/** The family chosen for the role, if it is one from the list and suits it. */
export function chosenFamily(role: FontRole, choice: FontChoice): FontFamily | undefined {
  const family = familyOf(choice)
  return family && ROLE_CATEGORIES[role].includes(family.category) ? family : undefined
}

export const packageOf = (family: FontFamily) =>
  `${family.variable ? '@fontsource-variable' : '@fontsource'}/${family.id}`

/*
 * Fontsource registers the variable one as "Inter Variable" and the static one
 * as "Lato"; Google's css2 registers "Inter". The stack carries both names of
 * the variable one, so the same theme serves whoever installs the package and
 * whoever pastes the Google link, without editing the token.
 */
export const cssNamesOf = (family: FontFamily) =>
  family.variable ? [`${family.family} Variable`, family.family] : [family.family]

const FALLBACK: Record<FontCategory, string> = {
  'sans-serif': 'system-ui, sans-serif',
  serif: 'Georgia, serif',
  monospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}

export const SYSTEM_STACK: Record<FontRole, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  display: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
}

/** The token's stack, or nothing when the role keeps the house font. */
export function stackOf(role: FontRole, choice: FontChoice): string | undefined {
  if (choice === 'system') return SYSTEM_STACK[role]
  const family = chosenFamily(role, choice)
  if (!family) return undefined
  return [...cssNamesOf(family).map((name) => `"${name}"`), FALLBACK[family.category]].join(', ')
}

export const TOKEN_OF: Record<FontRole, string> = {
  sans: '--rc-font-sans',
  display: '--rc-font-display',
  mono: '--rc-font-mono',
}

export function applyFonts<T extends Record<string, string>>(tokens: T, fonts: FontState): T {
  const next: Record<string, string> = { ...tokens }
  for (const role of FONT_ROLES) {
    const stack = stackOf(role, fonts[role])
    if (stack !== undefined) next[TOKEN_OF[role]] = stack
  }
  Object.assign(next, weightTokens(fonts))
  return next as T
}

/* ---------------------------------------------------------------------------
 * The missing weight
 *
 * The browser does not refuse a weight the family lacks: it looks for the
 * neighbor by CSS Fonts 4's matching rule, and synthesizes bold when the
 * request is 600 or more and the neighbor found is lighter than that. The
 * builder does the same math BEFORE, and writes the neighbor into the weight
 * token: Lato in the display role comes out with `--rc-weight-display: 700`,
 * and DM Serif Display, which only has 400, comes out with 400. The request
 * becomes a weight the family has, and synthetic bold stops existing, instead
 * of becoming a warning.
 * ------------------------------------------------------------------------- */

export function nearestWeight(available: number[], desired: number): number {
  if (available.includes(desired)) return desired
  const sorted = [...available].sort((a, b) => a - b)
  const below = sorted.filter((weight) => weight < desired).reverse()
  const above = sorted.filter((weight) => weight > desired)
  if (desired >= 400 && desired <= 500) {
    const upTo500 = above.filter((weight) => weight <= 500)
    return upTo500[0] ?? below[0] ?? above.find((weight) => weight > 500)!
  }
  if (desired < 400) return below[0] ?? above[0]!
  return above[0] ?? below[0]!
}

export type WeightFit = { intent: WeightIntent; wanted: number; falls: number; synthetic: boolean }

/** The role's weight tokens the family lacks, with the neighbor the builder writes. */
export function weightFits(role: FontRole, family: FontFamily): WeightFit[] {
  return WEIGHT_INTENTS.filter((intent) => WEIGHT_ROLE[intent] === role).flatMap((intent) => {
    const wanted = HOUSE_WEIGHTS[intent]
    if (family.weights.includes(wanted)) return []
    const falls = nearestWeight(family.weights, wanted)
    return [{ intent, wanted, falls, synthetic: wanted >= 600 && falls < 600 }]
  })
}

/** What the theme declares for weight: only the token whose family lacks the house number. */
export function weightTokens(fonts: FontState): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const role of FONT_ROLES) {
    const family = chosenFamily(role, fonts[role])
    if (!family) continue
    for (const fit of weightFits(role, family)) tokens[weightToken(fit.intent)] = String(fit.falls)
  }
  return tokens
}

/** The faces the family needs to download: the neighbor of each weight the pieces ask for. */
export const facesOf = (family: FontFamily) =>
  [...new Set(USED_WEIGHTS.map((weight) => nearestWeight(family.weights, weight)))].sort((a, b) => a - b)

/* ---------------------------------------------------------------------------
 * What goes out to the project
 *
 * A role that keeps the house font, in a theme that changes another role,
 * goes out with its own family's package, not with `@rivocode/ui/fonts.css`:
 * that file brings the three families, and next to a client font it puts into
 * the build faces the theme no longer uses. The lines below are those of
 * `src/tokens/themes/rivocode-fonts.css`, and the builder test enforces it.
 * ------------------------------------------------------------------------- */

export const HOUSE_IMPORTS: Record<FontRole, string[]> = {
  sans: ['@fontsource-variable/manrope'],
  display: ['@fontsource/poppins/latin-600.css', '@fontsource/poppins/latin-700.css'],
  mono: ['@fontsource-variable/jetbrains-mono'],
}

const HOUSE_PACKAGES: Record<FontRole, string> = {
  sans: '@fontsource-variable/manrope',
  display: '@fontsource/poppins',
  mono: '@fontsource-variable/jetbrains-mono',
}

const unique = (items: string[]) => [...new Set(items)]

export const allHouse = (fonts: FontState) => FONT_ROLES.every((role) => fonts[role] === 'house')

const importsOf = (family: FontFamily) =>
  family.variable
    ? [packageOf(family)]
    : facesOf(family).map((weight) => `${packageOf(family)}/latin-${weight}.css`)

/** The `@import` paths, in role order and without repeats. */
export function fontImports(fonts: FontState): string[] {
  if (allHouse(fonts)) return []
  return unique(
    FONT_ROLES.flatMap((role) => {
      if (fonts[role] === 'house') return HOUSE_IMPORTS[role]
      const family = chosenFamily(role, fonts[role])
      return family ? importsOf(family) : []
    }),
  )
}

export function fontPackages(fonts: FontState): string[] {
  if (allHouse(fonts)) return []
  return unique(
    FONT_ROLES.flatMap((role) => {
      if (fonts[role] === 'house') return [HOUSE_PACKAGES[role]]
      const family = chosenFamily(role, fonts[role])
      return family ? [packageOf(family)] : []
    }),
  )
}

export function fontInstallCommand(fonts: FontState): string | undefined {
  const packages = fontPackages(fonts)
  return packages.length === 0 ? undefined : `bun add ${packages.join(' ')}`
}

/** The families chosen from the list, without repeats: what the browser needs to download. */
export function chosenFamilies(fonts: FontState): FontFamily[] {
  const found: FontFamily[] = []
  for (const role of FONT_ROLES) {
    const family = chosenFamily(role, fonts[role])
    if (family && !found.includes(family)) found.push(family)
  }
  return found
}

export function googleFontsUrl(fonts: FontState): string | undefined {
  const families = chosenFamilies(fonts)
  if (families.length === 0) return undefined
  const params = families.map((family) => {
    const weights = facesOf(family)
    return `family=${family.family.replace(/ /g, '+')}:wght@${weights.join(';')}`
  })
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`
}

/* ---------------------------------------------------------------------------
 * React Native
 *
 * On mobile each weight is a file, registered under its own name. The native
 * `RivoProvider` receives ONE name per role, so the snippet picks the weight
 * each role uses most: 400 for body and code, 600 for display - the same the
 * house loads from Poppins -, falling back to 700 and then 400.
 * ------------------------------------------------------------------------- */

const WEIGHT_NAME: Record<number, string> = {
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
}

const HOUSE_NATIVE: Record<FontRole, { family: string; id: string; weight: number }> = {
  sans: { family: 'Manrope', id: 'manrope', weight: 400 },
  display: { family: 'Poppins', id: 'poppins', weight: 600 },
  mono: { family: 'JetBrains Mono', id: 'jetbrains-mono', weight: 400 },
}

const ROLE_WEIGHTS: Record<FontRole, number[]> = {
  sans: [400],
  display: [600, 700, 400],
  mono: [400],
}

export type NativeFont = { role: FontRole; name: string; pkg: string }

export function nativeFonts(fonts: FontState): NativeFont[] {
  const out: NativeFont[] = []
  for (const role of FONT_ROLES) {
    const choice = fonts[role]
    if (choice === 'system') continue
    const family = chosenFamily(role, choice)
    const source = family
      ? {
          family: family.family,
          id: family.id,
          weight: ROLE_WEIGHTS[role].find((weight) => family.weights.includes(weight))!,
        }
      : HOUSE_NATIVE[role]
    out.push({
      role,
      name: `${source.family.replace(/ /g, '')}_${source.weight}${WEIGHT_NAME[source.weight]}`,
      pkg: `@expo-google-fonts/${source.id}`,
    })
  }
  return out
}

export function nativeFontsSnippet(fonts: FontState): string {
  const list = nativeFonts(fonts)
  const byPackage = new Map<string, string[]>()
  for (const font of list) {
    const names = byPackage.get(font.pkg) ?? []
    if (!names.includes(font.name)) names.push(font.name)
    byPackage.set(font.pkg, names)
  }
  const imports = [...byPackage].map(([pkg, names]) => `import { ${names.join(', ')} } from "${pkg}";`)
  const loaded = unique(list.map((font) => font.name))
  const props = list.map((font) => `${font.role}: "${font.name}"`).join(', ')

  const open =
    list.length === 0
      ? '<RivoProvider>'
      : `<RivoProvider\n      fonts={{ ${props} }}\n      isFontLoaded={isLoaded}\n    >`
  const load =
    loaded.length === 0
      ? ''
      : `  const [ready] = useFonts({ ${loaded.join(', ')} });\n  if (!ready) return null;\n\n`

  return (
    `${loaded.length === 0 ? '' : 'import { isLoaded, useFonts } from "expo-font";\n'}` +
    `import { RivoProvider } from "@rivocode/ui-native";\n` +
    `${imports.join('\n')}${imports.length === 0 ? '' : '\n'}\n` +
    `export default function App() {\n` +
    load +
    `  return (\n` +
    `    ${open}\n` +
    `      {/* … */}\n` +
    `    </RivoProvider>\n` +
    `  );\n` +
    `}\n`
  )
}

export function nativeInstallCommand(fonts: FontState): string | undefined {
  const packages = unique(nativeFonts(fonts).map((font) => font.pkg))
  return packages.length === 0 ? undefined : `npx expo install expo-font ${packages.join(' ')}`
}
