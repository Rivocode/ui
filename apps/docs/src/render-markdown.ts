import { Marked } from 'marked'
import { anchor } from './anchor'

/* ---------------------------------------------------------------------------
 * Markdown to HTML, with an address for every heading
 *
 * The id of a heading is what the right rail links to, what a pasted `#` lands
 * on, and what identifies the line inside the index. So it has to be unique on
 * the page — and a page is not one document: the piece's doc, and the doc of
 * every part shown under it, are rendered side by side.
 *
 * `Button` is the case that broke: its doc and `ButtonGroup`'s both write
 * `## No React Native`, so the page carried the same id twice. The `#` could
 * only reach one of them, and the index — keyed by that id — stopped
 * reconciling and started leaving orphan rows behind on every navigation.
 * ------------------------------------------------------------------------- */

export type MarkdownOptions = {
  /** Signs the ids of this document, so two docs on one page cannot collide. */
  idPrefix?: string
  /**
   * How far down to push the headings.
   *
   * A part's doc is rendered under the `h3` that names the part, so its own
   * `h2` would climb over its owner. Pushed to `h4`, it reads as what it is,
   * and stops crowding the index, which lists `h2` and `h3`.
   */
  headingOffset?: number
}

/**
 * The unique id for a heading: prefixed when the document is a guest on
 * someone else's page, and numbered when the same title shows up twice inside
 * the same document.
 */
function idFor(text: string, options: MarkdownOptions, used: Set<string>) {
  const base = options.idPrefix ? `${options.idPrefix}-${anchor(text)}` : anchor(text)

  let id = base
  for (let count = 2; used.has(id); count++) id = `${base}-${count}`

  used.add(id)
  return id
}

/**
 * Content comes from files in this repo, never from third-party input.
 *
 * An instance per call, and not the shared `marked`: the renderer carries the
 * ids already handed out, and that set belongs to one document.
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
