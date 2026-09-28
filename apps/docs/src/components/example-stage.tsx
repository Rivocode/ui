import {
  IconButton,
  RivoProvider,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@rivocode/ui'
import { Check, Code2, Copy, Eye, Monitor, Smartphone, Tablet } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { anchor } from '@/anchor'
import { ExampleFrame } from '@/components/example-frame'
import { titleOf } from '@/example-source'

export { titleOf }

/* ---------------------------------------------------------------------------
 * The example stage
 *
 * Preview and code as two tabs, plus the width switch. A component library
 * whose docs only show the desktop width is documenting half of itself, and
 * this one decides mobile behavior first - hiding that would bury exactly the
 * part that took the most thinking.
 * ------------------------------------------------------------------------- */

const VIEWPORTS = [
  { id: 'desktop', label: 'Desktop', width: null, Icon: Monitor },
  { id: 'tablet', label: 'Tablet', width: 768, Icon: Tablet },
  { id: 'mobile', label: 'Mobile', width: 390, Icon: Smartphone },
] as const

type ViewportId = (typeof VIEWPORTS)[number]['id']

/* ---------------------------------------------------------------------------
 * One control, two groups
 *
 * The width switch and the preview/code switch answer the same question,
 * "show this example another way", so both read as a single segmented
 * control. Before, one was a row of icons inside a box and the other a strip
 * of underlined tabs, and two shapes side by side made the header look like
 * two features stitched together.
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
          <IconButton
            size="sm"
            variant="ghost"
            label={copied ? 'Code copied' : 'Copy code'}
            onClick={() => {
              navigator.clipboard.writeText(text).then(() => setCopied(true))
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </IconButton>
        }
      />
      <TooltipContent>{copied ? 'Copied' : 'Copy code'}</TooltipContent>
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
                aria-label={`View on ${label.toLowerCase()}`}
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
 * The width a keep-open story draws at while the switch says desktop.
 *
 * It matches the doc column, so the frame reads as if it were inline; what
 * matters is the window, not the size: inside the iframe a dialog's backdrop
 * ends at the card, instead of opening over the documentation. On mobile the
 * column is narrower than this, and the frame follows the column (`fit`)
 * instead of shrinking a 720px snapshot to half.
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
  /** A story that is open on purpose draws in the iframe at any width. */
  keepOpen?: boolean
}) {
  const [viewport, setViewport] = useState<ViewportId>('desktop')
  const picked = VIEWPORTS.find((option) => option.id === viewport)?.width ?? null
  const width = picked ?? (keepOpen ? KEEP_OPEN_WIDTH : null)

  // Measured at the moment of the switch, so the frame that replaces the
  // inline example starts at the height the person was already looking at,
  // instead of collapsing to a guess and coming back.
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
          {/* `h2` and not `h3`: each example is a section of the page, and it
              came right after the component's `h1`, skipping a level on all
              66 pages. Semantic level and visual size are different things,
              so the appearance does not change. */}
          <h2 id={anchor(name)} className="pl-1 font-sans text-sm font-medium text-fg">
            {title ?? titleOf(name)}
          </h2>

          {/* The `flex-wrap` here and the `header`'s are two: the outer one
              wraps between the title and the group, and the inner one wraps
              INSIDE the group. Without this, the group was a single 334px flex
              item that does not shrink - the `w-8` of each width icon and the
              word of each tab lock the minimum -, so at 320px it overflowed by
              86px and the section's `overflow-hidden` ate the whole copy
              button: 75px outside the card, and `elementFromPoint` at its
              center did not return the button. It costs no height where the
              row already fits: from 414px up the DOM comes out the same as
              before. */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ViewportSwitch value={viewport} onChange={switchViewport} />

            {/* Icon and word together: the eye alone is guesswork, and the
                word alone is one more thing to read on a page full of
                examples. */}
            {/* The tabs and the copy button in a single group, so the wrap
                always falls between the width switch and them, never in the
                middle of them: at 390px the copy button alone dropped to an
                empty third line, far from the "Code" it copies. The repeated
                `gap-2` is the same as the parent's, so where the row fits
                whole the spacing comes out as before. */}
            <div className="flex items-center gap-2">
              <TabList variant="segmented">
                <Tab value="preview">
                  <Eye size={14} aria-hidden="true" />
                  Preview
                </Tab>
                <Tab value="code" disabled={!source}>
                  <Code2 size={14} aria-hidden="true" />
                  Code
                </Tab>
              </TabList>

              {source && <CopyButton text={source} />}
            </div>
          </div>
        </header>

        <TabPanel value="preview" className="p-0">
          {/* `safe` because center + overflow together cut off the start: an
              example wider than the column had an unreachable left edge,
              beheading the table's first column on mobile. */}
          <div ref={preview} className="flex justify-center-safe overflow-x-auto bg-bg/40 p-4">
            {width ? (
              <ExampleFrame
                title={`Example ${title ?? titleOf(name)}, at ${width}px wide`}
                width={width}
                fit={picked === null}
                initialHeight={heldHeight.current}
                minHeight={keepOpen ? KEEP_OPEN_MIN_HEIGHT : undefined}
              >
                <Example />
              </ExampleFrame>
            ) : (
              // The width has to be resolved BEFORE the provider, not inside
              // it: as a flex item, the provider's own box is shrink-to-fit, so
              // a `w-full` under it resolved against a width that depended on
              // the content, and a chart asking for 100% of that collapsed
              // into a sliver.
              <div className="w-full">
                <RivoProvider scope="local" theme="rivocode-dark">
                  <div className="flex min-h-32 w-full items-center justify-center-safe overflow-x-auto rounded-md p-6">
                    <Example />
                  </div>
                </RivoProvider>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value="code" className="p-0">
          <pre className="overflow-x-auto bg-bg p-4 font-mono text-xs leading-relaxed text-fg max-sm:whitespace-pre-wrap max-sm:wrap-anywhere">
            <code>{source}</code>
          </pre>
        </TabPanel>
      </Tabs>
    </section>
  )
}
