import { Badge, Button, Clipboard, Tab, TabList, TabPanel, Tabs, useMobile } from '@rivocode/ui'
import { Code2, Eye, FileText, Monitor, Smartphone } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { BLOCK_LIST, type BlockEntry } from '@/block-list'
import { ExampleFrame } from '@/components/example-frame'
import { linkTo, type Route } from '@/routes'
import { slugify } from '@/slug'

/* ---------------------------------------------------------------------------
 * Os blocos de pagina
 *
 * Telas inteiras, e nao pecas soltas. Cada uma e um arquivo so em `blocks/`,
 * que importa somente dos tres caminhos da biblioteca, do zod, do lucide e do
 * React - `test/blocos-de-pagina.test.tsx` cobra isso -, entao o que a pessoa
 * copia daqui cola num projeto e compila.
 *
 * O preview e SEMPRE uma moldura, inclusive no desktop. Um bloco e uma pagina:
 * ele tem o proprio `h1`, e decide o layout pela largura da JANELA. Dentro da
 * coluna do site ele teria a janela do site e um segundo `h1` na mesma arvore;
 * no iframe ele tem janela e documento proprios, e o desktop de 1440 encolhe
 * para caber, como a barra de dispositivo do navegador faz.
 * ------------------------------------------------------------------------- */

const MODULES = import.meta.glob('../blocks/*.tsx', { eager: true, import: 'default' }) as Record<
  string,
  ComponentType
>

const SOURCES = import.meta.glob('../blocks/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const VIEWPORTS = [
  { id: 'desktop', label: 'Desktop', width: 1440, Icon: Monitor },
  { id: 'mobile', label: 'Celular', width: 390, Icon: Smartphone },
] as const

type ViewportId = (typeof VIEWPORTS)[number]['id']

function BlockStage({ block }: { block: BlockEntry }) {
  const Block = MODULES[`../blocks/${block.file}.tsx`]
  const source = SOURCES[`../blocks/${block.file}.tsx`] ?? ''
  // No celular a moldura abre na largura de celular: o desktop de 1440 caberia
  // em 350px de coluna so como miniatura ilegivel. A escolha da pessoa vence.
  const isMobile = useMobile()
  const [picked, setViewport] = useState<ViewportId | null>(null)
  const viewport = picked ?? (isMobile ? 'mobile' : 'desktop')
  const width = VIEWPORTS.find((option) => option.id === viewport)!.width

  return (
    <section
      id={block.slug}
      aria-labelledby={`${block.slug}-titulo`}
      className="scroll-mt-20 overflow-hidden rounded-lg border border-border bg-surface"
    >
      <Tabs defaultValue="preview">
        <header className="space-y-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-2xl space-y-1">
              <h2 id={`${block.slug}-titulo`} className="font-display text-lg text-fg">
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
                  Código
                </Tab>
              </TabList>

              <Clipboard value={source} labels={{ copy: `Copiar o código do bloco ${block.title}`, copied: 'Código copiado' }} />
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
              <ExampleFrame width={width} initialHeight={480}>
                <Block />
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
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl space-y-3">
        <p className="font-mono text-xs tracking-[0.14em] text-fg-subtle uppercase">Blocos</p>
        <h1 className="font-display text-3xl text-fg sm:text-4xl">Blocos de página</h1>
        <p className="text-base text-fg-muted">
          Telas inteiras, prontas para copiar: {BLOCK_LIST.length} arquivos montados só com peças
          do @rivocode/ui e as regras da skill. Cada um importa apenas da biblioteca, do{' '}
          <code className="font-mono">zod</code> e do <code className="font-mono">lucide-react</code>,
          e traz os finais que a tela precisa: dados, carregando, erro e vazio.
        </p>
        <p className="text-sm text-fg-subtle">
          Para agents, cada bloco tem o seu <code className="font-mono">.md</code>, e todos estão no{' '}
          <a href="/llms.txt" className="text-accent-text underline underline-offset-4">
            /llms.txt
          </a>
          . Para vestir com a marca de um cliente, use o{' '}
          <a
            {...linkTo({ kind: 'theme' }, navigate)}
            className="text-accent-text underline underline-offset-4"
          >
            montador de tema
          </a>
          .
        </p>
        <nav aria-label="Blocos" className="flex flex-wrap gap-2 pt-1">
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

      <div className="mt-10 space-y-10">
        {BLOCK_LIST.map((block) => (
          <BlockStage key={block.slug} block={block} />
        ))}
      </div>

      <p className="mt-10 max-w-3xl text-sm text-fg-subtle">
        As peças de cada bloco têm a própria página, com a tabela de props:{' '}
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
