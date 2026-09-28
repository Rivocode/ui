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
 * O build escreve a pagina inteira dentro do `#root`, entao aqui ela ja existe
 * pintada: o React so precisa se prender ao que esta na tela. O `vite dev` e um
 * `dist` gerado sem o passo de prerender entregam o `#root` vazio, e ai a
 * montagem e a de sempre. Trocar `hydrateRoot` por `createRoot` no caso
 * prerenderizado apagaria o HTML e o repintaria - o pisco que o prerender
 * existe para eliminar.
 */
if (root.firstChild) hydrateRoot(root, tree)
else createRoot(root).render(tree)
