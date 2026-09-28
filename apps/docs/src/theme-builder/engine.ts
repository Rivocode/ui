import {
  MIN_TEXT,
  checkThemeCss,
  checkThemeMap,
  contrastRatio,
  resolveTokens,
  toHex,
  type ColorMap,
  type Finding,
} from '../../../../src/lib/contrast'
import { checkThemes, themeBlocks } from '../../../../src/lib/theme-check'
import { exportDtcg } from '../../../../src/tokens/dtcg'
import { THEME_ROLES } from '../../../../src/tokens/theme-roles'
import TOKENS from '../../../../native/tokens.json'
import {
  FONT_ROLES,
  HOUSE_FONTS,
  allHouse,
  chosenFamily,
  fontImports,
  fontInstallCommand,
  googleFontsUrl,
  type FontRole,
  type FontState,
} from './fonts'

/* ---------------------------------------------------------------------------
 * The theme builder engine
 *
 * The person writes the eight seeds `rivocode-ui-native-theme` already accepts
 * - background, surface, text, accent and the four states - and the rest comes
 * out of them by the SAME rules as that command: the alpha of one seed, the
 * mix of two, the tone that weighs more on a fill. The tables below are a copy
 * of those in `native/scripts/build-theme.mjs`, because that module reads
 * `tokens.json` from disk at the top and does not run in the browser. The copy
 * does not go stale silently: `test/theme-builder.test.ts` runs both with the
 * same seeds and checks role by role.
 *
 * The measurement is `src/lib/contrast.ts`'s, the same math as `check-theme`
 * and the repository's two guards, and the DTCG JSON comes from the same
 * `exportDtcg` as `rivocode-ui tokens`. The site imports directly; what
 * `check:cli` forbids is the math reaching the package's `src/index.ts`, and
 * this is the site.
 * ------------------------------------------------------------------------- */

export type Scheme = 'light' | 'dark'
export const SCHEMES: Scheme[] = ['light', 'dark']

export const SEEDS = ['bg', 'surface', 'fg', 'accent', 'success', 'warning', 'danger', 'info'] as const
export type Seed = (typeof SEEDS)[number]

export type Palette = Record<string, string>

const HOUSE_THEMES = TOKENS.themes as Record<string, Palette>
export const HOUSE: Record<Scheme, Palette> = {
  light: HOUSE_THEMES['rivocode-light']!,
  dark: HOUSE_THEMES['rivocode-dark']!,
}

/** The color roles both packages have, in `tokens.json` order. */
export const ROLES = Object.keys(HOUSE.dark)

const SAME: Record<string, string> = { 'surface-raised': 'surface', ring: 'accent-text' }

const ALPHA: Record<string, { from: string; light: number; dark: number }> = {
  overlay: { from: 'ink', light: 0.42, dark: 0.62 },
  skeleton: { from: 'fg', light: 0.08, dark: 0.08 },
  border: { from: 'fg', light: 0.1, dark: 0.09 },
  'border-strong': { from: 'fg', light: 0.48, dark: 0.38 },
  'border-disabled': { from: 'fg', light: 0.3, dark: 0.22 },
  'line-hover': { from: 'fg', light: 0.62, dark: 0.5 },
  selected: { from: 'accent', light: 0.16, dark: 0.05 },
  'accent-subtle': { from: 'accent', light: 0.22, dark: 0.14 },
  'success-subtle': { from: 'success', light: 0.1, dark: 0.14 },
  'warning-subtle': { from: 'warning', light: 0.1, dark: 0.14 },
  'danger-subtle': { from: 'danger', light: 0.1, dark: 0.14 },
  'info-subtle': { from: 'info', light: 0.1, dark: 0.14 },
}

const MIX: Record<string, { from: string; toward: string; keep: number }> = {
  'fg-muted': { from: 'fg', toward: 'bg', keep: 0.7 },
  'fg-subtle': { from: 'fg', toward: 'bg', keep: 0.62 },
  'fg-disabled': { from: 'fg', toward: 'bg', keep: 0.45 },
  'accent-hover': { from: 'accent', toward: 'paper', keep: 0.85 },
  'accent-active': { from: 'accent', toward: 'ink', keep: 0.9 },
}

const OVER: Record<string, string[]> = {
  'accent-fg': ['accent', 'accent-active'],
  'success-fg': ['success'],
  'warning-fg': ['warning'],
  'danger-fg': ['danger'],
  'info-fg': ['info'],
}

/** Each tone's text is born equal to the fill, and it is what fails most. */
export const REUSE: Record<string, string> = {
  'accent-text': 'accent',
  'success-text': 'success',
  'warning-text': 'warning',
  'danger-text': 'danger',
  'info-text': 'info',
}

