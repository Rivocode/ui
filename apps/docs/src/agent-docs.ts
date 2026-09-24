import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { indexLine, partNote } from './agent-address'
import { dropLeadingHeading, firstSentence, splitFrontmatter } from './doc-text'
import { sliceSource, storyNamesOf, titleFromSource } from './example-source'
import { GUIDE_LIST } from './guide-list'
import { findParent, importPathOf } from './parts'
import type { Prop } from './prop-types'
import { renderDoc, type Part } from './render-md'
import { slugify } from './slug'

/* ---------------------------------------------------------------------------
 * O que o site entrega a quem le com agent
 *
 * `/llms.txt`, `/llms-full.txt`, o `.md` de cada peca e de cada guia, as
 * convencoes e a skill. Tudo sai de uma funcao so, `agentFiles`, e as tres
 * pontas leem dela: o `generateBundle` do build, o middleware do `vite dev` e
 * o teste `test/markdown-para-agents.test.ts`.
 *
 * Mora aqui, e nao dentro do `vite.config.ts`, para o teste poder chamar a
 * mesma funcao que o build chama sem construir o site antes. Teste que le
 * `dist/` passa na maquina que acabou de construir e falha na CI, onde o
 * `check` roda antes de qualquer build.
 * ------------------------------------------------------------------------- */

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const DOCS_DIR = here('../../../.design-sync/docs')
const PREVIEWS_DIR = here('../../../.design-sync/previews')
const PROPS_FILE = here('./component-props.json')
const CONVENTIONS = here('../../../.design-sync/conventions.md')
/*
 * A skill mora onde o Claude Code procura, e nao numa pasta so para o site: uma
 * segunda copia divergiria da primeira no dia seguinte, e a que o site entrega
 * e justamente a que precisa estar certa.
 */
const SKILL_DIR = here('../../../.claude/skills/rivocode-ui')
const GUIDES_DIR = here('./content')

export const SITE = 'https://ds.rivocode.com.br'

/** Os arquivos da skill, na ordem em que o corpo dela os cita. */
function skillFiles(): string[] {
  const refs = readdirSync(`${SKILL_DIR}/reference`)
    .filter((file) => file.endsWith('.md'))
    .map((file) => `reference/${file}`)

  return ['SKILL.md', ...refs]
}

export type Doc = { name: string; slug: string; family: string; body: string }

export function readDocs(): Doc[] {
  return readdirSync(DOCS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const { family, body } = splitFrontmatter(readFileSync(`${DOCS_DIR}/${file}`, 'utf8'))
      return {
        name: file.replace(/\.md$/, ''),
        slug: slugify(file.replace(/\.md$/, '')),
        family,
        body,
      }
    })
}

/**
 * Os guias em prosa, por slug, com o titulo e a lede.
 *
 * Sao servidos crus como as paginas de peca. O guia e onde mora o porque - como
 * se escreve um tema, por que densidade e um atributo so -, e e disso que um
 * agente precisa antes da primeira linha.
 */
export function readGuides() {
  const guides = new Map<string, { title: string; summary: string; body: string }>()

  for (const { slug, title, summary } of GUIDE_LIST) {
    try {
      guides.set(slug, { title, summary, body: readFileSync(`${GUIDES_DIR}/${slug}.md`, 'utf8') })
    } catch {
      // Guia listado e ainda nao escrito simplesmente nao e servido.
    }
  }

  return guides
}

const guideMarkdown = (guide: { title: string; body: string }) =>
  `# ${guide.title}\n\n${guide.body.trimStart()}`

function readPreviews() {
  const sources = new Map<string, string>()
  for (const file of readdirSync(PREVIEWS_DIR)) {
    if (!file.endsWith('.tsx')) continue
    sources.set(file.replace(/\.tsx$/, ''), readFileSync(`${PREVIEWS_DIR}/${file}`, 'utf8'))
  }
  return sources
}

/**
 * As props de cada peca, por nome, lidas do arquivo que a extracao escreve. Ele
 * sai do compilador em `scripts/props-do-catalogo.ts`, e o `check:props` falha
 * quando o comitado diverge da fonte.
 */
export type Piece = { forwardsRoot: boolean; props: Prop[] }

export function readTypes() {
  try {
    return new Map<string, Piece>(
      Object.entries(JSON.parse(readFileSync(PROPS_FILE, 'utf8')) as Record<string, Piece>),
    )
  } catch {
    // Ainda nao gerado: as tabelas saem vazias, e a pagina serve assim mesmo.
    return new Map<string, Piece>()
  }
}

