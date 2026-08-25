import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { sliceSource, storyNamesOf, titleFromSource, withoutAutoOpen } from './src/example-source'
import { findParent, importPathOf } from './src/parts'
import { parseProps, parsesRootProps } from './src/props-parse'
import { renderDoc, type Part } from './src/render-md'
import { slugify } from './src/slug'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const DOCS_DIR = here('../../.design-sync/docs')
const PREVIEWS_DIR = here('../../.design-sync/previews')
const TYPES_FILE = here('./src/component-types.json')
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
const GUIDE_TITLES: Record<string, string> = {
  instalacao: 'Instalação',
  'inicio-rapido': 'Início rápido',
  temas: 'Temas e personalização',
  densidade: 'Densidade',
  'para-agents': 'Para agents',
  skill: 'Skill',
}

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
 * writes. See `scripts/tipos-do-catalogo.ts` for why it is a file and not a
 * walk over `ds-bundle/`.
 */
function readTypes() {
  try {
    return new Map<string, string>(
      Object.entries(JSON.parse(readFileSync(TYPES_FILE, 'utf8')) as Record<string, string>),
    )
  } catch {
    // Not generated yet: the tables come out empty, the page still serves.
    return new Map<string, string>()
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

  const preview = previews.get(doc.name)
  const stories = preview
    ? storyNamesOf(preview)
        .map((story) => ({
          title: titleFromSource(preview, story),
          code: sliceSource(preview, story) ?? '',
        }))
        .filter((story) => story.code)
    : []

  const parts: Part[] = [...names]
    .filter((name) => partOf(name) === doc.name)
    .sort()
    .map((name) => ({
      name,
      body: (docs.find((item) => item.name === name)?.body ?? '').replace(/^\s*#\s+\S.*\n+/, ''),
      props: parseProps(types.get(name), name),
    }))

  const related = docs
    .filter((item) => item.family === doc.family && item.name !== doc.name && !partOf(item.name))
    .slice(0, 6)
    .map((item) => ({ name: item.name, slug: item.slug }))

  return renderDoc({
    name: doc.name,
    body: doc.body.trimStart(),
    importPath: importPathOf(doc.name),
    props: parseProps(types.get(doc.name), doc.name),
    forwardsRootProps: parsesRootProps(types.get(doc.name)),
    stories,
    parts,
    related,
  })
}

function indexForAgents(docs: Doc[]) {
  const byFamily = new Map<string, Doc[]>()
  for (const doc of docs) {
    const list = byFamily.get(doc.family) ?? []
    list.push(doc)
    byFamily.set(doc.family, list)
  }

  const sections = [...byFamily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, items]) => {
      const lines = items
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((doc) => `- [${doc.name}](/componentes/${doc.slug}.md)`)
        .join('\n')
      return `## ${family}\n\n${lines}`
    })
    .join('\n\n')

  return `# @rivocode/ui

Design system da RivoCode: ${docs.length} documentos, tokens em tres camadas,
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

      for (const doc of docs) {
        this.emitFile({
          type: 'asset',
          fileName: `componentes/${doc.slug}.md`,
          source: buildMarkdown(doc, docs, sources),
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
      const cleaned = withoutAutoOpen(code)
      return cleaned === code ? null : { code: cleaned, map: null }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rawDocs(), previewsClosed()],
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
