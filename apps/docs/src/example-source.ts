/* ---------------------------------------------------------------------------
 * The source of an example
 *
 * Cutting a story out of a preview file, and giving it a name. Used by the
 * page, which draws the story next to the code, and by the plugin that writes
 * that same code into the raw `.md`.
 * ------------------------------------------------------------------------- */

/**
 * The previews open for the camera. Not for the reader.
 *
 * Every floating piece carries `defaultOpen` in `.design-sync/previews`,
 * because the sync photographs each one and a closed dialog photographs as an
 * empty box. On the page that flag means a modal opens over the doc the
 * moment someone lands on `/componentes/dialog`, and what the person copies
 * opens by itself in their app too.
 *
 * Not every `defaultOpen` is that, however. In a sidebar or an accordion the
 * flag IS the example: a sidebar that starts collapsed shows the wrong half.
 * So the pruning asks which element the flag belongs to, and these keep it.
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
 * The way out for the story whose subject is precisely being open.
 *
 * The tag list above does not reach this case: in the same file the "Closed"
 * story has to stay closed and the "Open" one has to open, and both use the
 * same tag. Without a per-story escape, the `Select` example called "Open"
 * drew closed and still reserved the height of a list that never came - an
 * example lying about its own name.
 *
 * The mark is removed from the code the person copies: it is documentation
 * scaffolding, not something to take home.
 */
const KEEP_OPEN_MARK = String.raw`\s*(?:\{\s*)?\/\*\s*rc-keep-open\s*\*\/(?:\s*\})?`

export function withoutAutoOpen(code: string, mode: 'display' | 'runtime' = 'display') {
  const pattern = new RegExp(
    String.raw`(\s+)defaultOpen(?![\w$])(?!\s*[=:])(${KEEP_OPEN_MARK})?`,
    'g',
  )

  return code.replace(pattern, (match, space: string, mark: string | undefined, at: number) => {
    // A story marked keep-open draws inside the iframe, and there
    // `defaultOpen` is not enough: the popup cannot take focus from the outer
    // page on mount, and the piece reads that as "focus left, close". On the
    // page it runs with a controlled `open`, which has no way to close; the
    // reader keeps seeing and copying `defaultOpen`, which is what works in an
    // app.
    if (mark !== undefined) return mode === 'runtime' ? `${space}open` : `${space}defaultOpen`

    // Walks back to the tag that owns the attribute: the last `<Name` before
    // it, as long as no `>` closed that tag on the way.
    const before = code.slice(0, at)
    const opened = before.lastIndexOf('<')
    if (opened === -1) return match
    if (before.slice(opened).includes('>')) return match

    const tag = /^<([A-Za-z][\w.]*)/.exec(before.slice(opened))?.[1]
    return tag && KEEPS_OPEN.has(tag) ? match : ''
  })
}

/**
 * `AsLink` -> `As link`. The export name is a JS identifier; the title above
 * the example is for whoever reads the page.
 */
