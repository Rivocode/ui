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
