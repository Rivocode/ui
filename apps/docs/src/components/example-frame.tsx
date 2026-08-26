import { RivoProvider } from '@rivocode/ui'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* ---------------------------------------------------------------------------
 * Uma janela estreita de verdade
 *
 * Encolher uma `<div>` nao prova nada. Toda classe responsiva desta biblioteca
 * se decide pela JANELA: o `max-sm:` da folha que ancora embaixo, o
 * `hideOnMobile` de uma coluna de tabela, o calendario decidindo quantos meses
 * cabem. Uma caixa de 390px dentro de uma janela de 1440 nao dispara nenhuma
 * delas, entao a chave de celular mostrava um desktop espremido e a de tablet
 * nao mostrava nada, porque a coluna da pagina ja era mais estreita que 768.
 *
 * Um iframe tem janela propria, entao as queries respondem de verdade. Custa um
 * documento por exemplo, e por isso ele so e montado quando a pessoa pede uma
 * largura: no desktop o exemplo desenha inline, como antes.
 * ------------------------------------------------------------------------- */

/**
 * Copia os estilos da pagina para dentro da moldura.
 *
 * Em dev o Vite injeta CSS como tags `<style>` que ele fica mutando; num build
 * e um `<link>`. Os dois sao clonados, e o observer pega as atualizacoes
 * quentes para que uma moldura aberta nao congele na folha com que nasceu.
 */
function useClonedStyles(doc: Document | null) {
  useEffect(() => {
    if (!doc) return

    const copy = () => {
      for (const old of doc.head.querySelectorAll('[data-rc-cloned]')) old.remove()
      for (const node of document.querySelectorAll('style, link[rel="stylesheet"]')) {
        const clone = node.cloneNode(true) as HTMLElement
        clone.setAttribute('data-rc-cloned', '')
        doc.head.append(clone)
      }
    }

    copy()

    const observer = new MutationObserver(copy)
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })

    return () => observer.disconnect()
  }, [doc])
}

/**
 * Cresce a moldura ate o que o exemplo la dentro acabou precisando.
 *
 * A medida e um laco, e nao uma leitura: o exemplo reage a largura da moldura,
 * e a moldura tira a altura do exemplo. Trocar para tablet desce a altura em
 * degraus (264, 216, 169) ao longo de mais de um segundo, e cada degrau e
 * pintado, entao a pessoa assiste uma caixa vazia alta desabar. Por isso o hook
 * tambem informa se o numero parou de mexer, e a moldura fica escondida ate
 * parar.
 */
function useMeasuredHeight(doc: Document | null, width: number) {
  const [height, setHeight] = useState(220)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!doc?.body) return
    const body = doc.body
    // A largura e dependencia de proposito: trocar de tablet para celular
    // reaproveita a moldura, e sem o reset a pessoa via o conteudo se
    // reorganizar ao vivo. O esconde-ate-silenciar so funcionava na primeira
    // montagem.
    setSettled(false)

    let timer: ReturnType<typeof setTimeout>
    const measure = () => {
      setHeight(Math.max(160, Math.ceil(body.getBoundingClientRect().height)))
      // Assentado quer dizer que parou de mudar. O observer so relata mudanca,
      // entao o que conta e o silencio dele, e nao duas leituras iguais.
      clearTimeout(timer)
      timer = setTimeout(() => setSettled(true), 180)
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(body)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [doc, width])

  return { height, settled }
}

/**
 * Quanto a moldura precisa encolher para caber na coluna em que ela mora.
 *
 * Tablet tem 768px de largura e a coluna da documentacao e mais estreita que
 * isso, entao a moldura ou vazava ou, pior, tinha que ser cortada ate o espaco
 * disponivel - foi assim que a chave de tablet acabou mostrando a mesma largura
 * da de desktop. A escala mantem a moldura em 768 pixels de CSS de verdade,
 * entao as media queries la dentro continuam respondendo como tablet, e so o
 * retrato dela fica menor. E o que a propria barra de dispositivo do navegador
 * faz.
 */
