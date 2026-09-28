import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, createServerModuleRunner } from 'vite'

/* ---------------------------------------------------------------------------
 * O prerender
 *
 * O `vite build` escreve um `index.html` com o `#root` vazio: nada aparece na
 * tela ate o React montar, e no Lighthouse isso media 2.490ms de atraso de
 * render dentro do LCP - sozinho, maior que todo o resto somado. Este passo
 * roda o mesmo `App` uma vez por endereco, em Node, e guarda o HTML pronto
 * dentro do `#root`. O navegador passa a pintar assim que o documento chega, e
 * o React hidrata por cima (ver o `main.tsx`).
 *
 * Nao ha segundo bundle. O Vite carrega os modulos por conta propria, com os
 * mesmos plugins, aliases e modulos virtuais do `vite.config.ts` - a alternativa
 * era um `vite build --ssr` com externals proprios, e ai passam a existir duas
 * configuracoes que divergem sem ninguem notar.
 *
 * O `vercel.json` continua reescrevendo para `/index.html` o que nao casa com
 * arquivo, entao endereco sem HTML proprio segue funcionando como SPA: o
 * prerender nao e requisito de nada, e sim de quanto tempo a primeira tela
 * demora.
 * ------------------------------------------------------------------------- */

const here = dirname(fileURLToPath(import.meta.url))
const DIST = join(here, 'dist')
const MARKER = '<div id="root"></div>'

/*
 * As tres familias latinas, prontas para o preload.
 *
 * Elas sao descobertas em profundidade 3 - o HTML pede o CSS, o CSS pede a
 * fonte -, e chegavam por volta de 1.100ms. O `font-display: swap` ja impede
 * que o texto espere por elas, entao isto nao mexe no LCP: mexe no pulo de
 * fonte, que com o prerender passou a ser visivel, porque agora ha texto na
 * tela desde o primeiro quadro.
 *
 * Os nomes carregam hash de build, entao a lista sai do proprio `dist`. Um
 * `latin-ext` nao entra: o portugues cabe no `latin`, e preload de arquivo que
 * o navegador nao vai usar e banda jogada fora.
 */
function latinFonts(): string[] {
  return readdirSync(join(DIST, 'assets'))
    .filter((file) => file.endsWith('.woff2') && /-latin-/.test(file) && !file.includes('latin-ext'))
    .sort()
    .map((file) => `/assets/${file}`)
}

function withFontPreload(html: string, fonts: string[]): string {
  const links = fonts
    .map((href) => `    <link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>`)
    .join('\n')

  return html.replace('</head>', `${links}\n  </head>`)
}

/** Onde o HTML de um endereco mora dentro do `dist`. */
function fileOf(path: string) {
  return path === '/' ? join(DIST, 'index.html') : join(DIST, path.slice(1), 'index.html')
}

async function main() {
  /*
   * O molde sai do proprio `index.html` do build, com o `#root` esvaziado
   * antes de qualquer coisa. Sem esvaziar, rodar este script duas vezes sobre
   * o mesmo `dist` - o que acontece na primeira vez que alguem repete o
   * comando sem refazer o build - leria a capa ja prerenderizada como molde e
   * aninharia a pagina dentro dela. Pelo mesmo motivo o preload de fonte e
   * removido antes de ser reescrito: sem isso a segunda passada acumularia
   * uma copia de cada link.
   */
  const fonts = latinFonts()
  if (fonts.length === 0) {
    throw new Error('Nenhuma fonte latina em dist/assets: o preload sairia vazio sem ninguem ver.')
  }

  const template = withFontPreload(
    readFileSync(join(DIST, 'index.html'), 'utf8')
      .replace(/(<div id="root">)[\s\S]*(<\/div>)(?=\s*<script)/, '$1$2')
      .replace(/^[ \t]*<link rel="preload" as="font"[^>]*>\n/gm, ''),
    fonts,
  )

  if (!template.includes(MARKER)) {
    throw new Error(`O ${MARKER} nao esta no dist/index.html: o prerender nao teria onde escrever.`)
  }

  const server = await createServer({
    root: here,
    // Sem isto a Vite serviria o proprio `index.html` e ligaria o HMR, que aqui
    // nao tem para quem falar.
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'warn',
  })

  const runner = createServerModuleRunner(server.environments.ssr)

  try {
    const entry = (await runner.import('/src/entry-server.tsx')) as typeof import('./src/entry-server')
    const paths = entry.pagePaths()

    let written = 0
    let bytes = 0
    const broken: string[] = []

    /*
     * Um endereco por vez, de proposito. A rota que o `App` le mora em modulo
     * (`setRenderedPath`), entao duas paginas em voo ao mesmo tempo escreveriam
     * uma o endereco da outra - e o defeito sairia como uma pagina de peca com
     * o conteudo da vizinha, que hidrata divergindo e some no primeiro frame.
     */
    for (const path of paths) {
      const { html, failures } = await entry.renderPage(path)

      if (failures.length > 0) {
        broken.push(`${path}: ${failures[0]}`)
        continue
      }

      const page = template.replace(MARKER, `<div id="root">${html}</div>`)
      const file = fileOf(path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, page)
      written += 1
      bytes += Buffer.byteLength(page)
    }

    if (broken.length > 0) {
      console.error(`\nO prerender falhou em ${broken.length} de ${paths.length} enderecos:`)
      for (const line of broken.slice(0, 10)) console.error(`  ${line}`)
      throw new Error('Pagina que nao renderiza fora do navegador nao vai ao ar pela metade.')
    }

    console.log(
      `prerender: ${written} paginas, ${(bytes / written / 1024).toFixed(1)} KB de HTML em media`,
    )
  } finally {
    await server.close()
  }
}

await main()
