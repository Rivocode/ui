import { useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
 * On this page
 *
 * The right rail. It reads the headings out of the rendered page instead of
 * being handed a list, because half of what a component page shows arrives
 * late: the examples load on demand, and the parts section is built from the
 * catalog. A list written up front would be missing exactly those.
 *
 * A coluna nao rola por dentro, e nao sai da tela. Sao os dois lados de um
 * mesmo defeito, e cada um foi visto sozinho antes: presa no topo com a
 * altura da janela, ela ganhava barra propria e um indice longo aparecia
 * cortado nas duas pontas; solta, ela some assim que a leitura desce, e a
 * pagina de Icones - tres linhas - deixava de dizer onde a pessoa estava.
 *
 * O que sustenta os dois e a altura da lista, medida em `useRail`. Cabendo na
 * tela, ela fica imovel. Nao cabendo, desliza junto com a pagina: descendo
 * chega ao fim da lista, subindo volta ao comeco. Rolagem so existe uma, e e
 * a da pagina.
 * ------------------------------------------------------------------------- */

/**
 * The page on which the reader last moved the scroll themselves.
 *
 * Module scope, because it has to be listening before the component mounts:
 * the realignment below happens in the first moments, and a scroll in that
 * window has to win.
 *
 * It stores the address, not the moment. Comparing timestamps looked like
 * enough and was not: a scroll that happens before this module loads carries a
 * mark older than the mount, and passed for "nobody moved". The address
 * answers the question that matters, which is whether it happened on this
 * page, and still lets a fresh navigation start clean.
 *
 * `wheel`, touch and keyboard are the reader's intent. The `scroll` event is
 * not: it also fires for the scrolling we cause ourselves.
 */
let readerMovedOn: string | null = null
if (typeof window !== 'undefined') {
  const mark = () => {
    readerMovedOn = window.location.pathname
  }
  for (const evento of ['wheel', 'touchstart', 'keydown'] as const) {
    window.addEventListener(evento, mark, { passive: true })
  }
}

type Item = { id: string; text: string; level: number }

/** Waits for the async pieces of the page before reading its shape. */
function useHeadings(watch: string) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return

    /*
     * Examples mount after their module resolves, and the page grows under the
     * anchor: the browser already scrolled to where `#` pointed before the
     * content arrived, so whoever opened `#api` lands on a section they did not
     * ask for.
     *
     * They arrive in waves, and each wave pushes the anchor down again, so we
     * wait for the changes to go quiet and correct once. Realigning on every
     * wave works too, but the page hops several times on the way there.
     */
    let pending: ReturnType<typeof setTimeout> | undefined

    const goToAnchor = () => {
      if (!window.location.hash) return
      clearTimeout(pending)
      pending = setTimeout(() => {
        // The check lives in here, not at scheduling time: what matters is
        // whether the reader moved by the moment we scroll, not by the moment
        // we queued it.
        if (readerMovedOn === window.location.pathname) return
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        // `instant` on purpose. The sheet sets `scroll-behavior: smooth` for
        // everyone, which turned this correction into half a second of
        // animation: a reader who scrolled during it saw the page crawling
        // back, as if arguing with them. This is not navigation, it is fixing
        // a position, and a fix you can watch happen reads as a defect.
        target?.scrollIntoView({ behavior: 'instant' })
      }, 200)
    }

    const read = () => {
      const found = [...main.querySelectorAll<HTMLElement>('h2[id], h3[id]')].map((node) => ({
        id: node.id,
        text: node.textContent?.trim() ?? '',
        level: Number(node.tagName[1]),
      }))

      setItems((current) =>
        current.length === found.length && current.every((item, index) => item.id === found[index].id)
          ? current
          : found,
      )

      if (found.length) goToAnchor()
    }

    read()

    // Examples mount after their module resolves, and each one adds a heading.
    const observer = new MutationObserver(read)
    observer.observe(main, { childList: true, subtree: true })

    return () => {
      clearTimeout(pending)
      observer.disconnect()
    }
  }, [watch])

  return items
}

/** Which heading the reader is on, by the topmost one still above the fold. */
function useActive(items: Item[]) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!items.length) return

    const onScroll = () => {
      /*
       * At the bottom the scrolling is over, so the last headings never reach
       * the 96px line and tracking by position stops telling them apart.
       *
       * Marking the first one still visible solved jumping to an anchor near
       * the end, but broke on a short page: with every heading on screen the
       * first one always won, and asking for `#api` lit up "A busca".
       *
       * Down there the anchor the reader asked for decides, as long as it is
       * in view. With no anchor, or one left behind, the last heading wins,
       * which is where the page actually ended.
       */
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2

      if (atBottom) {
        const requested = decodeURIComponent(window.location.hash.slice(1))
        const inView = items.find((item) => {
          if (item.id !== requested) return false
          const node = document.getElementById(item.id)
          if (!node) return false
          const rect = node.getBoundingClientRect()
          return rect.bottom > 0 && rect.top < window.innerHeight
        })

        setActive((inView ?? items[items.length - 1]).id)
        return
      }

      let current: string | null = items[0].id

      for (const item of items) {
        const node = document.getElementById(item.id)
        if (!node) continue
        // 96px down from the top: the sticky header covers the first 56, and a
        // heading flush against it does not read as "where I am" yet.
        if (node.getBoundingClientRect().top <= 96) current = item.id
      }

      setActive(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    // Already at the bottom, clicking an item in the index scrolls nothing, so
    // the scroll event never comes and the mark would sit where it was.
    window.addEventListener('hashchange', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hashchange', onScroll)
    }
  }, [items])

  return active
}

