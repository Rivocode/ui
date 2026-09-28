import { FileCode2 } from 'lucide-react'
import conventions from '../../../../.design-sync/conventions.md?raw'
import { Markdown } from '@/components/markdown'

/**
 * O contrato de uso da biblioteca.
 *
 * O mesmo arquivo que sai dentro do bundle de design e que o agente le antes de
 * escrever qualquer tela. Um segundo texto sobre o mesmo assunto envelheceria
 * na primeira troca de token.
 */
export function FoundationPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl text-fg">Como construir</h1>
        <p className="mt-3 text-fg-muted">
          O contrato da biblioteca: o Provider, o vocabulário de classes e as regras que valem para
          toda peça.
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
