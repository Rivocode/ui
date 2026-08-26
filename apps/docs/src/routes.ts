import { useCallback, useEffect, useState } from 'react'

/* ---------------------------------------------------------------------------
 * O roteador
 *
 * Tres formas de endereco: a capa, a fundacao, um componente. Uma biblioteca de
 * rotas traz grafo de rota, carregamento por rota e um contexto: vale a pena
 * com dezenas de telas, sai caro com tres.
 * ------------------------------------------------------------------------- */

export type Route =
  | { kind: 'home' }
  | { kind: 'demo' }
  | { kind: 'foundation' }
  | { kind: 'catalog' }
  | { kind: 'guide'; slug: string }
  | { kind: 'component'; slug: string }

export function readRoute(path = window.location.pathname): Route {
  if (path === '/fundacao' || path === '/fundacao/') return { kind: 'foundation' }
  // Antes do padrao de guia la embaixo, que senao engoliria este.
  if (path === '/demonstracao' || path === '/demonstracao/') return { kind: 'demo' }

  if (path === '/componentes' || path === '/componentes/') return { kind: 'catalog' }

  const component = /^\/componentes\/([^/]+)\/?$/.exec(path)
  if (component) return { kind: 'component', slug: decodeURIComponent(component[1]) }

  const guide = /^\/([a-z0-9-]+)\/?$/.exec(path)
  if (guide) return { kind: 'guide', slug: guide[1] }

  return { kind: 'home' }
}

export function hrefOf(route: Route) {
  if (route.kind === 'demo') return '/demonstracao'
  if (route.kind === 'foundation') return '/fundacao'
  if (route.kind === 'catalog') return '/componentes'
  if (route.kind === 'guide') return `/${route.slug}`
  if (route.kind === 'component') return `/componentes/${route.slug}`
  return '/'
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => readRoute())

  useEffect(() => {
    const onPop = () => setRoute(readRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((target: Route) => {
    const href = hrefOf(target)
    if (href === window.location.pathname) return

    window.history.pushState(null, '', href)
    setRoute(target)
    // Trocar de pagina mantendo a rolagem velha abre o proximo componente pela
    // metade. O navegador so cuida disso nas navegacoes dele.
    //
    // `instant` a proposito. A folha define `scroll-behavior: smooth`, e sem
    // dizer nada aqui a troca de pagina herdava esse suave: quem clicava num
    // nome da lateral no fim de uma pagina longa via a pagina velha subir
    // rolando ate o topo antes da nova aparecer.
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return { route, navigate }
}

/**
 * Um link de verdade: clique do meio, "abrir em nova aba" e o teclado
 * continuam funcionando, e o clique comum navega sem recarregar.
 *
 * Nao e hook. Ela e chamada dentro de listas, e o prefixo `use` proibiria isso
 * sem comprar nada - nao ha estado aqui.
 */
export function linkTo(target: Route, navigate: (route: Route) => void) {
  return {
    href: hrefOf(target),
    onClick(event: React.MouseEvent) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      event.preventDefault()
      navigate(target)
    },
  }
}
