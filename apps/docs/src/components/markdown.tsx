import { useMemo } from 'react'
import { renderMarkdown, type MarkdownOptions } from '@/render-markdown'

/* ---------------------------------------------------------------------------
 * Markdown
 *
 * The docs were written for an agent to read, so they are plain markdown:
 * heading, prose, list, code. The styling lives here and not inside the text,
 * so the same file serves the page and the raw `.md` address.
 * ------------------------------------------------------------------------- */

const CLASSES = [
  '[&_h1]:font-display [&_h1]:text-3xl [&_h1]:text-fg [&_h1]:mb-4',
  '[&_h2]:font-display [&_h2]:text-xl [&_h2]:text-fg [&_h2]:mt-10 [&_h2]:mb-3',
  '[&_h3]:font-sans [&_h3]:font-medium [&_h3]:text-lg [&_h3]:text-fg [&_h3]:mt-8 [&_h3]:mb-2',
  // A document pushed inside another: its heading drops a level without
  // shrinking along, otherwise the section vanishes in the middle of the prose.
  '[&_h4]:font-sans [&_h4]:font-medium [&_h4]:text-base [&_h4]:text-fg [&_h4]:mt-6 [&_h4]:mb-2',
  '[&_h5]:font-sans [&_h5]:font-medium [&_h5]:text-sm [&_h5]:text-fg [&_h5]:mt-5 [&_h5]:mb-2',

  '[&_p]:text-base [&_p]:leading-relaxed [&_p]:text-fg-muted [&_p]:my-4',
  '[&_strong]:text-fg [&_strong]:font-medium',
  '[&_a]:text-accent-text [&_a]:underline [&_a]:underline-offset-2',

  '[&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:marker:text-accent',
  '[&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:marker:text-fg-subtle',
  '[&_li]:text-base [&_li]:leading-relaxed [&_li]:text-fg-muted',

  // `break-words` on inline code: a name like
  // `accessibilityRole/accessibilityState` is a single word, wider than the
  // prose column at 320px, and unable to break it pushed the page (measured:
  // 33px of excess on /react-native). The break only happens when the word
  // does not fit on the line by itself, so nothing changes for what already
  // fit.
  '[&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-accent-text [&_code]:break-words',
  '[&_code]:bg-accent-subtle [&_code]:rounded-sm [&_code]:px-1.5 [&_code]:py-0.5',
  '[&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border',
  '[&_pre]:bg-surface [&_pre]:p-4',
  // On mobile a long line wraps instead of scrolling sideways: with no visible
  // scrollbar, the end of the command looked cut off, and whoever copied the
  // command did not see the rest.
  'max-sm:[&_pre]:whitespace-pre-wrap max-sm:[&_pre]:wrap-anywhere',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-fg [&_pre_code]:text-sm',

  // The table margin lives on the frame, not here: inside a scrolling
  // container, it would push the content instead of separating the table from
  // the prose.
  '[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
  '[&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:text-left [&_th]:text-fg',
  '[&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_td]:text-fg-muted',
].join(' ')

/*
 * The markdown table scrolls inside its own frame.
 *
 * A three-column table with a piece name and a code snippet inside does not
 * fit in 320px, and `<table>` does not shrink below its own minimum content:
 * it pushes the PAGE sideways. Measured at 320px, it was the cause of the
 * worst routes - /react-native went 116px past the viewport, /fundacao 102,
 * and the whole site scrolled sideways (WCAG 1.4.10, which asks that nothing
 * require scrolling on both axes).
 *
 * The way out is the same as `DataTable` and the props table: what scrolls is
 * the frame around it, and the `<table>` stays a `<table>` - with the rows,
 * the headers and the role the screen reader reads. Put `display:block` on
 * the table to make it scroll by itself and the drawing works, but the table
 * role goes with it, and with it cell navigation.
 *
 * The wrapper is applied to the finished HTML because the markdown arrives as
 * text: `marked` writes `<table>` with no attributes at all, and tables do not
 * nest in tables, so the swap is literal and unambiguous.
 */
const TABLE_FRAME = 'my-5 overflow-x-auto'

function frameTables(html: string) {
  return html
    .replaceAll('<table>', `<div class="${TABLE_FRAME}"><table>`)
    .replaceAll('</table>', '</table></div>')
}

export function Markdown({
  source,
  idPrefix,
  headingOffset,
}: { source: string } & MarkdownOptions) {
  const html = useMemo(
    () => frameTables(renderMarkdown(source, { idPrefix, headingOffset })),
    [source, idPrefix, headingOffset],
  )

  return <div className={CLASSES} dangerouslySetInnerHTML={{ __html: html }} />
}
