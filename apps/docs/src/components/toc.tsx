import { useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
 * Nesta pagina
 *
 * A coluna da direita. Ela le os titulos da pagina ja desenhada em vez de
 * receber uma lista pronta, porque metade do que uma pagina de peca mostra
 * chega atrasada: os exemplos carregam sob demanda, e a secao de partes e
 * montada a partir do catalogo. Uma lista escrita de antemao ficaria sem
 * exatamente esses.
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
 * A pagina em que a pessoa mexeu na rolagem por conta propria pela ultima vez.
 *
 * Escopo de modulo, porque isto precisa estar escutando antes de o componente
 * montar: o realinhamento la embaixo acontece nos primeiros instantes, e uma
 * rolagem nessa janela tem que ganhar.
 *
 * Ele guarda o endereco, e nao o momento. Comparar carimbo de tempo parecia
 * bastar e nao bastava: uma rolagem que acontece antes de este modulo carregar
 * leva uma marca mais velha que a montagem, e passava por "ninguem mexeu". O
 * endereco responde a pergunta que importa, que e se aquilo aconteceu NESTA
 * pagina, e ainda deixa uma navegacao nova comecar limpa.
 *
 * `wheel`, toque e teclado sao a intencao de quem le. O evento `scroll` nao e:
 * ele dispara tambem para a rolagem que nos mesmos causamos.
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

/** Espera as partes assincronas da pagina antes de ler a forma dela. */
function useHeadings(watch: string) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return

    /*
     * Os exemplos montam depois que o modulo deles resolve, e a pagina cresce
     * por baixo da ancora: o navegador ja rolou ate onde o `#` apontava antes
     * de o conteudo chegar, entao quem abriu `#api` cai numa secao que nao
     * pediu.
     *
     * Eles chegam em ondas, e cada onda empurra a ancora mais para baixo, entao
     * esperamos as mudancas silenciarem e corrigimos uma vez so. Realinhar a
     * cada onda tambem funciona, mas a pagina pula varias vezes no caminho.
     */
    let pending: ReturnType<typeof setTimeout> | undefined

    const goToAnchor = () => {
      if (!window.location.hash) return
      clearTimeout(pending)
      pending = setTimeout(() => {
        // A conferencia mora aqui dentro, e nao na hora de agendar: o que
        // importa e se a pessoa mexeu ate o instante em que rolamos, e nao ate
        // o instante em que enfileiramos.
        if (readerMovedOn === window.location.pathname) return
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        // `instant` de proposito. A folha poe `scroll-behavior: smooth` para
        // todo mundo, o que transformava esta correcao em meio segundo de
        // animacao: quem rolava durante ela via a pagina rastejando de volta,
        // como se discutisse. Isto nao e navegacao, e conserto de posicao, e
        // conserto que da para ver acontecendo le como defeito.
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

    // Os exemplos montam depois que o modulo deles resolve, e cada um soma um
    // titulo.
    const observer = new MutationObserver(read)
    observer.observe(main, { childList: true, subtree: true })

    return () => {
      clearTimeout(pending)
      observer.disconnect()
    }
  }, [watch])

  return items
}

/** Em que titulo a pessoa esta, pelo ultimo que ainda ficou acima da dobra. */
function useActive(items: Item[]) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!items.length) return

    const onScroll = () => {
      /*
       * No fim a rolagem acabou, entao os ultimos titulos nunca alcancam a
       * linha dos 96px e acompanhar por posicao para de distinguir um do outro.
       *
       * Marcar o primeiro ainda visivel resolvia o salto para uma ancora perto
       * do fim, e quebrava na pagina curta: com todos os titulos na tela o
       * primeiro ganhava sempre, e pedir `#api` acendia "A busca".
       *
       * La embaixo quem decide e a ancora que a pessoa pediu, desde que ela
       * esteja a vista. Sem ancora, ou com uma que ficou para tras, ganha o
       * ultimo titulo, que e onde a pagina de fato terminou.
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
        // 96px abaixo do topo: o cabecalho grudado cobre os primeiros 56, e um
        // titulo encostado nele ainda nao le como "onde eu estou".
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

  // Um titulo so nao e indice de nada.
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
          A chave e a posicao, e nao o id.

          Esta lista e lida do documento, e um documento pode escrever o mesmo
          id duas vezes - foi o que a pagina de `Button` fez. Duas chaves iguais
          nao deixam o React reconciliar a lista: ele passou a abandonar linhas
          aqui dentro, que sobreviviam a navegacao e se somavam as da proxima
          peca, ate a pagina ser recarregada. A origem esta corrigida, mas o
          indice nao tem como garantir o que le, e o estrago era grande demais
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
