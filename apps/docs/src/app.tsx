import { Button, Input, RivoProvider, Sheet, SheetContent, SheetTrigger } from '@rivocode/ui'
import { BookOpen, Bot, LayoutGrid, Menu, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ENTRIES, FAMILIES, entriesOfFamily } from '@/catalog'
import { GUIDES } from '@/guides'
import { Logo } from '@/components/logo'
import { ComponentPage } from '@/pages/component'
import { FoundationPage } from '@/pages/foundation'
import { GuidePage } from '@/pages/guide'
import { DemoPage } from '@/pages/demo'
import { Home } from '@/pages/home'
import { linkTo, useRoute, type Route } from '@/routes'
import { CatalogPage } from '@/pages/catalog'
import { Toc } from '@/components/toc'

function Brand({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <a
      {...linkTo({ kind: 'home' }, navigate)}
      className="flex items-center gap-2 font-display text-sm tracking-wide text-fg"
    >
      <Logo className="h-4 w-auto text-accent" />
      RIVOCODE
      <span className="font-mono text-xs font-normal text-fg-subtle">/ui</span>
    </a>
  )
}

/** The piece list, with a filter. Serves both the sidebar and the phone sheet. */
function Nav({
  route,
  navigate,
  onNavigate,
}: {
  route: Route
  navigate: (target: Route) => void
  onNavigate?: () => void
}) {
  const [query, setQuery] = useState('')

  const families = useMemo(() => {
    const term = query.trim().toLowerCase()

    return FAMILIES.map((family) => ({
      family,
      entries: entriesOfFamily(family).filter(
        (entry) =>
          term === '' ||
          entry.name.toLowerCase().includes(term) ||
          entry.summary.toLowerCase().includes(term),
      ),
    })).filter((group) => group.entries.length > 0)
  }, [query])

  const found = families.reduce((total, group) => total + group.entries.length, 0)
  const foundationLink = linkTo({ kind: 'foundation' }, navigate)

  /*
   * The row, once.
   *
   * Every group hangs off one vertical rule, and the active row replaces its
   * segment of that rule with the accent. That is what carries "you are here"
   * down a list of sixty-six names: a filled pill alone reads as hover on the
   * second glance, and hover is the one thing it must not be confused with.
   */
  const rowClass = (active: boolean) =>
    [
      'relative block rounded-r-md py-1.5 pr-3 pl-4 text-sm',
      'transition-[color,background-color] duration-[var(--rc-duration-fast)] ease-rc',
      // The segment of rule this row owns. Transparent by default, so the
      // group's own line shows through and the list reads as one column.
      'before:absolute before:inset-y-0 before:-left-px before:w-px before:transition-colors',
      active
        ? 'bg-accent-subtle text-accent-text before:bg-accent before:w-0.5'
        : 'text-fg-muted before:bg-transparent hover:bg-surface/70 hover:text-fg',
    ].join(' ')

  /* Sticky, so the family a name belongs to is still on screen after
   * scrolling past its heading. */
  const headingClass =
    'sticky top-0 z-[1] -mx-1 bg-bg px-4 pt-2 pb-2 font-mono text-[0.68rem] font-medium tracking-[0.14em] text-fg-subtle uppercase'

  return (
    <nav className="flex h-full flex-col gap-4">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Buscar entre ${ENTRIES.length} peças`}
          aria-label="Buscar peça"
          className="border-transparent bg-surface pl-8 focus-visible:border-border"
        />
      </div>

      <div className="rc-scroll min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="mb-6">
          <h2 className={headingClass}>Começar</h2>
          <ul className="border-l border-border">
            {GUIDES.map((guide) => {
              const link = linkTo({ kind: 'guide', slug: guide.slug }, navigate)
              const active = route.kind === 'guide' && route.slug === guide.slug

              return (
                <li key={guide.slug}>
                  <a
                    href={link.href}
                    onClick={(event) => {
                      link.onClick(event)
                      onNavigate?.()
                    }}
                    className={rowClass(active)}
                  >
                    {guide.title}
                  </a>
                </li>
              )
            })}
            <li>
              <a
                href={foundationLink.href}
                onClick={(event) => {
                  foundationLink.onClick(event)
                  onNavigate?.()
                }}
                className={rowClass(route.kind === 'foundation')}
              >
                Convenções
              </a>
            </li>
          </ul>
        </div>

        {found === 0 && (
          <p className="px-3 py-6 text-sm text-fg-subtle">Nada com esse nome no catálogo.</p>
        )}

        {(() => {
          const link = linkTo({ kind: 'catalog' }, navigate)
          return (
            <a
              href={link.href}
              onClick={(event) => {
                link.onClick(event)
                onNavigate?.()
              }}
              className={`${rowClass(route.kind === 'catalog')} mb-4 block border-l border-border`}
            >
              Todas as peças, numa tela
            </a>
          )
        })()}

        {families.map(({ family, entries }) => (
          <div key={family} className="mb-6">
            <h2 className={headingClass}>{family}</h2>
            <ul className="border-l border-border">
              {entries.map((entry) => {
                const active = route.kind === 'component' && route.slug === entry.slug
                const link = linkTo({ kind: 'component', slug: entry.slug }, navigate)

                return (
                  <li key={entry.name}>
                    <a
                      href={link.href}
                      onClick={(event) => {
                        link.onClick(event)
                        onNavigate?.()
                      }}
                      className={`${rowClass(active)} font-mono`}
                    >
                      {entry.name}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}

export function App() {
  const { route, navigate } = useRoute()
  // Both of these use the whole window: a 256px list of names beside a page
  // that is itself a list of names buys nothing.
  const fullWidth = route.kind === 'home' || route.kind === 'demo'

  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <div className="min-h-dvh">
        <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* On a phone the sidebar becomes a drawer: 256px of fixed menu
                  inside 390px of screen leaves no page to read. */}
              {!fullWidth && (
                <Sheet side="left">
                  <SheetTrigger
                    render={
                      <Button
                        size="iconSm"
                        variant="ghost"
                        aria-label="Abrir o menu"
                        className="lg:hidden"
                      />
                    }
                  >
                    <Menu size={16} />
                  </SheetTrigger>
                  <SheetContent className="w-72 p-4 lg:hidden">
                    <Nav route={route} navigate={navigate} />
                  </SheetContent>
                </Sheet>
              )}
              <Brand navigate={navigate} />
            </div>

            <div className="flex items-center gap-2">
              {/* The documentation needs its own way in from every page, and
                  it opens where someone actually starts: installation. From
                  there the sidebar carries them to any piece. */}
              <a
                {...linkTo({ kind: 'guide', slug: 'instalacao' }, navigate)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${
                  route.kind === 'guide' || route.kind === 'component' || route.kind === 'foundation'
                    ? 'border-accent text-fg'
                    : 'border-border text-fg-subtle'
                }`}
              >
                <BookOpen size={13} />
                <span className="hidden sm:inline">documentação</span>
              </a>

              <a
                {...linkTo({ kind: 'demo' }, navigate)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${
                  route.kind === 'demo'
                    ? 'border-accent text-fg'
                    : 'border-border text-fg-subtle'
                }`}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">demonstração</span>
              </a>

              <a
                href="/llms.txt"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs text-fg-subtle transition-colors hover:border-accent hover:text-fg"
              >
                <Bot size={13} />
                <span className="hidden sm:inline">/llms.txt</span>
              </a>
            </div>
          </div>
        </header>

        {fullWidth ? (
          route.kind === 'home' ? (
            <Home navigate={navigate} />
          ) : (
            <DemoPage />
          )
        ) : (
          /* The sidebar sits against the edge of the window, like the header
             above it. Centring the whole shell left a gap to its left and put
             the divider in the middle of the screen, which read as a bug. */
          <div className="flex w-full">
            <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-border py-4 pr-2 pl-4 lg:block xl:w-72 xl:pl-6">
              <Nav route={route} navigate={navigate} />
            </aside>

            <div className="flex min-w-0 flex-1 justify-center">
              <main className="min-w-0 flex-1 xl:max-w-3xl">
                {route.kind === 'catalog' && <CatalogPage navigate={navigate} />}
                {route.kind === 'foundation' && <FoundationPage />}
                {route.kind === 'guide' && <GuidePage slug={route.slug} />}
                {route.kind === 'component' && <ComponentPage slug={route.slug} />}
              </main>

              <Toc watch={`${route.kind}:${'slug' in route ? route.slug : ''}`} />
            </div>
          </div>
        )}

        {/* O rodape da documentacao nao entra na demonstracao: ali a tela e o
            sistema, e um rodape de site embaixo dele quebra a ilusao que a
            pagina inteira existe para sustentar. */}
        {route.kind !== 'demo' && (
        <footer className="border-t border-border px-6 py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-xl text-sm text-fg-subtle">
              @rivocode/ui, {ENTRIES.length} peças no catálogo. Esta página é gerada dos mesmos
              arquivos que alimentam o design system, então ela não envelhece sozinha.
            </p>

            {/* O credito fica no rodape de todas as paginas, e nao so na capa:
                quem chega por um link de componente nunca passa pela capa, e e
                justamente essa pessoa que vai querer saber de quem e a
                biblioteca antes de instalar. */}
            <div className="text-sm text-fg-subtle sm:text-right">
              <p>
                Feito por{' '}
                <a
                  href="https://rivocode.com.br"
                  target="_blank"
                  rel="noreferrer"
                  className="text-fg-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg hover:decoration-accent"
                >
                  RivoCode
                </a>
                .
              </p>
              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 sm:justify-end">
                <a
                  href="https://github.com/Rivocode/ui"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-fg"
                >
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/@rivocode/ui"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-fg"
                >
                  npm
                </a>
                <a
                  href="https://github.com/Rivocode/ui/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-fg"
                >
                  MIT
                </a>
              </p>
            </div>
          </div>
        </footer>
        )}
      </div>
    </RivoProvider>
  )
}
