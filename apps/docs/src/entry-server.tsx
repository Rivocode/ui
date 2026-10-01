import { prerenderToNodeStream } from 'react-dom/static'
import { App } from '@/app'
import { ENTRIES } from '@/catalog'
import { GUIDES } from '@/guides'
import { setRenderedPath } from '@/routes'

/* ---------------------------------------------------------------------------
 * O lado de fora do navegador
 *
 * O mesmo `App` que roda na aba, montado uma vez por endereco em tempo de
 * build. E `prerenderToNodeStream`, e nao `renderToString`: metade do que a
 * pagina mostra chega por promessa - a rota e um `lazy()`, e o corpo de cada
 * doc entra por `use()`. O `renderToString` desiste dessas duas e escreve o
 * fallback, que aqui e uma caixa vazia; o `prerender` espera tudo assentar e
 * escreve a pagina inteira, que e a unica versao que vale a pena guardar.
 * ------------------------------------------------------------------------- */

/** Os enderecos que ganham HTML proprio, na ordem em que o site os lista. */
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
 * O HTML de um endereco, ou o erro que impediu.
 *
 * O `onError` nao interrompe: o React continua e entrega o que conseguiu. Uma
 * pagina meio escrita e pior do que nenhuma - ela hidrata divergindo -, entao
 * quem chama decide, e a decisao aqui e nao publicar o que falhou.
 */
export async function renderPage(path: string) {
  setRenderedPath(path)

  const failures: string[] = []

  const { prelude } = await prerenderToNodeStream(<App />, {
    /*
     * Tudo em linha, sem fronteira separada. Mesmo no `prerender`, o React
     * tira do lugar a fronteira de Suspense que passa de ~12 KB: o conteudo
     * vai num `<div hidden>` no fim e um `<script>` ($RC) o troca pelo
     * fallback. Na hidratacao o React nao adotava essa troca: punha o
     * fallback (`min-h-dvh`, vazio) e redesenhava a pagina inteira - no
     * celular lento do Lighthouse o texto sumia por 1,3s e o LCP so contava
     * depois. Num arquivo estatico nao ha o que transmitir aos poucos.
     */
    progressiveChunkSize: Number.POSITIVE_INFINITY,
    onError(error: unknown) {
      failures.push(error instanceof Error ? error.message : String(error))
    },
  })

  const chunks: Buffer[] = []
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk))

  return { html: Buffer.concat(chunks).toString('utf8'), failures }
}