/**
 * Uma leitura por build, e nao uma por documento. Varrer os previews cento e
 * tantas vezes para escrever cento e tantos arquivos e o desperdicio que so
 * aparece como build lento que ninguem sabe explicar.
 */
function readAll(docs: Doc[]) {
  const previews = readPreviews()
  const types = readTypes()
  return { previews, types, names: new Set([...docs.map((item) => item.name), ...previews.keys()]) }
}

type Sources = ReturnType<typeof readAll>

/** O corpo de `/componentes/<slug>.md`, dos mesmos arquivos que a pagina le. */
function buildMarkdown(doc: Doc, docs: Doc[], { previews, types, names }: Sources) {
  const partOf = (name: string) => findParent(name, names)

  const partNames = [...names].filter((name) => partOf(name) === doc.name).sort()

  /*
   * Os exemplos da peca, e os das partes dela - a mesma regra da pagina. Uma
   * parte nao tem `.md` proprio, entao o preview dela so tem este endereco
   * para chegar a quem le. Sem isto, `RadioGroup.md` saia sem um exemplo
   * sequer, com dois escritos em `Radio.tsx`.
   */
  const stories = [doc.name, ...partNames].flatMap((name) => {
    const source = previews.get(name)
    if (!source) return []
    return storyNamesOf(source)
      .map((story) => ({
        title: titleFromSource(source, story),
        code: sliceSource(source, story) ?? '',
      }))
      .filter((story) => story.code)
  })

  const parts: Part[] = partNames.map((name) => ({
    name,
    body: dropLeadingHeading(docs.find((item) => item.name === name)?.body ?? ''),
    props: types.get(name)?.props ?? [],
  }))

  const related = docs
    .filter((item) => item.family === doc.family && item.name !== doc.name && !partOf(item.name))
    .slice(0, 6)
    .map((item) => ({ name: item.name, slug: item.slug }))

  return renderDoc({
    name: doc.name,
    body: doc.body.trimStart(),
    importPath: importPathOf(doc.name),
    props: types.get(doc.name)?.props ?? [],
    forwardsRootProps: types.get(doc.name)?.forwardsRoot ?? false,
    stories,
    parts,
    related,
  })
}

/** As familias em ordem alfabetica, cada uma com os documentos dela. */
function byFamily(docs: Doc[]) {
  const families = new Map<string, Doc[]>()
  for (const doc of docs) {
    const list = families.get(doc.family) ?? []
    list.push(doc)
    families.set(doc.family, list)
  }

  return [...families.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, items]) => [family, items.sort((a, b) => a.name.localeCompare(b.name))] as const)
}

const summaryLine = (pieces: number, documents: number) =>
  `Design system da RivoCode: ${pieces} peças em ${documents} documentos, tokens em três camadas, dois temas e duas densidades.`

/*
 * O indice que o agente le, no formato de llmstxt.org: titulo, resumo em
 * citacao, prosa, e uma secao por assunto com `- [nome](endereco): descricao`.
 *
 * Parte entra debaixo da peca que ela compoe, e nao ao lado. Quarenta e cinco
 * das entradas daqui sao partes - CardHeader, DialogFooter, SelectItem -, e
 * lista-las no mesmo nivel faz o agente contar cento e vinte e seis pecas,
 * gastar contexto abrindo CardTitle.md como se ela existisse sozinha, e perder
 * a unica coisa que importa sobre ela: que so existe dentro do Card.
 */
