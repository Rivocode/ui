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
 * O motor do montador de tema
 *
 * A pessoa escreve as oito sementes que o `rivocode-ui-native-theme` ja aceita
 * - fundo, superficie, texto, acento e os quatro estados - e o resto sai delas
 * pelas MESMAS regras daquele comando: alfa de uma semente, mistura de duas,
 * o tom que pesa mais sobre um preenchimento. As tabelas abaixo sao copia das
 * de `native/scripts/build-theme.mjs`, porque aquele modulo le o `tokens.json`
 * do disco no topo e nao roda no navegador. A copia nao envelhece calada:
 * `test/montador-de-tema.test.ts` roda os dois com as mesmas sementes e cobra
 * papel por papel.
 *
 * A medida e a do `src/lib/contrast.ts`, a mesma conta do `check-theme` e das
 * duas guardas do repositorio, e o JSON DTCG sai da mesma `exportDtcg` do
 * `rivocode-ui tokens`. O site importa direto; o que o `check:cli` proibe e a
 * conta alcancar o `src/index.ts` do pacote, e isto aqui e o site.
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

/** Os papeis de cor que os dois pacotes tem, na ordem do `tokens.json`. */
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

/** O texto de cada tom nasce igual ao preenchimento, e e o que mais reprova. */
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

/** Hexadecimal de seis digitos, ou nada: e o que a semente aceita. */
export function normalizeHex(value: string) {
  return toHex(value.trim()) ?? null
}

export type Derived = { scheme: Scheme; colors: Palette; written: string[]; guessed: string[] }

/** Porte fiel do `derive` do `rivocode-ui-native-theme`. */
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
 * O que o web tem a mais
 *
 * O mapa nativo tem so cor. A camada 3 do web tem tambem as tres familias, os
 * dois tamanhos de marca, as sombras, o brilho e os tres acabamentos. Eles
 * saem do tema da casa do mesmo esquema - nao sao identidade de cor -, menos o
 * brilho, que e feito da cor do acento e acompanha a marca.
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

/** Os papeis do web, na ordem do `THEME_ROLES`, com o valor de cada um. */
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
 * A medida
 * ------------------------------------------------------------------------- */

export type Pair = { ok: boolean; text: string; ratio: number | null; min: number | null }

/** Uma linha do `checkThemeCss`, sem o prefixo de situacao. */
export function pairOf(finding: Finding): Pair {
  const text = finding.line.trim().replace(/^(ok|FALHA|FALTA)\s+/, '')
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
    .filter((finding) => !finding.line.startsWith('\n') && !finding.line.trim().startsWith('nota'))
    .map(pairOf)
}

/** As falhas do mapa nativo, por esquema: e o que o comando do nativo recusaria. */
export function measureNative(map: Record<Scheme, Palette>): Record<Scheme, string[]> {
  const failures: Record<Scheme, string[]> = { light: [], dark: [] }
  let scheme: Scheme = 'light'
  for (const finding of checkThemeMap('montador', map, ROLES)) {
    const header = /\/\s*(light|dark)\s*$/.exec(finding.line)
    if (header) {
      scheme = header[1] as Scheme
      continue
    }
    if (!finding.ok) failures[scheme].push(finding.line.trim().replace(/^(FALHA|FALTA)\s+/, ''))
  }
  return failures
}

const names = (role: string) => new RegExp(`(^|\\s)(--rc-)?${role.replace(/-/g, '\\-')}(?![\\w-])`)

/* ---------------------------------------------------------------------------
 * O ajuste do texto de cada tom
 *
 * O texto do acento e dos estados nasce igual ao preenchimento. Num fundo
 * claro, o lima que preenche o botao nao se le como link, e o comando do
 * nativo recusa a paleta e sugere a cor que passaria. O montador faz a mesma
 * conta - puxar o tom para o branco ou para o preto em passos de 2%, ate o
 * primeiro que passa nas DUAS medidas - e escreve o resultado como semente,
 * para o comando equivalente aceitar a paleta exportada. Todo ajuste aparece
 * na tela; nenhum e silencioso.
 * ------------------------------------------------------------------------- */

