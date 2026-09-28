import { FileCode2 } from 'lucide-react'
import conventions from '../../../../.design-sync/conventions.md?raw'
import { Markdown } from '@/components/markdown'

/**
 * The library's usage contract.
 *
 * The same file that ships inside the design bundle and that the agent reads
 * before writing any screen. A second text on the same subject would go stale
 * at the first token change.
 */
export function FoundationPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl text-fg">How to build</h1>
        <p className="mt-3 text-fg-muted">
          The library contract: the Provider, the class vocabulary and the rules that apply to
          every piece.
        </p>

        <a
          href="/convencoes.md"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-xs text-fg-subtle transition-colors hover:border-accent hover:text-fg"
        >
          <FileCode2 size={13} />
          /convencoes.md
        </a>
      </header>

      <Markdown source={conventions} />
    </article>
  )
}
