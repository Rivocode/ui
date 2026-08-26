/* ---------------------------------------------------------------------------
 * The shape of a documented prop
 *
 * It lives apart from `props.ts` because that module *loads* the generated
 * catalog — a JSON imported through the `@/` alias, which only the site's
 * tsconfig knows how to resolve. Anything that merely needs the shape (the
 * markdown renderer, a test) would drag that import into its own type graph
 * and fail to compile somewhere else entirely.
 * ------------------------------------------------------------------------- */

export type Prop = {
  name: string
  type: string
  required: boolean
  /** The doc comment above the prop, when the source carries one. */
  note?: string
  /** The version this prop first shipped in. Absent means it has not shipped. */
  since?: string
}

/** A piece and what it forwards, as the generator writes it. */
export type Piece = { forwardsRoot: boolean; props: Prop[] }