const SERIES = ROLES.filter((role) => /^chart-\d+$/.test(role))

const WHITE = '#ffffff'
const BLACK = '#000000'

const bytes = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16))
const hexOf = (parts: number[]) =>
  `#${parts.map((part) => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, '0')).join('')}`

export function mix(from: string, toward: string, keep: number) {
  const a = bytes(from)
  const b = bytes(toward)
  return hexOf(a.map((part, at) => keep * part + (1 - keep) * b[at]!))
}

export function withAlpha(color: string, amount: number) {
  return `rgba(${bytes(color).join(',')},${amount})`
}

export const isDarkScheme = (bg: string) => contrastRatio(bg, WHITE) > contrastRatio(bg, BLACK)

/** Six-digit hex, or nothing: it is what a seed accepts. */
export function normalizeHex(value: string) {
  return toHex(value.trim()) ?? null
}

export type Derived = { scheme: Scheme; colors: Palette; written: string[]; guessed: string[] }

/** A faithful port of `rivocode-ui-native-theme`'s `derive`. */
export function derive(seeds: Palette): Derived {
  const colors: Palette = {}
  const scheme: Scheme = isDarkScheme(seeds.bg!) ? 'dark' : 'light'
  const ink =
    contrastRatio(seeds.fg!, WHITE) > contrastRatio(seeds.bg!, WHITE) ? seeds.fg! : seeds.bg!
  const paper = ink === seeds.fg ? seeds.bg! : seeds.fg!
  const anchors: Palette = { ...seeds, ink, paper }

  for (const role of ROLES) if (seeds[role] !== undefined) colors[role] = seeds[role]!

  const put = (role: string, value: string | undefined) => {
    if (colors[role] === undefined && value !== undefined) colors[role] = value
  }

  for (const [role, from] of Object.entries(REUSE)) put(role, colors[from] ?? anchors[from])

  for (const [role, how] of Object.entries(MIX)) {
    const from = colors[how.from] ?? anchors[how.from]
    const toward = colors[how.toward] ?? anchors[how.toward]
    if (from && toward) put(role, mix(from, toward, how.keep))
  }

  for (const [role, fills] of Object.entries(OVER)) {
    const solid = fills.map((fill) => colors[fill] ?? anchors[fill]).filter(Boolean) as string[]
    if (solid.length !== fills.length) continue
    const score = (candidate: string) =>
      Math.min(...solid.map((fill) => contrastRatio(candidate, fill)))
    const own = score(ink) >= score(paper) ? ink : paper
    const extreme = score(BLACK) >= score(WHITE) ? BLACK : WHITE
    put(role, score(own) >= MIN_TEXT ? own : extreme)
  }

  for (const [role, from] of Object.entries(SAME)) put(role, colors[from])

  for (const [role, how] of Object.entries(ALPHA)) {
    const from = colors[how.from] ?? anchors[how.from]
    if (from) put(role, withAlpha(from, how[scheme]))
  }

  for (const role of SERIES) put(role, HOUSE[scheme][role])

  return {
    scheme,
    colors,
    written: ROLES.filter((role) => seeds[role] !== undefined),
    guessed: ROLES.filter((role) => seeds[role] === undefined && colors[role] !== undefined),
  }
}

/* ---------------------------------------------------------------------------
 * What the web has on top
 *
 * The native map has only color. The web's layer 3 also has the three
 * families, the two brand sizes, the shadows, the glow and the three finishes.
 * They come from the house theme of the same scheme - they are not color
 * identity -, except the glow, which is made of the accent color and follows
 * the brand.
 * ------------------------------------------------------------------------- */

export type HouseBlocks = Record<Scheme, ColorMap>

export function houseBlocks(houseCss: string): HouseBlocks {
  const blocks = themeBlocks([{ file: 'preset.css', css: houseCss }])
  const of = (name: string) =>
    blocks.find((block) => block.selector === `[data-rc-theme="${name}"]`)?.tokens ?? {}
  return { light: of('rivocode-light'), dark: of('rivocode-dark') }
}

const GLOW_ALPHA: Record<Scheme, number> = { light: 0.18, dark: 0.2 }

export const RADII = {
  house: undefined,
  square: { sm: '0px', md: '0px', lg: '0px', xl: '0px' },
  soft: { sm: '2px', md: '4px', lg: '6px', xl: '8px' },
  round: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
} as const

export type Radius = keyof typeof RADII

