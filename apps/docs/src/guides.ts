/* ---------------------------------------------------------------------------
 * Os guias
 *
 * As paginas de prosa: instalacao, primeira tela, tema, densidade, agentes.
 * Escritas a mao em `content/`, em portugues, porque nada disso da para derivar
 * da fonte - e o raciocinio em volta do codigo, e nao o codigo.
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
