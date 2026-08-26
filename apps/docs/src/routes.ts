import { useCallback, useEffect, useState } from 'react'

/* ---------------------------------------------------------------------------
 * The router
 *
 * Three shapes of address: the home page, the foundation, one component. A
 * routing library brings a route graph, per-route loading and a context:
 * worth it with dozens of screens, expensive with three.
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
  // Before the guide pattern below, which would otherwise swallow it.
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
    // Changing pages while keeping the old scroll opens the next component
    // halfway down. The browser only handles that for its own navigations.
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
 * A real link: middle click, "open in new tab" and the keyboard all keep
 * working, and a plain click still navigates without a reload.
 *
 * Not a hook. It gets called inside lists, and a `use` prefix would forbid
 * that while buying nothing, there is no state here.
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
