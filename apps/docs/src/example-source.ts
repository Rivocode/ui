/* ---------------------------------------------------------------------------
 * A fonte de um exemplo
 *
 * Recortar uma historia de dentro de um arquivo de preview, e dar nome a ela.
 * Usada pela pagina, que desenha a historia ao lado do codigo, e pelo plugin
 * que escreve esse mesmo codigo no `.md` cru.
 * ------------------------------------------------------------------------- */

/**
 * Os previews se abrem para a camera. Nao para quem le.
 *
 * Toda peca flutuante carrega `defaultOpen` em `.design-sync/previews`, porque
 * o sync fotografa cada uma e um dialog fechado fotografa como caixa vazia. Na
 * pagina essa flag quer dizer que um modal abre por cima da doc no instante em
 * que alguem cai em `/componentes/dialog`, e o que a pessoa copia abre sozinho
 * no app dela tambem.
 *
 * Nem todo `defaultOpen` e isso, no entanto. Numa sidebar ou num accordion a
 * flag E o exemplo: uma sidebar que comeca encolhida mostra a metade errada.
 * Entao a poda pergunta de qual elemento e a flag, e estes aqui ficam com ela.
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
 * A saida para a historia cujo assunto e justamente estar aberta.
 *
 * A lista de tags acima nao alcanca este caso: num mesmo arquivo a historia
 * "Fechado" tem que ficar fechada e a "Aberto" tem que abrir, e as duas usam a
 * mesma tag. Sem um escape por historia, o exemplo do `Select` chamado "Aberto"
 * desenhava fechado e ainda reservava a altura de uma lista que nunca vinha -
 * um exemplo mentindo sobre o proprio nome.
 *
 * A marca sai do codigo que a pessoa copia: ela e andaime de documentacao, e
 * nao coisa para levar para casa.
 */
const KEEP_OPEN_MARK = String.raw`\s*(?:\{\s*)?\/\*\s*rc-keep-open\s*\*\/(?:\s*\})?`

export function withoutAutoOpen(code: string, mode: 'display' | 'runtime' = 'display') {
  const pattern = new RegExp(
    String.raw`(\s+)defaultOpen(?![\w$])(?!\s*[=:])(${KEEP_OPEN_MARK})?`,
    'g',
  )

  return code.replace(pattern, (match, space: string, mark: string | undefined, at: number) => {
    // Historia marcada com keep-open desenha dentro do iframe, e la o
    // `defaultOpen` nao basta: o popup nao consegue tomar o foco da pagina de
    // fora na montagem, e a peca le isso como "o foco saiu, fecha". Na pagina
    // ela roda com `open` controlado, que nao tem como fechar; quem le
    // continua vendo e copiando `defaultOpen`, que e o que serve num app.
    if (mark !== undefined) return mode === 'runtime' ? `${space}open` : `${space}defaultOpen`

    // Volta ate a tag dona do atributo: o ultimo `<Nome` antes dele, desde que
    // nenhum `>` tenha fechado essa tag no caminho.
    const before = code.slice(0, at)
    const opened = before.lastIndexOf('<')
    if (opened === -1) return match
    if (before.slice(opened).includes('>')) return match

    const tag = /^<([A-Za-z][\w.]*)/.exec(before.slice(opened))?.[1]
    return tag && KEEPS_OPEN.has(tag) ? match : ''
  })
}

/**
 * `ComoLink` -> `Como link`. O nome do export e identificador de JS; o titulo
 * em cima do exemplo e para quem le a pagina.
 */
