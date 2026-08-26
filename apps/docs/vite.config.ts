import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { dropLeadingHeading, firstSentence, splitFrontmatter } from './src/doc-text'
import { sliceSource, storyNamesOf, titleFromSource, withoutAutoOpen } from './src/example-source'
import { GUIDE_LIST } from './src/guide-list'
import { indexLine, partNote } from './src/agent-address'
import { findParent, importPathOf } from './src/parts'
import { renderDoc, type Part } from './src/render-md'
import type { Prop } from './src/props'
import { slugify } from './src/slug'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const DOCS_DIR = here('../../.design-sync/docs')
const PREVIEWS_DIR = here('../../.design-sync/previews')
const PROPS_FILE = here('./src/component-props.json')
const CONVENTIONS = here('../../.design-sync/conventions.md')
/*
 * A skill mora onde o Claude Code procura, e nao numa pasta so para o site: uma
 * segunda copia divergiria da primeira no dia seguinte, e a que o site entrega
 * e justamente a que precisa estar certa.
 */
const SKILL_DIR = here('../../.claude/skills/rivocode-ui')
const GUIDES_DIR = here('./src/content')

/** Os arquivos da skill, na ordem em que o corpo dela os cita. */
function skillFiles(): string[] {
  const refs = readdirSync(`${SKILL_DIR}/reference`)
    .filter((file) => file.endsWith('.md'))
    .map((file) => `reference/${file}`)

  return ['SKILL.md', ...refs]
}

type Doc = { name: string; slug: string; family: string; body: string }

