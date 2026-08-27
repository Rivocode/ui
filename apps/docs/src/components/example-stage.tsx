import { Button, RivoProvider, Tab, TabList, TabPanel, Tabs, Tooltip, TooltipContent, TooltipTrigger } from '@rivocode/ui'
import { Check, Code2, Copy, Eye, Monitor, Smartphone, Tablet } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { anchor } from '@/anchor'
import { ExampleFrame } from '@/components/example-frame'
import { titleOf } from '@/example-source'

export { titleOf }

/* ---------------------------------------------------------------------------
 * O palco do exemplo
 *
 * Preview e codigo como duas abas, mais a chave de largura. Biblioteca de
 * componente cuja doc so mostra a largura de desktop esta documentando metade
 * dela, e esta aqui decide o comportamento de celular primeiro - esconder isso
 * enterraria justamente a parte que deu mais trabalho de pensar.
 * ------------------------------------------------------------------------- */

const VIEWPORTS = [
  { id: 'desktop', label: 'Desktop', width: null, Icon: Monitor },
  { id: 'tablet', label: 'Tablet', width: 768, Icon: Tablet },
  { id: 'mobile', label: 'Celular', width: 390, Icon: Smartphone },
] as const

type ViewportId = (typeof VIEWPORTS)[number]['id']

/* ---------------------------------------------------------------------------
 * Um controle, dois grupos
 *
 * A chave de largura e a chave preview/codigo respondem a mesma pergunta,
 * "mostra este exemplo de outro jeito", entao as duas leem como um unico
 * controle segmentado. Antes, uma era uma fileira de icones dentro de caixa e a
 * outra uma faixa de abas sublinhadas, e duas formas lado a lado faziam o
 * cabecalho parecer dois recursos costurados.
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
 * A largura em que uma historia de keep-open desenha enquanto a chave diz
 * desktop.
 *
 * Ela bate com a coluna da doc, entao a moldura le como se fosse inline; o que
 * importa e a janela, e nao o tamanho: dentro do iframe a cortina de um dialog
 * acaba no cartao, em vez de abrir por cima da documentacao. No celular a
 * coluna e mais estreita que isto, e a moldura acompanha a coluna (`fit`) em
 * vez de encolher um retrato de 720px para metade.
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
  /** Historia aberta de proposito desenha no iframe em qualquer largura. */
  keepOpen?: boolean
}) {
  const [viewport, setViewport] = useState<ViewportId>('desktop')
  const picked = VIEWPORTS.find((option) => option.id === viewport)?.width ?? null
  const width = picked ?? (keepOpen ? KEEP_OPEN_WIDTH : null)

  // Medida no instante da troca, para a moldura que substitui o exemplo inline
  // comecar na altura que a pessoa ja estava olhando, em vez de desabar para um
  // chute e voltar.
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
          <h2 id={anchor(name)} className="pl-1 font-sans text-sm font-medium text-fg">
            {title ?? titleOf(name)}
          </h2>

          {/* O `flex-wrap` aqui e o do `header` sao dois: o de fora quebra
              entre o titulo e o grupo, e o de dentro quebra DENTRO do grupo.
              Sem este, o grupo era um item de flex unico de 334px que nao
              encolhe - o `w-8` de cada icone de largura e a palavra de cada aba
              travam o minimo -, entao a 320px ele transbordava 86px e o
              `overflow-hidden` da secao comia o botao de copiar inteiro: 75px
              fora do cartao, e `elementFromPoint` no centro dele nao devolvia o
              botao. Nao custa altura onde a fileira ja cabe: de 414px para
              cima o DOM sai igual ao de antes. */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ViewportSwitch value={viewport} onChange={switchViewport} />

            {/* Icone e palavra juntos: o olho sozinho e adivinhacao, e a
                palavra sozinha e mais uma coisa para ler numa pagina cheia de
                exemplos. */}
            {/* As abas e o copiar num grupo so, para a quebra cair sempre entre
                a chave de largura e eles, e nunca no meio deles: a 390px o
                copiar sozinho descia para uma terceira linha vazia, longe do
                "Codigo" que e o que ele copia. O `gap-2` repetido e o mesmo do
                pai, entao onde a fileira cabe inteira o espacamento sai igual
                ao de antes. */}
            <div className="flex items-center gap-2">
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
          </div>
        </header>

        <TabPanel value="preview" className="p-0">
          {/* `safe` porque o par centro + overflow corta o comeco: um exemplo
              mais largo que a coluna ficava com a borda esquerda inalcancavel,
              decapitando a primeira coluna da tabela no celular. */}
          <div ref={preview} className="flex justify-center-safe overflow-x-auto bg-bg/40 p-4">
            {width ? (
              <ExampleFrame
                width={width}
                fit={picked === null}
                initialHeight={heldHeight.current}
                minHeight={keepOpen ? KEEP_OPEN_MIN_HEIGHT : undefined}
              >
                <Example />
              </ExampleFrame>
            ) : (
              // A largura tem que estar resolvida ANTES do provider, e nao
              // dentro dele: como item de flex, a caixa do proprio provider e
              // shrink-to-fit, entao um `w-full` embaixo dele resolvia contra
              // uma largura que dependia do conteudo, e um grafico pedindo 100%
              // disso desabava para uma tirinha.
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
          <pre className="overflow-x-auto bg-bg p-4 font-mono text-xs leading-relaxed text-fg">
            <code>{source}</code>
          </pre>
        </TabPanel>
      </Tabs>
    </section>
  )
}
