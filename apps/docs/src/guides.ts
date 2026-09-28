/* ---------------------------------------------------------------------------
 * The guides
 *
 * The prose pages: installation, first screen, theme, density, agents. Written
 * by hand in `content/`, because none of it can be derived from the source -
 * it is the reasoning around the code, not the code.
 *
 * The body loads on demand, like the pieces': the guides add up to 72 KB of
 * markdown, and the sidebar only prints their titles.
 * ------------------------------------------------------------------------- */

import { GUIDE_LIST } from './guide-list'

const CONTENT = import.meta.glob('./content/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

export type Guide = {
  slug: string
  title: string
  summary: string
  /** A guide listed and not yet written opens empty, not with an error. */
  loadBody: () => Promise<string>
}

/** The same promise on every call: see `once` in `catalog.ts`. */
function once(load: () => Promise<string>) {
  let pending: Promise<string> | null = null
  return () => (pending ??= load())
}

export const GUIDES: Guide[] = GUIDE_LIST.map((guide) => ({
  ...guide,
  loadBody: once(CONTENT[`./content/${guide.slug}.md`] ?? (async () => '')),
}))

export const findGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug)
