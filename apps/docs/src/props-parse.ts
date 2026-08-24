/* ---------------------------------------------------------------------------
 * Prop parsing
 *
 * Pure text in, prop list out. It lives apart from `props.ts` because two very
 * different callers need the same answer: the page, which loads the `.d.ts`
 * through Vite's glob, and the plugin that writes the raw `.md`, which reads
 * the same files from disk in Node. Two parsers would drift, and the markdown
 * an agent reads would stop matching the table a person sees.
 * ------------------------------------------------------------------------- */

export type Prop = {
  name: string
  type: string
  required: boolean
  /** The doc comment above the prop, when the source carries one. */
  note?: string
}

/** Props every component forwards to its root element, listed once, elsewhere. */
export const PASSTHROUGH = new Set(['className', 'style', 'id', 'children'])

/**
 * Splits an interface body on the commas of its own top level, so a union that
 * carries commas inside `<>` or `{}` is not cut in half.
 */
export function splitMembers(body: string) {
  const members: string[] = []
  let depth = 0
  let current = ''

  for (const char of body) {
    if ('<{(['.includes(char)) depth++
    if ('>})]'.includes(char)) depth--

    if ((char === ';' || char === '\n') && depth === 0) {
      if (current.trim()) members.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) members.push(current.trim())
  return members
}

export function parseProps(source: string | undefined, component: string): Prop[] {
  if (!source) return []

  const start = source.indexOf(`interface ${component}Props`)
  if (start === -1) return []

  const open = source.indexOf('{', start)
  let depth = 0
  let end = open

  for (let index = open; index < source.length; index++) {
    if (source[index] === '{') depth++
    if (source[index] === '}') depth--
    if (depth === 0) {
      end = index
      break
    }
  }

  const body = source.slice(open + 1, end)
  const props: Prop[] = []
  let pendingNote: string | undefined

  for (const member of splitMembers(body)) {
    if (member.startsWith('/*') || member.startsWith('*') || member.startsWith('//')) {
      const text = member.replace(/^[/*\s]+|[*/\s]+$/g, '').trim()
      if (text) pendingNote = text
      continue
    }

    const match = /^(\w+)(\?)?:\s*([\s\S]+)$/.exec(member)
    if (!match) continue

    props.push({
      name: match[1],
      required: !match[2],
      type: match[3].replace(/\s+/g, ' ').trim(),
      note: pendingNote,
    })
    pendingNote = undefined
  }

  // Required first, then alphabetical: what the caller must pass comes before
  // what it may pass.
  return props
    .filter((prop) => !PASSTHROUGH.has(prop.name))
    .sort((a, b) =>
      a.required === b.required ? a.name.localeCompare(b.name) : a.required ? -1 : 1,
    )
}

/** Whether this component forwards the usual root props. */
export function parsesRootProps(source: string | undefined) {
  return Boolean(source && /className\?:/.test(source))
}
