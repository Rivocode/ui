/* ---------------------------------------------------------------------------
 * Where a piece lives, for whoever reads the raw markdown
 *
 * A part does not get its own page. It is already published in full - prose,
 * props and the example that assembles it - inside the page of the piece it
 * composes, and the standalone version never had an example: there is nothing
 * to demonstrate about a `CardHeader` without the `Card` around it. Seventy-six
 * of the hundred and fifty-seven files were that, and each one cost an agent a
 * fetch that added nothing.
 *
 * These two functions live here, and not inside the plugin, so a test can read
 * them without building the site first. A test that reads `dist/` passes on
 * the machine that just built and fails in CI, which is the worst kind: it
 * looks like a guard and is a coin toss.
 * ------------------------------------------------------------------------- */

/** `/componentes/card.md#cardheader` - the part, inside whoever assembles it. */
export function addressOf(slug: string, part?: { name: string; ownerSlug: string }) {
  if (!part) return `/componentes/${slug}.md`
  return `/componentes/${part.ownerSlug}.md#${part.name.toLowerCase()}`
}

/**
 * One index line, in the llmstxt.org format: `- [name](address): note`.
 * A part is indented under the piece, and the note opens saying it is a part.
 */
export function indexLine(
  name: string,
  slug: string,
  owner?: { name: string; slug: string },
  summary?: string,
) {
  const note = summary?.trim()

  if (!owner) return `- [${name}](${addressOf(slug)})${note ? `: ${note}` : ''}`

  const address = addressOf(slug, { name, ownerSlug: owner.slug })
  return `  - [${name}](${address}): part of ${owner.name}${note ? `. ${note}` : ''}`
}

/**
 * The note left at the part's old address.
 *
 * An agent that saved the link cannot be met with nothing, so the address
 * keeps answering - with three lines saying what that is and where the whole
 * thing lives.
 */
export function partNote(name: string, owner: { name: string; slug: string }) {
  return (
    `# ${name}\n\n${name} is part of ${owner.name}, and is documented on its ` +
    `page, with the prose, the props table and the example that assembles both:\n\n` +
    `[/componentes/${owner.slug}.md](${addressOf(name, { name, ownerSlug: owner.slug })})\n`
  )
}
