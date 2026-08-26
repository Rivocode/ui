import { useMemo } from 'react'
import { renderMarkdown, type MarkdownOptions } from '@/render-markdown'

/* ---------------------------------------------------------------------------
 * Markdown
 *
 * The docs were written to be read by an agent, so they are plain markdown:
 * heading, prose, list, code. Styling lives here and not inside the text, so
 * one file serves both the page and the raw `.md` address.
 * ------------------------------------------------------------------------- */

const CLASSES = [
  // Headings
  '[&_h1]:font-display [&_h1]:text-3xl [&_h1]:text-fg [&_h1]:mb-4',
  '[&_h2]:font-display [&_h2]:text-xl [&_h2]:text-fg [&_h2]:mt-10 [&_h2]:mb-3',
  '[&_h3]:font-sans [&_h3]:font-medium [&_h3]:text-lg [&_h3]:text-fg [&_h3]:mt-8 [&_h3]:mb-2',
  // Um documento empurrado para dentro de outro: o titulo dele desce de nivel
  // sem encolher junto, senao a secao some no meio da prosa.
  '[&_h4]:font-sans [&_h4]:font-medium [&_h4]:text-base [&_h4]:text-fg [&_h4]:mt-6 [&_h4]:mb-2',
  '[&_h5]:font-sans [&_h5]:font-medium [&_h5]:text-sm [&_h5]:text-fg [&_h5]:mt-5 [&_h5]:mb-2',

  // Prose
  '[&_p]:text-base [&_p]:leading-relaxed [&_p]:text-fg-muted [&_p]:my-4',
  '[&_strong]:text-fg [&_strong]:font-medium',
  '[&_a]:text-accent-text [&_a]:underline [&_a]:underline-offset-2',

  // Lists
  '[&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:marker:text-accent',
  '[&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:marker:text-fg-subtle',
  '[&_li]:text-base [&_li]:leading-relaxed [&_li]:text-fg-muted',

  // Code
  '[&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-accent-text',
  '[&_code]:bg-accent-subtle [&_code]:rounded-sm [&_code]:px-1.5 [&_code]:py-0.5',
  '[&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border',
  '[&_pre]:bg-surface [&_pre]:p-4',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-fg [&_pre_code]:text-sm',

  // Table
  '[&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
  '[&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:text-left [&_th]:text-fg',
  '[&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_td]:text-fg-muted',
].join(' ')

export function Markdown({
  source,
  idPrefix,
  headingOffset,
}: { source: string } & MarkdownOptions) {
  const html = useMemo(
    () => renderMarkdown(source, { idPrefix, headingOffset }),
    [source, idPrefix, headingOffset],
  )

  return <div className={CLASSES} dangerouslySetInnerHTML={{ __html: html }} />
}
