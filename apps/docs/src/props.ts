/* ---------------------------------------------------------------------------
 * Props, for the page
 *
 * The table is generated from the compiler, by `scripts/props-do-catalogo.ts`,
 * and committed as JSON. Hand-written prop tables are the first thing to rot: a
 * prop gets renamed, the table keeps the old name, and the page lies with
 * confidence. What we had before rotted a step earlier - the tables were parsed
 * out of a `.d.ts` snapshot left behind by a bundle sync, stamped 0.1.0, which
 * carried no callback at all.
 *
 * `bun run check:props` fails when this file drifts from the types.
 * ------------------------------------------------------------------------- */

import CATALOG from '@/component-props.json'
import type { Piece, Prop } from '@/prop-types'

export type { Prop, Piece } from '@/prop-types'

const byName = new Map<string, Piece>(Object.entries(CATALOG as Record<string, Piece>))

export function propsOf(component: string): Prop[] {
  return byName.get(component)?.props ?? []
}

/** Whether this component forwards the usual root props. */
export function forwardsRootProps(component: string) {
  return byName.get(component)?.forwardsRoot ?? false
}
