import { RivoProvider } from '@rivocode/ui'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* ---------------------------------------------------------------------------
 * A real narrow viewport
 *
 * Shrinking a `<div>` proves nothing. Every responsive class in this library
 * keys off the window: `max-sm:` on the sheet that docks to the bottom,
 * `hideOnMobile` on a table column, the calendar deciding how many months fit.
 * A 390px box inside a 1440px window fires none of them, so the mobile switch
 * showed a squeezed desktop and the tablet switch showed nothing at all,
 * because the page column was already narrower than 768.
 *
 * An iframe has its own window, so the queries answer for real. It costs a
 * document per example, which is why it is built only when the reader asks for
 * a width: at desktop the example renders inline, as before.
 * ------------------------------------------------------------------------- */

/**
 * Copies the page's styles into the frame.
 *
 * In dev Vite injects CSS as `<style>` tags it keeps mutating; in a build it
 * is a `<link>`. Both are cloned, and the observer catches the hot updates so
 * an open frame does not freeze at the stylesheet it was born with.
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

/** Grows the frame to whatever the example inside it turned out to need. */
function useMeasuredHeight(doc: Document | null, deps: unknown[]) {
  const [height, setHeight] = useState(220)

  useEffect(() => {
    if (!doc?.body) return

    const measure = () =>
      setHeight(Math.max(160, doc.body.scrollHeight, doc.documentElement.scrollHeight))
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(doc.body)

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, ...deps])

  return height
}

/**
 * How much the frame has to shrink to fit the column it sits in.
 *
 * A tablet is 768px wide and the documentation column is narrower than that,
 * so the frame either overflowed or, worse, had to be cut down to the space
 * available, which is how the tablet switch ended up showing the same width as
 * the desktop one. Scaling keeps the frame at a real 768 CSS pixels, so the
 * media queries inside still answer as a tablet, and only the picture of it
 * gets smaller. It is what the browser's own device toolbar does.
 */
function useFitScale(width: number) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const node = box.current
    if (!node) return

    const measure = () => setScale(Math.min(1, node.clientWidth / width))
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)

    return () => observer.disconnect()
  }, [width])

  return { box, scale }
}

export function ExampleFrame({ width, children }: { width: number; children: ReactNode }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const { box, scale } = useFitScale(width)

  useEffect(() => {
    const node = frame.current
    if (!node) return

    const attach = () => {
      const inner = node.contentDocument
      if (!inner) return
      inner.body.style.margin = '0'
      // The frame is sized to its content, so its own vertical scrollbar would
      // only ever be a stripe of chrome over the example. Sideways scrolling
      // still belongs to whatever inside asked for it.
      inner.documentElement.style.overflowY = 'hidden'
      setDoc(inner)
    }

    // Safari can hand back a document that is still about:blank on the first
    // tick, so the load event is the one that counts.
    attach()
    node.addEventListener('load', attach)
    return () => node.removeEventListener('load', attach)
  }, [])

  useClonedStyles(doc)
  const height = useMeasuredHeight(doc, [children])

  return (
    // The outer box carries the scaled height, so a shrunken frame does not
    // leave dead space under it, and centres the frame so scaling about its
    // own centre keeps it in the middle of the column.
    <div
      ref={box}
      className="flex w-full justify-center overflow-hidden"
      style={{ height: height * scale }}
    >
      <iframe
        ref={frame}
        title="Exemplo em outra largura"
        className="shrink-0 rounded-md border border-border bg-bg"
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        {/* Local, never global: the provider writes a global theme onto
            `document.documentElement`, and inside a portal that document is
            still the page, not the frame. */}
        {doc &&
          createPortal(
            <RivoProvider scope="local" theme="rivocode-dark">
              <div className="flex min-h-40 items-center justify-center p-6">{children}</div>
            </RivoProvider>,
            doc.body,
          )}
      </iframe>
    </div>
  )
}
