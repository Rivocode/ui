import { useCallback, useEffect, useState } from 'react'

/* ---------------------------------------------------------------------------
 * The router
 *
 * Three shapes of address: the cover, the foundation, a component. A routing
 * library brings a route graph, per-route loading and a context: worth it with
 * dozens of screens, expensive with three.
 * ------------------------------------------------------------------------- */

export type Route =
  | { kind: 'home' }
  | { kind: 'demo' }
  | { kind: 'foundation' }
  | { kind: 'catalog' }
  | { kind: 'theme' }
  | { kind: 'blocks' }
  | { kind: 'guide'; slug: string }
  | { kind: 'component'; slug: string }

/**
 * The path the router reads when nobody says which.
 *
 * In the browser it is the address bar. In the prerender there is no
 * `window`: the route comes from whoever is generating the page, through
 * `setRenderedPath`. Without this the first render outside the browser blows
 * up on `window`, and no page comes out with content inside `#root`.
 */
let renderedPath = '/'

export function setRenderedPath(path: string) {
  renderedPath = path
}

const currentPath = () =>
  typeof window === 'undefined' ? renderedPath : window.location.pathname

export function readRoute(path = currentPath()): Route {
  if (path === '/fundacao' || path === '/fundacao/') return { kind: 'foundation' }
  // Before the guide pattern further down, which would otherwise swallow this one.
  if (path === '/demonstracao' || path === '/demonstracao/') return { kind: 'demo' }

  if (path === '/componentes' || path === '/componentes/') return { kind: 'catalog' }
  if (path === '/tema' || path === '/tema/') return { kind: 'theme' }
  if (path === '/blocos' || path === '/blocos/') return { kind: 'blocks' }

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
  if (route.kind === 'theme') return '/tema'
  if (route.kind === 'blocks') return '/blocos'
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
    // halfway down. The browser only takes care of this on its own navigations.
    //
    // `instant` on purpose. The stylesheet sets `scroll-behavior: smooth`, and
    // without saying anything here the page change inherited that smoothness:
    // whoever clicked a name in the sidebar at the end of a long page watched
    // the old page scroll up to the top before the new one appeared.
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return { route, navigate }
}

/**
 * A real link: middle click, "open in new tab" and the keyboard keep working,
 * and a plain click navigates without reloading.
 *
 * Not a hook. It is called inside lists, and the `use` prefix would forbid
 * that without buying anything - there is no state here.
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
