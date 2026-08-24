import { Button, EmptyState, RivoProvider } from '@rivocode/ui'
import { FileCode2, FileText } from 'lucide-react'
import { useState } from 'react'
import { Markdown } from '@/components/markdown'
import { findGuide } from '@/guides'
import { ThemePlayground } from '@/components/theme-playground'

/**
 * A prose page. Two of them carry a live demo below the text, because reading
 * about density is not the same as seeing the same screen in both.
 */
export function GuidePage({ slug }: { slug: string }) {
  const guide = findGuide(slug)

  if (!guide) {
    return (
      <div className="py-20">
        <EmptyState
          icon={<FileText size={20} />}
          title="Essa página não existe"
          description="Confira o endereço, ou volte pela lista lateral."
        />
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl text-fg">{guide.title}</h1>
        <p className="mt-3 text-lg text-fg-muted">{guide.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <a
            href={`/${guide.slug}.md`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-xs text-fg-subtle transition-colors hover:border-accent hover:text-fg"
          >
            <FileCode2 size={13} />/{guide.slug}.md
          </a>
          <span className="text-fg-subtle">
            markdown cru, para quem lê com agent em vez de olho
          </span>
        </div>
      </header>

      <Markdown source={guide.body} />

      {slug === 'temas' && <ThemePlayground />}
      {slug === 'densidade' && <DensityDemo />}
    </article>
  )
}

/** The same form at both densities, side by side. */
function DensityDemo() {
  const [compact, setCompact] = useState(false)

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl text-fg">Ver a diferença</h2>
      <p className="mt-2 text-fg-muted">A mesma tela, nas duas alturas.</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
          <Button
            size="sm"
            variant={compact ? 'ghost' : 'secondary'}
            onClick={() => setCompact(false)}
          >
            comfortable
          </Button>
          <Button
            size="sm"
            variant={compact ? 'secondary' : 'ghost'}
            onClick={() => setCompact(true)}
          >
            compact
          </Button>
        </div>

        <RivoProvider scope="local" theme="rivocode-dark" density={compact ? 'compact' : 'comfortable'}>
          <div className="space-y-3 p-6">
            <Button>Emitir nota</Button>
            <Button variant="outline">Cancelar</Button>
            <div className="flex gap-2">
              <Button size="sm">Pequeno</Button>
              <Button size="md">Medio</Button>
              <Button size="lg">Grande</Button>
            </div>
          </div>
        </RivoProvider>
      </div>
    </section>
  )
}
