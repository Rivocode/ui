import { Marked } from 'marked'
import { anchor } from './anchor'

/* ---------------------------------------------------------------------------
 * Markdown to HTML, with an address for every heading
 *
 * A heading's id is where the right column points, where a pasted `#` lands,
 * and what identifies the row inside the table of contents. So it has to be
 * unique on the page - and a page is not a single document: the piece's doc,
 * and the doc of each part shown below it, are drawn side by side.
 *
 * `Button` was the case that broke: its doc and `ButtonGroup`'s both write
 * `## In React Native`, so the page carried the same id twice. The `#` only
 * reached one of them, and the table of contents - keyed by that id - stopped
 * reconciling and started leaving orphan rows behind on every navigation.
 * ------------------------------------------------------------------------- */

export type MarkdownOptions = {
  /** Signs this document's ids, so two docs on one page do not collide. */
  idPrefix?: string
  /**
   * How far to push the headings down.
   *
   * A part's doc is drawn below the `h3` that names the part, so its `h2`
   * would rise above whoever composes it. Pushed to `h4`, it reads as what it
   * is, and stops crowding the table of contents, which lists `h2` and `h3`.
   */
  headingOffset?: number
}

/**
 * A heading's unique id: prefixed when the document is a guest on another's
 * page, and numbered when the same heading appears twice inside the same
 * document.
 */
function idFor(text: string, options: MarkdownOptions, used: Set<string>) {
  const base = options.idPrefix ? `${options.idPrefix}-${anchor(text)}` : anchor(text)

  let id = base
  for (let count = 2; used.has(id); count++) id = `${base}-${count}`

  used.add(id)
  return id
}

/**
 * The content comes from files in this repository, never from third-party
 * input.
 *
 * One instance per call, not the shared `marked`: the renderer carries the ids
 * already handed out, and that set belongs to a single document.
 */
export function renderMarkdown(source: string, options: MarkdownOptions = {}) {
  const used = new Set<string>()
  const marked = new Marked({ gfm: true, breaks: false })

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        const level = Math.min(depth + (options.headingOffset ?? 0), 6)
        return `<h${level} id="${idFor(text, options, used)}">${text}</h${level}>\n`
      },
    },
  })

  return marked.parse(source) as string
}
