import { Badge, EmptyState } from '@rivocode/ui'
import { FileCode2, FileText } from 'lucide-react'
import { CopyMarkdown } from '@/components/copy-markdown'
import { Examples } from '@/components/examples'
import { Markdown } from '@/components/markdown'
import { PropsTable } from '@/components/props-table'
import { findEntry, importPathOf, type Entry } from '@/catalog'
import { anchor } from '@/anchor'
import { use } from 'react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      {/* The id is where the right column points, and where a pasted address
          lands. */}
      <h2 id={anchor(title)} className="font-display text-xl text-fg">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * The examples the page shows: its own, and those of the parts that compose it.
 *
 * A part has no page of its own (its address leads to whoever assembles it),
 * and until now its preview was shown nowhere. `Radio` is the extreme case:
 * `RadioGroup` has no preview of its own, so the page opened without a single
 * example, with two written and maintained in `Radio.tsx` that nobody saw.
 */
function examplesOf(entry: Entry) {
  return [entry, ...(entry.parts ?? [])].filter((item) => item.loadExamples)
}

/**
 * The piece's prose.
 *
 * The doc bodies left the entry chunk, so each one is a separate request - and
 * it SUSPENDS the whole page, instead of reserving a spot and filling it
 * later. A skeleton that turns into text of another height pushes everything
 * below it: the piece page scored 0.44 CLS that way, and the good threshold is
 * 0.1. By suspending, the page appears once, already at its final size.
 */
function Body({
  entry,
  idPrefix,
  headingOffset,
}: {
  entry: Entry
  idPrefix?: string
  headingOffset?: number
}) {
  const body = use(entry.loadBody())

  if (!body.trim()) return null

  return <Markdown source={body} idPrefix={idPrefix} headingOffset={headingOffset} />
}

export function ComponentPage({ slug }: { slug: string }) {
  const entry = findEntry(slug)

  if (!entry) {
    return (
      <div className="py-20">
        <EmptyState
          icon={<FileText size={20} />}
          title={`There is no piece at "${slug}"`}
          description="Check the name in the sidebar. It is case-sensitive, the same way the import is."
        />
      </div>
    )
  }

  const shown = examplesOf(entry)

  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <Badge tone="accent">{entry.family}</Badge>
        <h1 className="mt-4 font-display text-4xl break-words text-fg">{entry.name}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <a
            href={`/componentes/${entry.slug}.md`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-xs text-fg-subtle transition-colors hover:border-accent hover:text-fg"
          >
            <FileCode2 size={13} />/componentes/{entry.slug}.md
          </a>
          <CopyMarkdown href={`/componentes/${entry.slug}.md`} />
          <span className="text-fg-subtle">
            raw markdown, for whoever reads with an agent instead of eyes
          </span>
        </div>
      </header>

      {shown.length > 0 && (
        <section className="mb-10 space-y-4">
          {shown.map((item) => (
            <Examples key={item.name} load={item.loadExamples!} loadSource={item.loadSource} />
          ))}
        </section>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-4 py-2.5 font-mono text-xs tracking-wide text-fg-subtle uppercase">
          Import
        </header>
        <pre className="overflow-x-auto p-4 font-mono text-sm text-fg">
          <code>{`import { ${entry.name} } from '${importPathOf(entry.name)}'`}</code>
        </pre>
      </div>

      <Section title="When to use">
        <Body entry={entry} />
      </Section>

      <Section title="API">
        <PropsTable component={entry.name} />
      </Section>

      {/* "The parts", and not "Parts": several docs write their own `## Parts`,
          and the two would compete for the same `#parts` id on the page. */}
      {entry.parts && entry.parts.length > 0 && (
        <Section title="The parts">
          <p className="mb-4 text-fg-muted">
            {entry.name} is assembled with these pieces. They all live on this page, because giving
            each one its own address would mean opening six tabs to build one screen.
          </p>

          <div className="space-y-8">
            {entry.parts.map((part) => (
              <div key={part.name} className="border-l-2 border-border pl-4">
                <div className="mb-2 flex flex-wrap items-baseline gap-3">
                  <h3 id={anchor(part.name)} className="font-mono text-base text-fg">
                    {part.name}
                  </h3>
                  <a
                    href={`/componentes/${part.slug}.md`}
                    className="font-mono text-xs text-fg-subtle underline underline-offset-2 hover:text-fg"
                  >
                    /{part.slug}.md
                  </a>
                </div>

                <div className="mb-3">
                  {/* The part is a guest on this page: its headings sign
                      with its name and go down inside the `h3` above.
                      Without that, ButtonGroup's `## In React Native`
                      competed for the `#in-react-native` address with
                      Button's, and the right-hand table of contents, which
                      keys each row by id, stopped reconciling. */}
                  <Body entry={part} idPrefix={anchor(part.name)} headingOffset={2} />
                </div>

                <PropsTable component={part.name} compact />
              </div>
            ))}
          </div>
        </Section>
      )}

      {shown.length === 0 && (
        /*
         * A part no longer lands here: its address leads to the page of whoever
         * assembles it, and there it appears whole. So this message stopped
         * being "you are in the wrong place" and became what it always should
         * have been - the gap, said out loud, on the page of whoever has it.
         */
        <p className="mt-8 rounded-md border border-border bg-surface p-4 text-sm text-fg-subtle">
          This piece does not have a running example yet: the prose and the props table below are
          what exists today. It is a gap on our side, not a feature of the piece.
        </p>
      )}
    </article>
  )
}
