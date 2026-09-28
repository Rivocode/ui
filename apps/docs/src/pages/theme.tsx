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
 * The theme builder
 *
 * The person picks the brand color, the other seven seeds and the three
 * fonts, sees real pieces dressed in both schemes and both densities, reads
 * each pair's measurement and takes the theme away in three formats. The
 * state lives in the URL, so a link pasted in a chat opens exactly what was
 * built.
 *
 * Everything the page computes comes from `theme-builder/engine.ts`, which
 * reuses the CLI's math, DTCG export and derivation. This page only draws.
 * ------------------------------------------------------------------------- */

const HOUSE = houseBlocks(HOUSE_CSS)

const SCHEME_LABEL: Record<Scheme, string> = { light: 'Light', dark: 'Dark' }

const SEED_LABEL: Record<Seed, string> = {
  bg: 'Page background',
  surface: 'Surface',
  fg: 'Text',
  accent: 'Accent',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
  info: 'Info',
}

const BRAND = [
  { value: '#d4f34a', label: 'Lime' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#7c3aed', label: 'Violet' },
  { value: '#db2777', label: 'Pink' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#0d9488', label: 'Teal' },
  { value: '#16a34a', label: 'Green' },
  { value: '#0f172a', label: 'Graphite' },
]

const RADIUS_LABEL: Record<Radius, string> = {
  house: 'House',
  square: 'Square',
  soft: 'Soft',
  round: 'Round',
}

const FONT_ROLE_LABEL: Record<FontRole, string> = {
  sans: 'Body',
  display: 'Display',
  mono: 'Code',
}

const HOUSE_FAMILY: Record<FontRole, string> = {
  sans: 'Manrope',
  display: 'Poppins',
  mono: 'JetBrains Mono',
}

const CATEGORY_LABEL = {
  'sans-serif': 'sans serif',
  serif: 'serif',
  monospace: 'monospace',
} as const

type FontItem = { value: FontChoice; label: string }

const FONT_ITEMS: Record<FontRole, FontItem[]> = Object.fromEntries(
  FONT_ROLES.map((role) => [
    role,
    [
      { value: 'house', label: `House font (${HOUSE_FAMILY[role]})` },
      { value: 'system', label: 'System font' },
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
  comfortable: 'Comfortable',
  compact: 'Compact',
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
      Download {name}
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
          aria-label={`${SEED_LABEL[seed]}, color picker`}
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
        <FieldError match>Use hex, rgb(), hsl() or oklch(), without transparency.</FieldError>
      )}
    </Field>
  )
}

const joinWeights = (weights: number[]) =>
  weights.length === 1
    ? String(weights[0])
    : `${weights.slice(0, -1).join(', ')} and ${weights[weights.length - 1]}`

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
          aria-label={`${FONT_ROLE_LABEL[role]} font`}
          placeholder="Search families"
          clearable={false}
        />
        <ComboboxContent emptyMessage="No family by that name in the list.">
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
          {CATEGORY_LABEL[family.category]}, {family.variable ? 'variable' : 'static'}, weights{' '}
          {joinWeights(family.weights.filter((weight) => weight >= 300 && weight <= 800))}.
        </FieldDescription>
      )}
      {fits.length > 0 && (
        <Alert tone="info" className="mt-1">
          <AlertTitle>
            {family!.family} does not have {fits.length === 1 ? 'weight' : 'weights'}{' '}
            {joinWeights([...new Set(fits.map((item) => item.wanted))])}, and the theme already adjusts
          </AlertTitle>
          <AlertDescription>
            <span className="block space-y-1">
              {fits.map((item) => (
                <span key={item.intent} className="block">
                  <code className="font-mono">{weightClass(item.intent)}</code> asks for {item.wanted} and comes
                  out with {item.falls}, the closest weight the family has:{' '}
                  <code className="font-mono">
                    {weightToken(item.intent)}: {item.falls}
                  </code>
                  {item.synthetic ? ', instead of the synthetic bold the browser would draw.' : '.'}
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
          <FieldLabel>Theme name</FieldLabel>
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
            Becomes the selector <code className="font-mono">{selectorOf(state.name, 'dark')}</code>.
          </FieldDescription>
        </Field>

        <ColorPicker
          label="Brand color, in both schemes"
          value={state.seeds.dark.accent}
          onValueChange={setBrand}
          swatches={BRAND}
          columns={8}
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-fg">The eight seeds</p>
          <p className="text-sm text-fg-muted">
            The same ones <code className="font-mono">rivocode-ui-native-theme</code> reads. The
            other roles come out of them, by the command's rules.
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
          <p className="text-sm font-medium text-fg">The three fonts</p>
          <p className="text-sm text-fg-muted">
            Google Fonts families picked for interfaces. The sample downloads the chosen one right
            away, with the 400, 500, 600 and 700 weights the pieces use.
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
          <FieldLabel>Corners</FieldLabel>
          <ToggleGroup
            aria-label="Corners"
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
          <FieldLabel>Sample density</FieldLabel>
          <ToggleGroup
            aria-label="Sample density"
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
          <FieldDescription>Density is not a theme: it comes from the Provider prop.</FieldDescription>
        </Field>

        <Switch
          checked={state.autoFix}
          onCheckedChange={(checked) => setState((current) => ({ ...current, autoFix: checked }))}
        >
          Adjust each tone's text until it passes
        </Switch>

        <Button
          variant="ghost"
          onClick={() =>
            setState((current) => ({ ...DEFAULT_STATE, name: current.name, fonts: current.fonts }))
          }
        >
          <RotateCcw size={14} aria-hidden="true" />
          Back to the house colors
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
    <section aria-labelledby="sample" className="space-y-3">
      <h2 id="sample" className="font-display text-xl text-fg">
        The sample, in both schemes
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
                  {failing === 0 ? 'Contrast passes' : `${failing} failing`}
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
          <TableHead>Pair</TableHead>
          <TableHead className="text-right">Measured</TableHead>
          <TableHead className="text-right">Minimum</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pairs.map((pair) => (
          <TableRow key={pair.text}>
            <TableCell className="max-w-[28rem] font-mono text-xs whitespace-normal">
              {pair.text.replace(/\s+\d+\.\d+:1.*$/, '')}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {pair.ratio === null ? '—' : `${pair.ratio.toFixed(2)}:1`}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {pair.min === null ? '—' : String(pair.min)}
            </TableCell>
            <TableCell>
              <Badge tone={pair.ok ? 'success' : 'danger'} size="sm">
                {pair.ok ? 'Pass' : 'Fail'}
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
    <section aria-labelledby="contrast" className="space-y-3">
      <h2 id="contrast" className="font-display text-xl text-fg">
        Each pair measured
      </h2>
      <p className="max-w-prose text-sm text-fg-muted">
        The same math as <code className="font-mono">npx rivocode-ui check-theme</code> and the
        repository guards: 7:1 for body text, 4.5:1 for text, 3:1 for control boundaries and chart
        series, with alpha composited over the background it is drawn on.
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
                  {pairs.length - failing.length} of {pairs.length} pairs pass on the web
                  {native.length === 0
                    ? ', and the React Native map passes.'
                    : `, and ${native.length} failing in the React Native map.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {failing.length > 0 && (
                  <Alert tone="danger">
                    <AlertTitle>
                      {failing.length} {failing.length === 1 ? 'failing pair' : 'failing pairs'}
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
                    <AlertTitle>The native command would refuse this palette</AlertTitle>
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
                      {fixes.length === 1 ? 'One text was adjusted' : `${fixes.length} texts were adjusted`}
                    </AlertTitle>
                    <AlertDescription>
                      The tone came out equal to the fill and did not pass as text. The adjustment
                      pulls the color toward white or black up to the first value that passes, and
                      goes into the exported palette as a written seed:
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
                    <AlertTitle>The background does not match the scheme name</AlertTitle>
                    <AlertDescription>
                      The {SCHEME_LABEL[scheme].toLowerCase()} scheme has a{' '}
                      {isDarkScheme(bg) ? 'dark' : 'light'} background. The CSS comes out with the{' '}
                      <code className="font-mono">color-scheme</code> the background asks for, but
                      native picks the <code className="font-mono">light-dark()</code> slot by
                      name, not by measurement.
                    </AlertDescription>
                  </Alert>
                )}

                <Accordion>
                  <AccordionItem value="all" title={`All ${pairs.length} pairs`}>
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
        The same output as <code className="font-mono">rivocode-ui tokens</code>: {dtcg.count}{' '}
        tokens in {files.length} files, in the DTCG 2025.10 that Tokens Studio and Figma's variable
        import read directly. Both themes point to the palette and the scale by alias.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Field className="min-w-0 flex-1 sm:max-w-xs">
          <FieldLabel>File</FieldLabel>
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
          {dtcg.skipped.length} values were left out, because the format has no way to express them -
          the finishes set to <code className="font-mono">none</code> and the size in{' '}
          <code className="font-mono">clamp()</code>, among them. The CLI lists the same.
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
    <section aria-labelledby="export" className="space-y-3">
      <h2 id="export" className="font-display text-xl text-fg">
        Take the theme
      </h2>

      {failing > 0 ? (
        <Alert tone="danger">
          <AlertTitle>
            The theme goes out with {failing} {failing === 1 ? 'failing pair' : 'failing pairs'}
          </AlertTitle>
          <AlertDescription>
            The list is written in the CSS header, and{' '}
            <code className="font-mono">check-theme</code> exits with code 1 while it exists.
            Change the pair's seed, or turn on the per-tone text adjustment.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert tone="success">
          <AlertTitle>All pairs pass, in both schemes</AlertTitle>
          <AlertDescription>
            {missing === 0
              ? `The ${required} required roles are declared in both selectors.`
              : `${missing} roles are missing: check-theme will flag them.`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="css">
        <TabList>
          <Tab value="css">Web CSS</Tab>
          <Tab value="dtcg">JSON DTCG</Tab>
          <Tab value="nativo">React Native</Tab>
          <Tab value="comandos">Commands</Tab>
        </TabList>

        <TabPanel value="css" className="space-y-3 pt-4">
          <p className="max-w-prose text-sm text-fg-muted">
            Layer 3, with both schemes. Import it after the preset and pass{' '}
            <code className="font-mono">theme="{name}-dark"</code> or{' '}
            <code className="font-mono">"{name}-light"</code> to{' '}
            <code className="font-mono">RivoProvider</code>.
          </p>
          <p className="max-w-prose text-sm text-fg-muted">
            {result.fontInstall
              ? 'The chosen fonts go at the top, as fontsource @import lines, with the Google Fonts link commented out as an alternative. With them, do not import @rivocode/ui/fonts.css.'
              : 'The fonts are the house ones: they arrive through @rivocode/ui/fonts.css, imported once in the entry CSS.'}
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
            The palette <code className="font-mono">rivocode-ui-native-theme</code> reads, with the
            seeds and the adjustments written. Running the command on it writes the{' '}
            <code className="font-mono">@theme</code> below, role by role.
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
            The font does not go into <code className="font-mono">@theme</code>: on mobile the app
            loads the file, with <code className="font-mono">expo-font</code>, and{' '}
            <code className="font-mono">RivoProvider</code> receives the registered name. Each
            weight is a file with its own name, so each role takes just one: 400 for body and code,
            600 for display when the family has it.
          </p>
          {result.nativeInstall && (
            <CodeBlock title="install the fonts" copyable>
              {result.nativeInstall}
            </CodeBlock>
          )}
          <CodeBlock title="App.tsx" copyable>
            {result.nativeFonts}
          </CodeBlock>
        </TabPanel>

        <TabPanel value="comandos" className="space-y-3 pt-4">
          <p className="max-w-prose text-sm text-fg-muted">
            What the CLI does with the files from here, in your project. The first one is the one
            worth putting in CI: it checks the roles and redoes this same measurement.
          </p>
          <CodeBlock title="web: check the theme" copyable>
            {npxCheck!}
          </CodeBlock>
          <CodeBlock title="web: export the tokens to Figma" copyable>
            {npxTokens!}
          </CodeBlock>
          <CodeBlock title="React Native: generate the @theme from the palette" copyable>
            {npxNative!}
          </CodeBlock>
          {result.fontInstall && (
            <CodeBlock title="web: install the fonts the CSS imports" copyable>
              {result.fontInstall}
            </CodeBlock>
          )}
          {result.native.light.length + result.native.dark.length > 0 && (
            <Alert tone="warning">
              <AlertTitle>The last command would refuse this palette</AlertTitle>
              <AlertDescription>
                The React Native map has failing pairs, and the command does not write a theme that
                does not pass. The list is in the measurement section, above.
              </AlertDescription>
            </Alert>
          )}
        </TabPanel>
      </Tabs>
    </section>
  )
}

const FONT_LINK_ID = 'rc-builder-fonts'

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
        <p className="font-mono text-xs tracking-[0.14em] text-fg-subtle uppercase">Theme</p>
        <h1 className="font-display text-3xl text-fg sm:text-4xl">Theme builder</h1>
        <p className="text-base text-fg-muted">
          Pick the brand color and see the real pieces dressed in it, in both schemes and both
          densities. Each pair is measured with the same math as{' '}
          <code className="font-mono">check-theme</code>, and the theme comes out as CSS, as DTCG
          JSON and as the React Native palette.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Clipboard value={href} labels={{ copy: 'Copy the link to this theme', copied: 'Link copied' }}>
            Copy the link to this theme
          </Clipboard>
          <span className="text-sm text-fg-subtle">The link keeps everything you chose.</span>
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
