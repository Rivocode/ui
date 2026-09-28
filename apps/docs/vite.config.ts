import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { agentFiles, readDocs, readTypes, type Piece } from './src/agent-docs'
import { firstSentence } from './src/doc-text'
import { withoutAutoOpen } from './src/example-source'
import { findParent } from './src/parts'
import { readCssTree } from '../../src/tokens/css-tree.ts'
import { exportDtcg } from '../../src/tokens/dtcg.ts'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const PROPS_FILE = here('./src/component-props.json')
const GUIDES_DIR = here('./src/content')

const CONTENT_TYPES: Record<string, string> = {
  md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  ts: 'text/plain; charset=utf-8',
  mts: 'text/plain; charset=utf-8',
}

/**
 * Serves the raw documentation.
 *
 * The whole site exists for people; the agent reading `/componentes/button.md`
 * does not want the HTML around it. They are the same files the pages render,
 * so nothing is duplicated and nothing goes stale on its own. The whole list
 * comes from `agentFiles`, the same in `vite dev`, in the build and in the
 * test.
 */
function rawDocs(): Plugin {
  return {
    name: 'rivocode-raw-docs',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const kind = /\.(md|txt|m?ts)$/.exec(path)?.[1]
        if (!kind) return next()

        const found = agentFiles().get(decodeURIComponent(path.slice(1)))
        if (found === undefined) return next()

        res.setHeader('content-type', CONTENT_TYPES[kind])
        res.end(found)
      })
    },

    generateBundle() {
      for (const [fileName, source] of agentFiles()) {
        this.emitFile({ type: 'asset', fileName, source })
      }
    },
  }
}

/**
 * The same cleanup, for the module that actually runs on the page.
 * `sliceSource` already cleans the code the reader reads; this cleans the
 * code React mounts.
 *
 * `pre`, and only `pre`: after the JSX is compiled the flag stops looking like
 * an attribute and becomes `defaultOpen: true` inside a props object, and
 * cutting the name out of there leaves `{ : true }` - a syntax error, and
 * every example on the page replaced by a red box.
 */
function previewsClosed(): Plugin {
  return {
    name: 'rivocode-closed-previews',
    enforce: 'pre',

    transform(code, id) {
      if (!id.includes('/.design-sync/previews/') || id.includes('?')) return null
      const cleaned = withoutAutoOpen(code, 'runtime')
      return cleaned === code ? null : { code: cleaned, map: null }
    },
  }
}

/**
 * The catalog index, as a virtual module.
 *
 * The sidebar needs the name, family and lede of a hundred and fifty-seven
 * documents before the first piece is opened - and only that. While
 * `catalog.ts` read the `.md` files with `eager: true`, the WHOLE body of each
 * one, plus the source of each preview, went into the entry chunk: 1.1 MB of
 * text became 1.77 MB of escaped string the browser had to download and parse
 * before painting the first pixel of the cover. Lighthouse measured 4.6s of
 * FCP, LCP and Speed Index - all three equal, which is the signature of a page
 * that only appears when the JS finishes.
 *
 * The body still comes from the same files, now on demand, on the page that
 * shows it. If someone puts `eager: true` back there, the cost comes back in
 * full here.
 */
function catalogIndex(): Plugin {
  const VIRTUAL = 'virtual:catalog-index'

  return {
    name: 'rivocode-catalog-index',

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
       * Both ways of being present count: `traduz` is the piece with the same
       * name, `vira` is the one that arrived under another. The count comes
       * from the parity table, which `scripts/native-parity.ts` generates and
       * `check:parity` holds - a number derived from it is born honest. It
       * used to be done in the browser, and only because of that the whole
       * guide had to be loaded.
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
      // A new document or a rewritten lede touches the whole sidebar, and the
      // virtual module cannot update piecemeal.
      server.moduleGraph.invalidateModule(found)
      server.ws.send({ type: 'full-reload' })
    },
  }
}

/**
 * The catalog props, one page per chunk.
 *
 * `component-props.json` is 534 KB (58 KB compressed) - every prop of every
 * piece -, and a piece page only reads its own tables and its parts'.
 * Imported whole, it was the largest chunk on the site and the last to arrive
 * on the piece page: on Lighthouse's network, half a second of download and
 * the parse of half a megabyte before the table existed. The file stays the
 * same, generated by `gen:props` and guarded by `check:props`; only the
 * delivery is sliced here.
 *
 * The slice is per PAGE, not per piece: a part lives on the page of whoever
 * composes it, so Select takes the tables of its seven parts in a single
 * request, not in eight.
 */
