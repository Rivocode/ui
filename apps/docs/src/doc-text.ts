/* ---------------------------------------------------------------------------
 * The text of a document, read from both sides
 *
 * The page reads the `.md` in the browser and the catalog index reads the same
 * `.md` at build time. While each side had its own copy of these three
 * functions, the lede in the sidebar and the one in the index could drift
 * apart with nothing flagging it - and the lede is the only text of the
 * document the site loads before the piece is opened.
 * ------------------------------------------------------------------------- */

/** Splits the top `---` from the body. Without frontmatter, the family is "General". */
export function splitFrontmatter(raw: string) {
  const front = /^---\n([\s\S]*?)\n---\n/.exec(raw)
  if (!front) return { family: 'General', body: raw }
  return {
    family: /category:\s*(.+)/.exec(front[1])?.[1].trim() ?? 'General',
    body: raw.slice(front[0].length),
  }
}

/**
 * The doc opens with its own `# Name`, which the page already prints as the
 * title. Kept in the raw `.md`: a file served on its own needs a title.
 */
export function dropLeadingHeading(body: string) {
  return body.replace(/^\s*#\s+\S.*\n+/, '')
}

/** The first line of prose after the title, without markup. */
export function firstSentence(body: string) {
  const line = body
    .split('\n')
    .map((text) => text.trim())
    .find((text) => text.length > 0 && !text.startsWith('#') && !text.startsWith('```'))

  if (!line) return ''
  const clean = line.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1')
  return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean
}
