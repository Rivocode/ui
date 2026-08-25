import { useEffect, useState } from 'react'

/* ---------------------------------------------------------------------------
 * On this page
 *
 * The right rail. It reads the headings out of the rendered page instead of
 * being handed a list, because half of what a component page shows arrives
 * late: the examples load on demand, and the parts section is built from the
 * catalog. A list written up front would be missing exactly those.
 * ------------------------------------------------------------------------- */

/**
 * Em que pagina quem le mexeu na rolagem.
 *
 * Mora no escopo do modulo porque precisa estar escutando antes do componente
 * montar: o realinhamento com a ancora acontece nos primeiros instantes, e uma
 * rolagem nesse meio tempo tem de ser respeitada.
 *
 * Guardamos o endereco, e nao o instante. Comparar horarios parecia bastar e
 * nao bastava: uma rolagem que acontece antes do modulo carregar fica com
 * carimbo anterior ao da montagem, e passava por "ninguem mexeu". O endereco
 * responde a pergunta certa, que e se foi nesta pagina, e ainda deixa uma
 * navegacao nova comecar limpa.
 *
 * `wheel`, toque e teclado sao intencao de quem le. O evento `scroll` nao
 * serve: ele tambem dispara pela rolagem que nos mesmos causamos.
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
     * Os exemplos montam depois que o modulo deles resolve, e a pagina cresce
     * debaixo da ancora: o navegador ja rolou para onde o `#` apontava antes do
     * conteudo chegar, e quem abriu `#api` aterrissa numa secao que nao pediu.
     * Os exemplos chegam em ondas, e cada onda empurra a ancora de novo, entao
     * esperamos as mudancas silenciarem e ajustamos uma vez so. Realinhar a
     * cada onda funciona igual, mas a pagina pula varias vezes no caminho.
     *
     * `wheel`, toque e teclado marcam intencao de quem le, e nao a rolagem que
     * nos mesmos causamos: depois de qualquer um deles, ninguem mexe mais na
     * posicao da pagina.
     */
    let aguardando: ReturnType<typeof setTimeout> | undefined

    const irParaAncora = () => {
      if (!window.location.hash) return
      clearTimeout(aguardando)
      aguardando = setTimeout(() => {
        // A checagem fica aqui dentro, e nao no agendamento: o que importa e se
        // quem le mexeu ate a hora de rolar, e nao ate a hora de agendar.
        if (readerMovedOn === window.location.pathname) return
        const alvo = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        // `instant` de proposito. A pagina rola suave por padrao, e com isso a
        // correcao virava meio segundo de animacao: o leitor que rolasse nesse
        // meio tempo via a pagina voltando sozinha, como se disputasse com ele.
        // Isto aqui nao e navegacao, e conserto de posicao, e conserto que se
        // ve acontecendo parece defeito.
        alvo?.scrollIntoView({ behavior: 'instant' })
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

      if (found.length) irParaAncora()
    }

    read()

    // Examples mount after their module resolves, and each one adds a heading.
    const observer = new MutationObserver(read)
    observer.observe(main, { childList: true, subtree: true })

    return () => {
      clearTimeout(aguardando)
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
       * No fim da pagina a rolagem acabou, entao os ultimos titulos nunca
       * chegam aos 96px do topo e o rastreio por posicao para de distinguir um
       * do outro.
       *
       * Marcar o primeiro ainda visivel resolvia o caso de pular para uma
       * ancora perto do fim, mas quebrava numa pagina curta: com todos os
       * titulos na tela, o primeiro vencia sempre, e pedir `#api` acendia "A
       * busca".
       *
       * Ali quem manda e a ancora que a pessoa pediu, desde que ela esteja em
       * vista. Sem ancora, ou com uma que ficou para tras, vale o ultimo
       * titulo, que e onde a pagina de fato terminou.
       */
      const fim = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2

      if (fim) {
        const pedido = decodeURIComponent(window.location.hash.slice(1))
        const emVista = items.find((item) => {
          if (item.id !== pedido) return false
          const node = document.getElementById(item.id)
          if (!node) return false
          const rect = node.getBoundingClientRect()
          return rect.bottom > 0 && rect.top < window.innerHeight
        })

        setActive((emVista ?? items[items.length - 1]).id)
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
    // Ja no fim da pagina, clicar num item do indice nao rola nada, entao o
    // evento de rolagem nunca vem e a marca ficaria onde estava.
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
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto py-10 pl-6 xl:block"
    >
      <p className="mb-3 font-mono text-[0.7rem] tracking-widest text-fg-subtle uppercase">
        Nesta página
      </p>

      <ul className="border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
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
