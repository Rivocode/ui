/* ---------------------------------------------------------------------------
 * O markdown cru
 *
 * O que `/componentes/table.md` responde. So a prosa nao bastava: um agente que
 * a le ainda tem que adivinhar o caminho de import, os nomes das props e quais
 * pecas compoem o componente - e ele adivinha com confianca, o que e pior que
 * falhar.
 *
 * Entao o arquivo e montado das mesmas fontes que a pagina HTML desenha: a doc,
 * o preview que roda na pagina, e o `.d.ts` que o build emite. Nada aqui e
 * segunda copia para manter; renomeie uma prop e os dois mudam.
 * ------------------------------------------------------------------------- */

import type { Prop } from './prop-types'

export type Part = {
  name: string
  /** A doc da propria parte, sem o titulo dela. */
  body: string
  props: Prop[]
}

export type RenderInput = {
  name: string
  /** O corpo da doc, ainda carregando o proprio `# Nome`. */
  body: string
  importPath: string
  props: Prop[]
  forwardsRootProps: boolean
  stories: Array<{ title: string; code: string }>
  parts: Part[]
  /** As pecas irmas da mesma familia, para continuar lendo. */
  related: Array<{ name: string; slug: string }>
}

/** Tipo de uniao carrega `|`, que encerraria a celula antes da hora. */
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

  // A coluna de versao existe para o agente que le isto sem saber qual versao o
  // projeto tem instalada: `—` e prop que ainda nao saiu em versao nenhuma.
  return `| Prop | Tipo | Obrigatória | Desde | O que faz |\n| --- | --- | --- | --- | --- |\n${rows}`
}

export function renderDoc(input: RenderInput) {
  const blocks: string[] = []

  // A doc abre com o proprio `# Nome` e com a prosa que explica quando a peca
  // serve; isso fica primeiro, porque e o que decide se vale ler o resto.
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