function readDocs(): Doc[] {
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
 * Os guias em prosa, por slug, com o titulo.
 *
 * Sao servidos crus como as paginas de peca. O guia e onde mora o porque - como
 * se escreve um tema, por que densidade e um atributo so -, e e disso que um
 * agente precisa antes da primeira linha. Enquanto eles eram so HTML, entregar
 * o contrato de tema a alguem era colar o texto na conversa.
 */
const GUIDE_TITLES: Record<string, string> = Object.fromEntries(
  GUIDE_LIST.map((guide) => [guide.slug, guide.title]),
)

function readGuides() {
  const guides = new Map<string, { title: string; body: string }>()

  for (const [slug, title] of Object.entries(GUIDE_TITLES)) {
    try {
      guides.set(slug, { title, body: readFileSync(`${GUIDES_DIR}/${slug}.md`, 'utf8') })
    } catch {
      // Guia listado aqui e ainda nao escrito simplesmente nao e servido.
    }
  }

  return guides
}

function readPreviews() {
  const sources = new Map<string, string>()
  for (const file of readdirSync(PREVIEWS_DIR)) {
    if (!file.endsWith('.tsx')) continue
    sources.set(file.replace(/\.tsx$/, ''), readFileSync(`${PREVIEWS_DIR}/${file}`, 'utf8'))
  }
  return sources
}

/**
 * O `.d.ts` de cada peca, por nome, lido do arquivo que a extracao escreve. Ele
 * sai do compilador em `scripts/props-do-catalogo.ts`, e o `check:props` falha
 * quando o comitado diverge da fonte.
 */
type Piece = { forwardsRoot: boolean; props: Prop[] }

function readTypes() {
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
 * Uma leitura por request, e uma por build - e nao uma por documento. Varrer o
 * `ds-bundle` cento e seis vezes para escrever cento e seis arquivos e o
 * desperdicio que so aparece como build lento que ninguem sabe explicar.
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
   * Os exemplos da peça, e os das partes dela — a mesma regra da página. Uma
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

  const parts: Part[] = partNames
    .map((name) => ({
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

/*
 * O indice que o agente le.
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

  const byFamily = new Map<string, Doc[]>()
  for (const doc of docs) {
    const list = byFamily.get(doc.family) ?? []
    list.push(doc)
    byFamily.set(doc.family, list)
  }

  const pieces = docs.filter((doc) => !parentOf(doc.name)).length

  const sections = [...byFamily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, items]) => {
      const lines = items
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((doc) => {
          const parent = parentOf(doc.name)
          const owner = parent ? docs.find((item) => item.name === parent) : undefined
          return indexLine(doc.name, doc.slug, owner && { name: owner.name, slug: owner.slug })
        })
        .join('\n')
      return `## ${family}\n\n${lines}`
    })
    .join('\n\n')

  return `# @rivocode/ui

Design system da RivoCode: ${pieces} peças em ${docs.length} documentos, tokens em tres camadas,
dois temas e duas densidades. Cada endereco abaixo entrega markdown cru, sem HTML em
volta, para leitura por agent.

Comece por [/convencoes.md](/convencoes.md): e o contrato de uso da biblioteca,
com o RivoProvider, o vocabulario de classes e as regras que valem para todo
componente.

Se voce roda como agente com skills, ha uma pronta em [/skill/SKILL.md](/skill/SKILL.md).

## Guias

${[...readGuides()]
  .map(([slug, guide]) => `- [${guide.title}](/${slug}.md)`)
  .join('\n')}

${sections}
`
}

/**
 * Serve a documentacao crua.
 *
 * O site inteiro existe para gente; o agente que le `/Button.md` nao quer o
 * HTML em volta. Sao os mesmos arquivos que as paginas renderizam, entao nada
 * e duplicado e nada envelhece por conta propria.
 */
function rawDocs(): Plugin {
  return {
    name: 'rivocode-documentacao-crua',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]

        if (path === '/llms.txt') {
          res.setHeader('content-type', 'text/plain; charset=utf-8')
          res.end(indexForAgents(readDocs()))
          return
        }

        if (path === '/convencoes.md') {
          res.setHeader('content-type', 'text/markdown; charset=utf-8')
          res.end(readFileSync(CONVENTIONS, 'utf8'))
          return
        }

        const guide = /^\/([a-z0-9-]+)\.md$/.exec(path)
        if (guide) {
          const found = readGuides().get(guide[1])
          if (found) {
            res.setHeader('content-type', 'text/markdown; charset=utf-8')
            res.end(`# ${found.title}\n\n${found.body.trimStart()}`)
            return
          }
        }

        // A skill, servida crua no endereço que o comando de instalação usa.
        // Os arquivos de `reference/` vão junto: o corpo da skill aponta para
        // eles, e um link que dá 404 é pior do que não ter o link.
        const skillHit = /^\/skill\/(SKILL\.md|reference\/[a-z0-9-]+\.md)$/.exec(path)
        if (skillHit) {
          res.setHeader('content-type', 'text/markdown; charset=utf-8')
          res.end(readFileSync(`${SKILL_DIR}/${skillHit[1]}`, 'utf8'))
          return
        }

        const hit = /^\/componentes\/([a-z0-9-]+)\.md$/.exec(path)
        if (hit) {
          const docs = readDocs()
          const doc = docs.find((item) => item.slug === hit[1])
          if (doc) {
            res.setHeader('content-type', 'text/markdown; charset=utf-8')
            res.end(buildMarkdown(doc, docs, readAll(docs)))
            return
          }
        }

        next()
      })
    },

    generateBundle() {
      const docs = readDocs()

      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: indexForAgents(docs) })
      this.emitFile({
        type: 'asset',
        fileName: 'convencoes.md',
        source: readFileSync(CONVENTIONS, 'utf8'),
      })
      for (const file of skillFiles()) {
        this.emitFile({
          type: 'asset',
          fileName: `skill/${file}`,
          source: readFileSync(`${SKILL_DIR}/${file}`, 'utf8'),
        })
      }

      for (const [slug, guide] of readGuides()) {
        this.emitFile({
          type: 'asset',
          fileName: `${slug}.md`,
          source: `# ${guide.title}\n\n${guide.body.trimStart()}`,
        })
      }

      const sources = readAll(docs)

      const names = new Set(docs.map((doc) => doc.name))

      for (const doc of docs) {
        const parent = findParent(doc.name, names)

        /*
         * Parte nao ganha pagina propria.
         *
         * Ela ja e publicada inteira - prosa, props e o exemplo que a monta -
         * dentro da pagina de quem a compoe, e a versao solta dela nunca teve
         * exemplo: nao ha o que exemplificar sem a peca em volta. Setenta e
         * seis dos cento e cinquenta e sete arquivos eram isso, e cada um
         * custava ao agente uma busca que nao acrescentava nada.
         *
         * O endereco antigo continua respondendo, com um bilhete de tres
         * linhas: agente que guardou o link nao pode encontrar o vazio.
         */
        const owner = parent ? docs.find((item) => item.name === parent) : undefined

        this.emitFile({
          type: 'asset',
          fileName: `componentes/${doc.slug}.md`,
          source: owner
            ? partNote(doc.name, { name: owner.name, slug: owner.slug })
            : buildMarkdown(doc, docs, sources),
        })
      }
    },
  }
}

/**
 * A mesma limpeza, para o modulo que roda de fato na pagina. O `sliceSource` ja
 * limpa o codigo que o leitor le; isto limpa o codigo que o React monta.
 *
 * `pre`, e so `pre`: depois de o JSX ser compilado a flag deixa de parecer
 * atributo e vira `defaultOpen: true` dentro de um objeto de props, e cortar o
 * nome dali deixa `{ : true }` - erro de sintaxe, e todo exemplo da pagina
 * substituido por uma caixa vermelha.
 */
function previewsClosed(): Plugin {
  return {
    name: 'rivocode-previews-fechadas',
    enforce: 'pre',

    transform(code, id) {
      if (!id.includes('/.design-sync/previews/') || id.includes('?')) return null
      const cleaned = withoutAutoOpen(code, 'runtime')
      return cleaned === code ? null : { code: cleaned, map: null }
    },
  }
}

