import { Badge, Button, Clipboard, Tab, TabList, TabPanel, Tabs, useMobile } from '@rivocode/ui'
import { Code2, Eye, FileText, Monitor, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { BLOCK_LIST, type BlockEntry } from '@/block-list'
import { ExampleFrame } from '@/components/example-frame'
import { linkTo, type Route } from '@/routes'
import { slugify } from '@/slug'

/* ---------------------------------------------------------------------------
 * The page blocks
 *
 * Whole screens, not loose pieces. Each one is a single file in `blocks/`,
 * which imports only from the library's three paths, zod, lucide and React -
 * `test/page-blocks.test.tsx` enforces that -, so what the person copies from
 * here pastes into a project and compiles.
 *
 * The preview is ALWAYS a frame, desktop included. A block is a page: it has
 * its own `h1`, and decides the layout by the WINDOW width. Inside the site
 * column it would have the site's window and a second `h1` in the same tree;
 * in the iframe it has its own window and document, and the 1440 desktop
 * shrinks to fit, the way the browser's device toolbar does.
 * ------------------------------------------------------------------------- */

const MODULES = import.meta.glob('../blocks/*.tsx', { eager: true, import: 'default' }) as Record<
  string,
  ComponentType<Record<string, unknown>>
>

/**
 * What the preview swaps in a block so it does not act on the site.
 *
 * The block runs through a portal inside the frame, but its code's `window`
 * is the /blocos page's: the 500's "Tentar de novo" called
 * `window.location.reload()` and reloaded the whole documentation, taking the
 * person back to the top. The copied file still reloads, which is right on a
 * real error page; here the retry is simulated and returns to the same error,
 * as it would with the server still down.
 */
const PREVIEW_PROPS: Record<string, Record<string, unknown>> = {
  'server-error': {
    onRetry: () => new Promise<void>((resolve) => setTimeout(resolve, 1200)),
  },
}

/**
 * Holds the `#` of whoever arrived by direct link until the frames stop
 * growing.
 *
 * The prerender delivers each frame at its starting height, and it only takes
 * the block's height after measuring, in the browser. The browser's jump
 * happens before that: whoever opened /blocos#sem-permissao landed in the
 * middle of another block, because the nine above were still going to grow
 * hundreds of pixels each. The observer realigns on every growth and turns off
 * at the person's first gesture - whoever started scrolling chose somewhere
 * else, and pulling back reads as a defect - or when the list goes quiet.
 */
function useHeldAnchor() {
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = list.current
    if (!node) return

    let holding = Boolean(window.location.hash)
    let quiet: ReturnType<typeof setTimeout> | undefined

    const align = () => {
      if (!holding || !window.location.hash) return
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      // `instant`: the stylesheet puts smooth scrolling on everything, and an
      // animated position fix looks like the page arguing with the person.
      target?.scrollIntoView({ behavior: 'instant', block: 'start' })
    }

    const release = () => {
      holding = false
      clearTimeout(quiet)
    }

    const observer = new ResizeObserver(() => {
      if (!holding) return
      align()
      clearTimeout(quiet)
      quiet = setTimeout(() => {
        align()
        holding = false
      }, 1500)
    })
    observer.observe(node)

    const gestures = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    for (const gesture of gestures) window.addEventListener(gesture, release, { passive: true })

    return () => {
      observer.disconnect()
      clearTimeout(quiet)
      for (const gesture of gestures) window.removeEventListener(gesture, release)
    }
  }, [])

  return list
}

const SOURCES = import.meta.glob('../blocks/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const VIEWPORTS = [
  { id: 'desktop', label: 'Desktop', width: 1440, Icon: Monitor },
  { id: 'mobile', label: 'Mobile', width: 390, Icon: Smartphone },
] as const

type ViewportId = (typeof VIEWPORTS)[number]['id']

