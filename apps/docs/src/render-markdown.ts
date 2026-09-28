import { Marked } from 'marked'
import { anchor } from './anchor'

/* ---------------------------------------------------------------------------
 * Markdown para HTML, com endereco para cada titulo
 *
 * O id de um titulo e para onde a coluna da direita aponta, onde um `#` colado
 * aterrissa, e o que identifica a linha dentro do indice. Entao ele tem que ser
 * unico na pagina - e uma pagina nao e um documento so: a doc da peca, e a doc
 * de cada parte mostrada embaixo dela, sao desenhadas lado a lado.
 *
 * O `Button` foi o caso que quebrou: a doc dele e a do `ButtonGroup` escrevem
 * as duas `## No React Native`, entao a pagina carregava o mesmo id duas vezes.
 * O `#` so alcancava um deles, e o indice - identificado por esse id - parou de
 * reconciliar e passou a deixar linhas orfas para tras em cada navegacao.
 * ------------------------------------------------------------------------- */

export type MarkdownOptions = {
  /** Assina os ids deste documento, para duas docs numa pagina nao colidirem. */
  idPrefix?: string
  /**
   * Quanto empurrar os titulos para baixo.
   *
   * A doc de uma parte e desenhada embaixo do `h3` que nomeia a parte, entao o
   * `h2` dela subiria por cima de quem a compoe. Empurrado para `h4`, ele le
   * como o que e, e para de lotar o indice, que lista `h2` e `h3`.
   */
  headingOffset?: number
}

/**
 * O id unico de um titulo: com prefixo quando o documento e hospede na pagina
 * de outro, e numerado quando o mesmo titulo aparece duas vezes dentro do mesmo
 * documento.
 */
function idFor(text: string, options: MarkdownOptions, used: Set<string>) {
  const base = options.idPrefix ? `${options.idPrefix}-${anchor(text)}` : anchor(text)

  let id = base
  for (let count = 2; used.has(id); count++) id = `${base}-${count}`

  used.add(id)
  return id
}

/**
 * O conteudo vem de arquivos deste repositorio, nunca de entrada de terceiro.
 *
 * Uma instancia por chamada, e nao o `marked` compartilhado: o renderer carrega
 * os ids ja distribuidos, e esse conjunto pertence a um documento so.
 */
export function renderMarkdown(source: string, options: MarkdownOptions = {}) {
  const used = new Set<string>()
  const marked = new Marked({ gfm: true, breaks: false })

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        const level = Math.min(depth + (options.headingOffset ?? 0), 6)
        return `<h${level} id="${idFor(text, options, used)}">${text}</h${level}>\n`
      },
    },
  })

  return marked.parse(source) as string
}
