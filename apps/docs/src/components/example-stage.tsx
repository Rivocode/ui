import { Button, RivoProvider, Tab, TabList, TabPanel, Tabs, Tooltip, TooltipContent, TooltipTrigger } from '@rivocode/ui'
import { Check, Code2, Copy, Eye, Monitor, Smartphone, Tablet } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { anchor } from '@/anchor'
import { ExampleFrame } from '@/components/example-frame'
import { titleOf } from '@/example-source'

export { titleOf }

/* ---------------------------------------------------------------------------
 * Example stage
 *
 * Preview and code as two tabs, plus a viewport switch. A component library
 * whose docs only ever show the desktop width is documenting half of it, and
 * this one decides mobile behaviour first, so hiding it would bury the part
 * that took the most thought.
 * ------------------------------------------------------------------------- */

const VIEWPORTS = [
  { id: 'desktop', label: 'Desktop', width: null, Icon: Monitor },
  { id: 'tablet', label: 'Tablet', width: 768, Icon: Tablet },
  { id: 'mobile', label: 'Celular', width: 390, Icon: Smartphone },
] as const

type ViewportId = (typeof VIEWPORTS)[number]['id']

/* ---------------------------------------------------------------------------
 * One control, two groups
 *
 * The width switch and the preview/code switch answer the same question, "show
 * me this example another way", so they read as one segmented control. Before,
 * one was a boxed row of icons and the other an underlined tab strip, and two
 * shapes side by side made the header look like two features stitched
 * together.
 * ------------------------------------------------------------------------- */

const SEGMENTED = 'flex items-center gap-0.5 rounded-md border border-border bg-bg p-0.5'

const segment = (active: boolean, extra = '') =>
  [
    'inline-flex h-7 items-center justify-center gap-1.5 rounded-sm px-2.5',
    'font-sans text-sm transition-colors duration-[var(--rc-duration-fast)] ease-rc',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring',
    active ? 'bg-surface-raised text-fg' : 'text-fg-subtle hover:text-fg',
    'disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:text-fg-disabled',
    extra,
  ].join(' ')

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="iconSm"
            variant="ghost"
            aria-label={copied ? 'Código copiado' : 'Copiar código'}
            onClick={() => {
              navigator.clipboard.writeText(text).then(() => setCopied(true))
            }}
          />
        }
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copiado' : 'Copiar código'}</TooltipContent>
    </Tooltip>
  )
}

function ViewportSwitch({
  value,
  onChange,
}: {
  value: ViewportId
  onChange: (id: ViewportId) => void
}) {
  return (
    <div className={SEGMENTED}>
      {VIEWPORTS.map(({ id, label, Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={`Ver em ${label.toLowerCase()}`}
                aria-pressed={value === id}
                onClick={() => onChange(id)}
                className={segment(value === id, 'w-8')}
              />
            }
          >
            <Icon size={14} aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

/**
 * The width a keep-open story renders at while the switch says desktop.
 *
 * It matches the docs column, so the frame reads as inline; the point is the
 * window, not the size: inside the iframe a dialog's overlay ends at the
 * card, instead of opening over the documentation.
 */
const KEEP_OPEN_WIDTH = 720
const KEEP_OPEN_MIN_HEIGHT = 360

export function ExampleStage({
  name,
  Example,
  source,
  title,
  keepOpen = false,
}: {
  name: string
  Example: ComponentType
  source: string | null
  title?: string
  /** A story that is open by design renders in the iframe at every width. */
  keepOpen?: boolean
}) {
  const [viewport, setViewport] = useState<ViewportId>('desktop')
  const width =
    VIEWPORTS.find((option) => option.id === viewport)?.width ?? (keepOpen ? KEEP_OPEN_WIDTH : null)

  // Measured at the moment of the switch, so the frame that replaces the
  // inline example starts at the height the reader was already looking at,
  // instead of collapsing to a guess and popping back up.
  const preview = useRef<HTMLDivElement>(null)
  const heldHeight = useRef<number | undefined>(undefined)

  const switchViewport = (id: ViewportId) => {
    const node = preview.current
    if (node) {
      const style = getComputedStyle(node)
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
      heldHeight.current = Math.max(160, node.getBoundingClientRect().height - padding)
    }
    setViewport(id)
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <Tabs defaultValue="preview">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2">
          {/* `h2` e nao `h3`: cada exemplo e uma secao da pagina, e vinha
              logo depois do `h1` do componente, pulando um nivel em todas as
              66 paginas. Nivel semantico e tamanho visual sao coisas
              diferentes, entao a aparencia nao muda. */}
          <h2 id={anchor(name)} className="scroll-mt-20 pl-1 font-sans text-sm font-medium text-fg">
            {title ?? titleOf(name)}
          </h2>

          <div className="flex items-center gap-2">
            <ViewportSwitch value={viewport} onChange={switchViewport} />

            {/* Icon and word together: the eye alone is a guess, and the word
                alone is one more thing to read on a page full of examples. */}
            <TabList variant="segmented">
              <Tab value="preview">
                <Eye size={14} aria-hidden="true" />
                Preview
              </Tab>
              <Tab value="code" disabled={!source}>
                <Code2 size={14} aria-hidden="true" />
                Código
              </Tab>
            </TabList>

            {source && <CopyButton text={source} />}
          </div>
        </header>

        <TabPanel value="preview" className="p-0">
          <div ref={preview} className="flex justify-center overflow-x-auto bg-bg/40 p-4">
            {width ? (
              <ExampleFrame
                width={width}
                initialHeight={heldHeight.current}
                minHeight={keepOpen ? KEEP_OPEN_MIN_HEIGHT : undefined}
              >
                <Example />
              </ExampleFrame>
            ) : (
              // The width has to be settled before the provider, not inside
              // it: as a flex item the provider's own box is shrink-to-fit, so
              // a `w-full` under it resolved against a width that depended on
              // the content, and a chart asking for 100% of that collapsed to
              // a sliver.
              <div className="w-full">
                <RivoProvider scope="local" theme="rivocode-dark">
                  <div className="flex min-h-32 w-full items-center justify-center overflow-x-auto rounded-md p-6">
                    <Example />
                  </div>
                </RivoProvider>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value="code" className="p-0">
          <pre className="overflow-x-auto bg-bg p-4 font-mono text-xs leading-relaxed text-fg">
            <code>{source}</code>
          </pre>
        </TabPanel>
      </Tabs>
    </section>
  )
}