/**
 * O indice do catalogo, como modulo virtual.
 *
 * A lista lateral precisa do nome, da familia e da lede de cento e cinquenta e
 * sete documentos antes de a primeira peca ser aberta - e so disso. Enquanto o
 * `catalog.ts` lia os `.md` com `eager: true`, o corpo INTEIRO de cada um, mais
 * a fonte de cada preview, entrava no chunk de entrada: 1,1 MB de texto virava
 * 1,77 MB de string escapada que o navegador tinha que baixar e parsear antes
 * de pintar o primeiro pixel da capa. O Lighthouse media 4,6s de FCP, LCP e
 * Speed Index - os tres iguais, que e a assinatura de pagina que so aparece
 * quando o JS termina.
 *
 * O corpo continua vindo dos mesmos arquivos, agora sob demanda, na pagina que
 * o mostra. Se alguem devolver o `eager: true` la, o custo volta inteiro aqui.
 */
function catalogIndex(): Plugin {
  const VIRTUAL = 'virtual:catalog-index'

  return {
    name: 'rivocode-indice-do-catalogo',

    resolveId(id) {
      return id === VIRTUAL ? `\0${VIRTUAL}` : undefined
    },

    load(id) {
      if (id !== `\0${VIRTUAL}`) return undefined

      const index = readDocs().map((doc) => ({
        name: doc.name,
        family: doc.family,
        summary: firstSentence(doc.body),
      }))

      /*
       * As duas formas de estar presente contam: `traduz` e a peca com o mesmo
       * nome, `vira` e a que chegou com outro. A conta sai da tabela de
       * paridade, que `scripts/paridade-nativo.ts` gera e `check:paridade`
       * segura - numero derivado dela nasce honesto. Ela era feita no
       * navegador, e so por isso o guia inteiro precisava estar carregado.
       */
      const parity = readFileSync(`${GUIDES_DIR}/react-native.md`, 'utf8')
      const native = (parity.match(/^\| `[^`]+` \| ✔/gm) ?? []).length

      return `export const DOC_INDEX = ${JSON.stringify(index)}
export const NATIVE_PIECES = ${native}
`
    },

    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.md')) return
      const found = server.moduleGraph.getModuleById(`\0${VIRTUAL}`)
      if (!found) return
      // Documento novo ou lede reescrita mexe na lista lateral inteira, e o
      // modulo virtual nao tem como se atualizar em pedaco.
      server.moduleGraph.invalidateModule(found)
      server.ws.send({ type: 'full-reload' })
    },
  }
}

/**
 * O acervo da galeria de icones, como modulo virtual: os dados vetoriais de
 * cada icone saem dos proprios modulos do lucide-react no build, e viram um
 * chunk proprio que so a pagina /icones importa - importar o objeto `icons`
 * do pacote poria as ~1500 formas no bundle de toda pagina.
 */
function iconGallery(): Plugin {
  const VIRTUAL = 'virtual:icon-gallery'
  const ICONS_DIR = here('./node_modules/lucide-react/dist/esm/icons')

  return {
    name: 'rivocode-galeria-de-icones',
    resolveId(id) {
      return id === VIRTUAL ? `\0${VIRTUAL}` : undefined
    },
    load(id) {
      if (id !== `\0${VIRTUAL}`) return undefined

      const icons: Record<string, unknown> = {}
      for (const file of readdirSync(ICONS_DIR)) {
        if (!file.endsWith('.mjs')) continue
        const source = readFileSync(`${ICONS_DIR}/${file}`, 'utf8')
        // So os arquivos com o desenho: os de alias reexportam outro modulo.
        const match = /const __iconNode = (\[[\s\S]*?\]);\n/.exec(source)
        if (!match) continue
        // Confiavel porque e o node_modules deste build, nao entrada externa.
        icons[file.replace(/\.mjs$/, '')] = new Function(`return ${match[1]}`)()
      }
      return `export default ${JSON.stringify(icons)}`
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rawDocs(), previewsClosed(), catalogIndex(), iconGallery()],
  resolve: {
    // A biblioteca resolve para a fonte, e nao para `dist`: a doc passa a
    // refletir o que esta escrito agora, sem build antes, e o HMR alcanca os
    // componentes enquanto eles sao editados.
    alias: {
      '@rivocode/ui/form': here('../../src/form/index.ts'),
      '@rivocode/ui/chart': here('../../src/chart/index.ts'),
      '@rivocode/ui': here('../../src/index.ts'),
      '@': here('./src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // A fonte da biblioteca e a doc moram acima desta pasta, e a Vite bloqueia
    // por padrao tudo que esta fora da raiz do projeto.
    fs: { allow: [here('../..')] },
  },
})