function propsByPage(): Plugin {
  const INDEX = 'virtual:component-props'
  const PAGE = `${INDEX}/`

  const groups = () => {
    const names = new Set(readDocs().map((doc) => doc.name))
    const byPage = new Map<string, Record<string, Piece>>()
    const pageOf = new Map<string, string>()

    for (const [name, piece] of readTypes()) {
      const page = findParent(name, names) ?? name
      pageOf.set(name, page)
      byPage.set(page, { ...byPage.get(page), [name]: piece })
    }

    return { byPage, pageOf }
  }

  return {
    name: 'rivocode-props-by-page',

    resolveId(id) {
      return id === INDEX || id.startsWith(PAGE) ? `\0${id}` : undefined
    },

    load(id) {
      if (!id.startsWith(`\0${INDEX}`)) return undefined

      this.addWatchFile(PROPS_FILE)
      const { byPage, pageOf } = groups()

      if (id === `\0${INDEX}`) {
        const loaders = [...pageOf]
          .map(([name, page]) => `  ${JSON.stringify(name)}: () => import(${JSON.stringify(PAGE + page)}),`)
          .join('\n')
        return `export const LOADERS = {\n${loaders}\n}\n`
      }

      return `export default ${JSON.stringify(byPage.get(id.slice(`\0${PAGE}`.length)) ?? {})}`
    },
  }
}

/**
 * The icon gallery collection, as a virtual module: each icon's vector data
 * comes from lucide-react's own modules at build time, and becomes its own
 * chunk that only the /icones page imports - importing the package's `icons`
 * object would put the ~1500 shapes in the bundle of every page.
 */
function iconGallery(): Plugin {
  const VIRTUAL = 'virtual:icon-gallery'
  const ICONS_DIR = here('./node_modules/lucide-react/dist/esm/icons')

  return {
    name: 'rivocode-icon-gallery',
    resolveId(id) {
      return id === VIRTUAL ? `\0${VIRTUAL}` : undefined
    },
    load(id) {
      if (id !== `\0${VIRTUAL}`) return undefined

      const icons: Record<string, unknown> = {}
      for (const file of readdirSync(ICONS_DIR)) {
        if (!file.endsWith('.mjs')) continue
        const source = readFileSync(`${ICONS_DIR}/${file}`, 'utf8')
        // Only the files with the drawing: the alias ones re-export another module.
        const match = /const __iconNode = (\[[\s\S]*?\]);\n/.exec(source)
        if (!match) continue
        // Trusted because it is this build's node_modules, not external input.
        icons[file.replace(/\.mjs$/, '')] = new Function(`return ${match[1]}`)()
      }
      return `export default ${JSON.stringify(icons)}`
    },
  }
}

/**
 * The house tokens as DTCG JSON, at `/tokens/<file>`.
 *
 * They come from the same function that `rivocode-ui tokens` and the
 * package's `build:tokens` call, reading the same `src/preset.css`: the site
 * keeps no committed copy, so there is no copy that can go stale. The address
 * is what the tokens guide teaches to paste into Tokens Studio.
 */
function designTokens(): Plugin {
  const build = () => exportDtcg(readCssTree(here('../../src/preset.css'))).files
  const json = (content: object) => `${JSON.stringify(content, undefined, 2)}\n`

  return {
    name: 'rivocode-tokens-dtcg',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const hit = /^\/tokens\/([\w.-]+\.json)$/.exec((req.url ?? '').split('?')[0])
        const content = hit ? build()[hit[1]] : undefined
        if (!content) return next()
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(json(content))
      })
    },

    generateBundle() {
      for (const [name, content] of Object.entries(build())) {
        this.emitFile({ type: 'asset', fileName: `tokens/${name}`, source: json(content) })
      }
    },
  }
}

/**
 * The whole house CSS - palette, scale, shape, contract and both themes -, as
 * a string, for the theme builder.
 *
 * The builder exports the DTCG JSON in the browser, with the same
 * `exportDtcg` that `rivocode-ui tokens` calls, and it needs the house to
 * resolve the palette and the scale. Reading the file is a Node thing, so the
 * read happens here, at build time, and only the `/tema` page chunk loads the
 * result.
 */
function houseCss(): Plugin {
  const VIRTUAL = 'virtual:house-css'
  const PRESET = here('../../src/preset.css')

  return {
    name: 'rivocode-house-css',
    resolveId(id) {
      return id === VIRTUAL ? `\0${VIRTUAL}` : undefined
    },
    load(id) {
      if (id !== `\0${VIRTUAL}`) return undefined
      return `export default ${JSON.stringify(readCssTree(PRESET))}`
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    rawDocs(),
    previewsClosed(),
    catalogIndex(),
    propsByPage(),
    iconGallery(),
    designTokens(),
    houseCss(),
  ],
  resolve: {
    // The library resolves to source, not to `dist`: the docs reflect what is
    // written right now, with no build first, and HMR reaches the components
    // while they are being edited.
    alias: {
      '@rivocode/ui/form': here('../../src/form/index.ts'),
      '@rivocode/ui/chart': here('../../src/chart/index.ts'),
      '@rivocode/ui/ai': here('../../src/ai/index.ts'),
      '@rivocode/ui/dnd': here('../../src/dnd/index.ts'),
      '@rivocode/ui/editor': here('../../src/editor/index.ts'),
      '@rivocode/ui': here('../../src/index.ts'),
      '@': here('./src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // The library source and the docs live above this folder, and Vite blocks
    // by default everything outside the project root.
    fs: { allow: [here('../..')] },
  },
})
