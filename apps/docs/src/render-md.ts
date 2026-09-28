/* ---------------------------------------------------------------------------
 * The raw markdown
 *
 * What `/componentes/table.md` answers. The prose alone was not enough: an
 * agent reading it still has to guess the import path, the prop names and
 * which pieces compose the component - and it guesses with confidence, which
 * is worse than failing.
 *
 * So the file is assembled from the same sources the HTML page draws: the doc,
 * the preview that runs on the page, and the `.d.ts` the build emits. Nothing
 * here is a second copy to maintain; rename a prop and both change.
 * ------------------------------------------------------------------------- */

import type { Prop } from './prop-types'

export type Part = {
  name: string
  /** The part's own doc, without its title. */
  body: string
  props: Prop[]
}

export type RenderInput = {
  name: string
  /** The doc body, still carrying its own `# Name`. */
  body: string
  importPath: string
  props: Prop[]
  forwardsRootProps: boolean
  stories: Array<{ title: string; code: string }>
  parts: Part[]
  /** The sibling pieces of the same family, to keep reading. */
  related: Array<{ name: string; slug: string }>
}

/** A union type carries `|`, which would end the cell too early. */
const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()

function propsTable(props: Prop[]) {
  const rows = props
    .map(
      (prop) =>
        `| \`${prop.name}\` | \`${cell(prop.type)}\` | ${prop.required ? 'yes' : ''} | ${
          prop.since ?? '-'
        } | ${prop.note ? cell(prop.note) : ''} |`,
    )
    .join('\n')

  // The version column exists for the agent that reads this without knowing
  // which version the project has installed: `-` is a prop not yet released in
  // any version.
  return `| Prop | Type | Required | Since | What it does |\n| --- | --- | --- | --- | --- |\n${rows}`
}

export function renderDoc(input: RenderInput) {
  const blocks: string[] = []

  // The doc opens with its own `# Name` and with the prose that explains when
  // the piece fits; that goes first, because it decides whether the rest is
  // worth reading.
  blocks.push(input.body.trim())

  blocks.push(`## Import\n\n\`\`\`tsx\nimport { ${input.name} } from '${input.importPath}'\n\`\`\``)

  if (input.stories.length) {
    const examples = input.stories
      .map((story) => `### ${story.title}\n\n\`\`\`tsx\n${story.code.trim()}\n\`\`\``)
      .join('\n\n')

    blocks.push(`## Examples\n\n${examples}`)
  }

  const PASSES = 'Forwards `className`, `style`, `id` and the other attributes of the root element.'

  if (input.props.length) {
    const table = propsTable(input.props)
    blocks.push(`## Props\n\n${table}${input.forwardsRootProps ? `\n\nBeyond these: ${PASSES.charAt(0).toLowerCase()}${PASSES.slice(1)}` : ''}`)
  } else if (input.forwardsRootProps) {
    blocks.push(`## Props\n\nHas no props of its own. ${PASSES}`)
  }

  if (input.parts.length) {
    const parts = input.parts
      .map((part) => {
        const pieces = [`### ${part.name}`]
        if (part.body.trim()) pieces.push(part.body.trim())
        if (part.props.length) pieces.push(propsTable(part.props))
        return pieces.join('\n\n')
      })
      .join('\n\n')

    blocks.push(
      `## Parts\n\nThe component is assembled with the pieces below. All of them come from \`${input.importPath}\`.\n\n${parts}`,
    )
  }

  const links = [
    ...input.related.map((item) => `- [${item.name}](/componentes/${item.slug}.md)`),
    '- [Library conventions](/convencoes.md): Provider, tokens and the rules that apply to every piece',
    '- [Full index](/llms.txt)',
  ].join('\n')

  blocks.push(`## See also\n\n${links}`)

  return `${blocks.join('\n\n')}\n`
}
