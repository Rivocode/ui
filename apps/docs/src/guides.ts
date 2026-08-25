/* ---------------------------------------------------------------------------
 * Guides
 *
 * The prose pages: install, first screen, theming, density, agents. Written by
 * hand in `content/`, in Portuguese, because none of it can be derived from
 * the source, it is the reasoning around the code, not the code.
 * ------------------------------------------------------------------------- */

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

/** Order is the reading order, not the alphabet: install before customize. */
const ORDER: Array<{ slug: string; title: string; summary: string }> = [
  {
    slug: 'instalacao',
    title: 'Instalação',
    summary: 'Um comando, as duas linhas de CSS e o Provider.',
  },
  {
    slug: 'inicio-rapido',
    title: 'Início rápido',
    summary: 'Uma tela de verdade: formulário que valida e listagem com os estados.',
  },
  {
    slug: 'temas',
    title: 'Temas e personalização',
    summary: 'As três camadas de token, e um tema de cliente do começo ao fim.',
  },
  {
    slug: 'densidade',
    title: 'Densidade',
    summary: 'A mesma tela em duas alturas, sem dois catálogos.',
  },
  {
    slug: 'icones',
    title: 'Ícones',
    summary: 'Um conjunto, um conceito por ícone, e o tamanho de cada contexto.',
  },
  {
    slug: 'para-agents',
    title: 'Para agents',
    summary: 'Markdown cru, llms.txt e como pedir no prompt.',
  },
  {
    slug: 'skill',
    title: 'Skill',
    summary: 'Um comando, e o agente aprende a biblioteca inteira.',
  },
]

const bodyOf = (slug: string) => CONTENT[`./content/${slug}.md`] ?? ''

export const GUIDES: Guide[] = ORDER.map((guide) => ({ ...guide, body: bodyOf(guide.slug) }))

export const findGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug)