export type Fix = { role: string; from: string; to: string }

function failsFor(role: string, colors: Palette, scheme: Scheme, house: HouseBlocks, other: Palette) {
  const tokens = webTokens(colors, scheme, house)
  const web = measureWeb('medida', tokens).some((pair) => !pair.ok && names(role).test(pair.text))
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
 * Os arquivos que saem
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
    return '\n   Fontes:                    as da casa, com  @import "@rivocode/ui/fonts.css";  no CSS de entrada'
  }
  const install = fontInstallCommand(fonts)
  return install ? `\n   Fontes:                    ${install}` : ''
}

function fontPreamble(fonts: FontState) {
  const imports = fontImports(fonts)
  if (imports.length === 0) return ''
  const lines = imports.map((path) => `@import "${path}";`).join('\n')
  const url = googleFontsUrl(fonts)
  const google = url
    ? `\n\n/* Sem instalar pacote: apague os @import acima e ponha no <head> do HTML\n` +
      `   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
      `   <link rel="stylesheet" href="${url}">` +
      (FONT_ROLES.some((role) => fonts[role] === 'house')
        ? `\n   O papel que ficou com a fonte da casa continua pelo pacote. */`
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
      : `\n\n   ATENÇÃO: ${failures.length} ${failures.length === 1 ? 'par reprovou' : 'pares reprovaram'} na medida de contraste da WCAG:\n` +
        failures.map((line) => `     ${line}`).join('\n') +
        '\n   O check-theme sai com código 1 enquanto eles estiverem aqui.'

  return (
    `/* tema-${name}.css, gerado pelo montador de tema de ds.rivocode.com.br.\n` +
    `   Importe depois do preset:  @import "@rivocode/ui/preset";  @import "./tema-${name}.css";\n` +
    `   Vista a árvore:            <RivoProvider theme="${name}-dark">  ou  "${name}-light"\n` +
    `   Confira:                   npx rivocode-ui check-theme src/tema-${name}.css` +
    `${fontHeader(fonts)}${warning} */\n\n` +
    fontPreamble(fonts) +
    `${webBlocks(name, tokens, radius)}\n`
  )
}

/** Porte fiel do `emitCss` do `rivocode-ui-native-theme`: o `@theme` do app. */
export function emitNativeCss(colors: Record<Scheme, Palette>, source: string) {
  const lines = ROLES.map((role) => {
    const light = colors.light[role]
    const dark = colors.dark[role]
    const value = light === dark ? light : `light-dark(${light}, ${dark})`
    return `  --color-${role}: ${value};`
  })

  return (
    `/* Gerado de ${source} por rivocode-ui-native-theme. Nao editar: rode o comando de novo. */\n\n` +
    `/* Importe DEPOIS de "@rivocode/ui-native/theme.css", no global.css do app:\n` +
    `     @import "@rivocode/ui-native/theme.css";\n` +
    `     @import "./${source.replace(/\.[^.]+$/, '')}.theme.css";\n` +
    `   e rode "npx rivocode-ui-native-css" para o generated.css sair com a marca. */\n\n` +
    `@theme {\n${lines.join('\n')}\n}\n`
  )
}

/** A paleta que o `rivocode-ui-native-theme` le: so o que foi escrito, por esquema. */
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
 * O estado na URL
 *
 * So o que difere da casa entra no endereco, em `papel.hex` separado por `_`:
 * sao caracteres que a URL nao escapa, entao o link colado num chat continua
 * legivel. Semente que nao le como cor e descartada, e nao quebra a pagina.
 * A fonte vai pelo id do fontsource (`corpo=inter`) ou por `sistema`; id fora
 * da lista, ou de categoria que nao serve ao papel, volta a fonte da casa.
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