export function titleOf(exportName: string) {
  const spaced = exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')

  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/**
 * O titulo de uma historia: o bloco de doc acima dela quando existe, e o nome
 * do export virado em palavras quando nao existe.
 *
 * O nome do export e identificador de JS e vai em ingles como o resto do
 * codigo; o titulo e lido por uma pessoa, em portugues. Derivar um do outro
 * obrigava os dois a serem a mesma palavra, entao o comentario ganha sempre que
 * o preview se der ao trabalho de escrever um.
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

/** As historias exportadas de um preview, na ordem em que foram escritas. */
export function storyNamesOf(source: string) {
  return [...source.matchAll(/^export function (\w+)\(/gm)].map((match) => match[1])
}

/**
 * Se esta historia pediu para ficar aberta na pagina.
 *
 * Historia que e aberta de proposito nao pode desenhar inline: o popup dela se
 * ancora na janela da propria pagina e voa por cima dos cartoes vizinhos - ou,
 * pior, um modal abre por cima da doc. O palco desenha essas dentro do iframe,
 * onde o mundo do popup acaba na borda do cartao.
 */
export function storyKeepsOpen(source: string, name: string) {
  const start = source.indexOf(`export function ${name}(`)
  if (start === -1) return false

  const next = source.indexOf('\nexport function ', start + 1)
  const body = next === -1 ? source.slice(start) : source.slice(start, next)
  return body.includes('rc-keep-open')
}

/* ---------------------------------------------------------------------------
 * Recortar uma historia junto com aquilo em que ela se apoia
 *
 * Historia raramente esta sozinha no arquivo. O `Command.tsx` escreve o
 * `GROUPS` que alimenta a paleta acima dela; o `Form.tsx` escreve o `schema` do
 * Zod; o `ToastViewport.tsx` escreve o componentezinho que dispara o aviso.
 * Levar so a funcao exportada publicou tres exemplos que nao rodam: a pagina
 * mostrava `groups={GROUPS}` sem nenhum `GROUPS` em lugar nenhum, e quem
 * copiava recebia tela vermelha sem nenhuma pista de que o arquivo de onde
 * aquilo veio compila.
 *
 * Entao o recorte segue o que a historia nomeia. Tudo que esta no topo do
 * arquivo e candidato; o que o corpo cita vem junto, e o que esses trazem por
 * sua vez tambem vem, para que uma constante feita de outra constante nao
 * chegue pela metade. O que ninguem cita fica de fora - o proposito do recorte
 * continua sendo mostrar uma historia, e nao o arquivo inteiro.
 * ------------------------------------------------------------------------- */

/**
 * O nome que uma declaracao de topo declara, quando ela declara algum.
 *
 * O bloco de doc acima da declaracao viaja junto com ela, entao o nome e lido
 * depois dele. Ler a partir do primeiro caractere devolvia nada para toda
 * declaracao que se deu ao trabalho de se explicar - que sao quase todas, e foi
 * assim que o `ToastViewport` publicou uma historia chamando um componente que
 * a pessoa nao conseguia ver.
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

/** Se tudo que este texto abriu foi fechado de novo. */
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
 * O arquivo partido nas suas declaracoes de topo, cada uma com o bloco de doc
 * escrito acima dela.
 *
 * Declaracao comeca na coluna zero - os previews sao formatados, entao linha
 * indentada esta sempre dentro de alguma coisa - e bloco de comentario cola no
 * que ele apresenta, que e o que impede um bloco de doc de ser cortado longe da
 * constante que ele explica.
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

/** Recorta um export do arquivo de exemplo, para so aquela historia aparecer. */
export function sliceSource(source: string, name: string) {
  const start = source.indexOf(`export function ${name}(`)
  if (start === -1) return null

  const next = source.indexOf('\nexport function ', start + 1)
  const raw = next === -1 ? source.slice(start) : source.slice(start, next)

  /*
   * O bloco de doc da historia seguinte fica acima do `export` dela, entao
   * cortar no `export` trazia esse bloco junto: todo exemplo menos o ultimo de
   * cada pagina terminava num `/** Vertical *\/` solto que e do exemplo de
   * baixo.
   */
  const body = raw.replace(/(?:\n\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*$/, '').trimEnd()

  // Um import que lista uma duzia de pecas quebra em varias linhas, e pegar so
  // as linhas que comecam com `import` reduzia ele a um `import {` sozinho. A
  // declaracao vai ate a linha que carrega o `from` dela.
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
   * As declaracoes de apoio, perseguidas ate nenhum nome novo aparecer.
   *
   * A historia e a semente, e cada rodada pergunta ao texto ja juntado quais
   * das declaracoes restantes ele cita. Uma passada so nao daria conta: uma
   * historia que cita `GROUPS` e um `GROUPS` feito de um `ROWS` acima dele
   * publicariam o grupo e deixariam as linhas para tras - que e o mesmo exemplo
   * quebrado, uma linha mais abaixo.
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
