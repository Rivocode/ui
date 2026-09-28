import { useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
 * On this page
 *
 * The right-hand column. It reads the headings of the already-drawn page
 * instead of receiving a ready list, because half of what a piece page shows
 * arrives late: the examples load on demand, and the parts section is built
 * from the catalog. A list written in advance would miss exactly those.
 *
 * The column does not scroll inside, and does not leave the screen. These are
 * the two sides of one defect, and each was seen alone before: pinned to the
 * top at the window's height, it got its own scrollbar and a long table of
 * contents appeared cut at both ends; loose, it vanishes as soon as the
 * reading goes down, and the Icons page - three lines - stopped saying where
 * the person was.
 *
 * What holds both is the list height, measured in `useRail`. If it fits on
 * screen, it stays still. If it does not, it slides along with the page:
 * going down it reaches the end of the list, going up it returns to the
 * start. There is only one scroll, and it is the page's.
 * ------------------------------------------------------------------------- */

/**
 * The page on which the person last scrolled on their own.
 *
 * Module scope, because this has to be listening before the component mounts:
 * the realignment further down happens in the first moments, and a scroll in
 * that window has to win.
 *
 * It keeps the address, not the moment. Comparing timestamps seemed enough
 * and was not: a scroll that happens before this module loads carries a mark
 * older than the mount, and passed as "nobody touched it". The address
 * answers the question that matters, which is whether it happened on THIS
 * page, and still lets a new navigation start clean.
 *
 * `wheel`, touch and keyboard are the reader's intent. The `scroll` event is
 * not: it also fires for the scrolling we cause ourselves.
 */
let readerMovedOn: string | null = null
if (typeof window !== 'undefined') {
  const mark = () => {
    readerMovedOn = window.location.pathname
  }
  for (const event of ['wheel', 'touchstart', 'keydown'] as const) {
    window.addEventListener(event, mark, { passive: true })
  }
}

type Item = { id: string; text: string; level: number }

/** Waits for the page's async parts before reading its shape. */
function useHeadings(watch: string) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return

    /*
     * The examples mount after their module resolves, and the page grows
     * under the anchor: the browser already scrolled to where the `#` pointed
     * before the content arrived, so whoever opened `#api` lands in a section
     * they did not ask for.
     *
     * They arrive in waves, and each wave pushes the anchor further down, so
     * we wait for the changes to go quiet and correct once. Realigning on
     * every wave also works, but the page jumps several times on the way.
     */
    let pending: ReturnType<typeof setTimeout> | undefined

    const goToAnchor = () => {
      if (!window.location.hash) return
      clearTimeout(pending)
      pending = setTimeout(() => {
        // The check lives in here, not at scheduling time: what matters is
        // whether the person scrolled up to the moment we scroll, not up to
        // the moment we queued.
        if (readerMovedOn === window.location.pathname) return
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        // `instant` on purpose. The stylesheet sets `scroll-behavior: smooth`
        // for everyone, which turned this correction into half a second of
        // animation: whoever scrolled during it watched the page crawl back,
        // as if arguing. This is not navigation, it is a position fix, and a
        // fix you can watch happening reads as a defect.
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

    // The examples mount after their module resolves, and each one adds a
    // heading.
    const observer = new MutationObserver(read)
    observer.observe(main, { childList: true, subtree: true })

    return () => {
      clearTimeout(pending)
      observer.disconnect()
    }
  }, [watch])

  return items
}

/** Which heading the person is at, by the last one still above the fold. */
function useActive(items: Item[]) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!items.length) return

    const onScroll = () => {
      /*
       * At the end the scroll has run out, so the last headings never reach
       * the 96px line and tracking by position stops telling them apart.
       *
       * Marking the first one still visible fixed the jump to an anchor near
       * the end, and broke on the short page: with every heading on screen the
       * first always won, and asking for `#api` lit up "The search".
       *
       * Down there the anchor the person asked for decides, as long as it is
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
        // 96px below the top: the sticky header covers the first 56, and a
        // heading touching it does not yet read as "where I am".
        if (node.getBoundingClientRect().top <= 96) current = item.id
      }

      setActive(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    // Already at the end of the page, clicking a table of contents item does
    // not scroll anything, so the scroll event never comes and the mark would
    // stay where it was.
    window.addEventListener('hashchange', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hashchange', onScroll)
    }
  }, [items])

  return active
}

/** The height of the sticky header, which is where the table of contents may rest. */
const TOP = 56

/**
 * Keeps the table of contents in view without giving it its own scroll.
 *
 * `position: sticky` alone solves the short list and abandons the long one:
 * it sticks at the top, and whatever goes past the window height stays below
 * the fold, out of reach forever. Giving it `overflow` would be a second
 * scroll inside the first, which is exactly what we do not want.
 *
 * So the list stays sticky and moves on top of that, in PROPORTION to what
 * has been read: at the start of the text it shows its start, at the end its
 * end, and in the middle its middle. That way the marked row always falls
 * inside the window, which is the only thing the table of contents needs to
 * guarantee.
 *
 * The first version added up how far the wheel had turned, and that seemed
 * the same thing - it is not. The overflow is usually around 140px on a
 * ten-thousand-pixel article: the first two gestures used up the whole
 * travel, the list stopped at its end, and the rest of the reading happened
 * with the first rows - the only ones that mattered there - off screen.
 * Twenty-one of the hundred and twenty scroll positions had the marked row
 * invisible, and they were the first twenty-one.
 */
function useRail(count: number) {
  const rail = useRef<HTMLElement>(null)

  useEffect(() => {
    // By the number of rows, not just once: on the first render the list is
    // still empty and the `nav` does not even exist, so an effect without a
    // dependency left without finding anything and never came back.
    const nav = rail.current
    if (!nav) return

    const align = () => {
      // What the list has beyond what the window shows. Zero or less, it fits
      // entirely and there is nothing to shift.
      const overflow = nav.offsetHeight - (window.innerHeight - TOP)

      if (overflow <= 0) {
        nav.style.transform = ''
        return
      }

      // How much of the text has gone by, from 0 to 1. It is the same number
      // the window scrollbar draws, so the list moves at the pace the person
      // sees moving.
      const scrollRange = document.documentElement.scrollHeight - window.innerHeight
      const read = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0

      const shift = Math.round(overflow * read)
      // `transform`, not `top`: moving a sticky element's `top` makes it jump
      // on the frame the value changes, because it re-anchors all at once.
      nav.style.transform = shift ? `translateY(${-shift}px)` : ''
    }

    align()
    window.addEventListener('scroll', align, { passive: true })
    window.addEventListener('resize', align)
    // The list grows when the examples arrive, and what fit stops fitting.
    const observer = new ResizeObserver(align)
    observer.observe(nav)

    return () => {
      window.removeEventListener('scroll', align)
      window.removeEventListener('resize', align)
      observer.disconnect()
    }
  }, [count])

  return rail
}

export function Toc({ watch }: { watch: string }) {
  const items = useHeadings(watch)
  const active = useActive(items)
  const rail = useRail(items.length)

  // A single heading is not a table of contents of anything.
  if (items.length < 2) return null

  return (
    <nav
      ref={rail}
      aria-label="On this page"
      // `self-start` so the column has the list's height, not the whole row's:
      // stretched, it would have nowhere to stick, and the rail's border would
      // run down to the footer of the text like a line that belongs to nothing.
      className="sticky top-14 hidden w-56 shrink-0 self-start py-10 pl-6 xl:block"
    >
      <p className="mb-3 font-mono text-[0.7rem] tracking-widest text-fg-subtle uppercase">
        On this page
      </p>

      <ul className="border-l border-border">
        {/*
          The key is the position, not the id.

          This list is read from the document, and a document can write the
          same id twice - that is what the `Button` page did. Two equal keys
          keep React from reconciling the list: it started abandoning rows in
          here, which survived navigation and added up with the next piece's,
          until the page was reloaded. The source is fixed, but the table of
          contents cannot guarantee what it reads, and the damage was too big
          to depend on that.
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
