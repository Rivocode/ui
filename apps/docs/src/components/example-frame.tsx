import { RivoProvider } from '@rivocode/ui'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* ---------------------------------------------------------------------------
 * A genuinely narrow window
 *
 * Shrinking a `<div>` proves nothing. Every responsive class in this library
 * is decided by the WINDOW: the `max-sm:` of the sheet that anchors at the
 * bottom, a table column's `hideOnMobile`, the calendar deciding how many
 * months fit. A 390px box inside a 1440 window triggers none of them, so the
 * mobile switch showed a squeezed desktop and the tablet one showed nothing,
 * because the page column was already narrower than 768.
 *
 * An iframe has its own window, so the queries really answer. It costs one
 * document per example, which is why it is only mounted when the person asks
 * for a width: on desktop the example draws inline, as before.
 * ------------------------------------------------------------------------- */

/**
 * Copies the page's styles into the frame.
 *
 * In dev Vite injects CSS as `<style>` tags that it keeps mutating; in a build
 * it is a `<link>`. Both are cloned, and the observer catches hot updates so
 * an open frame does not freeze on the stylesheet it was born with.
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
 * Grows the frame to what the example inside ended up needing.
 *
 * The measurement is a loop, not a read: the example reacts to the frame's
 * width, and the frame takes its height from the example. Switching to tablet
 * lowers the height in steps (264, 216, 169) over more than a second, and
 * each step is painted, so the person watches a tall empty box collapse. That
 * is why the hook also reports whether the number stopped moving, and the
 * frame stays hidden until it does.
 */
function useMeasuredHeight(root: HTMLElement | null, width: number) {
  const [height, setHeight] = useState(220)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!root) return
    // The width is a dependency on purpose: switching from tablet to mobile
    // reuses the frame, and without the reset the person watched the content
    // rearrange live. Hide-until-quiet only worked on the first mount.
    setSettled(false)

    let timer: ReturnType<typeof setTimeout>
    const measure = () => {
      setHeight(Math.max(160, Math.ceil(root.getBoundingClientRect().height)))
      // Settled means it stopped changing. The observer only reports change,
      // so what counts is its silence, not two equal readings.
      clearTimeout(timer)
      timer = setTimeout(() => setSettled(true), 180)
    }
    measure()

    // Measures the portal's root node, not the `body`. The `body` is the size
    // of the frame's window whenever some stylesheet stretches it (and in
    // quirks mode it stretches by itself), and then the measurement becomes
    // the frame's own: the height fed back on itself, dropping one step per
    // observer round (1599, 1551, 1503...), the 180ms silence never came, and
    // the frame stayed invisible for some ten seconds on /blocos.
    const observer = new ResizeObserver(measure)
    observer.observe(root)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [root, width])

  return { height, settled }
}

/**
 * How much the frame needs to shrink to fit the column it lives in.
 *
 * Tablet is 768px wide and the documentation column is narrower than that, so
 * the frame either overflowed or, worse, had to be cut down to the available
 * space - that is how the tablet switch ended up showing the same width as
 * desktop. The scale keeps the frame at 768 real CSS pixels, so the media
 * queries inside keep answering as tablet, and only its picture gets smaller.
 * It is what the browser's own device toolbar does.
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

const FRAME_DOCUMENT = '<!doctype html><html><head></head><body></body></html>'

export function ExampleFrame({
  title,
  width,
  fit = false,
  initialHeight,
  minHeight,
  children,
}: {
  /**
   * The frame's name for whoever navigates by screen reader. Each iframe is a
   * document, and the reader announces its title on entering and lists it in
   * the frames rotor; with all of them called "Example at another width", the
   * /blocos list was ten identical lines without saying which block each one
   * opened.
   */
  title: string
  width: number
  /**
   * Follows the column instead of miniaturizing. A hand-picked width is the
   * picture of another device, so it shrinks to fit; a keep-open story at
   * rest is just the example, and on a phone it has to stay readable: the
   * window narrows, the layout inside answers as mobile, and nothing shrinks
   * to half size.
   */
  fit?: boolean
  /** The height of what the frame replaced, so the box never collapses. */
  initialHeight?: number
  /**
   * Room for what floats. A dialog centers in the frame's window and a select
   * needs air to open; without this the frame hugs the trigger and the popup
   * comes out cut at the first line.
   */
  minHeight?: number
  children: ReactNode
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const { box, boxWidth } = useBoxWidth()
  const frameWidth = fit ? Math.min(width, boxWidth ?? width) : width
  const scale = fit || !boxWidth ? 1 : Math.min(1, boxWidth / width)

  useEffect(() => {
    const node = frame.current
    if (!node) return

    const attach = () => {
      const inner = node.contentDocument
      // Only the `srcDoc` document will do. Before it the iframe has the
      // initial about:blank, which is quirks, and Safari even returns it on
      // the first tick; what counts is the standards-mode document, caught
      // here if load already happened or in the load event if not.
      if (!inner || inner.compatMode !== 'CSS1Compat') return
      inner.body.style.margin = '0'
      // The frame is the size of its own content, so its vertical scrollbar
      // would never be more than a strip of chrome over the example. Scrolling
      // sideways is still up to whoever inside asked for it.
      inner.documentElement.style.overflowY = 'hidden'
      // When the inner document's `color-scheme` differs from the page's, the
      // browser paints an OPAQUE background in its scheme's color behind the
      // iframe: white, on a dark page. It showed up in the strip between the
      // end of the content and the end of the frame, exactly when the example
      // shrank and the height had not been measured again yet.
      inner.documentElement.style.colorScheme = getComputedStyle(node).colorScheme
      inner.documentElement.style.background = 'transparent'
      setDoc((current) => (current === inner ? current : inner))
    }

    attach()
    node.addEventListener('load', attach)
    return () => node.removeEventListener('load', attach)
  }, [])

  useClonedStyles(doc)
  const { height, settled } = useMeasuredHeight(root, frameWidth)

  // While the new width is measured, the box holds the height it was already
  // showing, never a fixed placeholder: collapsing to 160 and coming back was
  // the blink the person saw on every switch. The first mount starts from the
  // height of what the frame replaced.
  const heldHeight = useRef(initialHeight ?? 160)
  if (settled) heldHeight.current = height * scale

  return (
    // The outer box carries the already-scaled height, so a shrunken frame
    // leaves no dead space below, and centers the frame so scaling around its
    // own center keeps it in the middle of the column.
    <div
      ref={box}
      className="flex w-full justify-center overflow-hidden transition-[height] duration-200 ease-rc"
      style={{ height: settled ? height * scale : heldHeight.current }}
    >
      <iframe
        ref={frame}
        // The doctype is the reason `srcDoc` exists. Without it the iframe is
        // born about:blank, in quirks mode, where the `body` stretches to the
        // window height and `h-full`, `min-h` and tables behave differently
        // from the site of whoever copies the example.
        srcDoc={FRAME_DOCUMENT}
        title={title}
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
        {/* Local, never global: the provider writes a global theme on
            `document.documentElement`, and inside a portal that document is
            still the page's, not the frame's. */}
        {doc &&
          createPortal(
            <RivoProvider scope="local" theme="rivocode-dark">
              <div
                ref={setRoot}
                // `safe` for the same reason as the stage: center plus overflow
                // makes the start unreachable, and here overflow is the rule,
                // not the exception - the frame exists precisely to squeeze the
                // width.
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