export function titleOf(exportName: string) {
  const spaced = exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')

  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/**
 * A story's title: the doc block above it when there is one, and the export
 * name turned into words when there is not.
 *
 * The export name is a JS identifier; the title is read by a person. Deriving
 * one from the other forced both to be the same word, so the comment always
 * wins when the preview takes the trouble to write one.
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

/** The stories exported from a preview, in the order they were written. */
export function storyNamesOf(source: string) {
  return [...source.matchAll(/^export function (\w+)\(/gm)].map((match) => match[1])
}

/**
 * Whether this story asked to stay open on the page.
 *
 * A story that is open on purpose cannot draw inline: its popup anchors to
 * the page's own window and flies over the neighboring cards - or, worse, a
 * modal opens over the doc. The stage draws these inside the iframe, where
 * the popup's world ends at the card's edge.
 */
export function storyKeepsOpen(source: string, name: string) {
  const start = source.indexOf(`export function ${name}(`)
  if (start === -1) return false

  const next = source.indexOf('\nexport function ', start + 1)
  const body = next === -1 ? source.slice(start) : source.slice(start, next)
  return body.includes('rc-keep-open')
}

/* ---------------------------------------------------------------------------
 * Cutting a story together with what it leans on
 *
 * A story is rarely alone in its file. `Command.tsx` writes the `GROUPS` that
 * feeds the palette above it; `Form.tsx` writes the Zod `schema`;
 * `ToastViewport.tsx` writes the little component that fires the toast.
 * Taking only the exported function published three examples that do not
 * run: the page showed `groups={GROUPS}` with no `GROUPS` anywhere, and
 * whoever copied got a red screen with no hint that the file it came from
 * compiles.
 *
 * So the cut follows what the story names. Everything at the top of the file
 * is a candidate; what the body cites comes along, and what those bring in
 * turn comes too, so a constant made of another constant does not arrive
 * half-way. What nobody cites stays out - the purpose of the cut is still to
 * show one story, not the whole file.
 * ------------------------------------------------------------------------- */

/**
 * The name a top-level statement declares, when it declares one.
 *
 * The doc block above the statement travels with it, so the name is read
 * after it. Reading from the first character returned nothing for every
 * statement that took the trouble to explain itself - which is almost all of
 * them, and that is how `ToastViewport` published a story calling a component
 * the person could not see.
 */
function declaredName(text: string) {
  const code = text.replace(/^(?:\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*)+/, '')
  const match =
    /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|type|interface|enum)\s+([A-Za-z_$][\w$]*)/.exec(
      code,
    )
  return match?.[1] ?? null
}

const OPENS_STATEMENT =
  /^(?:import|export|const|let|var|function|async|class|type|interface|enum)\b|^\/\*|^\/\//

/** Whether everything this text opened was closed again. */
function isBalanced(text: string) {
  let depth = 0
  let inBlockComment = false

  for (let index = 0; index < text.length; index++) {
    const two = text.slice(index, index + 2)
    if (inBlockComment) {
      if (two === '*/') {
        inBlockComment = false
        index++
      }
      continue
    }
    if (two === '/*') {
      inBlockComment = true
      index++
      continue
    }
    const character = text[index]
    if (character === '{' || character === '(' || character === '[') depth++
    if (character === '}' || character === ')' || character === ']') depth--
  }

  return depth <= 0 && !inBlockComment
}

const isOnlyComment = (text: string) =>
  text
    .split('\n')
    .every((line) => line.trim() === '' || /^\s*(?:\/\/|\/\*|\*)/.test(line))

/**
 * The file split into its top-level statements, each with the doc block
 * written above it.
 *
 * A statement starts at column zero - the previews are formatted, so an
 * indented line is always inside something - and a comment block sticks to
 * what it introduces, which is what keeps a doc block from being cut away
 * from the constant it explains.
 */
function topLevelStatements(source: string) {
  const statements: string[] = []
  let current: string[] = []

  const flush = () => {
    const text = current.join('\n').trim()
    if (text) statements.push(text)
    current = []
  }

  for (const line of source.split('\n')) {
    const pending = current.join('\n')
    if (
      OPENS_STATEMENT.test(line) &&
      pending.trim() &&
      isBalanced(pending) &&
      !isOnlyComment(pending)
    ) {
      flush()
    }
    current.push(line)
  }

  flush()
  return statements
}

const mentions = (text: string, name: string) => new RegExp(`\\b${name}\\b`).test(text)

/** Cuts one export out of the example file, so only that story shows. */
export function sliceSource(source: string, name: string) {
  const start = source.indexOf(`export function ${name}(`)
  if (start === -1) return null

  const next = source.indexOf('\nexport function ', start + 1)
  const raw = next === -1 ? source.slice(start) : source.slice(start, next)

  /*
   * The next story's doc block sits above its `export`, so cutting at the
   * `export` brought that block along: every example but the last on each
   * page ended with a loose `/** Vertical *\/` that belongs to the example
   * below.
   */
  const body = raw.replace(/(?:\n\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*$/, '').trimEnd()

  // An import that lists a dozen pieces breaks across several lines, and
  // taking only the lines that start with `import` reduced it to a lone
  // `import {`. The statement runs to the line that carries its `from`.
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

  /*
   * The supporting statements, chased until no new name shows up.
   *
   * The story is the seed, and each round asks the text gathered so far which
   * of the remaining statements it cites. A single pass would not do: a story
   * that cites `GROUPS` and a `GROUPS` made of a `ROWS` above it would publish
   * the group and leave the rows behind - the same broken example, one line
   * further down.
   */
  const candidates = topLevelStatements(source)
    .filter((statement) => !statement.startsWith('import '))
    .map((statement) => ({ text: statement, name: declaredName(statement) }))
    .filter((statement) => statement.name !== null && statement.name !== name)

  const taken = new Set<string>()
  let text = body
  let found = true

  while (found) {
    found = false
    for (const candidate of candidates) {
      if (taken.has(candidate.name!)) continue
      if (!mentions(text, candidate.name!)) continue

      taken.add(candidate.name!)
      text += `\n${candidate.text}`
      found = true
    }
  }

  const support = candidates.filter((candidate) => taken.has(candidate.name!))
  const parts = [imports.join('\n'), ...support.map((item) => item.text), body].filter(Boolean)

  return withoutAutoOpen(parts.join('\n\n'))
}
