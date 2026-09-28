/* ---------------------------------------------------------------------------
 * The props, for the page
 *
 * The table is generated from the compiler, by `scripts/catalog-props.ts`, and
 * committed as JSON. A hand-written props table is the first thing to rot: a
 * prop gets renamed, the table keeps the old name, and the page lies with
 * confidence. What existed before rotted one step earlier - the tables were
 * read from a `.d.ts` snapshot left by a bundle sync, stamped 0.1.0, that
 * carried no callbacks at all.
 *
 * `bun run check:props` fails when this file drifts from the types.
 *
 * The JSON weighs 500 KB - every prop of every piece, with note and version -,
 * and a piece page only reads its own tables. It arrives sliced, one chunk per
 * page, through `propsByPage` in `vite.config.ts`: whole, it was the largest
 * download of the piece page and the last one to arrive.
 * ------------------------------------------------------------------------- */

import { LOADERS } from 'virtual:component-props'
import type { Piece, Prop } from '@/prop-types'

export type { Prop, Piece } from '@/prop-types'

/*
 * One promise per piece, not one per render: it is by this identity that
 * `use()` recognizes data that has already arrived. A piece without a table
 * requests nothing.
 */
const byComponent = new Map<string, Promise<Piece | undefined>>()

export function pieceOf(component: string): Promise<Piece | undefined> {
  let found = byComponent.get(component)
  if (!found) {
    const load = LOADERS[component]
    found = load ? load().then((mod) => mod.default[component]) : Promise.resolve(undefined)
    byComponent.set(component, found)
  }
  return found
}

export function propsOf(piece: Piece | undefined): Prop[] {
  return piece?.props ?? []
}

/** Whether this component forwards the usual root props. */
export function forwardsRootProps(piece: Piece | undefined) {
  return piece?.forwardsRoot ?? false
}
