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

/**
 * Grows the frame to whatever the example inside it turned out to need.
 *
 * The measurement is a loop, not a reading: the example reacts to the frame's
 * width, and the frame takes its height from the example. Switching to tablet
 * walks the height down in steps (264, 216, 169) over more than a second, and
 * every step is painted, so the reader watches a tall empty box collapse. So
 * the hook also reports whether the number has stopped moving, and the frame
 * stays hidden until it has.
 */
function useMeasuredHeight(doc: Document | null, width: number) {
  const [height, setHeight] = useState(220)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!doc?.body) return
    const body = doc.body
    // Width is a dependency on purpose: switching tablet to mobile reuses the
    // frame, and without the reset the reader watched the content reflow live.
    // The hide-until-quiet guard only worked on the first mount.
    setSettled(false)

    let timer: ReturnType<typeof setTimeout>
    const measure = () => {
      setHeight(Math.max(160, Math.ceil(body.getBoundingClientRect().height)))
      // Settled means it stopped changing. The observer only reports changes,
      // so it is its silence that counts, not two equal readings.
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

export function ExampleFrame({
  width,
  initialHeight,
  minHeight,
  children,
}: {
  width: number
  /** Height of whatever the frame replaced, so the box never collapses. */
  initialHeight?: number
  /**
   * Room for what floats. A dialog centres on the frame's viewport and a
   * select needs air to open into; without this the frame hugs the trigger
   * and the popup gets clipped at the first row.
   */
  minHeight?: number
  children: ReactNode
}) {
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
  const { height, settled } = useMeasuredHeight(doc, width)

  // While the new width is being measured the box holds the height it was
  // showing, never a fixed placeholder: collapsing to 160 and popping back up
  // was the blink the reader saw on every switch. The first mount starts from
  // the height of whatever the frame replaced.
  const heldHeight = useRef(initialHeight ?? 160)
  if (settled) heldHeight.current = height * scale

  return (
    // The outer box carries the scaled height, so a shrunken frame does not
    // leave dead space under it, and centres the frame so scaling about its
    // own centre keeps it in the middle of the column.
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
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        {/* Local, never global: the provider writes a global theme onto
            `document.documentElement`, and inside a portal that document is
            still the page, not the frame. */}
        {doc &&
          createPortal(
            <RivoProvider scope="local" theme="rivocode-dark">
              <div
                className="flex min-h-40 items-center justify-center p-6"
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
