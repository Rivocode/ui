import type { ComponentType } from 'react'
import { findParent } from '@/parts'
import { slugify } from '@/slug'

export { importPathOf } from '@/parts'

/* ---------------------------------------------------------------------------
 * O catalogo
 *
 * Nada aqui e escrito a mao. As docs e os exemplos ja moram na pasta que
 * alimenta o sync do claude.ai/design, e sao exatamente esses arquivos que este
 * site serve. Documentacao mantida como copia separada comeca a mentir na
 * primeira prop renomeada, e nenhum teste quebra para avisar.
 * ------------------------------------------------------------------------- */

const DOCS = import.meta.glob('../../../.design-sync/docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const EXAMPLES = import.meta.glob('../../../.design-sync/previews/*.tsx') as Record<
  string,
  () => Promise<Record<string, ComponentType>>
>

const EXAMPLE_SOURCES = import.meta.glob('../../../.design-sync/previews/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export type Entry = {
  name: string
  /** Endereco da pagina: `ToggleGroup` mora em `/componentes/toggle-group`. */
  slug: string
  family: string
  /** A primeira frase da doc, para a lista e para a busca. */
  summary: string
  body: string
  /** Carrega o modulo do exemplo sob demanda. Ausente quando nao ha preview. */
  loadExamples?: () => Promise<Record<string, ComponentType>>
  /** A fonte do exemplo, mostrada ao lado do que ela desenha. */
  exampleSource?: string
  /** O nome da peca que esta compoe, quando ela e parte de outra. */
  partOf?: string
  /** As pecas que compoem esta, documentadas na mesma pagina. */
  parts?: Entry[]
}

const fileName = (path: string) => path.split('/').pop()!.replace(/\.(md|tsx)$/, '')

function splitFrontmatter(raw: string) {
  const front = /^---\n([\s\S]*?)\n---\n/.exec(raw)
  if (!front) return { family: 'Geral', body: raw }
  return {
    family: /category:\s*(.+)/.exec(front[1])?.[1].trim() ?? 'Geral',
    body: raw.slice(front[0].length),
  }
}

/**
 * A doc abre com o proprio `# Nome`, que a pagina ja imprime como titulo.
 * Mantido no `.md` cru: arquivo servido sozinho precisa de titulo.
 */
function dropLeadingHeading(body: string) {
  return body.replace(/^\s*#\s+\S.*\n+/, '')
}

/** A primeira linha de prosa depois do titulo, sem marcacao. */
function firstSentence(body: string) {
  const line = body
    .split('\n')
    .map((text) => text.trim())
    .find((text) => text.length > 0 && !text.startsWith('#') && !text.startsWith('```'))

  if (!line) return ''
  const clean = line.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1')
  return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean
}

const exampleByName = new Map(
  Object.entries(EXAMPLES).map(([path, load]) => [fileName(path), load]),
)

const sourceByName = new Map(
  Object.entries(EXAMPLE_SOURCES).map(([path, source]) => [fileName(path), source]),
)

/**
 * Toda peca, partes incluidas, na ordem em que a barra lateral as le.
 *
 * Quem cria a entrada e a doc, e nao ha segunda fonte: peca que saia com
 * exemplo e sem doc caia aqui numa familia propria, "Sem documento", e esse
 * ramo sumiu porque o caso nao pode mais acontecer. O `bun run check:doc` cruza
 * os exports com `.design-sync/docs/` nos dois sentidos, entao export sem
 * pagina reprova no gate antes de chegar ao site.
 */
const ALL: Entry[] = Object.entries(DOCS)
  .map(([path, raw]) => {
    const name = fileName(path)
    const { family, body } = splitFrontmatter(raw)
    return {
      name,
      slug: slugify(name),
      family,
      body: dropLeadingHeading(body),
      summary: firstSentence(body),
      loadExamples: exampleByName.get(name),
      exampleSource: sourceByName.get(name),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

const NAMES = new Set(ALL.map((entry) => entry.name))

for (const entry of ALL) {
  const parent = findParent(entry.name, NAMES)
  if (!parent) continue

  entry.partOf = parent
  const owner = ALL.find((other) => other.name === parent)!
  owner.parts = [...(owner.parts ?? []), entry]
}

/** So as pecas de topo. Parte mora dentro da pagina de quem a compoe. */
export const ENTRIES: Entry[] = ALL.filter((entry) => !entry.partOf)

/* As familias seguem o caminho de quem monta uma tela: primeiro a moldura,
 * depois o que entra nela, depois o que responde de volta. */
const FAMILY_ORDER = [
  'Fundação',
  'Ações',
  'Formulário',
  'Estrutura',
  'Navegação',
  'Sobreposição',
  'Feedback',
  'Gráfico',
  'Geral',
]

/** Familia que ninguem lembrou de ordenar vai por ultimo, nunca primeiro. */
const rankOf = (family: string) => {
  const index = FAMILY_ORDER.indexOf(family)
  return index === -1 ? FAMILY_ORDER.length : index
}

export const FAMILIES = [...new Set(ENTRIES.map((entry) => entry.family))].sort(
  (a, b) => rankOf(a) - rankOf(b),
)

export const entriesOfFamily = (family: string) =>
  ENTRIES.filter((entry) => entry.family === family)

/** Aceita o slug, e o nome cru da peca para link escrito a mao. */
export const findEntry = (address: string) => {
  const wanted = address.toLowerCase()
  const found = ALL.find((entry) => entry.slug === wanted || entry.name.toLowerCase() === wanted)
  if (!found) return undefined

  // O endereco de uma parte leva a pagina de quem a compoe: e la que ela esta.
  if (found.partOf) return ALL.find((entry) => entry.name === found.partOf)
  return found
}

/** Quantas pecas tem exemplo que roda, e nao so texto. */
export const WITH_EXAMPLE = ENTRIES.filter((entry) => entry.loadExamples).length
