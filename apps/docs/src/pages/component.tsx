import { Badge, EmptyState } from '@rivocode/ui'
import { FileCode2, FileText } from 'lucide-react'
import { Examples } from '@/components/examples'
import { Markdown } from '@/components/markdown'
import { PropsTable } from '@/components/props-table'
import { findEntry, importPathOf, type Entry } from '@/catalog'
import { anchor } from '@/anchor'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      {/* The id is what the right rail links to, and what a pasted address
          lands on. */}
      <h2 id={anchor(title)} className="font-display text-xl text-fg">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * Os exemplos que a página mostra: os seus, e os das partes que a compõem.
 *
 * Uma parte não tem página própria — o endereço dela leva a quem a monta — e
 * até aqui o preview dela não era mostrado em lugar nenhum. `Radio` é o caso
 * extremo: `RadioGroup` não tem preview seu, então a página abria sem um único
 * exemplo, com dois escritos e mantidos em `Radio.tsx` que ninguém via.
 */
function examplesOf(entry: Entry) {
  return [entry, ...(entry.parts ?? [])].filter((item) => item.loadExamples)
}

export function ComponentPage({ slug }: { slug: string }) {
  const entry = findEntry(slug)

  if (!entry) {
    return (
      <div className="py-20">
        <EmptyState
          icon={<FileText size={20} />}
          title={`Não existe peça em "${slug}"`}
          description="Confira o nome na lista lateral. Ele diferencia maiúscula de minúscula do jeito que o import usa."
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
          <span className="text-fg-subtle">
            markdown cru, para quem lê com agent em vez de olho
          </span>
        </div>
      </header>

      {shown.length > 0 && (
        <section className="mb-10 space-y-4">
          {shown.map((item) => (
            <Examples key={item.name} load={item.loadExamples!} source={item.exampleSource} />
          ))}
        </section>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-4 py-2.5 font-mono text-xs tracking-wide text-fg-subtle uppercase">
          Importar
        </header>
        <pre className="overflow-x-auto p-4 font-mono text-sm text-fg">
          <code>{`import { ${entry.name} } from '${importPathOf(entry.name)}'`}</code>
        </pre>
      </div>

      <Section title="Quando usar">
        <Markdown source={entry.body} />
      </Section>

      <Section title="API">
        <PropsTable component={entry.name} />
      </Section>

      {entry.parts && entry.parts.length > 0 && (
        <Section title="Partes">
          <p className="mb-4 text-fg-muted">
            {entry.name} se monta com estas peças. Todas vivem nesta página, porque separar cada uma
            num endereço obrigaria a abrir seis abas para montar uma tela.
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

                {part.body && (
                  <div className="mb-3">
                    {/* A parte é convidada nesta página: os títulos dela
                        assinam com o nome dela e descem para dentro do `h3`
                        acima. Sem isso, o `## No React Native` do ButtonGroup
                        disputava o endereço `#no-react-native` com o do
                        Button, e o índice da direita, que identifica cada
                        linha pelo id, parava de se reconciliar. */}
                    <Markdown source={part.body} idPrefix={anchor(part.name)} headingOffset={2} />
                  </div>
                )}

                <PropsTable component={part.name} compact />
              </div>
            ))}
          </div>
        </Section>
      )}

      {shown.length === 0 && (
        /*
         * A parte nao chega mais aqui: o endereco dela leva a pagina de quem a
         * monta, e la ela aparece inteira. Entao esta mensagem parou de ser
         * "voce esta no lugar errado" e virou o que sempre deveria ser - a
         * lacuna, dita em voz alta, na pagina de quem a tem.
         */
        <p className="mt-8 rounded-md border border-border bg-surface p-4 text-sm text-fg-subtle">
          Esta peça ainda não tem exemplo que roda — a prosa e a tabela de props abaixo são o que
          existe hoje. É uma lacuna nossa, e não uma característica dela.
        </p>
      )}
    </article>
  )
}
