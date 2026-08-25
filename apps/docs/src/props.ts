/* ---------------------------------------------------------------------------
 * Props, for the page
 *
 * The API table is read from the `.d.ts` the package build emits, one file per
 * component. Hand-written prop tables are the first thing to rot: a prop gets
 * renamed, the table keeps the old name, and the page lies with confidence.
 *
 * The parsing itself lives in `props-parse.ts`, shared with the plugin that
 * writes the raw markdown.
 * ------------------------------------------------------------------------- */

import { parseProps, parsesRootProps, type Prop } from '@/props-parse'

export type { Prop }

/*
 * From a committed JSON, no longer from a glob over `ds-bundle/`: that
 * directory is 14 MB and stays out of Git, so the published site shipped every
 * piece's prose and not one prop. `bun run scripts/tipos-do-catalogo.ts`
 * regenerates this file after a fresh sync.
 */
import TYPES from '@/component-types.json'

const byName = new Map<string, string>(Object.entries(TYPES as Record<string, string>))

export function propsOf(component: string): Prop[] {
  return parseProps(byName.get(component), component)
}

/** Whether this component forwards the usual root props. */
export function forwardsRootProps(component: string) {
  return parsesRootProps(byName.get(component))
}