/** The web roles, in `THEME_ROLES` order, with each one's value. */
export function webTokens(colors: Palette, scheme: Scheme, house: HouseBlocks): ColorMap {
  const tokens: ColorMap = {}
  for (const role of THEME_ROLES) {
    const bare = role.slice('--rc-'.length)
    if (colors[bare] !== undefined) tokens[role] = colors[bare]!
    else if (role === '--rc-glow-accent') {
      tokens[role] = `0 0 32px ${withAlpha(colors['accent-text']!, GLOW_ALPHA[scheme])}`
    } else if (house[scheme][role] !== undefined) tokens[role] = house[scheme][role]!
  }
  return tokens
}

/* ---------------------------------------------------------------------------
 * The measurement
 * ------------------------------------------------------------------------- */

export type Pair = { ok: boolean; text: string; ratio: number | null; min: number | null }

/**
 * A `checkThemeCss` line, without the status prefix. Both spellings of the
 * prefix are accepted, so the builder survives the report being translated.
 */
export function pairOf(finding: Finding): Pair {
  const text = finding.line.trim().replace(/^(ok|FALHA|FALTA|FAIL|MISSING)\s+/, '')
  const ratio = /(\d+\.\d+):1/.exec(text)
  const min = /\(min ([\d.]+)/.exec(text)
  return {
    ok: finding.ok,
    text,
    ratio: ratio ? Number(ratio[1]) : null,
    min: min ? Number(min[1]) : null,
  }
}

export function measureWeb(selector: string, tokens: ColorMap): Pair[] {
  return checkThemeCss(selector, resolveTokens(tokens, tokens))
    .filter((finding) => !finding.line.startsWith('\n') && !/^(nota|note)\b/.test(finding.line.trim()))
    .map(pairOf)
}

/** The native map's failures, per scheme: what the native command would refuse. */
export function measureNative(map: Record<Scheme, Palette>): Record<Scheme, string[]> {
  const failures: Record<Scheme, string[]> = { light: [], dark: [] }
  let scheme: Scheme = 'light'
  for (const finding of checkThemeMap('builder', map, ROLES)) {
    const header = /\/\s*(light|dark)\s*$/.exec(finding.line)
    if (header) {
      scheme = header[1] as Scheme
      continue
    }
    if (!finding.ok) failures[scheme].push(finding.line.trim().replace(/^(FALHA|FALTA|FAIL|MISSING)\s+/, ''))
  }
  return failures
}

const names = (role: string) => new RegExp(`(^|\\s)(--rc-)?${role.replace(/-/g, '\\-')}(?![\\w-])`)

/* ---------------------------------------------------------------------------
 * Adjusting each tone's text
 *
 * The text of the accent and of the states is born equal to the fill. On a
 * light background, the lime that fills the button does not read as a link,
 * and the native command refuses the palette and suggests the color that
 * would pass. The builder does the same math - pulling the tone toward white
 * or black in 2% steps, up to the first one that passes BOTH measurements -
 * and writes the result as a seed, so the equivalent command accepts the
 * exported palette. Every adjustment shows on screen; none is silent.
 * ------------------------------------------------------------------------- */

export type Fix = { role: string; from: string; to: string }

function failsFor(role: string, colors: Palette, scheme: Scheme, house: HouseBlocks, other: Palette) {
  const tokens = webTokens(colors, scheme, house)
  const web = measureWeb('measure', tokens).some((pair) => !pair.ok && names(role).test(pair.text))
  if (web) return true
  const map = scheme === 'light' ? { light: colors, dark: other } : { light: other, dark: colors }
  return measureNative(map)[scheme].some((line) => names(role).test(line))
}

export function suggestFor(
  role: string,
  seeds: Palette,
  scheme: Scheme,
  house: HouseBlocks,
  other: Palette,
): string | undefined {
  const from = REUSE[role]
  if (!from) return undefined
  const base = derive(seeds)
  const fill = base.colors[from]!
  const toward = isDarkScheme(base.colors.bg!) ? WHITE : BLACK
  for (let step = 1; step <= 50; step++) {
    const candidate = mix(fill, toward, 1 - step / 50)
    const next = derive({ ...seeds, [role]: candidate }).colors
    if (!failsFor(role, next, scheme, house, other)) return candidate
  }
  return undefined
}

export type Built = {
  seeds: Palette
  derived: Derived
  fixes: Fix[]
  tokens: ColorMap
}

export function build(
  written: Palette,
  scheme: Scheme,
  house: HouseBlocks,
  other: Palette,
  autoFix: boolean,
): Built {
  let seeds = { ...written }
  const fixes: Fix[] = []

  if (autoFix) {
    for (const role of Object.keys(REUSE)) {
      if (written[role] !== undefined) continue
      const current = derive(seeds).colors
      if (!failsFor(role, current, scheme, house, other)) continue
      const suggestion = suggestFor(role, seeds, scheme, house, other)
      if (!suggestion) continue
      fixes.push({ role, from: current[role]!, to: suggestion })
      seeds = { ...seeds, [role]: suggestion }
    }
  }

  const derived = derive(seeds)
  return { seeds, derived, fixes, tokens: webTokens(derived.colors, scheme, house) }
}

/* ---------------------------------------------------------------------------
 * The files that come out
 * ------------------------------------------------------------------------- */

export const selectorOf = (name: string, scheme: Scheme) => `[data-rc-theme="${name}-${scheme}"]`

export function webBlocks(name: string, tokens: Record<Scheme, ColorMap>, radius: Radius) {
  const shape = RADII[radius]
  return SCHEMES.map((scheme) => {
    const lines = Object.entries(tokens[scheme]).map(([role, value]) => `  ${role}: ${value};`)
    const extra = shape
      ? ['', ...Object.entries(shape).map(([size, value]) => `  --rc-radius-${size}: ${value};`)]
      : []
    const colorScheme = isDarkScheme(tokens[scheme]['--rc-bg']!) ? 'dark' : 'light'
    return `${selectorOf(name, scheme)} {\n  color-scheme: ${colorScheme};\n\n${lines.join('\n')}${extra.join('\n')}\n}`
  }).join('\n\n')
}

function fontHeader(fonts: FontState) {
  if (allHouse(fonts)) {
    return '\n   Fonts:                     the house ones, with  @import "@rivocode/ui/fonts.css";  in the entry CSS'
  }
  const install = fontInstallCommand(fonts)
  return install ? `\n   Fonts:                     ${install}` : ''
}

function fontPreamble(fonts: FontState) {
  const imports = fontImports(fonts)
  if (imports.length === 0) return ''
  const lines = imports.map((path) => `@import "${path}";`).join('\n')
  const url = googleFontsUrl(fonts)
  const google = url
    ? `\n\n/* Without installing a package: delete the @import lines above and put in the HTML <head>\n` +
      `   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
      `   <link rel="stylesheet" href="${url}">` +
      (FONT_ROLES.some((role) => fonts[role] === 'house')
        ? `\n   The role that kept the house font still comes from the package. */`
        : ' */')
    : ''
  return `${lines}${google}\n\n`
}

export function emitWebCss(
  name: string,
  tokens: Record<Scheme, ColorMap>,
  radius: Radius,
  failures: string[],
  fonts: FontState = HOUSE_FONTS,
) {
  const warning =
    failures.length === 0
      ? ''
      : `\n\n   WARNING: ${failures.length} ${failures.length === 1 ? 'pair failed' : 'pairs failed'} the WCAG contrast measurement:\n` +
        failures.map((line) => `     ${line}`).join('\n') +
        '\n   check-theme exits with code 1 while they are here.'

  return (
    `/* tema-${name}.css, generated by the theme builder at ds.rivocode.com.br.\n` +
    `   Import after the preset:   @import "@rivocode/ui/preset";  @import "./tema-${name}.css";\n` +
    `   Dress the tree:            <RivoProvider theme="${name}-dark">  or  "${name}-light"\n` +
    `   Check it:                  npx rivocode-ui check-theme src/tema-${name}.css` +
    `${fontHeader(fonts)}${warning} */\n\n` +
    fontPreamble(fonts) +
    `${webBlocks(name, tokens, radius)}\n`
  )
}

/** A faithful port of `rivocode-ui-native-theme`'s `emitCss`: the app's `@theme`. */
export function emitNativeCss(colors: Record<Scheme, Palette>, source: string) {
  const lines = ROLES.map((role) => {
    const light = colors.light[role]
    const dark = colors.dark[role]
    const value = light === dark ? light : `light-dark(${light}, ${dark})`
    return `  --color-${role}: ${value};`
  })

  return (
    `/* Generated from ${source} by rivocode-ui-native-theme. Do not edit: run the command again. */\n\n` +
    `/* Import AFTER "@rivocode/ui-native/theme.css", in the app's global.css:\n` +
    `     @import "@rivocode/ui-native/theme.css";\n` +
    `     @import "./${source.replace(/\.[^.]+$/, '')}.theme.css";\n` +
    `   and run "npx rivocode-ui-native-css" so generated.css comes out with the brand. */\n\n` +
    `@theme {\n${lines.join('\n')}\n}\n`
  )
}

/** The palette `rivocode-ui-native-theme` reads: only what was written, per scheme. */
export function emitPalette(seeds: Record<Scheme, Palette>) {
  return `${JSON.stringify({ light: seeds.light, dark: seeds.dark }, undefined, 2)}\n`
}

export function emitDtcg(houseCss: string, name: string, css: string) {
  return exportDtcg(houseCss, [{ file: `tema-${name}.css`, css }])
}

export function missingRoles(name: string, css: string) {
  return checkThemes([{ file: `tema-${name}.css`, css }], THEME_ROLES)
}

export function commandsOf(name: string) {
  return [
    `npx rivocode-ui check-theme src/tema-${name}.css`,
    `npx rivocode-ui tokens src/tema-${name}.css --out tokens`,
    `npx rivocode-ui-native-theme ${name}.json`,
  ]
}

/* ---------------------------------------------------------------------------
 * The state in the URL
 *
 * Only what differs from the house goes into the address, as `role.hex`
 * separated by `_`: characters the URL does not escape, so a link pasted in a
 * chat stays readable. A seed that does not read as a color is dropped, and
 * does not break the page. The font goes by its fontsource id (`corpo=inter`)
 * or by `sistema`; an id outside the list, or of a category that does not
 * suit the role, falls back to the house font.
 *
 * The parameter names and values stay in Portuguese: they are public
 * addresses, and links already shared must keep opening the same theme.
 * ------------------------------------------------------------------------- */

export type BuilderState = {
  name: string
  seeds: Record<Scheme, Palette>
  radius: Radius
  autoFix: boolean
  fonts: FontState
}

export const houseSeeds = (scheme: Scheme): Palette =>
  Object.fromEntries(SEEDS.map((seed) => [seed, HOUSE[scheme][seed]!]))

export const DEFAULT_STATE: BuilderState = {
  name: 'acme',
  seeds: { light: houseSeeds('light'), dark: houseSeeds('dark') },
  radius: 'house',
  autoFix: true,
  fonts: HOUSE_FONTS,
}

const SCHEME_PARAM: Record<Scheme, string> = { light: 'claro', dark: 'escuro' }

const FONT_PARAM: Record<FontRole, string> = { sans: 'corpo', display: 'titulo', mono: 'codigo' }

const RADIUS_PARAM: Record<Radius, string> = {
  house: 'casa',
  square: 'reto',
  soft: 'suave',
  round: 'redondo',
}

export function cleanName(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return /^[a-z]/.test(slug) ? slug.slice(0, 32) : ''
}

export function writeQuery(state: BuilderState) {
  const params = new URLSearchParams()
  if (state.name !== DEFAULT_STATE.name) params.set('nome', state.name)
  for (const scheme of SCHEMES) {
    const changed = SEEDS.filter((seed) => state.seeds[scheme][seed] !== houseSeeds(scheme)[seed])
    if (changed.length > 0) {
      params.set(
        SCHEME_PARAM[scheme],
        changed.map((seed) => `${seed}.${state.seeds[scheme][seed]!.slice(1)}`).join('_'),
      )
    }
  }
  if (state.radius !== 'house') params.set('raio', RADIUS_PARAM[state.radius])
  if (!state.autoFix) params.set('ajuste', 'nao')
  for (const role of FONT_ROLES) {
    const choice = state.fonts[role]
    if (choice === 'system') params.set(FONT_PARAM[role], 'sistema')
    else if (chosenFamily(role, choice)) params.set(FONT_PARAM[role], choice)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

function readFonts(params: URLSearchParams): FontState {
  const fonts = { ...HOUSE_FONTS }
  for (const role of FONT_ROLES) {
    const value = params.get(FONT_PARAM[role])
    if (value === 'sistema') fonts[role] = 'system'
    else if (value && chosenFamily(role, value)) fonts[role] = value
  }
  return fonts
}

export function readQuery(search: string): BuilderState {
  const params = new URLSearchParams(search)
  const seeds = { light: houseSeeds('light'), dark: houseSeeds('dark') }

  for (const scheme of SCHEMES) {
    for (const pair of (params.get(SCHEME_PARAM[scheme]) ?? '').split('_')) {
      const [seed, hex] = pair.split('.')
      if (!seed || !hex || !(SEEDS as readonly string[]).includes(seed)) continue
      const color = normalizeHex(`#${hex}`)
      if (color) seeds[scheme][seed] = color
    }
  }

  const radius = (Object.keys(RADIUS_PARAM) as Radius[]).find(
    (key) => RADIUS_PARAM[key] === params.get('raio'),
  )
  return {
    name: cleanName(params.get('nome') ?? '') || DEFAULT_STATE.name,
    seeds,
    radius: radius ?? 'house',
    autoFix: params.get('ajuste') !== 'nao',
    fonts: readFonts(params),
  }
}
