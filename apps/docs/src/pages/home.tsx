import { Badge, Button } from '@rivocode/ui'
import { ArrowRight, Bot, Check, Copy, Layers, Palette, Ruler, Smartphone, Sparkles } from 'lucide-react'
import { Suspense, lazy, useEffect, useState } from 'react'
import { CodeRiver } from '@/components/code-river'
import { ENTRIES, FAMILIES, WITH_EXAMPLE, entriesOfFamily } from '@/catalog'
import { GUIDES } from '@/guides'
import { NATIVE_PIECES } from '@/native-parity'
import { Logo } from '@/components/logo'
import { linkTo, type Route } from '@/routes'
import { version } from '../../../../package.json'

/*
 * The showcase arrives after the rest of the cover.
 *
 * It mounts a whole screen - DataTable, Select, tabs and a chart -, and
 * Recharts alone is over 250 KB. While it was a static import, that weight sat
 * between whoever opens the site and the page title, which is what decides
 * whether the person stays. Its spot stays reserved so the scroll does not
 * jump when it arrives.
 */
const Showcase = lazy(() => import('@/components/showcase').then((mod) => ({ default: mod.Showcase })))

/* ---------------------------------------------------------------------------
 * The cover
 *
 * Whoever arrives here is deciding whether to adopt the library, and decides
 * by looking, not reading. That is why the running screen comes before the
 * prose, each of the three ideas that make the library different gets a
 * figure, and the catalog sits at the end, not at the start.
 * ------------------------------------------------------------------------- */

/*
 * The only number on this page written by hand.
 *
 * The other three in the showcase come from the catalog while the site is
 * built. This one cannot: the count only exists after the suite runs, and
 * charging the whole suite to the Vercel build (minutes, on every push) to
 * print a digit costs too much for what it buys.
 *
 * So it stays versioned here, and what keeps it honest is `bun run
 * check:tests`, which recomputes in seconds and fails saying which number to
 * rewrite. Without that guard the digit goes stale silently, as it did twice:
 * stuck at 292, and later at 348 while the suite reached 552.
 *
 * It counts the whole root suite (`test/` and `native/test/`), which is what
 * the label next to it promises.
 */
const TESTS = 3369

const INSTALL = 'npm install @rivocode/ui'

const SKILL_CMD = 'npx rivocode-ui skill'

const SKILL_PEEK = `| Situation                   | Right piece   |
| --------------------------- | ------------- |
| Notice that stays on screen | Alert         |
| Destructive confirmation    | AlertDialog   |
| A few fixed options         | Select        |
| Long list, or from server   | Combobox      |
| Turns on now, no confirm    | Switch        |

## What never to do

- Literal color in className or style. Always a token.
- Numeric z-index. Always z-[var(--rc-z-*)].
- Hard-coded height on a control.`

const BOOTSTRAP = `import '@rivocode/ui/styles.css'
import { RivoProvider } from '@rivocode/ui'

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <InvoiceScreen />
    </RivoProvider>
  )
}`

const AGENT_FILE = `# DataTable

A listing with the four end states of
a query: loading, succeeded, failed,
came back empty.

## Import

import { DataTable } from '@rivocode/ui'

## Props

| Prop      | Type     | Required |
| --------- | -------- | -------- |
| data      | Row[]    | yes      |
| columns   | Column[] | yes      |
| isLoading | boolean  |, |`

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-surface/70 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:border-accent"
    >
      <span className="font-mono text-fg-subtle select-none">$</span>
      <code className="flex-1 truncate font-mono text-sm text-fg">{text}</code>
      <span className="text-fg-subtle transition-colors group-hover:text-fg">
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </span>
      <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-fg">{value}</p>
      <p className="mt-1 text-sm text-fg-subtle">{label}</p>
    </div>
  )
}