/** A altura do cabecalho grudado, que e onde o indice pode encostar. */
const TOPO = 56

/**
 * Mantem o indice a vista sem dar rolagem propria a ele.
 *
 * `position: sticky` sozinho resolve a lista curta e abandona a longa: ela
 * gruda pelo topo, e o que passa da altura da janela fica embaixo da dobra,
 * fora de alcance para sempre. Dar `overflow` a ela seria uma segunda rolagem
 * dentro da primeira, que e justamente o que nao se quer.
 *
 * Entao a lista continua grudada e anda por cima disso, na PROPORCAO do que
 * ja se leu: no comeco do texto ela mostra o comeco dela, no fim mostra o fim,
 * e no meio o meio. Assim a linha marcada cai sempre dentro da janela, que e a
 * unica coisa que o indice precisa garantir.
 *
 * A primeira versao somava o quanto a roda tinha girado, e isso parecia a
 * mesma coisa - nao e. O excedente costuma ser de uns 140px num artigo de dez
 * mil: os primeiros dois gestos gastavam o curso inteiro, a lista parava no
 * fim dela, e o resto da leitura acontecia com as linhas do comeco - as unicas
 * que interessavam ali - fora da tela. Vinte e uma das cento e vinte posicoes
 * de rolagem tinham a linha marcada invisivel, e eram as vinte e uma
 * primeiras.
 */
function useRail(count: number) {
  const rail = useRef<HTMLElement>(null)

  useEffect(() => {
    // Pela quantidade de linhas, e nao uma vez so: no primeiro render a lista
    // ainda esta vazia e o `nav` nem existe, entao um efeito sem dependencia
    // saia sem achar nada e nunca mais voltava.
    const nav = rail.current
    if (!nav) return

    const acertar = () => {
      // O que a lista tem alem do que a janela mostra. Zero ou menos, ela
      // cabe inteira e nao ha o que deslocar.
      const excedente = nav.offsetHeight - (window.innerHeight - TOPO)

      if (excedente <= 0) {
        nav.style.transform = ''
        return
      }

      // Quanto do texto ja passou, de 0 a 1. E o mesmo numero que a barra de
      // rolagem da janela desenha, entao a lista anda no compasso que a pessoa
      // ve andar.
      const percurso = document.documentElement.scrollHeight - window.innerHeight
      const lido = percurso > 0 ? Math.min(1, Math.max(0, window.scrollY / percurso)) : 0

      const shift = Math.round(excedente * lido)
      // `transform`, e nao `top`: mexer no `top` de um elemento grudado o faz
      // saltar no quadro em que o valor muda, porque ele reancora de uma vez.
      nav.style.transform = shift ? `translateY(${-shift}px)` : ''
    }

    acertar()
    window.addEventListener('scroll', acertar, { passive: true })
    window.addEventListener('resize', acertar)
    // A lista cresce quando os exemplos chegam, e o que cabia deixa de caber.
    const observer = new ResizeObserver(acertar)
    observer.observe(nav)

    return () => {
      window.removeEventListener('scroll', acertar)
      window.removeEventListener('resize', acertar)
      observer.disconnect()
    }
  }, [count])

  return rail
}

export function Toc({ watch }: { watch: string }) {
  const items = useHeadings(watch)
  const active = useActive(items)
  const rail = useRail(items.length)

  // One heading is not an index of anything.
  if (items.length < 2) return null

  return (
    <nav
      ref={rail}
      aria-label="Nesta página"
      // `self-start` para a coluna ter a altura da lista, e nao a da linha
      // inteira: esticada, ela nao teria onde grudar, e a borda do trilho
      // desceria ate o rodape do texto como uma linha que nao pertence a nada.
      className="sticky top-14 hidden w-56 shrink-0 self-start py-10 pl-6 xl:block"
    >
      <p className="mb-3 font-mono text-[0.7rem] tracking-widest text-fg-subtle uppercase">
        Nesta página
      </p>

      <ul className="border-l border-border">
        {/*
          A chave é a posição, e não o id.

          Esta lista é lida do documento, e um documento pode escrever o mesmo
          id duas vezes — foi o que a página de `Button` fez. Duas chaves iguais
          não deixam o React reconciliar a lista: ele passou a abandonar linhas
          aqui dentro, que sobreviviam à navegação e se somavam às da próxima
          peça, até a página ser recarregada. A origem está corrigida, mas o
          índice não tem como garantir o que lê, e o estrago era grande demais
          para depender disso.
        */}
        {items.map((item, index) => (
          <li key={`${index}-${item.id}`}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'location' : undefined}
              className={`-ml-px block border-l py-1.5 text-sm leading-snug transition-colors ${
                item.level === 3 ? 'pr-2 pl-6' : 'pr-2 pl-3'
              } ${
                active === item.id
                  ? 'border-accent text-accent-text'
                  : 'border-transparent text-fg-subtle hover:text-fg'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
