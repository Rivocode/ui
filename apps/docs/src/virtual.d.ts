/** O acervo da galeria de icones, gerado pelo plugin em vite.config.ts. */
declare module 'virtual:icon-gallery' {
  const icons: Record<string, Array<[string, Record<string, string>]>>
  export default icons
}

/** O indice do catalogo, gerado pelo plugin em vite.config.ts. */
declare module 'virtual:catalog-index' {
  export const DOC_INDEX: Array<{ name: string; family: string; summary: string }>
  export const NATIVE_PIECES: number
}

/** Por peca, o loader das props da pagina onde ela mora; gerado em vite.config.ts. */
declare module 'virtual:component-props' {
  export const LOADERS: Record<
    string,
    () => Promise<{ default: Record<string, import('./prop-types').Piece> }>
  >
}

/** O CSS da casa inteiro, com os imports resolvidos; gerado em vite.config.ts. */
declare module 'virtual:house-css' {
  const css: string
  export default css
}
