import { IconButton, Input, RivoProvider, Sheet, SheetContent, SheetTrigger } from '@rivocode/ui'
import { BookOpen, Bot, Blocks, LayoutGrid, Menu, Palette, Search } from 'lucide-react'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { ENTRIES, FAMILIES, entriesOfFamily, preloadPage } from '@/catalog'
import { GUIDES } from '@/guides'
import { Logo } from '@/components/logo'
import { Home } from '@/pages/home'
import { linkTo, useRoute, type Route } from '@/routes'
import { PageBoundary } from '@/components/boundary'
import { Toc } from '@/components/toc'
import { revealWithin } from '@/reveal'

/*
 * One route, one chunk.
 *
 * The cover stays with the shell because it is where almost everyone arrives.
 * The other five dragged into the entry chunk everything they mount - the icon
 * gallery, the foundation's Recharts, the whole demo screen - and none of that
 * shows on the cover. While they were static imports, Vite also wrote a
 * `modulepreload` for each of their dependencies into `index.html`: eighty
 * preload lines competing for bandwidth with what the first screen needed.
 */
const CatalogPage = lazy(() =>
  import('@/pages/catalog').then((mod) => ({ default: mod.CatalogPage })),
)
const ComponentPage = lazy(() =>
  import('@/pages/component').then((mod) => ({ default: mod.ComponentPage })),
)
const DemoPage = lazy(() => import('@/pages/demo').then((mod) => ({ default: mod.DemoPage })))
const FoundationPage = lazy(() =>
  import('@/pages/foundation').then((mod) => ({ default: mod.FoundationPage })),
)
const GuidePage = lazy(() => import('@/pages/guide').then((mod) => ({ default: mod.GuidePage })))
const ThemePage = lazy(() => import('@/pages/theme').then((mod) => ({ default: mod.ThemePage })))
const BlocksPage = lazy(() => import('@/pages/blocks').then((mod) => ({ default: mod.BlocksPage })))

/**
 * The page's place while its chunks arrive.
 *
 * A full window of height, not half: the footer has to stay OFF screen until
 * the page exists. Appearing earlier, it moves down when the content arrives,
 * and that move is layout shift - the metric Lighthouse's agentic navigation
 * category charges together with the accessibility tree.
 */
function PageFallback() {
  return <div className="min-h-dvh" />
}

function Brand({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <a
      {...linkTo({ kind: 'home' }, navigate)}
      className="flex min-w-0 items-center gap-2 font-display text-sm tracking-wide text-fg"
    >
      <Logo className="h-4 w-auto shrink-0 text-accent" />
      {/* The brand is its own flex item so it can shrink with an ellipsis
          instead of being cut in the middle of a letter. */}
      <span className="truncate">RIVOCODE</span>
      {/* The suffix is the first thing to go on mobile: at 320px the header
          row was 23px wider than the window, and dropping this is the cheapest
          way to pay for part of that - the name alone still identifies the
          site. */}
      <span className="hidden font-mono text-xs font-normal text-fg-subtle sm:inline">/ui</span>
    </a>
  )
}

