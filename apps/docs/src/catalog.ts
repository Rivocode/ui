import type { ComponentType } from 'react'
import { DOC_INDEX } from 'virtual:catalog-index'
import { dropLeadingHeading, splitFrontmatter } from '@/doc-text'
import { findParent } from '@/parts'
import { pieceOf } from '@/props'
import { slugify } from '@/slug'

export { importPathOf } from '@/parts'

/* ---------------------------------------------------------------------------
 * The catalog
 *
 * Nothing here is written by hand. The docs and the examples already live in
 * the folder that feeds the claude.ai/design sync, and those are exactly the
 * files this site serves. Documentation kept as a separate copy starts lying
 * at the first renamed prop, and no test breaks to warn about it.
 *
 * What goes into the entry chunk is only the index - name, family and lede -,
 * which is what the sidebar draws. Body and example source are LAZY globs on
 * purpose: with `eager: true` the hundred and fifty-seven bodies plus the
 * preview sources became 1.77 MB of entry, and the cover only painted after
 * the browser parsed all of them. See `catalogIndex` in `vite.config.ts`.
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

/**
 * One promise per file, not one per call.
 *
 * React's `use()` finds the same data again by the promise's identity: with a
 * new one on every render, the page suspended, mounted, asked again and
 * suspended once more, never settling.
 */
function once<T>(load: () => Promise<T>) {
  let pending: Promise<T> | null = null
  return () => (pending ??= load())
}

export type Entry = {
  name: string
  /** The page address: `ToggleGroup` lives at `/componentes/toggle-group`. */
  slug: string
  family: string
  /** The doc's first sentence, for the list and for search. */
  summary: string
  /** Loads the doc prose on demand: only the open page needs it. */
  loadBody: () => Promise<string>
  /** Loads the example module on demand. Absent when there is no preview. */
  loadExamples?: () => Promise<Record<string, ComponentType>>
  /** Loads the example source, shown next to what it draws. */
  loadSource?: () => Promise<string>
  /** The name of the piece this one composes, when it is part of another. */
  partOf?: string
  /** The pieces that compose this one, documented on the same page. */
  parts?: Entry[]
}

const fileName = (path: string) => path.split('/').pop()!.replace(/\.(md|tsx)$/, '')

const bodyByName = new Map(
  Object.entries(DOC_BODIES).map(([path, load]) => [
    fileName(path),
    once(async () => dropLeadingHeading(splitFrontmatter(await load()).body)),
  ]),
)

const exampleByName = new Map(
  Object.entries(EXAMPLES).map(([path, load]) => [fileName(path), once(load)]),
)

const sourceByName = new Map(
  Object.entries(EXAMPLE_SOURCES).map(([path, load]) => [fileName(path), once(load)]),
)

/**
 * Every piece, parts included, in the order the sidebar reads them.
 *
 * The doc is what creates the entry, and there is no second source: a piece
 * that shipped with an example and no doc used to land here in a family of
 * its own, "No document", and that branch is gone because the case can no
 * longer happen. `bun run check:doc` crosses the exports with
 * `.design-sync/docs/` in both directions, so an export without a page fails
 * the gate before it reaches the site.
 */
const ALL: Entry[] = DOC_INDEX.map((doc) => ({
  name: doc.name,
  slug: slugify(doc.name),
  family: doc.family,
  summary: doc.summary,
  // The index comes from the same `readdirSync` this glob sees, so a miss would
  // be a file deleted between the build and the request: the page opens
  // without prose instead of blowing up.
  loadBody: bodyByName.get(doc.name) ?? once(async () => ''),
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

/** Only the top-level pieces. A part lives inside the page of whoever composes it. */
export const ENTRIES: Entry[] = ALL.filter((entry) => !entry.partOf)

/* The families follow the path of someone building a screen: first the frame,
 * then what goes into it, then what answers back. */
const FAMILY_ORDER = [
  'Foundation',
  'Typography',
  'Actions',
  'Forms',
  'Structure',
  'Navigation',
  'Overlays',
  'Feedback',
  'Charts',
  'AI',
  'General',
]

/** A family nobody remembered to rank goes last, never first. */
const rankOf = (family: string) => {
  const index = FAMILY_ORDER.indexOf(family)
  return index === -1 ? FAMILY_ORDER.length : index
}

export const FAMILIES = [...new Set(ENTRIES.map((entry) => entry.family))].sort(
  (a, b) => rankOf(a) - rankOf(b),
)

export const entriesOfFamily = (family: string) =>
  ENTRIES.filter((entry) => entry.family === family)

/** Accepts the slug, and the raw piece name for hand-written links. */
export const findEntry = (address: string) => {
  const wanted = address.toLowerCase()
  const found = ALL.find((entry) => entry.slug === wanted || entry.name.toLowerCase() === wanted)
  if (!found) return undefined

  // A part's address leads to the page of whoever composes it: that is where it is.
  if (found.partOf) return ALL.find((entry) => entry.name === found.partOf)
  return found
}

/** How many pieces have an example that runs, and not just text. */
export const WITH_EXAMPLE = ENTRIES.filter((entry) => entry.loadExamples).length

/**
 * Requests at once everything the page is going to read.
 *
 * Each `use()` only fires its own download when React reaches it, and React
 * only reaches the next one after the previous resolves: the piece's examples,
 * those of each part, the prose and the props table became a queue of one
 * request at a time. Measured on Select with Lighthouse's network (150 ms
 * round trip), it was eight 1 KB chunks in a queue, 1.4 s of waiting alone,
 * and the props JSON only left after all of them. Since each loader keeps its
 * promise, the `use()` calls below receive these same ones, already in flight.
 *
 * The caller is the shell, not the page: the page is a lazy chunk, and asking
 * from there meant the data only left after it arrived. From the shell, they
 * come down together with it.
 */
export function preloadPage(address: string) {
  const entry = findEntry(address)
  if (!entry) return

  for (const item of [entry, ...(entry.parts ?? [])]) {
    const pending = [item.loadBody(), item.loadExamples?.(), item.loadSource?.(), pieceOf(item.name)]
    // The failure belongs to whoever reads the promise, through `use()` and the
    // boundary; here it just must not become a loose rejection before anyone
    // gets there.
    for (const promise of pending) promise?.catch(() => {})
  }
}