function useBoxWidth() {
  const box = useRef<HTMLDivElement>(null)
  const [boxWidth, setBoxWidth] = useState<number | null>(null)

  useEffect(() => {
    const node = box.current
    if (!node) return

    const measure = () => setBoxWidth(node.clientWidth)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return { box, boxWidth }
}

export function ExampleFrame({
  width,
  fit = false,
  initialHeight,
  minHeight,
  children,
}: {
  width: number
  /**
   * Acompanha a coluna em vez de miniaturizar. Largura escolhida a mao e o
   * retrato de outro aparelho, entao ela encolhe para caber; historia de
   * keep-open em repouso e so o exemplo, e num celular ela tem que continuar
   * legivel: a janela estreita, o layout la dentro responde como celular, e
   * nada encolhe para metade do tamanho.
   */
  fit?: boolean
  /** A altura do que a moldura substituiu, para a caixa nunca desabar. */
  initialHeight?: number
  /**
   * Espaco para o que flutua. Um dialog se centra na janela da moldura e um
   * select precisa de ar para abrir; sem isto a moldura abraca o gatilho e o
   * popup sai cortado na primeira linha.
   */
  minHeight?: number
  children: ReactNode
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const { box, boxWidth } = useBoxWidth()
  const frameWidth = fit ? Math.min(width, boxWidth ?? width) : width
  const scale = fit || !boxWidth ? 1 : Math.min(1, boxWidth / width)

  useEffect(() => {
    const node = frame.current
    if (!node) return

    const attach = () => {
      const inner = node.contentDocument
      if (!inner) return
      inner.body.style.margin = '0'
      // A moldura tem o tamanho do proprio conteudo, entao a barra de rolagem
      // vertical dela nunca passaria de uma tarja de cromo por cima do
      // exemplo. Rolar para o lado continua sendo de quem la dentro pediu.
      inner.documentElement.style.overflowY = 'hidden'
      setDoc(inner)
    }

    // O Safari pode devolver um documento que ainda e about:blank no primeiro
    // tick, entao quem vale e o evento de load.
    attach()
    node.addEventListener('load', attach)
    return () => node.removeEventListener('load', attach)
  }, [])

  useClonedStyles(doc)
  const { height, settled } = useMeasuredHeight(doc, frameWidth)

  // Enquanto a largura nova e medida, a caixa segura a altura que ja estava
  // mostrando, e nunca um placeholder fixo: desabar para 160 e voltar era a
  // piscada que a pessoa via em cada troca. A primeira montagem parte da altura
  // do que a moldura substituiu.
  const heldHeight = useRef(initialHeight ?? 160)
  if (settled) heldHeight.current = height * scale

  return (
    // A caixa de fora carrega a altura ja escalada, para que uma moldura
    // encolhida nao deixe espaco morto embaixo, e centra a moldura para que
    // escalar em torno do proprio centro a mantenha no meio da coluna.
    <div
      ref={box}
      className="flex w-full justify-center overflow-hidden transition-[height] duration-200 ease-rc"
      style={{ height: settled ? height * scale : heldHeight.current }}
    >
      <iframe
        ref={frame}
        title="Exemplo em outra largura"
        className={`shrink-0 rounded-md border border-border bg-bg transition-opacity duration-200 ${
          settled ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: frameWidth,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Local, nunca global: o provider escreve tema global no
            `document.documentElement`, e dentro de um portal esse documento
            ainda e o da pagina, e nao o da moldura. */}
        {doc &&
          createPortal(
            <RivoProvider scope="local" theme="rivocode-dark">
              <div
                // `safe` pelo mesmo motivo do stage: centro mais overflow torna
                // o comeco inalcancavel, e aqui o overflow e a regra, nao a
                // excecao - a moldura existe justamente para apertar a largura.
                className="flex min-h-40 items-center justify-center-safe p-6"
                style={minHeight ? { minHeight } : undefined}
              >
                {children}
              </div>
            </RivoProvider>,
            doc.body,
          )}
      </iframe>
    </div>
  )
}
