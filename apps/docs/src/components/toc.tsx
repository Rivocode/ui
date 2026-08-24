import { useEffect, useState } from 'react'

/* ---------------------------------------------------------------------------
 * On this page
 *
 * The right rail. It reads the headings out of the rendered page instead of
 * being handed a list, because half of what a component page shows arrives
 * late: the examples load on demand, and the parts section is built from the
 * catalog. A list written up front would be missing exactly those.
 * ------------------------------------------------------------------------- */

type Item = { id: string; text: string; level: number }

/** Waits for the async pieces of the page before reading its shape. */
function useHeadings(watch: string) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return

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
    }

    read()

    // Examples mount after their module resolves, and each one adds a heading.
    const observer = new MutationObserver(read)
    observer.observe(main, { childList: true, subtree: true })

    return () => observer.disconnect()
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
       * No fim da pagina nao ha mais rolagem, entao os ultimos titulos nunca
       * chegam aos 96px do topo e nunca ficariam ativos: a marca parava no
       * penultimo e o resto da lista virava enfeite.
       *
       * Ali o ativo passa a ser o primeiro titulo ainda visivel, e nao o
       * ultimo. Marcar o ultimo cego quebrava o caso de pular direto para uma
       * ancora perto do fim: a pagina rolava ate onde dava, batia no fim, e a
       * marca ia parar num titulo que a pessoa nem pediu.
       */
      const fim = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2

      if (fim) {
        const visivel = items.find((item) => {
          const node = document.getElementById(item.id)
          return node ? node.getBoundingClientRect().bottom > 96 : false
        })

        setActive((visivel ?? items[items.length - 1]).id)
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
    return () => window.removeEventListener('scroll', onScroll)
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
