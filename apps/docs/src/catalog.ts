import type { ComponentType } from 'react'
import { findParent } from '@/parts'
import { slugify } from '@/slug'

export { importPathOf } from '@/parts'

/* ---------------------------------------------------------------------------
 * The catalog
 *
 * Nothing here is written by hand. The docs and the examples already live in
 * the folder that feeds the claude.ai/design sync, and those are the very
 * files this site serves. Documentation kept as a separate copy starts lying
 * on the first renamed prop, and no test breaks to say so.
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
  /** Address of the page: `ToggleGroup` lives at `/componentes/toggle-group`. */
  slug: string
  family: string
  /** First sentence of the doc, for the list and for search. */
  summary: string
  body: string
  /** Loads the example module on demand. Absent when there is no preview. */
  loadExamples?: () => Promise<Record<string, ComponentType>>
  /** Example source, shown next to what it draws. */
  exampleSource?: string
  /** Ships in the library and has an example, but no doc written yet. */
  undocumented?: boolean
  /** Name of the piece this one composes, when it is a part of another. */
  partOf?: string
  /** The pieces that compose this one, documented on the same page. */
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
 * The doc opens with its own `# Name`, which the page already prints as the
 * heading. Kept in the raw `.md`, a file served on its own needs a title.
 */
function dropLeadingHeading(body: string) {
  return body.replace(/^\s*#\s+\S.*\n+/, '')
}

/** The first line of prose after the title, stripped of markup. */
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

const DOCUMENTED: Entry[] = Object.entries(DOCS).map(([path, raw]) => {
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

/*
 * Fourteen pieces from the Base UI wave landed with an example and no doc.
 * Hiding them would make for a pretty, lying site: they ship in the package,
 * and someone searching for `Slider` has to find it. They show up with the
 * example that already runs, and with the gap stated.
 */
const EXAMPLE_ONLY: Entry[] = [...exampleByName.keys()]
  .filter((name) => !DOCUMENTED.some((entry) => entry.name === name))
  .map((name) => ({
    name,
    slug: slugify(name),
    family: 'Sem documento',
    body: '',
    summary: 'Existe na biblioteca e tem exemplo, mas ainda nao foi documentada.',
    loadExamples: exampleByName.get(name),
    exampleSource: sourceByName.get(name),
    undocumented: true,
  }))

const ALL: Entry[] = [...DOCUMENTED, ...EXAMPLE_ONLY].sort((a, b) => a.name.localeCompare(b.name))

const NAMES = new Set(ALL.map((entry) => entry.name))

for (const entry of ALL) {
  const parent = findParent(entry.name, NAMES)
  if (!parent) continue

  entry.partOf = parent
  const owner = ALL.find((other) => other.name === parent)!
  owner.parts = [...(owner.parts ?? []), entry]
}

/** Top-level pieces only. A part lives inside the page of what composes it. */
export const ENTRIES: Entry[] = ALL.filter((entry) => !entry.partOf)

/* Families follow the path of someone building a screen: the frame first,
 * then what goes in it, then what answers back. */
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
  'Sem documento',
]

/** A family nobody thought to order goes last, never first. */
const rankOf = (family: string) => {
  const index = FAMILY_ORDER.indexOf(family)
  return index === -1 ? FAMILY_ORDER.length : index
}

export const FAMILIES = [...new Set(ENTRIES.map((entry) => entry.family))].sort(
  (a, b) => rankOf(a) - rankOf(b),
)

export const entriesOfFamily = (family: string) =>
  ENTRIES.filter((entry) => entry.family === family)

/** Accepts the slug, and the bare component name for links written by hand. */
export const findEntry = (address: string) => {
  const wanted = address.toLowerCase()
  const found = ALL.find((entry) => entry.slug === wanted || entry.name.toLowerCase() === wanted)
  if (!found) return undefined

  // A part's address leads to the page of what composes it: that is where it is.
  if (found.partOf) return ALL.find((entry) => entry.name === found.partOf)
  return found
}

/** How many pieces have a running example, not just text. */
export const WITH_EXAMPLE = ENTRIES.filter((entry) => entry.loadExamples).length

/** The gap, counted and in plain sight: shipped but not documented. */
export const UNDOCUMENTED = ENTRIES.filter((entry) => entry.undocumented).length
