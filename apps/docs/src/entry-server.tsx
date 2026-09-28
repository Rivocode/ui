import { prerenderToNodeStream } from 'react-dom/static'
import { App } from '@/app'
import { ENTRIES } from '@/catalog'
import { GUIDES } from '@/guides'
import { setRenderedPath } from '@/routes'

/* ---------------------------------------------------------------------------
 * The outside of the browser
 *
 * The same `App` that runs in the tab, mounted once per address at build
 * time. It is `prerenderToNodeStream`, not `renderToString`: half of what the
 * page shows arrives through a promise - the route is a `lazy()`, and each
 * doc body comes in through `use()`. `renderToString` gives up on both and
 * writes the fallback, which here is an empty box; `prerender` waits for
 * everything to settle and writes the whole page, the only version worth
 * keeping.
 * ------------------------------------------------------------------------- */

/** The addresses that get their own HTML, in the order the site lists them. */
export function pagePaths(): string[] {
  return [
    '/',
    '/componentes',
    '/fundacao',
    '/demonstracao',
    '/tema',
    '/blocos',
    ...GUIDES.map((guide) => `/${guide.slug}`),
    ...ENTRIES.map((entry) => `/componentes/${entry.slug}`),
  ]
}

/**
 * The HTML of an address, or the error that prevented it.
 *
 * `onError` does not interrupt: React carries on and delivers what it could.
 * A half-written page is worse than none - it hydrates with a mismatch -, so
 * the caller decides, and the decision here is to not publish what failed.
 */
export async function renderPage(path: string) {
  setRenderedPath(path)

  const failures: string[] = []

  const { prelude } = await prerenderToNodeStream(<App />, {
    onError(error: unknown) {
      failures.push(error instanceof Error ? error.message : String(error))
    },
  })

  const chunks: Buffer[] = []
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk))

  return { html: Buffer.concat(chunks).toString('utf8'), failures }
}
