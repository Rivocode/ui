import type { ComponentType } from 'react'
import { DOC_INDEX } from 'virtual:catalog-index'
import { dropLeadingHeading, splitFrontmatter } from '@/doc-text'
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
 *
 * O que entra no chunk de entrada e so o indice - nome, familia e lede -, que
 * e o que a lista lateral desenha. Corpo e fonte de exemplo sao glob PREGUICOSO
 * de proposito: com `eager: true` os cento e cinquenta e sete corpos mais as
 * fontes dos previews viravam 1,77 MB de entrada, e a capa so pintava depois de
 * o navegador parsear todos eles. Ver o `catalogIndex` em `vite.config.ts`.
 * ------------------------------------------------------------------------- */

const DOC_BODIES = import.meta.glob('../../../.design-sync/docs/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const EXAMPLES = import.meta.glob('../../../.design-sync/previews/*.tsx') as Record<
  string,
  () => Promise<Record<string, ComponentType>>
>

const EXAMPLE_SOURCES = import.meta.glob('../../../.design-sync/previews/*.tsx', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

export type Entry = {
  name: string
  /** Endereco da pagina: `ToggleGroup` mora em `/componentes/toggle-group`. */
  slug: string
  family: string
  /** A primeira frase da doc, para a lista e para a busca. */
  summary: string
  /** Carrega a prosa da doc sob demanda: so a pagina aberta precisa dela. */
  loadBody: () => Promise<string>
  /** Carrega o modulo do exemplo sob demanda. Ausente quando nao ha preview. */
  loadExamples?: () => Promise<Record<string, ComponentType>>
  /** Carrega a fonte do exemplo, mostrada ao lado do que ela desenha. */
  loadSource?: () => Promise<string>
  /** O nome da peca que esta compoe, quando ela e parte de outra. */
  partOf?: string
  /** As pecas que compoem esta, documentadas na mesma pagina. */
  parts?: Entry[]
}

const fileName = (path: string) => path.split('/').pop()!.replace(/\.(md|tsx)$/, '')

const bodyByName = new Map(
  Object.entries(DOC_BODIES).map(([path, load]) => [
    fileName(path),
    async () => dropLeadingHeading(splitFrontmatter(await load()).body),
  ]),
)

const exampleByName = new Map(
  Object.entries(EXAMPLES).map(([path, load]) => [fileName(path), load]),
)

const sourceByName = new Map(
  Object.entries(EXAMPLE_SOURCES).map(([path, load]) => [fileName(path), load]),
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
const ALL: Entry[] = DOC_INDEX.map((doc) => ({
  name: doc.name,
  slug: slugify(doc.name),
  family: doc.family,
  summary: doc.summary,
  // O indice sai do mesmo `readdirSync` que este glob ve, entao a falta seria
  // um arquivo apagado entre o build e o request: a pagina abre sem prosa em
  // vez de estourar.
  loadBody: bodyByName.get(doc.name) ?? (async () => ''),
  loadExamples: exampleByName.get(doc.name),
  loadSource: sourceByName.get(doc.name),
})).sort((a, b) => a.name.localeCompare(b.name))

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
