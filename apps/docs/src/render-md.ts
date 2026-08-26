/* ---------------------------------------------------------------------------
 * The raw markdown
 *
 * What `/componentes/table.md` answers. The prose alone was not enough: an
 * agent that reads it still has to guess the import path, the prop names and
 * which pieces compose the component, and it guesses confidently, which is
 * worse than failing.
 *
 * So the file is assembled from the very sources the HTML page renders: the
 * doc, the preview that runs on the page, and the `.d.ts` the build emits.
 * Nothing here is a second copy to maintain, rename a prop and both change.
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
  /** Sibling pieces of the same family, to keep reading. */
  related: Array<{ name: string; slug: string }>
}

/** A union type carries `|`, which would end the cell early. */
const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()

function propsTable(props: Prop[]) {
  const rows = props
    .map(
      (prop) =>
        `| \`${prop.name}\` | \`${cell(prop.type)}\` | ${prop.required ? 'sim' : ''} | ${
          prop.since ?? '—'
        } | ${prop.note ? cell(prop.note) : ''} |`,
    )
    .join('\n')

  // A coluna de versão existe para o agente que lê isto sem saber qual versão
  // o projeto tem instalada: `—` é prop que ainda não saiu em versão nenhuma.
  return `| Prop | Tipo | Obrigatória | Desde | O que faz |\n| --- | --- | --- | --- | --- |\n${rows}`
}

export function renderDoc(input: RenderInput) {
  const blocks: string[] = []

  // The doc opens with its own `# Name` and the prose that explains when the
  // piece serves, that stays first, because it is what decides whether to
  // read the rest.
  blocks.push(input.body.trim())

  blocks.push(`## Importação\n\n\`\`\`tsx\nimport { ${input.name} } from '${input.importPath}'\n\`\`\``)

  if (input.stories.length) {
    const examples = input.stories
      .map((story) => `### ${story.title}\n\n\`\`\`tsx\n${story.code.trim()}\n\`\`\``)
      .join('\n\n')

    blocks.push(`## Exemplos\n\n${examples}`)
  }

  const PASSES = 'Repassa `className`, `style`, `id` e os demais atributos do elemento raiz.'

  if (input.props.length) {
    const table = propsTable(input.props)
    blocks.push(`## Props\n\n${table}${input.forwardsRootProps ? `\n\nAlém dessas: ${PASSES.charAt(0).toLowerCase()}${PASSES.slice(1)}` : ''}`)
  } else if (input.forwardsRootProps) {
    blocks.push(`## Props\n\nNão tem prop própria. ${PASSES}`)
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
      `## Partes\n\nO componente se monta com as peças abaixo. Todas vêm de \`${input.importPath}\`.\n\n${parts}`,
    )
  }

  const links = [
    ...input.related.map((item) => `- [${item.name}](/componentes/${item.slug}.md)`),
    '- [Convenções da biblioteca](/convencoes.md): Provider, tokens e as regras que valem para toda peça',
    '- [Índice completo](/llms.txt)',
  ].join('\n')

  blocks.push(`## Ver também\n\n${links}`)

  return `${blocks.join('\n\n')}\n`
}
