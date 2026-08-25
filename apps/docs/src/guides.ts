/* ---------------------------------------------------------------------------
 * Guides
 *
 * The prose pages: install, first screen, theming, density, agents. Written by
 * hand in `content/`, in Portuguese, because none of it can be derived from
 * the source, it is the reasoning around the code, not the code.
 * ------------------------------------------------------------------------- */

import { GUIDE_LIST } from './guide-list'

const CONTENT = import.meta.glob('./content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export type Guide = {
  slug: string
  title: string
  summary: string
  body: string
}

const bodyOf = (slug: string) => CONTENT[`./content/${slug}.md`] ?? ''

export const GUIDES: Guide[] = GUIDE_LIST.map((guide) => ({ ...guide, body: bodyOf(guide.slug) }))

export const findGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug)