function BlockStage({ block }: { block: BlockEntry }) {
  const Block = MODULES[`../blocks/${block.file}.tsx`]
  const source = SOURCES[`../blocks/${block.file}.tsx`] ?? ''
  // On mobile the frame opens at mobile width: the 1440 desktop would only fit
  // in a 350px column as an unreadable thumbnail. The person's choice wins.
  const isMobile = useMobile()
  const [picked, setViewport] = useState<ViewportId | null>(null)
  const viewport = picked ?? (isMobile ? 'mobile' : 'desktop')
  const width = VIEWPORTS.find((option) => option.id === viewport)!.width

  return (
    <section
      id={block.slug}
      aria-labelledby={`${block.slug}-title`}
      className="overflow-hidden rounded-lg border border-border bg-surface"
    >
      <Tabs defaultValue="preview">
        <header className="space-y-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-2xl space-y-1">
              <h2 id={`${block.slug}-title`} className="font-display text-lg text-fg">
                {block.title}
              </h2>
              <p className="text-sm text-fg-muted">{block.summary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5 rounded-md border border-border bg-bg p-0.5">
                {VIEWPORTS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={viewport === id}
                    onClick={() => setViewport(id)}
                    className={`inline-flex h-7 items-center gap-1.5 rounded-sm px-2.5 font-sans text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      viewport === id ? 'bg-surface-raised text-fg' : 'text-fg-subtle hover:text-fg'
                    }`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>

              <TabList variant="segmented">
                <Tab value="preview">
                  <Eye size={14} aria-hidden="true" />
                  Preview
                </Tab>
                <Tab value="code">
                  <Code2 size={14} aria-hidden="true" />
                  Code
                </Tab>
              </TabList>

              <Clipboard value={source} labels={{ copy: `Copy the code of the ${block.title} block`, copied: 'Code copied' }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {block.pieces.map((piece) => (
              <Badge key={piece} size="sm" className="font-mono">
                {piece}
              </Badge>
            ))}
            <Button
              size="sm"
              variant="ghost"
              render={<a href={`/blocos/${block.slug}.md`} />}
              className="ml-auto"
            >
              <FileText size={14} aria-hidden="true" />
              {block.slug}.md
            </Button>
          </div>
        </header>

        <TabPanel value="preview" className="p-0">
          <div className="bg-bg/40 p-3 sm:p-4">
            {Block ? (
              <ExampleFrame
                title={`Block ${block.title}, at ${width}px wide`}
                width={width}
                initialHeight={480}
              >
                <Block {...PREVIEW_PROPS[block.file]} />
              </ExampleFrame>
            ) : null}
          </div>
        </TabPanel>

        <TabPanel value="code" className="p-0">
          <pre className="max-h-[36rem] overflow-auto bg-bg p-4 font-mono text-xs leading-relaxed text-fg">
            <code>{source}</code>
          </pre>
        </TabPanel>
      </Tabs>
    </section>
  )
}

export function BlocksPage({ navigate }: { navigate: (route: Route) => void }) {
  const list = useHeldAnchor()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl space-y-3">
        <p className="font-mono text-xs tracking-[0.14em] text-fg-subtle uppercase">Blocks</p>
        <h1 className="font-display text-3xl text-fg sm:text-4xl">Page blocks</h1>
        <p className="text-base text-fg-muted">
          Whole screens, ready to copy: {BLOCK_LIST.length} files built only with @rivocode/ui
          pieces and the skill's rules. Each one imports only from the library,{' '}
          <code className="font-mono">zod</code> and <code className="font-mono">lucide-react</code>,
          and brings the end states the screen needs: data, loading, error and empty.
        </p>
        <p className="text-sm text-fg-subtle">
          For agents, each block has its own <code className="font-mono">.md</code>, and all of them
          are in{' '}
          <a href="/llms.txt" className="text-accent-text underline underline-offset-4">
            /llms.txt
          </a>
          . To dress one in a client's brand, use the{' '}
          <a
            {...linkTo({ kind: 'theme' }, navigate)}
            className="text-accent-text underline underline-offset-4"
          >
            theme builder
          </a>
          .
        </p>
        <nav aria-label="Blocks" className="flex flex-wrap gap-2 pt-1">
          {BLOCK_LIST.map((block) => (
            <a
              key={block.slug}
              href={`#${block.slug}`}
              className="rounded-md border border-border px-2.5 py-1 text-sm text-fg-muted transition-colors hover:border-accent hover:text-fg"
            >
              {block.title}
            </a>
          ))}
        </nav>
      </header>

      <div ref={list} className="mt-10 space-y-10">
        {BLOCK_LIST.map((block) => (
          <BlockStage key={block.slug} block={block} />
        ))}
      </div>

      <p className="mt-10 max-w-3xl text-sm text-fg-subtle">
        The pieces of each block have their own page, with the props table:{' '}
        {[...new Set(BLOCK_LIST.flatMap((block) => block.pieces))].sort().map((piece, index, all) => (
          <span key={piece}>
            <a
              {...linkTo({ kind: 'component', slug: slugify(piece) }, navigate)}
              className="font-mono text-fg-muted underline decoration-border underline-offset-4 hover:text-fg"
            >
              {piece}
            </a>
            {index < all.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>
    </div>
  )
}
