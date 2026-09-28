/* ---------------------------------------------------------------------------
 * The shape of a documented prop
 *
 * It lives away from `props.ts` because that module LOADS the generated
 * catalog - a JSON imported through the `@/` alias, which only the site's
 * tsconfig knows how to resolve. Whoever needs just the shape (the markdown
 * renderer, a test) would drag that import into their own type graph and stop
 * compiling somewhere else.
 * ------------------------------------------------------------------------- */

export type Prop = {
  name: string
  type: string
  required: boolean
  /** The doc block above the prop, when the source carries one. */
  note?: string
  /** The version the prop shipped in. Absent means it has not shipped yet. */
  since?: string
}

/** A piece and what it forwards, the way the generator writes it. */
export type Piece = { forwardsRoot: boolean; props: Prop[] }
