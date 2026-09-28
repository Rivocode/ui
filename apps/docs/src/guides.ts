/* ---------------------------------------------------------------------------
 * Os guias
 *
 * As paginas de prosa: instalacao, primeira tela, tema, densidade, agentes.
 * Escritas a mao em `content/`, em portugues, porque nada disso da para derivar
 * da fonte - e o raciocinio em volta do codigo, e nao o codigo.
 *
 * O corpo carrega sob demanda, como o das pecas: os cinco guias somam 72 KB de
 * markdown, e a lista lateral so imprime o titulo deles.
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
  /** Guia listado e ainda nao escrito abre vazio, e nao com erro. */
  loadBody: () => Promise<string>
}

/** A mesma promessa em toda chamada: ver o `once` do `catalog.ts`. */
function once(load: () => Promise<string>) {
  let pending: Promise<string> | null = null
  return () => (pending ??= load())
}

export const GUIDES: Guide[] = GUIDE_LIST.map((guide) => ({
  ...guide,
  loadBody: once(CONTENT[`./content/${guide.slug}.md`] ?? (async () => '')),
}))

export const findGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug)
