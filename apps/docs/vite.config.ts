import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
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
const SKILL = `${SKILL_DIR}/SKILL.md`
const GUIDES_DIR = here('./src/content')

/** Os arquivos da skill, na ordem em que o corpo dela os cita. */
function skillFiles(): string[] {
  const refs = readdirSync(`${SKILL_DIR}/reference`)
    .filter((file) => file.endsWith('.md'))
    .map((file) => `reference/${file}`)

  return ['SKILL.md', ...refs]
}

type Doc = { name: string; slug: string; family: string; body: string }

/** Reads the component docs, taking the family from the frontmatter. */
function readDocs(): Doc[] {
  return readdirSync(DOCS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(`${DOCS_DIR}/${file}`, 'utf8')
      const front = /^---\n([\s\S]*?)\n---\n/.exec(raw)
      const family = front ? (/category:\s*(.+)/.exec(front[1])?.[1].trim() ?? 'Geral') : 'Geral'
      return {
        name: file.replace(/\.md$/, ''),
        slug: slugify(file.replace(/\.md$/, '')),
        family,
        body: front ? raw.slice(front[0].length) : raw,
      }
    })
}

/**
 * The prose guides, by slug, with their title.
 *
 * They are served raw like the component docs are. A guide is where the
 * reasoning lives - how a theme is written, why density is one attribute - and
 * that is exactly what an agent needs before it writes the first line. Leaving
 * them HTML-only meant the only way to hand someone the theme contract was to
 * paste it.
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
      // A guide listed here but not written yet simply does not get served.
    }
  }

  return guides
}

/** The preview file of each piece, by component name. */
function readPreviews() {
  const sources = new Map<string, string>()
  for (const file of readdirSync(PREVIEWS_DIR)) {
    if (!file.endsWith('.tsx')) continue
    sources.set(file.replace(/\.tsx$/, ''), readFileSync(`${PREVIEWS_DIR}/${file}`, 'utf8'))
  }
  return sources
}

/**
 * The `.d.ts` of every piece, by name, from the file the extraction script
 * writes. The file is generated from the compiler by
 * `scripts/props-do-catalogo.ts`, and `check:props` fails when it drifts.
 */
type Piece = { forwardsRoot: boolean; props: Prop[] }

function readTypes() {
  try {
    return new Map<string, Piece>(
      Object.entries(JSON.parse(readFileSync(PROPS_FILE, 'utf8')) as Record<string, Piece>),
    )
  } catch {
    // Not generated yet: the tables come out empty, the page still serves.
    return new Map<string, Piece>()
  }
}

/**
 * Read once per request, and once per build — not once per document. Walking
 * `ds-bundle` a hundred and six times to write a hundred and six files is the
 * kind of waste that only shows up as a slow build nobody can explain.
 */
function readAll(docs: Doc[]) {
  const previews = readPreviews()
  const types = readTypes()
  return { previews, types, names: new Set([...docs.map((item) => item.name), ...previews.keys()]) }
}

type Sources = ReturnType<typeof readAll>

/**
 * Everything `/componentes/<slug>.md` needs, assembled from the same files the
 * page reads: the doc, the preview, the types, and the parts that compose it.
 */
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
      body: (docs.find((item) => item.name === name)?.body ?? '').replace(/^\s*#\s+\S.*\n+/, ''),
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
 * The index an agent reads.
 *
 * A part is listed under the piece it composes, not beside it. Forty-five of
 * the entries here are parts - CardHeader, DialogFooter, SelectItem - and
 * listing them at the same level makes an agent count a hundred and twenty-six
 * pieces, spend context opening CardTitle.md as if it stood alone, and miss
 * the one thing that matters about it: that it only exists inside Card.
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
 * Serves the docs raw.
 *
 * The whole site exists for people; an agent reading `/Button.md` does not
 * want the HTML shell around it. These are the same files the pages render,
 * so nothing is duplicated and nothing ages on its own.
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
 * The same strip, for the module that actually runs on the page. `sliceSource`
 * already cleans the code the reader sees; this cleans the code React mounts.
 *
 * `pre`, and only `pre`: after the JSX is compiled the flag no longer looks
 * like an attribute, it looks like `defaultOpen: true` inside a props object,
 * and cutting the name out of that leaves `{ : true }` — a syntax error, and
 * every example on the page replaced by a red box.
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
  plugins: [react(), tailwindcss(), rawDocs(), previewsClosed(), iconGallery()],
  resolve: {
    // The library resolves to source, not to `dist`: the docs then reflect
    // what is written right now, with no build step first, and HMR reaches the
    // components while they are edited.
    alias: {
      '@rivocode/ui/form': here('../../src/form/index.ts'),
      '@rivocode/ui/chart': here('../../src/chart/index.ts'),
      '@rivocode/ui': here('../../src/index.ts'),
      '@': here('./src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // Library source and docs live above this folder, and Vite blocks
    // anything outside the project root by default.
    fs: { allow: [here('../..')] },
  },
})
