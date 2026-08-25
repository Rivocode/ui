/* ---------------------------------------------------------------------------
 * Example source
 *
 * Cutting one story out of a preview file, and naming it. Shared by the page,
 * which renders the story next to the code, and by the plugin that writes the
 * same code into the raw `.md`.
 * ------------------------------------------------------------------------- */

/**
 * The previews open themselves for the camera. Not for a reader.
 *
 * Every floating piece carries `defaultOpen` in `.design-sync/previews`,
 * because the sync photographs each one and a closed dialog photographs as an
 * empty box. On a page that flag means a modal opens over the docs the moment
 * someone lands on `/componentes/dialog`, and what the reader copies opens by
 * itself in their app too.
 *
 * Not every `defaultOpen` is that, though. On a sidebar or an accordion the
 * flag is the example: a sidebar that starts collapsed is showing the reader
 * the wrong half. So the strip asks which element the flag belongs to, and
 * these keep it.
 */
const KEEPS_OPEN = new Set([
  'SidebarProvider',
  'Collapsible',
  'Accordion',
  'AccordionItem',
  'Tree',
  'TreeSelect',
])

/**
 * Opt-out for the story whose whole point is being open.
 *
 * The tag list above cannot reach this case: in one file the "Fechado" story
 * has to stay closed and the "Aberto" one has to open, and both use the same
 * tag. Without a per-story escape, the `Select` example titled "Aberto"
 * rendered closed and still reserved the height of a list that never came,
 * which is an example lying about its own name.
 *
 * The marker is stripped from the code the reader copies: it is documentation
 * scaffolding, not something to carry home.
 */
const KEEP_OPEN_MARK = String.raw`\s*(?:\{\s*)?\/\*\s*rc-keep-open\s*\*\/(?:\s*\})?`

export function withoutAutoOpen(code: string) {
  const pattern = new RegExp(
    String.raw`(\s+)defaultOpen(?![\w$])(?!\s*[=:])(${KEEP_OPEN_MARK})?`,
    'g',
  )

  return code.replace(pattern, (match, space: string, mark: string | undefined, at: number) => {
    if (mark !== undefined) return `${space}defaultOpen`

    // Walk back to the tag that owns the attribute: the last `<Name` before
    // it, as long as no `>` closed that tag first.
    const before = code.slice(0, at)
    const opened = before.lastIndexOf('<')
    if (opened === -1) return match
    if (before.slice(opened).includes('>')) return match

    const tag = /^<([A-Za-z][\w.]*)/.exec(before.slice(opened))?.[1]
    return tag && KEEPS_OPEN.has(tag) ? match : ''
  })
}

/**
 * `ComoLink` → `Como link`. The export name is a JS identifier; the heading
 * above the example is for a person reading the page.
 */
export function titleOf(exportName: string) {
  const spaced = exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')

  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/**
 * The heading for a story: the doc comment above it when there is one, the
 * export name turned into words when there is not.
 *
 * The export name is a JS identifier and belongs in English like the rest of
 * the code; the heading is read by a person, in Portuguese. Deriving one from
 * the other forced the two to be the same word, so the comment wins when the
 * preview bothers to write one.
 */
export function titleFromSource(source: string, name: string) {
  const at = source.indexOf(`export function ${name}(`)
  if (at === -1) return titleOf(name)

  const before = source.slice(0, at).trimEnd()
  if (!before.endsWith('*/')) return titleOf(name)

  const opened = before.lastIndexOf('/**')
  if (opened === -1) return titleOf(name)

  const first = before
    .slice(opened + 3, before.length - 2)
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').trim())
    .find((line) => line.length > 0)

  return first || titleOf(name)
}

/** The exported stories of a preview file, in the order they were written. */
export function storyNamesOf(source: string) {
  return [...source.matchAll(/^export function (\w+)\(/gm)].map((match) => match[1])
}

/** Cuts one export out of the example file, so only that story is shown. */
export function sliceSource(source: string, name: string) {
  const start = source.indexOf(`export function ${name}(`)
  if (start === -1) return null

  const next = source.indexOf('\nexport function ', start + 1)
  const body = (next === -1 ? source.slice(start) : source.slice(start, next)).trimEnd()

  // An import that lists a dozen pieces wraps over several lines, and taking
  // only the lines that start with `import` cut it down to a lone `import {`.
  // The statement runs until the line that carries its `from`.
  const imports: string[] = []
  const lines = source.split('\n')

  for (let index = 0; index < lines.length; index++) {
    if (!lines[index].startsWith('import ')) continue

    const statement = [lines[index]]
    while (!/\bfrom\s+['"]/.test(statement[statement.length - 1]) && index + 1 < lines.length) {
      statement.push(lines[++index])
    }

    imports.push(statement.join('\n'))
  }

  return withoutAutoOpen(`${imports.join('\n')}\n\n${body}`)
}
