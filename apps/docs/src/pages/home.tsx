import { Badge, Button } from '@rivocode/ui'
import { ArrowRight, Bot, Check, Copy, Layers, Palette, Ruler } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CodeRiver } from '@/components/code-river'
import { Showcase } from '@/components/showcase'
import { ENTRIES, FAMILIES, WITH_EXAMPLE, entriesOfFamily } from '@/catalog'
import { GUIDES } from '@/guides'
import { Logo } from '@/components/logo'
import { linkTo, type Route } from '@/routes'

/* ---------------------------------------------------------------------------
 * The front page
 *
 * Someone lands here to decide whether to adopt this, and that decision is
 * made by looking, not by reading. So the running screen comes before the
 * prose, each of the three ideas that make the library different gets a
 * picture, and the catalog is the last thing rather than the first.
 * ------------------------------------------------------------------------- */

const INSTALL = 'bun add @rivocode/ui'

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

Listagem com os quatro finais de uma
consulta: carregando, deu certo, deu
errado, veio vazia.

## Importação

import { DataTable } from '@rivocode/ui'

## Props

| Prop      | Tipo     | Obrigatória |
| --------- | -------- | ----------- |
| data      | Linha[]  | sim         |
| columns   | Coluna[] | sim         |
| isLoading | boolean  | —           |`

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
      <span className="sr-only">{copied ? 'Copiado' : 'Copiar'}</span>
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

/** A section that argues one point, with its own picture beside the words. */
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
      <div className={reverse ? 'lg:order-2' : undefined}>
        <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-accent-text uppercase">
          {icon}
          {eyebrow}
        </p>
        <h3 className="mt-3 font-display text-2xl text-fg sm:text-3xl">{title}</h3>
        <div className="mt-4 space-y-3 text-fg-muted">{children}</div>
      </div>

      <div className={reverse ? 'lg:order-1' : undefined}>{figure}</div>
    </div>
  )
}

/** The three token layers, drawn instead of described. */
function TokenLayers() {
  const layers = [
    { code: '--rc-p-lime-400', hint: 'a cor crua, sem opinião' },
    { code: '--color-accent', hint: 'o papel que ela cumpre' },
    { code: '[data-rc-theme]', hint: 'quem decide, por cliente' },
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

/** Both densities at once, driven by the token and not by a hard-coded height. */
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

      {/* A glow behind the headline. The river alone is texture; this is what
          gives the top of the page a centre of gravity. */}
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
          <Badge tone="accent">v0.2.0 no npm</Badge>
          <span className="font-mono text-xs text-fg-subtle">Base UI · Tailwind 4 · React 19</span>
        </div>

        <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] text-fg sm:text-6xl">
          O design system da <span className="text-accent-text">RivoCode</span>, documentado por
          dentro.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">
          {ENTRIES.length} peças sobre a Base UI, com tokens em três camadas, dois temas e duas
          densidades. Nenhum componente conhece a cor da marca: ele pede um papel, e o tema
          responde.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" shape="pill" {...toInstall} render={<a />}>
            Começar a usar
            <ArrowRight size={16} />
          </Button>
          <Button size="lg" shape="pill" variant="outline" {...toDemo} render={<a />}>
            Ver um sistema pronto
          </Button>
        </div>

        <div className="mt-8 max-w-md">
          <CopyLine text={INSTALL} />
        </div>

        <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <Stat value={String(ENTRIES.length)} label="peças no catálogo" />
          <Stat value={String(WITH_EXAMPLE)} label="com exemplo que roda" />
          <Stat value="237" label="testes, todos verdes" />
          <Stat value={String(GUIDES.length)} label="guias de uso" />
        </div>
      </section>

      {/* The argument, running, before any of the prose about it. */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <Showcase />
      </section>

      <section className="relative mx-auto max-w-6xl space-y-24 px-6 pb-24">
        <Argument
          icon={<Palette size={14} />}
          eyebrow="Tokens"
          title="Trocar de cliente é trocar uma camada"
          figure={<TokenLayers />}
        >
          <p>
            A paleta guarda a cor crua. O papel diz para que ela serve. O tema decide qual cor
            responde a cada papel.
          </p>
          <p>
            Componente nenhum atravessa essas camadas: o{' '}
            <code className="font-mono text-accent-text">bun run check</code> falha se alguém
            escrever uma cor literal, e quarenta pares de contraste são medidos a cada commit.
          </p>
        </Argument>

        <Argument
          icon={<Ruler size={14} />}
          eyebrow="Densidade"
          title="A mesma tela em duas alturas, sem dois catálogos"
          reverse
          figure={<DensityFigure />}
        >
          <p>
            Numa tela de operação cabe mais linha na mesma altura. Num cadastro que se preenche uma
            vez por mês, não.
          </p>
          <p>
            É um atributo no Provider, e a altura de todo controle acompanha. Não existe um segundo
            catálogo de peças compactas para manter em dia.
          </p>
        </Argument>

        <Argument
          icon={<Bot size={14} />}
          eyebrow="Agents"
          title="A mesma documentação, em markdown cru"
          figure={<CodeCard label="/componentes/data-table.md">{AGENT_FILE}</CodeCard>}
        >
          <p>
            Boa parte do código que usa esta biblioteca hoje é escrita com um agent ao lado. Um site
            que só serve HTML obriga o agent a adivinhar a API pelo nome, e ele adivinha com
            confiança.
          </p>
          <p>
            Toda página tem o endereço cru em{' '}
            <code className="font-mono text-accent-text">.md</code>, com importação, exemplos e
            tabela de props. O índice fica em{' '}
            <a href="/llms.txt" className="text-accent-text underline underline-offset-2">
              /llms.txt
            </a>
            .
          </p>
        </Argument>

        <Argument
          icon={<Layers size={14} />}
          eyebrow="Base UI"
          title="O comportamento não é nosso, e essa é a vantagem"
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
            Foco, teclado, portal, leitor de tela e os casos de borda vêm da Base UI, que trata
            disso em tempo integral.
          </p>
          <p>
            O que a biblioteca acrescenta é o desenho, e a decisão de quando cada peça serve. Duas
            linhas de CSS e um Provider, e a tela começa.
          </p>
        </Argument>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl text-fg">O catálogo</h2>
          <p className="text-fg-muted">Por família, na ordem de quem monta uma tela.</p>
        </div>

        <div className="mt-8 space-y-8">
          {FAMILIES.map((family) => (
            <div key={family}>
              <h3 className="flex items-baseline gap-2 font-mono text-xs tracking-widest text-fg-subtle uppercase">
                {family}
                <span className="text-fg-subtle/70">{entriesOfFamily(family).length}</span>
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
          <h2 className="font-display text-3xl text-fg">Comece pela instalação</h2>
          <p className="mx-auto mt-3 max-w-xl text-fg-muted">
            Um comando, as duas linhas de CSS e o Provider. Depois disso é escrever tela.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" shape="pill" {...toInstall} render={<a />}>
              Instalação
              <ArrowRight size={16} />
            </Button>
            <Button size="lg" shape="pill" variant="outline" {...toDemo} render={<a />}>
              Demonstração
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
