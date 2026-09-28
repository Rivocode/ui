/* ---------------------------------------------------------------------------
 * A forma de uma prop documentada
 *
 * Ela mora longe de `props.ts` porque aquele modulo CARREGA o catalogo gerado -
 * um JSON importado pelo alias `@/`, que so o tsconfig do site sabe resolver.
 * Quem precisa apenas da forma (o renderer de markdown, um teste) arrastaria
 * esse import para o proprio grafo de tipos e deixaria de compilar em algum
 * outro lugar.
 * ------------------------------------------------------------------------- */

export type Prop = {
  name: string
  type: string
  required: boolean
  /** O bloco de doc acima da prop, quando a fonte carrega um. */
  note?: string
  /** A versao em que a prop saiu. Ausente quer dizer que ela ainda nao saiu. */
  since?: string
}

/** Uma peca e o que ela repassa, do jeito que o gerador escreve. */
export type Piece = { forwardsRoot: boolean; props: Prop[] }
