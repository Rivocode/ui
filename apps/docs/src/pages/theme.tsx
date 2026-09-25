import {
  Accordion,
  AccordionItem,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Clipboard,
  CodeBlock,
  ColorPicker,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  RivoProvider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Toggle,
  ToggleGroup,
  type RivoDensity,
} from '@rivocode/ui'
import { Download, RotateCcw } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import HOUSE_CSS from 'virtual:house-css'
import {
  DEFAULT_STATE,
  SCHEMES,
  SEEDS,
  build,
  cleanName,
  commandsOf,
  derive,
  emitDtcg,
  emitNativeCss,
  emitPalette,
  emitWebCss,
  houseBlocks,
  isDarkScheme,
  measureNative,
  measureWeb,
  missingRoles,
  normalizeHex,
  readQuery,
  selectorOf,
  webBlocks,
  writeQuery,
  type BuilderState,
  type Pair,
  type Radius,
  type Scheme,
  type Seed,
} from '@/theme-builder/engine'
import {
  FAMILIES,
  FONT_ROLES,
  ROLE_CATEGORIES,
  applyFonts,
  chosenFamily,
  fontInstallCommand,
  googleFontsUrl,
  nativeFontsSnippet,
  nativeInstallCommand,
  type FontChoice,
  type FontRole,
  type FontState,
  weightClass,
  weightFits,
  weightToken,
} from '@/theme-builder/fonts'
import { Sample } from '@/theme-builder/sample'

/* ---------------------------------------------------------------------------
 * O montador de tema
 *
 * A pessoa escolhe a cor da marca, as outras sete sementes e as tres fontes,
 * ve pecas de verdade vestidas nos dois esquemas e nas duas densidades, le a
 * medida de cada par e leva o tema embora em tres formatos. O estado mora na
 * URL, para o link colado num chat abrir exatamente o que foi montado.
 *
 * Tudo o que a pagina calcula sai do `theme-builder/engine.ts`, que reusa a
 * conta, a exportacao DTCG e a derivacao da CLI. Esta pagina so desenha.
 * ------------------------------------------------------------------------- */

const HOUSE = houseBlocks(HOUSE_CSS)

const SCHEME_LABEL: Record<Scheme, string> = { light: 'Claro', dark: 'Escuro' }

const SEED_LABEL: Record<Seed, string> = {
  bg: 'Fundo da página',
  surface: 'Superfície',
  fg: 'Texto',
  accent: 'Acento',
  success: 'Sucesso',
  warning: 'Atenção',
  danger: 'Perigo',
  info: 'Informação',
}

const BRAND = [
  { value: '#d4f34a', label: 'Lima' },
  { value: '#2563eb', label: 'Azul' },
  { value: '#7c3aed', label: 'Violeta' },
  { value: '#db2777', label: 'Rosa' },
  { value: '#ea580c', label: 'Laranja' },
  { value: '#0d9488', label: 'Verde-água' },
  { value: '#16a34a', label: 'Verde' },
  { value: '#0f172a', label: 'Grafite' },
]

const RADIUS_LABEL: Record<Radius, string> = {
  house: 'Da casa',
  square: 'Reto',
  soft: 'Suave',
  round: 'Redondo',
}

const FONT_ROLE_LABEL: Record<FontRole, string> = {
  sans: 'Corpo',
  display: 'Título',
  mono: 'Código',
}

const HOUSE_FAMILY: Record<FontRole, string> = {
  sans: 'Manrope',
  display: 'Poppins',
  mono: 'JetBrains Mono',
}

const CATEGORY_LABEL = {
  'sans-serif': 'sem serifa',
  serif: 'serifada',
  monospace: 'largura fixa',
} as const

type FontItem = { value: FontChoice; label: string }

const FONT_ITEMS: Record<FontRole, FontItem[]> = Object.fromEntries(
  FONT_ROLES.map((role) => [
    role,
    [
      { value: 'house', label: `Fonte da casa (${HOUSE_FAMILY[role]})` },
      { value: 'system', label: 'Fonte do sistema' },
      ...ROLE_CATEGORIES[role].flatMap((category) =>
        FAMILIES.filter((family) => family.category === category).map((family) => ({
          value: family.id,
          label: family.family,
        })),
      ),
    ],
  ]),
) as Record<FontRole, FontItem[]>

const DENSITY_LABEL: Record<RivoDensity, string> = {
  comfortable: 'Confortável',
  compact: 'Compacta',
}

