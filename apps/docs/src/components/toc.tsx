import { useEffect, useState } from 'react'

/* ---------------------------------------------------------------------------
 * On this page
 *
 * The right rail. It reads the headings out of the rendered page instead of
 * being handed a list, because half of what a component page shows arrives
 * late: the examples load on demand, and the parts section is built from the
 * catalog. A list written up front would be missing exactly those.
 *
 * A coluna nao rola por dentro. Ela era presa no topo com a altura da janela e
 * rolagem propria, e um indice longo — o de temas passa de trinta linhas —
 * ficava cortado nas duas pontas: a lista se movia sozinha para acompanhar a
 * leitura e o titulo "Nesta pagina" saia por cima. Agora ela e uma coluna
 * comum ao lado do texto, com a altura que a lista pedir, e quem manda no
 * gesto e a pagina: um so scroll, um so lugar onde ele acontece.
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

export function Toc({ watch }: { watch: string }) {
  const items = useHeadings(watch)
  const active = useActive(items)

  // One heading is not an index of anything.
  if (items.length < 2) return null

  return (
    <nav
      aria-label="Nesta página"
      // `self-start` para a coluna ter a altura da lista, e nao a da linha
      // inteira: esticada, ela empurraria a borda do trilho ate o rodape do
      // texto, desenhando uma linha vertical que nao pertence a nada.
      className="hidden w-56 shrink-0 self-start py-10 pl-6 xl:block"
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
              aria-current={active === item.id ? 'true' : undefined}
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
