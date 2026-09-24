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
}

/**
 * Serve a documentacao crua.
 *
 * O site inteiro existe para gente; o agente que le `/componentes/button.md`
 * nao quer o HTML em volta. Sao os mesmos arquivos que as paginas renderizam,
 * entao nada e duplicado e nada envelhece por conta propria. A lista inteira
 * sai de `agentFiles`, a mesma no `vite dev`, no build e no teste.
 */
function rawDocs(): Plugin {
  return {
    name: 'rivocode-documentacao-crua',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const kind = /\.(md|txt)$/.exec(path)?.[1]
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
 * As props do catalogo, uma pagina por chunk.
 *
 * O `component-props.json` tem 534 KB (58 KB comprimido) - toda prop de toda
 * peca -, e a pagina de uma peca le so as tabelas dela e das partes dela.
 * Importado inteiro, ele era o maior chunk do site e o ultimo a chegar na
 * pagina de peca: na rede do Lighthouse, meio segundo de download e o parse de
 * meio megabyte antes de a tabela existir. O arquivo continua o mesmo, gerado
 * pelo `gen:props` e guardado pelo `check:props`; so a entrega e fatiada aqui.
 *
 * A fatia e a da PAGINA, e nao a da peca: a parte mora na pagina de quem a
 * compoe, entao o Select leva as tabelas das sete partes num pedido so, e nao
 * em oito.
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
    name: 'rivocode-props-por-pagina',

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

/**
 * Os tokens da casa em JSON DTCG, em `/tokens/<arquivo>`.
 *
 * Saem da mesma funcao que o `rivocode-ui tokens` e o `build:tokens` do pacote
 * chamam, lendo o mesmo `src/preset.css`: o site nao guarda copia comitada, e
 * por isso nao ha copia que possa envelhecer. O endereco e o que o guia de
 * tokens ensina a colar no Tokens Studio.
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
 * O CSS da casa inteiro - paleta, escala, forma, contrato e os dois temas -,
 * como uma string, para o montador de tema.
 *
 * O montador exporta o JSON DTCG no navegador, com a mesma `exportDtcg` que o
 * `rivocode-ui tokens` chama, e ela precisa da casa para resolver a paleta e a
 * escala. Ler o arquivo e coisa do Node, entao a leitura acontece aqui, no
 * build, e so o chunk da pagina `/tema` carrega o resultado.
 */
function houseCss(): Plugin {
  const VIRTUAL = 'virtual:house-css'
  const PRESET = here('../../src/preset.css')

  return {
    name: 'rivocode-css-da-casa',
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
    // A biblioteca resolve para a fonte, e nao para `dist`: a doc passa a
    // refletir o que esta escrito agora, sem build antes, e o HMR alcanca os
    // componentes enquanto eles sao editados.
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
    // A fonte da biblioteca e a doc moram acima desta pasta, e a Vite bloqueia
    // por padrao tudo que esta fora da raiz do projeto.
    fs: { allow: [here('../..')] },
  },
})