/** The list of pieces, with a filter. Serves the sidebar and the mobile sheet. */
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
  const list = useRef<HTMLDivElement>(null)

  /*
   * Whoever arrives through a component link lands on a list of sixty-six
   * names scrolled to the top, with the name they are reading off screen.
   * Nothing said where they were in the family, nor that the list went on
   * below.
   *
   * Only on page change: scrolling the list while the person filters would
   * take the gesture out of their hand.
   */
  const here = route.kind + ('slug' in route ? `:${route.slug}` : '')
  useEffect(() => {
    const current = list.current?.querySelector<HTMLElement>('[aria-current="page"]')
    // The larger-than-default margin is the family heading, which sticks to
    // the top of the list and would cover the row if it stopped under it.
    if (list.current && current) revealWithin(list.current, current, 44)
  }, [here])

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
   * The row, just once.
   *
   * Every group hangs from the same vertical thread, and the active row swaps
   * its piece of that thread for the accent. That is what carries "you are
   * here" through a list of sixty-six names: a filled pill alone reads as
   * hover at a second glance, and hover is exactly the one thing it must not
   * be mistaken for.
   */
  const rowClass = (active: boolean) =>
    [
      'relative block rounded-r-md py-1.5 pr-3 pl-4 text-sm',
      'transition-[color,background-color] duration-[var(--rc-duration-fast)] ease-rc',
      // The piece of thread this row owns. Transparent by default, so the
      // group's own line shows and the list reads as a single column.
      'before:absolute before:inset-y-0 before:-left-px before:w-px before:transition-colors',
      active
        ? 'bg-accent-subtle text-accent-text before:bg-accent before:w-0.5'
        : 'text-fg-muted before:bg-transparent hover:bg-surface/70 hover:text-fg',
    ].join(' ')

  /* Sticky, so the family a name belongs to stays on screen after the scroll
   * goes past its heading. */
  const headingClass =
    'sticky top-0 z-[1] -mx-1 bg-bg px-4 pt-2 pb-2 font-mono text-[0.68rem] font-medium tracking-[0.14em] text-fg-subtle uppercase'

  return (
    /* A named landmark: the page has two navs, and the unnamed one was this,
       the larger of the two. In a landmark list, "navigation" next to
       "navigation, On this page" left exactly the wrong one anonymous. */
    <nav aria-label="Pieces and guides" className="flex h-full flex-col gap-4">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${ENTRIES.length} pieces`}
          aria-label="Search pieces"
          className="border-transparent bg-surface pl-8 focus-visible:border-border"
        />
      </div>

      <div ref={list} className="rc-scroll min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="mb-6">
          <h2 className={headingClass}>Get started</h2>
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
                    aria-current={active ? 'page' : undefined}
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
                aria-current={route.kind === 'foundation' ? 'page' : undefined}
                className={rowClass(route.kind === 'foundation')}
              >
                Conventions
              </a>
            </li>
          </ul>
        </div>

        {found === 0 && (
          <p className="px-3 py-6 text-sm text-fg-subtle">Nothing by that name in the catalog.</p>
        )}

        {(() => {
          const link = linkTo({ kind: 'catalog' }, navigate)
          return (
            <div className="mb-6">
              <h2 className={headingClass}>Catalog</h2>
              <ul className="border-l border-border">
                <li>
                  <a
                    href={link.href}
                    onClick={(event) => {
                      link.onClick(event)
                      onNavigate?.()
                    }}
                    aria-current={route.kind === 'catalog' ? 'page' : undefined}
                    className={rowClass(route.kind === 'catalog')}
                  >
                    All pieces, on one screen
                  </a>
                </li>
              </ul>
            </div>
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
                      aria-current={active ? 'page' : undefined}
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
  // Idempotent: each loader keeps its own promise, so repeating it on every
  // render only returns what is already in flight. See `preloadPage`.
  if (route.kind === 'component') preloadPage(route.slug)
  // These two use the whole window: 256px of name list next to a page that is
  // already a list of names buys nothing.
  // The theme builder and the blocks too: both show whole screens side by
  // side, and the 768px reading column would squeeze them.
  const fullWidth =
    route.kind === 'home' || route.kind === 'demo' || route.kind === 'theme' || route.kind === 'blocks'

  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <div className="min-h-dvh">
        {/* The sidebar repeats some 90 links on every page, so the first
            control of an example was tab stop number 105. A screen reader
            skips that by landmark; someone driving by keyboard alone had no
            way out. First focusable element of the page, and it has to APPEAR
            when it receives focus - `sr-only` alone would leave it invisible
            under the cursor, which is worse than not having it. */}
        <a
          href="#conteudo"
          className="sr-only rounded-md focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--rc-z-sticky)] focus:m-0 focus:h-auto focus:w-auto focus:overflow-visible focus:border focus:border-accent focus:bg-surface-raised focus:px-3 focus:py-2 focus:font-sans focus:text-sm focus:whitespace-nowrap focus:text-fg focus:shadow-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
          {/* The `min-w-0` on the left block is what keeps the row from
              overflowing at 320px: a flex item starts with `min-width: auto`,
              so the drawer button plus the brand refused to shrink and pushed
              the chips 23px out of the window on every route - WCAG 1.4.10.
              The chips keep `shrink-0` so the squeeze falls on the brand,
              which has an ellipsis, and not on the three targets.

              The smaller gaps and padding below `sm` are what keep that
              ellipsis from showing: without them the brand fit with zero slack
              and became "RIVOCO..." depending on when the display font
              finished loading. The chips stay well above WCAG 2.5.8's 24x24. */}
          <div className="flex h-14 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {/* On mobile the sidebar becomes a drawer: 256px of fixed menu
                  inside a 390px screen leaves no page to read. */}
              {!fullWidth && (
                <Sheet side="left">
                  <SheetTrigger
                    render={
                      <IconButton
                        size="sm"
                        variant="ghost"
                        label="Open the menu"
                        className="lg:hidden"
                      >
                        <Menu size={16} />
                      </IconButton>
                    }
                  />
                  <SheetContent className="w-72 p-4 lg:hidden">
                    <Nav route={route} navigate={navigate} />
                  </SheetContent>
                </Sheet>
              )}
              <Brand navigate={navigate} />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* The documentation needs its own door on every page, and it
                  opens where someone actually starts: installation. From there
                  the sidebar takes the person to any piece. */}
              {/* The label repeats the text that only appears from `sm` up:
                  below that the link had an icon and nothing else, and a link
                  without an accessible name is a link agents and screen
                  readers cannot tell where it goes. They are the same words as
                  the screen on purpose - a name that differs from the visible
                  one breaks voice control (WCAG 2.5.3). */}
              <a
                aria-label="docs"
                {...linkTo({ kind: 'guide', slug: 'instalacao' }, navigate)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 sm:px-2.5 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${
                  route.kind === 'guide' || route.kind === 'component' || route.kind === 'foundation'
                    ? 'border-accent text-fg'
                    : 'border-border text-fg-subtle'
                }`}
              >
                <BookOpen size={13} />
                <span className="hidden sm:inline">docs</span>
              </a>

              {/* The two tools get their own door in the header: whoever comes
                  to dress a client or build a screen does not go through the
                  list of pieces. Same design as the neighboring chips, and the
                  label repeats the visible word for the same reason. */}
              <a
                aria-label="theme"
                {...linkTo({ kind: 'theme' }, navigate)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 sm:px-2.5 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${
                  route.kind === 'theme' ? 'border-accent text-fg' : 'border-border text-fg-subtle'
                }`}
              >
                <Palette size={13} />
                <span className="hidden md:inline">theme</span>
              </a>

              <a
                aria-label="blocks"
                {...linkTo({ kind: 'blocks' }, navigate)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 sm:px-2.5 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${
                  route.kind === 'blocks' ? 'border-accent text-fg' : 'border-border text-fg-subtle'
                }`}
              >
                <Blocks size={13} />
                <span className="hidden md:inline">blocks</span>
              </a>

              <a
                aria-label="demo"
                {...linkTo({ kind: 'demo' }, navigate)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 sm:px-2.5 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${
                  route.kind === 'demo'
                    ? 'border-accent text-fg'
                    : 'border-border text-fg-subtle'
                }`}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">demo</span>
              </a>

              <a
                aria-label="/llms.txt"
                href="/llms.txt"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 sm:px-2.5 font-mono text-xs text-fg-subtle transition-colors hover:border-accent hover:text-fg"
              >
                <Bot size={13} />
                <span className="hidden sm:inline">/llms.txt</span>
              </a>
            </div>
          </div>
        </header>

        {fullWidth ? (
          /* The `tabIndex={-1}` is not decoration: without it Chrome and Safari
             only scroll, leaving the cursor on the skip link, and the next Tab
             goes straight back to the header. */
          <main id="conteudo" tabIndex={-1} className="outline-none">
            {route.kind === 'home' ? (
              <Home navigate={navigate} />
            ) : (
              <PageBoundary key={route.kind}>
                <Suspense fallback={<PageFallback />}>
                  {route.kind === 'demo' && <DemoPage />}
                  {route.kind === 'theme' && <ThemePage />}
                  {route.kind === 'blocks' && <BlocksPage navigate={navigate} />}
                </Suspense>
              </PageBoundary>
            )}
          </main>
        ) : (
          /* The sidebar touches the window edge, like the header above it.
             Centering the whole shell left a gap on the left and put the
             divider in the middle of the screen, which read as a defect. */
          <div className="flex w-full">
            <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-border py-4 pr-2 pl-4 lg:block xl:w-72 xl:pl-6">
              <Nav route={route} navigate={navigate} />
            </aside>

            <div className="flex min-w-0 flex-1 justify-center">
              <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 outline-none xl:max-w-3xl">
                {/* The `key` resets the boundary on page change: without it, a
                    failure would leave the message in place of every piece
                    opened afterwards, and only reloading would clear it. */}
                <PageBoundary key={`${route.kind}:${'slug' in route ? route.slug : ''}`}>
                  <Suspense fallback={<PageFallback />}>
                    {route.kind === 'catalog' && <CatalogPage navigate={navigate} />}
                    {route.kind === 'foundation' && <FoundationPage />}
                    {route.kind === 'guide' && <GuidePage slug={route.slug} />}
                    {route.kind === 'component' && <ComponentPage slug={route.slug} />}
                  </Suspense>
                </PageBoundary>
              </main>

              <Toc watch={`${route.kind}:${'slug' in route ? route.slug : ''}`} />
            </div>
          </div>
        )}

        {/* The docs footer does not go into the demo: there the screen is the
            system, and a site footer under it breaks the illusion the whole
            page exists to sustain. */}
        {route.kind !== 'demo' && (
        <footer className="border-t border-border px-6 py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-xl text-sm text-fg-subtle">
              @rivocode/ui, {ENTRIES.length} pieces in the catalog. This page is generated from the
              same files that feed the design system, so it does not go stale on its own.
            </p>

            {/* The credit sits in the footer of every page, not just the cover:
                whoever arrives through a component link never passes the
                cover, and that is exactly the person who will want to know
                whose library it is before installing. */}
            <div className="text-sm text-fg-subtle sm:text-right">
              <p>
                Made by{' '}
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