function compute(state: BuilderState) {
  const base = {
    light: derive(state.seeds.light).colors,
    dark: derive(state.seeds.dark).colors,
  }
  const built = {
    light: build(state.seeds.light, 'light', HOUSE, base.dark, state.autoFix),
    dark: build(state.seeds.dark, 'dark', HOUSE, base.light, state.autoFix),
  }
  const tokens = {
    light: applyFonts(built.light.tokens, state.fonts),
    dark: applyFonts(built.dark.tokens, state.fonts),
  }
  const pairs = {
    light: measureWeb(selectorOf(state.name, 'light'), tokens.light),
    dark: measureWeb(selectorOf(state.name, 'dark'), tokens.dark),
  }
  const native = measureNative({
    light: built.light.derived.colors,
    dark: built.dark.derived.colors,
  })
  const failures = SCHEMES.flatMap((scheme) =>
    pairs[scheme].filter((pair) => !pair.ok).map((pair) => `${SCHEME_LABEL[scheme].toLowerCase()}: ${pair.text}`),
  )
  const css = emitWebCss(state.name, tokens, state.radius, failures, state.fonts)

  return {
    built,
    pairs,
    native,
    failures,
    css,
    preview: webBlocks(state.name, tokens, state.radius),
    palette: emitPalette({ light: built.light.seeds, dark: built.dark.seeds }),
    nativeCss: emitNativeCss(
      { light: built.light.derived.colors, dark: built.dark.derived.colors },
      `${state.name}.json`,
    ),
    missing: missingRoles(state.name, css),
    fontInstall: fontInstallCommand(state.fonts),
    nativeFonts: nativeFontsSnippet(state.fonts),
    nativeInstall: nativeInstallCommand(state.fonts),
  }
}

type Result = ReturnType<typeof compute>

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function DownloadButton({ name, text, type }: { name: string; text: string; type: string }) {
  return (
    <Button variant="secondary" size="sm" onClick={() => download(name, text, type)}>
      <Download size={14} aria-hidden="true" />
      Baixar {name}
    </Button>
  )
}