function Argument({
  icon,
  eyebrow,
  title,
  children,
  figure,
  reverse,
}: {
  icon: React.ReactNode
  eyebrow: string
  title: string
  children: React.ReactNode
  figure: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      {/* `min-w-0` on both columns: a grid item does not shrink below its own
          `min-content`, and the figure carries a code `<pre>`. Without this
          the `overflow-x-auto` inside it never kicks in, the column grows,
          and the whole page gets sideways scroll on mobile. */}
      <div className={`min-w-0 ${reverse ? 'lg:order-2' : ''}`}>
        <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-accent-text uppercase">
          {icon}
          {eyebrow}
        </p>
        {/* `h2`: each block is a section of the cover, and it came right after
            the `h1`, skipping a level for whoever navigates by heading. */}
        <h2 className="mt-3 font-display text-2xl text-fg sm:text-3xl">{title}</h2>
        <div className="mt-4 space-y-3 text-fg-muted">{children}</div>
      </div>

      <div className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`}>{figure}</div>
    </div>
  )
}

function TokenLayers() {
  const layers = [
    { code: '--rc-p-lime-400', hint: 'the raw color, with no opinion' },
    { code: '--color-accent', hint: 'the role it plays' },
    { code: '[data-rc-theme]', hint: 'who decides, per client' },
  ]

  return (
    <div className="space-y-2">
      {layers.map((layer, index) => (
        <div
          key={layer.code}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface/70 p-4 backdrop-blur-sm"
          style={{ marginLeft: `${index * 1.5}rem` }}
        >
          <span className="font-mono text-[0.7rem] tracking-widest text-fg-subtle">
            {index + 1}
          </span>
          <div className="min-w-0">
            <code className="block truncate font-mono text-sm text-accent-text">{layer.code}</code>
            <span className="text-xs text-fg-subtle">{layer.hint}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function CodeCard({ label, children }: { label: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Bot size={13} className="text-fg-subtle" />
        <code className="font-mono text-xs text-fg-subtle">{label}</code>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg-muted">
        <code>{children}</code>
      </pre>
    </div>
  )
}

/**
 * The same choice in both worlds, side by side.
 *
 * The figure exists to say, at a glance, what the prose promises and what it
 * does not. `Select` is the most honest example the catalog has: the data
 * props are the same on both - `items`, `value`, `onValueChange` -, and the
 * whole composition disappears, because on mobile the list opens in a bottom
 * sheet and there is no trigger to dress. Whoever reads only the left column
 * imagines the screen carries over; and it does not.
 */
function BothWorlds() {
  const worlds = [
    {
      pkg: '@rivocode/ui',
      code: `<Select items={UFS} value={uf} onValueChange={setUf}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {UFS.map((item) => (
      <SelectItem key={item.value} value={item.value}>
        {item.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>`,
    },
    {
      pkg: '@rivocode/ui-native',
      code: `<Select
  items={UFS}
  value={uf}
  onValueChange={setUf}
  label="UF"
/>`,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {worlds.map((world) => (
        <div
          key={world.pkg}
          className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface/70 backdrop-blur-sm"
        >
          <div className="border-b border-border px-4 py-2.5">
            <code className="font-mono text-xs text-fg-subtle">{world.pkg}</code>
          </div>
          {/* `overflow-x-auto` with `min-w-0` on the column: without both the
              widest block stretches the grid and the whole cover gets
              sideways scroll on mobile, which is the very defect this section
              would be saying we know how to avoid. */}
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg-muted">
            <code>{world.code}</code>
          </pre>
        </div>
      ))}
    </div>
  )
}

/**
 * Both densities at once, with the height coming from the token. Hard-coding a
 * value here breaks nothing: the figure stays pretty and starts lying, because
 * both boxes become equal and the section is saying precisely that they
 * change.
 */
function DensityFigure() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface/70 p-6 backdrop-blur-sm">
      {(['comfortable', 'compact'] as const).map((density) => (
        <div key={density}>
          <p className="mb-2 font-mono text-xs text-fg-subtle">density="{density}"</p>
          <div
            data-rc-density={density}
            className="flex items-center gap-2 rounded-md border border-border bg-bg p-3"
          >
            <span
              className="inline-flex items-center rounded-md bg-accent px-3 font-sans text-sm text-accent-fg"
              style={{ height: 'var(--rc-control-md)' }}
            >
              Emitir nota
            </span>
            <span
              className="inline-flex items-center rounded-md border border-border px-3 font-sans text-sm text-fg"
              style={{ height: 'var(--rc-control-md)' }}
            >
              Cancelar
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Home({ navigate }: { navigate: (route: Route) => void }) {
  const toInstall = linkTo({ kind: 'guide', slug: 'instalacao' }, navigate)
  const toDemo = linkTo({ kind: 'demo' }, navigate)

  return (
    <div className="relative">
      <CodeRiver />

      {/* The glow behind the title. The river alone is texture; this is what
          gives the top of the page a center of gravity. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] opacity-70"
        style={{
          background:
            'radial-gradient(60rem 28rem at 45% -6%, color-mix(in oklab, var(--rc-accent) 16%, transparent), transparent 70%)',
        }}
      />

      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-14 sm:pt-28">
        <Logo className="h-7 w-auto text-accent" />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Badge tone="accent">v{version} on npm</Badge>
          <span className="font-mono text-xs text-fg-subtle">
            Base UI · Tailwind 4 · React 19 · React Native
          </span>
        </div>

        <h1 className="animate-rise mt-5 max-w-4xl font-display text-4xl leading-[1.05] tracking-display text-fg sm:text-6xl">
          The <span className="text-accent-text">RivoCode</span> design system, documented from the
          inside.
        </h1>

        <p className="animate-rise mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted [animation-delay:80ms]">
          {ENTRIES.length} pieces on top of Base UI, with tokens in three layers, two themes and two
          densities. No component knows the brand color: it asks for a role, and the theme
          answers.
        </p>

        <div className="animate-rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:160ms]">
          {/* The page's only glow: the CTA is what the lantern exists to
              light up. A second glow would already be a fairground. */}
          <Button size="lg" shape="pill" className="shadow-glow" {...toInstall} render={<a />}>
            Get started
            <ArrowRight size={16} />
          </Button>
          <Button size="lg" shape="pill" variant="outline" {...toDemo} render={<a />}>
            See a finished system
          </Button>
        </div>

        <div className="animate-rise mt-8 max-w-md [animation-delay:240ms]">
          <CopyLine text={INSTALL} />
        </div>

        <div className="animate-fade mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4 [animation-delay:320ms]">
          <Stat value={String(ENTRIES.length)} label="pieces in the catalog" />
          <Stat value={String(WITH_EXAMPLE)} label="with a running example" />
          <Stat value={String(TESTS)} label="passing tests, web and native" />
          <Stat value={String(GUIDES.length)} label="usage guides" />
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <Suspense fallback={<div className="min-h-[34rem] rounded-lg border border-border bg-surface" />}>
          <Showcase />
        </Suspense>
      </section>

      <section className="relative mx-auto max-w-6xl space-y-24 px-6 pb-24">
        <Argument
          icon={<Palette size={14} />}
          eyebrow="Tokens"
          title="Switching clients is switching one layer"
          figure={<TokenLayers />}
        >
          <p>
            The palette holds the raw color. The role says what it is for. The theme decides which
            color answers each role.
          </p>
          <p>
            No component crosses these layers:{' '}
            <code className="font-mono text-accent-text">bun run check</code> fails if anyone
            writes a literal color, and forty contrast pairs are measured on every commit.
          </p>
        </Argument>

        <Argument
          icon={<Ruler size={14} />}
          eyebrow="Density"
          title="The same screen at two heights, without two catalogs"
          reverse
          figure={<DensityFigure />}
        >
          <p>
            An operations screen fits more rows in the same height. A sign-up form filled in once a
            month does not.
          </p>
          <p>
            It is one attribute on the Provider, and the height of every control follows. There is no
            second catalog of compact pieces to keep up to date.
          </p>
        </Argument>

        <Argument
          icon={<Smartphone size={14} />}
          eyebrow="React Native"
          title="The same piece on mobile, without a second catalog"
          figure={<BothWorlds />}
        >
          <p>
            <code className="font-mono text-accent-text">@rivocode/ui-native</code> brings{' '}
            {NATIVE_PIECES} of the {ENTRIES.length} pieces to React Native, with the same tokens,
            the same two themes and the same class vocabulary: NativeWind reads the classes you
            already write here.
          </p>
          <p>
            What carries over is the vocabulary, the token and the choice of piece.{' '}
            <strong className="font-medium text-fg">The JSX gets rewritten</strong>: on touch
            everything is controlled, the list comes through{' '}
            <code className="font-mono text-accent-text">items</code> instead of composition, and
            the pieces that do not port do not port by decision: sidebar, table and pointer tooltip
            are desktop idioms, and mobile has its own.
          </p>
          <p>
            <a
              {...linkTo({ kind: 'guide', slug: 'react-native' }, navigate)}
              className="text-accent-text underline decoration-border underline-offset-4 transition-colors hover:decoration-accent"
            >
              The React Native guide
            </a>{' '}
            has the table piece by piece: what translates, what is in the queue and what will never port.
          </p>
        </Argument>

        <Argument
          icon={<Bot size={14} />}
          eyebrow="Agents"
          title="The same documentation, in raw markdown"
          figure={<CodeCard label="/componentes/data-table.md">{AGENT_FILE}</CodeCard>}
        >
          <p>
            Much of the code that uses this library today is written with an agent alongside. A site
            that only serves HTML forces the agent to guess the API from the name, and it guesses
            with confidence.
          </p>
          <p>
            Every page has a raw address in{' '}
            <code className="font-mono text-accent-text">.md</code>, with the import, examples and
            props table. The index lives at{' '}
            <a href="/llms.txt" className="text-accent-text underline underline-offset-2">
              /llms.txt
            </a>
            .
          </p>
        </Argument>

        <Argument
          icon={<Sparkles size={14} />}
          eyebrow="Skill"
          title="One command, and the agent learns the library"
          figure={
            <div className="space-y-3">
              <CopyLine text={SKILL_CMD} />
              <CodeCard label=".claude/skills/rivocode-ui/SKILL.md">{SKILL_PEEK}</CodeCard>
            </div>
          }
        >
          <p>
            Pasting the contract into the prompt works once. In the second conversation it is not
            there, and the agent goes back to guessing the API from the name.
          </p>
          <p>
            The skill stays installed, and brings along the table for choosing between similar
            pieces: <code className="font-mono text-accent-text">Alert</code> versus{' '}
            <code className="font-mono text-accent-text">Toast</code>,{' '}
            <code className="font-mono text-accent-text">Select</code> versus{' '}
            <code className="font-mono text-accent-text">Combobox</code>, with the why of each
            row.
          </p>
        </Argument>

        <Argument
          icon={<Layers size={14} />}
          eyebrow="Base UI"
          title="The behavior is not ours, and that is the advantage"
          reverse
          figure={
            <div className="overflow-hidden rounded-lg border border-border bg-surface/70 backdrop-blur-sm">
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-fg">
                <code>{BOOTSTRAP}</code>
              </pre>
            </div>
          }
        >
          <p>
            Focus, keyboard, portals, screen readers and the edge cases come from Base UI, which
            works on that full time.
          </p>
          <p>
            What the library adds is the design, and the decision of when each piece fits. Two
            lines of CSS and a Provider, and the screen begins.
          </p>
        </Argument>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl text-fg">The catalog</h2>
          <p className="text-fg-muted">By family, in the order someone builds a screen.</p>
        </div>

        <div className="mt-8 space-y-8">
          {FAMILIES.map((family) => (
            <div key={family}>
              <h3 className="flex items-baseline gap-2 font-mono text-xs tracking-widest text-fg-subtle uppercase">
                {family}
                <span className="text-fg-subtle">{entriesOfFamily(family).length}</span>
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {entriesOfFamily(family).map((entry) => (
                  <li key={entry.name}>
                    <a
                      {...linkTo({ kind: 'component', slug: entry.slug }, navigate)}
                      className="inline-flex rounded-md border border-border bg-surface/70 px-3 py-1.5 font-mono text-sm text-fg-muted backdrop-blur-sm transition-colors hover:border-accent hover:text-fg"
                    >
                      {entry.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="rounded-xl border border-border bg-surface/70 p-8 text-center backdrop-blur-sm sm:p-12">
          <h2 className="font-display text-3xl text-fg">Start with installation</h2>
          <p className="mx-auto mt-3 max-w-xl text-fg-muted">
            One command, the two lines of CSS and the Provider. After that it is writing screens.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" shape="pill" {...toInstall} render={<a />}>
              Installation
              <ArrowRight size={16} />
            </Button>
            <Button size="lg" shape="pill" variant="outline" {...toDemo} render={<a />}>
              Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
