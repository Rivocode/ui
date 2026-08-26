/* ---------------------------------------------------------------------------
 * Where a piece lives, for whoever reads the raw markdown
 *
 * A part does not get a page of its own. It is already published whole - prose,
 * props and the example that assembles it - inside the page of the piece that
 * composes it, and the standalone version never had an example: there is
 * nothing to demonstrate about a `CardHeader` without the `Card` around it.
 * Seventy-six of the hundred and fifty-seven files were that, and each one cost
 * an agent a fetch that added nothing.
 *
 * These two functions live here, and not inside the plugin, so a test can read
 * them without building the site first. The test that reads `dist/` passes on
 * the machine that just built and fails in CI, which is the worst kind: it
 * looks like a guard and it is a coin toss.
 * ------------------------------------------------------------------------- */

/** `/componentes/card.md#cardheader` — the part, inside whoever assembles it. */
export function addressOf(slug: string, part?: { name: string; ownerSlug: string }) {
  if (!part) return `/componentes/${slug}.md`
  return `/componentes/${part.ownerSlug}.md#${part.name.toLowerCase()}`
}

/** One line of the index. A part is indented under the piece, and says so. */
export function indexLine(name: string, slug: string, owner?: { name: string; slug: string }) {
  if (!owner) return `- [${name}](${addressOf(slug)})`

  const address = addressOf(slug, { name, ownerSlug: owner.slug })
  return `  - [${name}](${address}) — parte de ${owner.name}`
}

/**
 * The note left at the part's old address.
 *
 * An agent that kept the link cannot be met with emptiness, so the address
 * keeps answering — with three lines that say what this is and where the whole
 * thing lives.
 */
export function partNote(name: string, owner: { name: string; slug: string }) {
  return (
    `# ${name}\n\n${name} é parte de ${owner.name}, e é documentada na página ` +
    `dele — com a prosa, a tabela de props e o exemplo que monta as duas:\n\n` +
    `[/componentes/${owner.slug}.md](${addressOf(name, { name, ownerSlug: owner.slug })})\n`
  )
}
