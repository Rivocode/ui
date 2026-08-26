import { Button, Input, RivoProvider, Sheet, SheetContent, SheetTrigger } from '@rivocode/ui'
import { BookOpen, Bot, LayoutGrid, Menu, Search } from 'lucide-react'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { ENTRIES, FAMILIES, entriesOfFamily } from '@/catalog'
import { GUIDES } from '@/guides'
import { Logo } from '@/components/logo'
import { Home } from '@/pages/home'
import { linkTo, useRoute, type Route } from '@/routes'
import { PageBoundary } from '@/components/boundary'
import { Toc } from '@/components/toc'
import { revealWithin } from '@/reveal'

/*
 * Uma rota, um chunk.
 *
 * A capa fica junto da casca porque e onde quase todo mundo chega. As outras
 * cinco arrastavam para o chunk de entrada tudo que elas montam - a galeria de
 * icones, o Recharts da fundacao, a tela inteira da demonstracao - e nada disso
 * aparece na capa. Enquanto elas eram import estatico, a Vite ainda escrevia um
 * `modulepreload` para cada dependencia delas no `index.html`: oitenta linhas
 * de preload disputando banda com o que a primeira tela precisava.
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

/**
 * O lugar da pagina enquanto os pedacos dela chegam.
 *
 * Uma janela inteira de altura, e nao meia: o rodape tem que ficar FORA da
 * tela ate a pagina existir. Aparecendo antes, ele desce quando o conteudo
 * chega, e essa descida e layout shift - a metrica que a categoria de
 * navegacao agentica do Lighthouse cobra junto com a arvore de acessibilidade.
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
      {/* A marca e item de flex proprio para poder encolher com reticencia em
          vez de sair cortada no meio de uma letra. */}
      <span className="truncate">RIVOCODE</span>
      {/* O sufixo e a primeira coisa a sair no celular: em 320px a linha do
          cabecalho ficava 23px mais larga que a janela, e largar isto e o jeito
          mais barato de pagar parte disso - o nome sozinho ainda identifica o
          site. */}
      <span className="hidden font-mono text-xs font-normal text-fg-subtle sm:inline">/ui</span>
    </a>
  )
}