function SeedRow({
  seed,
  value,
  onChange,
}: {
  seed: Seed
  value: string
  onChange: (hex: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  const shown = editing ? draft : value
  const valid = normalizeHex(shown) !== null

  return (
    <Field invalid={!valid} className="gap-1">
      <FieldLabel>{SEED_LABEL[seed]}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          aria-label={`${SEED_LABEL[seed]}, seletor de cor`}
          onChange={(event) => onChange(event.target.value)}
          className="h-[var(--rc-control-sm)] w-10 shrink-0 cursor-pointer rounded-md border border-border-strong bg-transparent p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        <Input
          size="sm"
          value={shown}
          spellCheck={false}
          className="min-w-0 flex-1 font-mono"
          onFocus={() => {
            setDraft(value)
            setEditing(true)
          }}
          onBlur={() => setEditing(false)}
          onChange={(event) => {
            const text = event.target.value
            setDraft(text)
            const hex = normalizeHex(text)
            if (hex) onChange(hex)
          }}
        />
      </div>
      {!valid && (
        <FieldError match>Use hexadecimal, rgb(), hsl() ou oklch(), sem transparência.</FieldError>
      )}
    </Field>
  )
}

const joinWeights = (weights: number[]) =>
  weights.length === 1
    ? String(weights[0])
    : `${weights.slice(0, -1).join(', ')} e ${weights[weights.length - 1]}`

function FontPicker({
  role,
  value,
  onChange,
}: {
  role: FontRole
  value: FontChoice
  onChange: (choice: FontChoice) => void
}) {
  const items = FONT_ITEMS[role]
  const current = items.find((item) => item.value === value) ?? items[0]!
  const family = chosenFamily(role, value)
  const fits = family ? weightFits(role, family) : []

  return (
    <Field className="gap-1">
      <FieldLabel>{FONT_ROLE_LABEL[role]}</FieldLabel>
      <Combobox
        items={items}
        value={current}
        onValueChange={(item: FontItem | null) => {
          if (item) onChange(item.value)
        }}
      >
        <ComboboxInput
          aria-label={`Fonte do ${FONT_ROLE_LABEL[role].toLowerCase()}`}
          placeholder="Buscar família"
          clearable={false}
        />
        <ComboboxContent emptyMessage="Nenhuma família com esse nome na lista.">
          <ComboboxList>
            {(item: FontItem) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {family && (
        <FieldDescription>
          {CATEGORY_LABEL[family.category]}, {family.variable ? 'variável' : 'estática'}, pesos{' '}
          {joinWeights(family.weights.filter((weight) => weight >= 300 && weight <= 800))}.
        </FieldDescription>
      )}
      {fits.length > 0 && (
        <Alert tone="info" className="mt-1">
          <AlertTitle>
            {family!.family} não tem {fits.length === 1 ? 'o peso' : 'os pesos'}{' '}
            {joinWeights([...new Set(fits.map((item) => item.wanted))])}, e o tema já se ajusta
          </AlertTitle>
          <AlertDescription>
            <span className="block space-y-1">
              {fits.map((item) => (
                <span key={item.intent} className="block">
                  <code className="font-mono">{weightClass(item.intent)}</code> pede {item.wanted} e sai
                  com {item.falls}, o peso mais próximo que a família tem:{' '}
                  <code className="font-mono">
                    {weightToken(item.intent)}: {item.falls}
                  </code>
                  {item.synthetic ? ', em vez do negrito sintético que o navegador desenharia.' : '.'}
                </span>
              ))}
            </span>
          </AlertDescription>
        </Alert>
      )}
    </Field>
  )
}

function Controls({
  state,
  setState,
  density,
  setDensity,
}: {
  state: BuilderState
  setState: (update: (current: BuilderState) => BuilderState) => void
  density: RivoDensity
  setDensity: (density: RivoDensity) => void
}) {
  const [nameDraft, setNameDraft] = useState(state.name)
  useEffect(() => setNameDraft(state.name), [state.name])

  const setSeed = (scheme: Scheme, seed: Seed, hex: string) =>
    setState((current) => ({
      ...current,
      seeds: { ...current.seeds, [scheme]: { ...current.seeds[scheme], [seed]: hex } },
    }))

  const setFont = (role: FontRole, choice: FontChoice) =>
    setState((current) => ({ ...current, fonts: { ...current.fonts, [role]: choice } }))

  const setBrand = (hex: string) =>
    setState((current) => ({
      ...current,
      seeds: {
        light: { ...current.seeds.light, accent: hex },
        dark: { ...current.seeds.dark, accent: hex },
      },
    }))

  return (
    <Card>
      <CardContent className="space-y-6 py-5">
        <Field>
          <FieldLabel>Nome do tema</FieldLabel>
          <Input
            value={nameDraft}
            onChange={(event) => {
              setNameDraft(event.target.value)
              const clean = cleanName(event.target.value)
              if (clean) setState((current) => ({ ...current, name: clean }))
            }}
            onBlur={() => setNameDraft(state.name)}
          />
          <FieldDescription>
            Vira o seletor <code className="font-mono">{selectorOf(state.name, 'dark')}</code>.
          </FieldDescription>
        </Field>

        <ColorPicker
          label="Cor da marca, nos dois esquemas"
          value={state.seeds.dark.accent}
          onValueChange={setBrand}
          swatches={BRAND}
          columns={8}
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-fg">As oito sementes</p>
          <p className="text-sm text-fg-muted">
            As mesmas que o <code className="font-mono">rivocode-ui-native-theme</code> lê. Os
            outros papéis saem delas, pelas regras do comando.
          </p>
          <Tabs defaultValue="light">
            <TabList variant="segmented">
              {SCHEMES.map((scheme) => (
                <Tab key={scheme} value={scheme}>
                  {SCHEME_LABEL[scheme]}
                </Tab>
              ))}
            </TabList>
            {SCHEMES.map((scheme) => (
              <TabPanel key={scheme} value={scheme} className="grid gap-3 pt-3">
                {SEEDS.map((seed) => (
                  <SeedRow
                    key={seed}
                    seed={seed}
                    value={state.seeds[scheme][seed]!}
                    onChange={(hex) => setSeed(scheme, seed, hex)}
                  />
                ))}
              </TabPanel>
            ))}
          </Tabs>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-fg">As três fontes</p>
          <p className="text-sm text-fg-muted">
            Famílias do Google Fonts escolhidas para interface. A amostra baixa a escolhida na hora,
            com os pesos 400, 500, 600 e 700 que as peças usam.
          </p>
          {FONT_ROLES.map((role) => (
            <FontPicker
              key={role}
              role={role}
              value={state.fonts[role]}
              onChange={(choice) => setFont(role, choice)}
            />
          ))}
        </div>

        <Field>
          <FieldLabel>Canto</FieldLabel>
          <ToggleGroup
            aria-label="Canto"
            value={[state.radius]}
            onValueChange={(value) => {
              const next = value[0] as Radius | undefined
              if (next) setState((current) => ({ ...current, radius: next }))
            }}
          >
            {(Object.keys(RADIUS_LABEL) as Radius[]).map((radius) => (
              <Toggle key={radius} value={radius}>
                {RADIUS_LABEL[radius]}
              </Toggle>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel>Densidade da amostra</FieldLabel>
          <ToggleGroup
            aria-label="Densidade da amostra"
            value={[density]}
            onValueChange={(value) => {
              const next = value[0] as RivoDensity | undefined
              if (next) setDensity(next)
            }}
          >
            {(Object.keys(DENSITY_LABEL) as RivoDensity[]).map((option) => (
              <Toggle key={option} value={option}>
                {DENSITY_LABEL[option]}
              </Toggle>
            ))}
          </ToggleGroup>
          <FieldDescription>Densidade não é tema: ela vem da prop do Provider.</FieldDescription>
        </Field>

        <Switch
          checked={state.autoFix}
          onCheckedChange={(checked) => setState((current) => ({ ...current, autoFix: checked }))}
        >
          Ajustar o texto de cada tom até passar
        </Switch>

        <Button
          variant="ghost"
          onClick={() =>
            setState((current) => ({ ...DEFAULT_STATE, name: current.name, fonts: current.fonts }))
          }
        >
          <RotateCcw size={14} aria-hidden="true" />
          Voltar às cores da casa
        </Button>
      </CardContent>
    </Card>
  )
}

function Preview({
  name,
  density,
  result,
}: {
  name: string
  density: RivoDensity
  result: Result
}) {
  return (
    <section aria-labelledby="amostra" className="space-y-3">
      <h2 id="amostra" className="font-display text-xl text-fg">
        A amostra, nos dois esquemas
      </h2>
      <style>{result.preview}</style>
      <div className="grid gap-4 2xl:grid-cols-2 [&>*]:min-w-0">
        {SCHEMES.map((scheme) => {
          const failing = result.pairs[scheme].filter((pair) => !pair.ok).length
          return (
            <div key={scheme} className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2">
                <p className="text-sm font-medium text-fg">
                  {SCHEME_LABEL[scheme]}{' '}
                  <span className="font-mono text-xs text-fg-subtle">
                    {name}-{scheme}
                  </span>
                </p>
                <Badge tone={failing === 0 ? 'success' : 'danger'} size="sm">
                  {failing === 0 ? 'Contraste aprovado' : `${failing} reprovado${failing === 1 ? '' : 's'}`}
                </Badge>
              </div>
              <RivoProvider scope="local" theme={`${name}-${scheme}`} density={density}>
                <div className="p-4 sm:p-5">
                  <Sample />
                </div>
              </RivoProvider>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PairTable({ pairs }: { pairs: Pair[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Par</TableHead>
          <TableHead className="text-right">Medida</TableHead>
          <TableHead className="text-right">Mínimo</TableHead>
          <TableHead>Situação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pairs.map((pair) => (
          <TableRow key={pair.text}>
            <TableCell className="max-w-[28rem] font-mono text-xs whitespace-normal">
              {pair.text.replace(/\s+\d+\.\d+:1.*$/, '')}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {pair.ratio === null ? '—' : `${pair.ratio.toFixed(2).replace('.', ',')}:1`}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {pair.min === null ? '—' : String(pair.min).replace('.', ',')}
            </TableCell>
            <TableCell>
              <Badge tone={pair.ok ? 'success' : 'danger'} size="sm">
                {pair.ok ? 'Aprovado' : 'Reprovado'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Contrast({ result }: { result: Result }) {
  return (
    <section aria-labelledby="contraste" className="space-y-3">
      <h2 id="contraste" className="font-display text-xl text-fg">
        A medida de cada par
      </h2>
      <p className="max-w-prose text-sm text-fg-muted">
        A mesma conta do <code className="font-mono">npx rivocode-ui check-theme</code> e das
        guardas do repositório: 7:1 para o corpo, 4,5:1 para texto, 3:1 para fronteira de controle
        e série de gráfico, com o alfa composto sobre o fundo em que ele é desenhado.
      </p>

      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        {SCHEMES.map((scheme) => {
          const pairs = result.pairs[scheme]
          const failing = pairs.filter((pair) => !pair.ok)
          const fixes = result.built[scheme].fixes
          const native = result.native[scheme]
          const bg = result.built[scheme].derived.colors.bg!
          const swapped = (scheme === 'light') === isDarkScheme(bg)

          return (
            <Card key={scheme}>
              <CardHeader>
                <CardTitle>{SCHEME_LABEL[scheme]}</CardTitle>
                <CardDescription>
                  {pairs.length - failing.length} de {pairs.length} pares aprovados no web
                  {native.length === 0
                    ? ', e o mapa do React Native passa.'
                    : `, e ${native.length} reprovado${native.length === 1 ? '' : 's'} no mapa do React Native.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {failing.length > 0 && (
                  <Alert tone="danger">
                    <AlertTitle>
                      {failing.length} {failing.length === 1 ? 'par reprovado' : 'pares reprovados'}
                    </AlertTitle>
                    <AlertDescription>
                      <span className="mt-1 block space-y-1 font-mono text-xs">
                        {failing.map((pair) => (
                          <span key={pair.text} className="block">{pair.text}</span>
                        ))}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {native.length > 0 && (
                  <Alert tone="warning">
                    <AlertTitle>O comando do nativo recusaria esta paleta</AlertTitle>
                    <AlertDescription>
                      <span className="mt-1 block space-y-1 font-mono text-xs">
                        {native.map((line) => (
                          <span key={line} className="block">{line}</span>
                        ))}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {fixes.length > 0 && (
                  <Alert tone="info">
                    <AlertTitle>
                      {fixes.length === 1 ? 'Um texto foi ajustado' : `${fixes.length} textos foram ajustados`}
                    </AlertTitle>
                    <AlertDescription>
                      O tom saía igual ao preenchimento e não passava como texto. O ajuste puxa a
                      cor para o branco ou para o preto até o primeiro valor que passa, e entra na
                      paleta exportada como semente escrita:
                      <span className="mt-2 block space-y-1 font-mono text-xs">
                        {fixes.map((fix) => (
                          <span key={fix.role} className="block">
                            {fix.role}: {fix.from} → {fix.to}
                          </span>
                        ))}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {swapped && (
                  <Alert tone="warning">
                    <AlertTitle>O fundo não combina com o nome do esquema</AlertTitle>
                    <AlertDescription>
                      O esquema {SCHEME_LABEL[scheme].toLowerCase()} tem fundo{' '}
                      {isDarkScheme(bg) ? 'escuro' : 'claro'}. O CSS sai com o{' '}
                      <code className="font-mono">color-scheme</code> que o fundo pede, mas o
                      nativo escolhe a vaga do <code className="font-mono">light-dark()</code> pelo
                      nome, e não pela medida.
                    </AlertDescription>
                  </Alert>
                )}

                <Accordion>
                  <AccordionItem value="todos" title={`Todos os ${pairs.length} pares`}>
                    <PairTable pairs={pairs} />
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function DtcgFiles({ name, css }: { name: string; css: string }) {
  const dtcg = useMemo(() => emitDtcg(HOUSE_CSS, name, css), [name, css])
  const files = Object.keys(dtcg.files)
  const [picked, setPicked] = useState(`${name}-dark.tokens.json`)
  const file = files.includes(picked) ? picked : files[0]!
  const text = `${JSON.stringify(dtcg.files[file], undefined, 2)}\n`

  return (
    <div className="space-y-3">
      <p className="max-w-prose text-sm text-fg-muted">
        A mesma saída do <code className="font-mono">rivocode-ui tokens</code>: {dtcg.count} tokens
        em {files.length} arquivos, no DTCG 2025.10 que o Tokens Studio e a importação de variáveis
        do Figma leem direto. Os dois temas apontam para a paleta e a escala por alias.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Field className="min-w-0 flex-1 sm:max-w-xs">
          <FieldLabel>Arquivo</FieldLabel>
          <Select value={file} onValueChange={(value) => value && setPicked(String(value))} items={files.map((item) => ({ label: item, value: item }))}>
            <SelectTrigger className="w-full font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {files.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <DownloadButton name={file} text={text} type="application/json" />
      </div>
      <CodeBlock title={file} copyable className="max-h-96 overflow-y-auto">
        {text}
      </CodeBlock>
      {dtcg.skipped.length > 0 && (
        <p className="max-w-prose text-sm text-fg-subtle">
          {dtcg.skipped.length} valores ficaram de fora, porque o formato não tem como dizê-los -
          os acabamentos em <code className="font-mono">none</code> e o tamanho em{' '}
          <code className="font-mono">clamp()</code>, entre eles. O CLI lista o mesmo.
        </p>
      )}
    </div>
  )
}

function Export({ name, result }: { name: string; result: Result }) {
  const [npxCheck, npxTokens, npxNative] = commandsOf(name)
  const failing = result.failures.length
  const missing = result.missing.reduce((total, theme) => total + theme.missing.length, 0)
  const required = result.missing[0]?.required ?? 0

  return (
    <section aria-labelledby="exportar" className="space-y-3">
      <h2 id="exportar" className="font-display text-xl text-fg">
        Levar o tema
      </h2>

      {failing > 0 ? (
        <Alert tone="danger">
          <AlertTitle>
            O tema sai com {failing} {failing === 1 ? 'par reprovado' : 'pares reprovados'}
          </AlertTitle>
          <AlertDescription>
            A lista vai escrita no cabeçalho do CSS, e o <code className="font-mono">check-theme</code>{' '}
            sai com código 1 enquanto ela existir. Troque a semente do par, ou ligue o ajuste do
            texto de cada tom.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert tone="success">
          <AlertTitle>Todos os pares aprovados, nos dois esquemas</AlertTitle>
          <AlertDescription>
            {missing === 0
              ? `Os ${required} papéis obrigatórios estão declarados nos dois seletores.`
              : `Faltam ${missing} papéis: o check-theme vai acusar.`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="css">
        <TabList>
          <Tab value="css">CSS do web</Tab>
          <Tab value="dtcg">JSON DTCG</Tab>
          <Tab value="nativo">React Native</Tab>
          <Tab value="comandos">Comandos</Tab>
        </TabList>

        <TabPanel value="css" className="space-y-3 pt-4">
          <p className="max-w-prose text-sm text-fg-muted">
            A camada 3, com os dois esquemas. Importe depois do preset e passe{' '}
            <code className="font-mono">theme="{name}-dark"</code> ou{' '}
            <code className="font-mono">"{name}-light"</code> ao{' '}
            <code className="font-mono">RivoProvider</code>.
          </p>
          <p className="max-w-prose text-sm text-fg-muted">
            {result.fontInstall
              ? 'As fontes escolhidas entram no topo, como @import do fontsource, com o link do Google Fonts comentado como alternativa. Com elas, não importe o @rivocode/ui/fonts.css.'
              : 'As fontes são as da casa: elas chegam pelo @rivocode/ui/fonts.css, importado uma vez no CSS de entrada.'}
          </p>
          <DownloadButton name={`tema-${name}.css`} text={result.css} type="text/css" />
          <CodeBlock title={`src/tema-${name}.css`} copyable className="max-h-96 overflow-y-auto">
            {result.css}
          </CodeBlock>
        </TabPanel>

        <TabPanel value="dtcg" className="pt-4">
          <DtcgFiles name={name} css={result.css} />
        </TabPanel>

        <TabPanel value="nativo" className="space-y-3 pt-4">
          <p className="max-w-prose text-sm text-fg-muted">
            A paleta que o <code className="font-mono">rivocode-ui-native-theme</code> lê, com as
            sementes e os ajustes escritos. Rodar o comando sobre ela escreve o{' '}
            <code className="font-mono">@theme</code> de baixo, papel por papel.
          </p>
          <div className="flex flex-wrap gap-2">
            <DownloadButton name={`${name}.json`} text={result.palette} type="application/json" />
            <DownloadButton name={`${name}.theme.css`} text={result.nativeCss} type="text/css" />
          </div>
          <CodeBlock title={`${name}.json`} copyable>
            {result.palette}
          </CodeBlock>
          <CodeBlock title={`${name}.theme.css`} copyable className="max-h-96 overflow-y-auto">
            {result.nativeCss}
          </CodeBlock>
          <p className="max-w-prose text-sm text-fg-muted">
            A fonte não vai no <code className="font-mono">@theme</code>: no celular quem carrega o
            arquivo é o app, com o <code className="font-mono">expo-font</code>, e o{' '}
            <code className="font-mono">RivoProvider</code> recebe o nome registrado. Cada peso é
            um arquivo com nome próprio, então cada papel leva um só: 400 no corpo e no código,
            600 no título quando a família tem.
          </p>
          {result.nativeInstall && (
            <CodeBlock title="instalar as fontes" copyable>
              {result.nativeInstall}
            </CodeBlock>
          )}
          <CodeBlock title="App.tsx" copyable>
            {result.nativeFonts}
          </CodeBlock>
        </TabPanel>

        <TabPanel value="comandos" className="space-y-3 pt-4">
          <p className="max-w-prose text-sm text-fg-muted">
            O que a CLI faz com os arquivos daqui, no seu projeto. O primeiro é o que vale pôr no
            CI: ele cobra os papéis e refaz esta mesma medida.
          </p>
          <CodeBlock title="web: conferir o tema" copyable>
            {npxCheck!}
          </CodeBlock>
          <CodeBlock title="web: exportar os tokens para o Figma" copyable>
            {npxTokens!}
          </CodeBlock>
          <CodeBlock title="React Native: gerar o @theme a partir da paleta" copyable>
            {npxNative!}
          </CodeBlock>
          {result.fontInstall && (
            <CodeBlock title="web: instalar as fontes que o CSS importa" copyable>
              {result.fontInstall}
            </CodeBlock>
          )}
          {result.native.light.length + result.native.dark.length > 0 && (
            <Alert tone="warning">
              <AlertTitle>O último comando recusaria esta paleta</AlertTitle>
              <AlertDescription>
                O mapa do React Native tem pares reprovados, e o comando não escreve tema que não
                passa. A lista está na seção de medida, acima.
              </AlertDescription>
            </Alert>
          )}
        </TabPanel>
      </Tabs>
    </section>
  )
}

const FONT_LINK_ID = 'rc-montador-fontes'

function useGoogleFonts(fonts: FontState) {
  const url = googleFontsUrl(fonts)
  useEffect(() => {
    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
    if (!url) {
      link?.remove()
      return
    }
    if (!link) {
      link = document.createElement('link')
      link.id = FONT_LINK_ID
      link.rel = 'stylesheet'
      document.head.append(link)
    }
    if (link.href !== url) link.href = url
  }, [url])
  useEffect(() => () => document.getElementById(FONT_LINK_ID)?.remove(), [])
}

export function ThemePage() {
  const [state, setStateRaw] = useState<BuilderState>(DEFAULT_STATE)
  const [density, setDensity] = useState<RivoDensity>('comfortable')
  const [ready, setReady] = useState(false)
  const [href, setHref] = useState('')

  useEffect(() => {
    setStateRaw(readQuery(window.location.search))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    const query = writeQuery(state)
    if (query !== window.location.search) {
      window.history.replaceState(null, '', `${window.location.pathname}${query}`)
    }
    setHref(window.location.href)
  }, [state, ready])

  const setState = (update: (current: BuilderState) => BuilderState) => setStateRaw(update)

  const deferred = useDeferredValue(state)
  const result = useMemo(() => compute(deferred), [deferred])
  useGoogleFonts(deferred.fonts)

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-10 sm:px-6">
      <header className="max-w-3xl space-y-3">
        <p className="font-mono text-xs tracking-[0.14em] text-fg-subtle uppercase">Tema</p>
        <h1 className="font-display text-3xl text-fg sm:text-4xl">Montador de tema</h1>
        <p className="text-base text-fg-muted">
          Escolha a cor da marca e veja as peças de verdade vestidas com ela, nos dois esquemas e
          nas duas densidades. Cada par é medido com a mesma conta do{' '}
          <code className="font-mono">check-theme</code>, e o tema sai em CSS, em JSON DTCG e na
          paleta do React Native.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Clipboard value={href} labels={{ copy: 'Copiar o link deste tema', copied: 'Link copiado' }}>
            Copiar o link deste tema
          </Clipboard>
          <span className="text-sm text-fg-subtle">O link guarda tudo o que foi escolhido.</span>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto rc-scroll">
          <Controls state={state} setState={setState} density={density} setDensity={setDensity} />
        </aside>

        <div className="min-w-0 space-y-10">
          <Preview name={deferred.name} density={density} result={result} />
          <Contrast result={result} />
          <Export name={deferred.name} result={result} />
        </div>
      </div>
    </div>
  )
}