function indexForAgents(docs: Doc[]) {
  const names = new Set(docs.map((doc) => doc.name))
  const parentOf = (name: string) => findParent(name, names)

  const pieces = docs.filter((doc) => !parentOf(doc.name)).length

  const sections = byFamily(docs)
    .map(([family, items]) => {
      const lines = items
        .map((doc) => {
          const parent = parentOf(doc.name)
          const owner = parent ? docs.find((item) => item.name === parent) : undefined
          return indexLine(
            doc.name,
            doc.slug,
            owner && { name: owner.name, slug: owner.slug },
            firstSentence(doc.body),
          )
        })
        .join('\n')
      return `## ${family}\n\n${lines}`
    })
    .join('\n\n')

  const guides = [...readGuides()]
    .map(([slug, guide]) => `- [${guide.title}](/${slug}.md): ${guide.summary}`)
    .join('\n')

  return `# @rivocode/ui

> ${summaryLine(pieces, docs.length)} Cada endereço abaixo entrega markdown cru, sem HTML em volta, para leitura por agent.

Tudo numa leitura só, sem seguir link: [/llms-full.txt](/llms-full.txt), com as
convenções, os guias e o documento de cada peça, concatenados.

## Comece por aqui: instale a skill

Se você é um agent que lê skills — Claude Code, Cursor, Codex, qualquer um que
carregue uma pasta com \`SKILL.md\` —, **instale a nossa antes de ler o resto desta
página**:

\`\`\`bash
npx rivocode-ui skill
\`\`\`

Sem a biblioteca no projeto, use \`npx -y @rivocode/ui skill\`. O comando escreve
\`.claude/skills/rivocode-ui/\` e o agent \`rivocode-ui\` em \`.claude/agents/\`, e
copia a skill da versão instalada, que é a que fala das peças que o projeto tem.

Ela traz o contrato inteiro em disco — o método de montar uma tela, a forma da
tarefa, o texto da interface, o Provider, o vocabulário de classes, a escolha
entre peças parecidas, acessibilidade, formulário, gráfico, tema e React Native
—, em arquivos que você abre só quando o trabalho pede. Sem ela, cada peça custa uma busca nesta página e a API volta a ser
adivinhada pelo nome.

- [Skill](/skill.md): instruções completas, inclusive sem gerenciador de pacote
- [SKILL.md](/skill/SKILL.md): a skill crua, para ler sem instalar

## Se não der para instalar

Leia [/convencoes.md](/convencoes.md): é o contrato de uso da biblioteca, com o
RivoProvider, o vocabulário de classes e as regras que valem para todo componente.
Depois, o documento da peça que interessa, na lista abaixo.

- [Convenções](/convencoes.md): Provider, tokens e as regras que valem para toda peça

## Guias

${guides}

${sections}
`
}

/**
 * O site inteiro num arquivo, para o agent que prefere uma leitura so a vinte
 * fetches. A ordem e a do indice: convencoes, guias, e as pecas por familia.
 * Parte nao entra solta, porque ja esta inteira na pagina de quem a compoe.
 */
function fullForAgents(docs: Doc[], pages: Map<string, string>) {
  const names = new Set(docs.map((doc) => doc.name))
  const pieces = docs.filter((doc) => !findParent(doc.name, names))

  const chunks: Array<[string, string]> = [['/convencoes.md', readFileSync(CONVENTIONS, 'utf8')]]

  for (const [slug, guide] of readGuides()) chunks.push([`/${slug}.md`, guideMarkdown(guide)])

  for (const [, items] of byFamily(pieces)) {
    for (const doc of items) {
      const address = `/componentes/${doc.slug}.md`
      chunks.push([address, pages.get(address.slice(1))!])
    }
  }

  const body = chunks
    .map(([address, text]) => `---\n\nEndereço: ${SITE}${address}\n\n${text.trim()}`)
    .join('\n\n')

  return `# @rivocode/ui — documentação completa

> ${summaryLine(pieces.length, docs.length)} Este arquivo junta o contrato, os guias e o documento de cada peça, na ordem de ${SITE}/llms.txt.

${body}
`
}

/**
 * Todo arquivo que o site entrega a agents, por caminho dentro do `dist`.
 *
 * Parte nao ganha pagina propria: ela ja e publicada inteira - prosa, props e
 * o exemplo que a monta - dentro da pagina de quem a compoe. O endereco antigo
 * continua respondendo, com um bilhete de tres linhas: agente que guardou o
 * link nao pode encontrar o vazio.
 */
export function agentFiles(): Map<string, string> {
  const docs = readDocs()
  const files = new Map<string, string>()

  files.set('convencoes.md', readFileSync(CONVENTIONS, 'utf8'))

  for (const file of skillFiles()) {
    files.set(`skill/${file}`, readFileSync(`${SKILL_DIR}/${file}`, 'utf8'))
  }

  for (const [slug, guide] of readGuides()) files.set(`${slug}.md`, guideMarkdown(guide))

  const sources = readAll(docs)
  const names = new Set(docs.map((doc) => doc.name))

  for (const doc of docs) {
    const parent = findParent(doc.name, names)
    const owner = parent ? docs.find((item) => item.name === parent) : undefined

    files.set(
      `componentes/${doc.slug}.md`,
      owner
        ? partNote(doc.name, { name: owner.name, slug: owner.slug })
        : buildMarkdown(doc, docs, sources),
    )
  }

  files.set('llms.txt', indexForAgents(docs))
  files.set('llms-full.txt', fullForAgents(docs, files))

  return files
}
