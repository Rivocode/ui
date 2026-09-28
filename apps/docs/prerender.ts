import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, createServerModuleRunner } from 'vite'

/* ---------------------------------------------------------------------------
 * The prerender
 *
 * `vite build` writes an `index.html` with an empty `#root`: nothing shows on
 * screen until React mounts, and in Lighthouse that measured 2,490ms of render
 * delay inside the LCP - by itself, more than everything else combined. This
 * step runs the same `App` once per address, in Node, and stores the finished
 * HTML inside `#root`. The browser starts painting as soon as the document
 * arrives, and React hydrates on top (see `main.tsx`).
 *
 * There is no second bundle. Vite loads the modules on its own, with the same
 * plugins, aliases and virtual modules as `vite.config.ts` - the alternative
 * was a `vite build --ssr` with its own externals, and then there would be two
 * configurations drifting apart without anyone noticing.
 *
 * `vercel.json` keeps rewriting to `/index.html` whatever does not match a
 * file, so an address without its own HTML still works as a SPA: the
 * prerender is not a requirement for anything, only for how long the first
 * screen takes.
 * ------------------------------------------------------------------------- */

const here = dirname(fileURLToPath(import.meta.url))
const DIST = join(here, 'dist')
const MARKER = '<div id="root"></div>'

/*
 * The three latin families, ready for preload.
 *
 * They are discovered at depth 3 - the HTML asks for the CSS, the CSS asks
 * for the font -, and arrived around 1,100ms. `font-display: swap` already
 * keeps the text from waiting for them, so this does not touch the LCP: it
 * touches the font swap jump, which became visible with the prerender,
 * because now there is text on screen from the first frame.
 *
 * The names carry a build hash, so the list comes from `dist` itself. A
 * `latin-ext` does not go in: Portuguese fits in `latin`, and preloading a
 * file the browser will not use is wasted bandwidth.
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

/** Where an address's HTML lives inside `dist`. */
function fileOf(path: string) {
  return path === '/' ? join(DIST, 'index.html') : join(DIST, path.slice(1), 'index.html')
}

async function main() {
  /*
   * The template comes from the build's own `index.html`, with `#root`
   * emptied before anything else. Without emptying it, running this script
   * twice over the same `dist` - which happens the first time someone repeats
   * the command without rebuilding - would read the already prerendered cover
   * as the template and nest the page inside it. For the same reason the font
   * preload is removed before being rewritten: without that the second pass
   * would pile up one copy of each link.
   */
  const fonts = latinFonts()
  if (fonts.length === 0) {
    throw new Error('No latin font in dist/assets: the preload would come out empty without anyone noticing.')
  }

  const template = withFontPreload(
    readFileSync(join(DIST, 'index.html'), 'utf8')
      .replace(/(<div id="root">)[\s\S]*(<\/div>)(?=\s*<script)/, '$1$2')
      .replace(/^[ \t]*<link rel="preload" as="font"[^>]*>\n/gm, ''),
    fonts,
  )

  if (!template.includes(MARKER)) {
    throw new Error(`${MARKER} is not in dist/index.html: the prerender would have nowhere to write.`)
  }

  const server = await createServer({
    root: here,
    // Without this Vite would serve its own `index.html` and turn on HMR, which
    // here has nobody to talk to.
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
     * One address at a time, on purpose. The route the `App` reads lives in a
     * module (`setRenderedPath`), so two pages in flight at once would write
     * each other's address - and the defect would come out as a piece page
     * with its neighbor's content, which hydrates with a mismatch and vanishes
     * on the first frame.
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
      console.error(`\nThe prerender failed on ${broken.length} of ${paths.length} addresses:`)
      for (const line of broken.slice(0, 10)) console.error(`  ${line}`)
      throw new Error('A page that does not render outside the browser does not go live half-done.')
    }

    console.log(
      `prerender: ${written} pages, ${(bytes / written / 1024).toFixed(1)} KB of HTML on average`,
    )
  } finally {
    await server.close()
  }
}

await main()
