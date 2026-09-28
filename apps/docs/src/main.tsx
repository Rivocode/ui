import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from '@/app'
import './styles.css'

const root = document.getElementById('root')!

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
)

/*
 * The build writes the whole page inside `#root`, so here it already exists,
 * painted: React only needs to attach to what is on screen. `vite dev` and a
 * `dist` built without the prerender step deliver an empty `#root`, and then
 * the mount is the usual one. Swapping `hydrateRoot` for `createRoot` in the
 * prerendered case would erase the HTML and repaint it - the flicker the
 * prerender exists to remove.
 */
if (root.firstChild) hydrateRoot(root, tree)
else createRoot(root).render(tree)