/** A lista de pecas, com filtro. Serve a barra lateral e a folha do celular. */
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
   * Quem chega por um link de componente cai numa lista de sessenta e seis
   * nomes rolada no topo, com o nome que ele esta lendo fora da tela. Nada
   * dizia onde ele estava na familia, nem que a lista continuava para baixo.
   *
   * So na troca de pagina: rolar a lista enquanto a pessoa filtra tiraria a
   * mao dela do gesto.
   */
  const here = route.kind + ('slug' in route ? `:${route.slug}` : '')
  useEffect(() => {
    const current = list.current?.querySelector<HTMLElement>('[aria-current="page"]')
    // A folga maior que a padrao e o titulo da familia, que fica grudado no
    // topo da lista e cobriria a linha se ela parasse debaixo dele.
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
   * A linha, uma vez so.
   *
   * Todo grupo pende de um mesmo fio vertical, e a linha ativa troca o pedaco
   * dela desse fio pelo acento. E o que carrega o "voce esta aqui" por uma
   * lista de sessenta e seis nomes: uma pilula preenchida sozinha le como hover
   * na segunda olhada, e hover e justamente a unica coisa com que ela nao pode
   * ser confundida.
   */
  const rowClass = (active: boolean) =>
    [
      'relative block rounded-r-md py-1.5 pr-3 pl-4 text-sm',
      'transition-[color,background-color] duration-[var(--rc-duration-fast)] ease-rc',
      // O pedaco de fio que esta linha possui. Transparente por padrao, para a
      // linha do proprio grupo aparecer e a lista ler como uma coluna so.
      'before:absolute before:inset-y-0 before:-left-px before:w-px before:transition-colors',
      active
        ? 'bg-accent-subtle text-accent-text before:bg-accent before:w-0.5'
        : 'text-fg-muted before:bg-transparent hover:bg-surface/70 hover:text-fg',
    ].join(' ')

  /* Grudado, para a familia a que um nome pertence continuar na tela depois de
   * a rolagem passar do titulo dela. */
  const headingClass =
    'sticky top-0 z-[1] -mx-1 bg-bg px-4 pt-2 pb-2 font-mono text-[0.68rem] font-medium tracking-[0.14em] text-fg-subtle uppercase'

  return (
    /* Landmark com nome: a pagina tem dois navs, e o sem nome era este, o maior
       dos dois. Numa lista de landmarks, "navigation" ao lado de "navigation,
       Nesta pagina" deixava anonimo justamente o errado. */
    <nav aria-label="Peças e guias" className="flex h-full flex-col gap-4">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Buscar entre ${ENTRIES.length} peças`}
          aria-label="Buscar peça"
          className="border-transparent bg-surface pl-8 focus-visible:border-border"
        />
      </div>

      <div ref={list} className="rc-scroll min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="mb-6">
          <h2 className={headingClass}>Começar</h2>
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
                Convenções
              </a>
            </li>
          </ul>
        </div>

        {found === 0 && (
          <p className="px-3 py-6 text-sm text-fg-subtle">Nada com esse nome no catálogo.</p>
        )}

        {(() => {
          const link = linkTo({ kind: 'catalog' }, navigate)
          return (
            <a
              href={link.href}
              onClick={(event) => {
                link.onClick(event)
                onNavigate?.()
              }}
              aria-current={route.kind === 'catalog' ? 'page' : undefined}
              className={`${rowClass(route.kind === 'catalog')} mb-4 block border-l border-border`}
            >
              Todas as peças, numa tela
            </a>
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
  // As duas usam a janela inteira: 256px de lista de nomes ao lado de uma
  // pagina que ja e uma lista de nomes nao compra nada.
  const fullWidth = route.kind === 'home' || route.kind === 'demo'

  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <div className="min-h-dvh">
        {/* A barra lateral repete uns 90 links em cada pagina, entao o primeiro
            controle de um exemplo ficava na parada de tab numero 105. Leitor de
            tela pula isso por landmark; quem dirige so pelo teclado nao tinha
            saida. Primeiro elemento focavel da pagina, e ele tem que APARECER
            ao receber foco - `sr-only` sozinho o deixaria invisivel embaixo do
            cursor, o que e pior que nao ter. */}
        <a
          href="#conteudo"
          className="sr-only rounded-md focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--rc-z-sticky)] focus:m-0 focus:h-auto focus:w-auto focus:overflow-visible focus:border focus:border-accent focus:bg-surface-raised focus:px-3 focus:py-2 focus:font-sans focus:text-sm focus:whitespace-nowrap focus:text-fg focus:shadow-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Pular para o conteúdo
        </a>

        <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
          {/* O `min-w-0` no bloco da esquerda e o que impede a linha de vazar em
              320px: item de flex nasce com `min-width: auto`, entao o botao da
              gaveta mais a marca se recusavam a encolher e empurravam as
              fichas 23px para fora da janela em toda rota - WCAG 1.4.10. As
              fichas ficam com `shrink-0` para o aperto cair na marca, que tem
              reticencia, e nao nos tres alvos.

              As folgas e o padding menores abaixo de `sm` sao o que impedem
              essa reticencia de aparecer: sem eles a marca cabia com folga zero
              e virava "RIVOCO..." dependendo de quando a fonte de display
              terminava de carregar. As fichas continuam bem acima dos 24x24 da
              WCAG 2.5.8. */}
          <div className="flex h-14 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {/* No celular a barra lateral vira gaveta: 256px de menu fixo
                  dentro de 390px de tela nao deixam pagina para ler. */}
              {!fullWidth && (
                <Sheet side="left">
                  <SheetTrigger
                    render={
                      <Button
                        size="iconSm"
                        variant="ghost"
                        aria-label="Abrir o menu"
                        className="lg:hidden"
                      />
                    }
                  >
                    <Menu size={16} />
                  </SheetTrigger>
                  <SheetContent className="w-72 p-4 lg:hidden">
                    <Nav route={route} navigate={navigate} />
                  </SheetContent>
                </Sheet>
              )}
              <Brand navigate={navigate} />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* A documentacao precisa de uma porta propria em toda pagina, e
                  ela abre onde alguem de fato comeca: a instalacao. Dali a
                  barra lateral leva a pessoa a qualquer peca. */}
              {/* O rotulo repete o texto que so aparece a partir de `sm`: abaixo
                  disso o link ficava com um icone e nada mais, e link sem nome
                  acessivel e link que agente e leitor de tela nao sabem para
                  onde vai. Sao as mesmas palavras da tela de proposito - nome
                  que difere do visivel quebra o comando de voz (WCAG 2.5.3). */}
              <a
                aria-label="documentação"
                {...linkTo({ kind: 'guide', slug: 'instalacao' }, navigate)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 sm:px-2.5 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${
                  route.kind === 'guide' || route.kind === 'component' || route.kind === 'foundation'
                    ? 'border-accent text-fg'
                    : 'border-border text-fg-subtle'
                }`}
              >
                <BookOpen size={13} />
                <span className="hidden sm:inline">documentação</span>
              </a>

              <a
                aria-label="demonstração"
                {...linkTo({ kind: 'demo' }, navigate)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 sm:px-2.5 font-mono text-xs transition-colors hover:border-accent hover:text-fg ${
                  route.kind === 'demo'
                    ? 'border-accent text-fg'
                    : 'border-border text-fg-subtle'
                }`}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">demonstração</span>
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
          /* O `tabIndex={-1}` nao e enfeite: sem ele o Chrome e o Safari so
             rolam, deixando o cursor no link de pular, e o Tab seguinte volta
             direto para o cabecalho. */
          <main id="conteudo" tabIndex={-1} className="outline-none">
            {route.kind === 'home' ? (
              <Home navigate={navigate} />
            ) : (
              <PageBoundary>
                <Suspense fallback={<PageFallback />}>
                  <DemoPage />
                </Suspense>
              </PageBoundary>
            )}
          </main>
        ) : (
          /* A barra lateral encosta na borda da janela, como o cabecalho acima
             dela. Centrar a casca inteira deixava um vao a esquerda e punha o
             divisor no meio da tela, o que lia como defeito. */
          <div className="flex w-full">
            <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-border py-4 pr-2 pl-4 lg:block xl:w-72 xl:pl-6">
              <Nav route={route} navigate={navigate} />
            </aside>

            <div className="flex min-w-0 flex-1 justify-center">
              <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 outline-none xl:max-w-3xl">
                {/* A `key` reseta a fronteira na troca de pagina: sem ela, uma
                    falha deixaria a mensagem no lugar de toda peca aberta
                    depois, e so recarregar tiraria. */}
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

        {/* O rodape da documentacao nao entra na demonstracao: ali a tela e o
            sistema, e um rodape de site embaixo dele quebra a ilusao que a
            pagina inteira existe para sustentar. */}
        {route.kind !== 'demo' && (
        <footer className="border-t border-border px-6 py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-xl text-sm text-fg-subtle">
              @rivocode/ui, {ENTRIES.length} peças no catálogo. Esta página é gerada dos mesmos
              arquivos que alimentam o design system, então ela não envelhece sozinha.
            </p>

            {/* O credito fica no rodape de todas as paginas, e nao so na capa:
                quem chega por um link de componente nunca passa pela capa, e e
                justamente essa pessoa que vai querer saber de quem e a
                biblioteca antes de instalar. */}
            <div className="text-sm text-fg-subtle sm:text-right">
              <p>
                Feito por{' '}
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
