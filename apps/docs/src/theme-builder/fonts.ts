/* ---------------------------------------------------------------------------
 * As familias que o montador oferece
 *
 * A lista e curada e embutida: nenhuma chamada a API do Google Fonts, que
 * exige chave, e nenhuma familia que ninguem conferiu. Cada linha foi medida
 * em 24/09/2026 contra tres fontes - a API publica do Fontsource (categoria,
 * pesos, se e variavel), o registro do npm (o pacote `@fontsource-variable/*`
 * ou `@fontsource/*` existe) e o css2 do Google Fonts (o pedido com os pesos
 * da lista responde 200). O pacote `@expo-google-fonts/*` de cada uma tambem
 * existe, e exporta `<Familia sem espaco>_<peso><Nome>`, que e de onde sai o
 * nome do trecho do React Native.
 *
 * `weights` e a lista de faces estaticas que a familia publica. Para a
 * variavel, e o que o eixo `wght` cobre em passos de cem. Pedir ao css2 um
 * peso que a familia nao tem devolve 400 e nenhuma face, por isso o link so
 * pede a intersecao com os pesos que as pecas usam.
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
 * Os pesos que as pecas pedem
 *
 * As pecas nao escrevem `font-semibold`: escrevem a intencao (`font-rc-medium`,
 * `font-rc-display`), e o numero mora em `--rc-weight-*`, no `forma.css`. O
 * valor da casa vem do `tokens.json` do nativo, que e gerado daquele CSS, para
 * o montador nao ter uma segunda tabela que envelhece calada.
 *
 * Quatro das cinco intencoes vestem o corpo, e a de titulo veste a familia de
 * titulo: e por essa familia que cada token e conferido. O `Kbd` tambem pede
 * `font-rc-medium` na familia de codigo, mas o token e um so para as tres, e o
 * corpo e quem mais o usa.
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

/** Os numeros que as pecas pedem com o tema da casa, sem repeticao e em ordem. */
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

/** A familia escolhida para o papel, se for uma da lista e servir a ele. */
export function chosenFamily(role: FontRole, choice: FontChoice): FontFamily | undefined {
  const family = familyOf(choice)
  return family && ROLE_CATEGORIES[role].includes(family.category) ? family : undefined
}

export const packageOf = (family: FontFamily) =>
  `${family.variable ? '@fontsource-variable' : '@fontsource'}/${family.id}`

/*
 * O fontsource registra a variavel como "Inter Variable" e a estatica como
 * "Lato"; o css2 do Google registra "Inter". A pilha leva os dois nomes da
 * variavel, e assim o mesmo tema serve a quem instala o pacote e a quem cola
 * o link do Google, sem editar o token.
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

/** A pilha do token, ou nada quando o papel fica com a fonte da casa. */
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
 * O peso que falta
 *
 * O navegador nao recusa um peso que a familia nao tem: ele procura o vizinho
 * pela regra de casamento da CSS Fonts 4, e sintetiza negrito quando o pedido
 * e 600 ou mais e o vizinho achado e mais leve que isso. O montador faz a mesma
 * conta ANTES, e escreve o vizinho no token de peso: a Lato no titulo sai com
 * `--rc-weight-display: 700`, e a DM Serif Display, que so tem 400, sai com
 * 400. O pedido passa a ser um peso que a familia tem, e o negrito sintetico
 * deixa de existir, em vez de virar aviso.
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

/** Os tokens de peso do papel que a familia nao tem, com o vizinho que o montador escreve. */
export function weightFits(role: FontRole, family: FontFamily): WeightFit[] {
  return WEIGHT_INTENTS.filter((intent) => WEIGHT_ROLE[intent] === role).flatMap((intent) => {
    const wanted = HOUSE_WEIGHTS[intent]
    if (family.weights.includes(wanted)) return []
    const falls = nearestWeight(family.weights, wanted)
    return [{ intent, wanted, falls, synthetic: wanted >= 600 && falls < 600 }]
  })
}

/** O que o tema declara de peso: so o token cuja familia nao tem o numero da casa. */
export function weightTokens(fonts: FontState): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const role of FONT_ROLES) {
    const family = chosenFamily(role, fonts[role])
    if (!family) continue
    for (const fit of weightFits(role, family)) tokens[weightToken(fit.intent)] = String(fit.falls)
  }
  return tokens
}

/** As faces que a familia precisa baixar: o vizinho de cada peso que as pecas pedem. */
export const facesOf = (family: FontFamily) =>
  [...new Set(USED_WEIGHTS.map((weight) => nearestWeight(family.weights, weight)))].sort((a, b) => a - b)

/* ---------------------------------------------------------------------------
 * O que sai para o projeto
 *
 * O papel que fica com a fonte da casa, num tema que troca outro papel, sai
 * com o pacote da propria familia, e nao com o `@rivocode/ui/fonts.css`: esse
 * arquivo traz as tres familias, e junto de uma fonte de cliente ele poe no
 * build as faces que o tema ja nao usa. As linhas abaixo sao as do
 * `src/tokens/themes/rivocode-fonts.css`, e o teste do montador cobra isso.
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

/** Os caminhos de `@import`, em ordem de papel e sem repeticao. */
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

/** As familias escolhidas da lista, sem repeticao: e o que o navegador precisa baixar. */
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
 * O React Native
 *
 * No celular cada peso e um arquivo, registrado com um nome proprio. O
 * `RivoProvider` nativo recebe UM nome por papel, entao o trecho escolhe o
 * peso que cada papel mais usa: 400 no corpo e no codigo, 600 no titulo - o
 * mesmo que a casa carrega da Poppins -, caindo para 700 e depois 400.
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
