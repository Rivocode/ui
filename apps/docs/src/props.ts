/* ---------------------------------------------------------------------------
 * As props, para a pagina
 *
 * A tabela e gerada do compilador, pelo `scripts/props-do-catalogo.ts`, e
 * comitada como JSON. Tabela de prop escrita a mao e a primeira coisa a
 * apodrecer: renomeia-se uma prop, a tabela guarda o nome velho, e a pagina
 * mente com confianca. O que havia antes apodrecia um passo antes - as tabelas
 * eram lidas de um retrato de `.d.ts` deixado por um sync de bundle, carimbado
 * 0.1.0, que nao trazia callback nenhum.
 *
 * O `bun run check:props` falha quando este arquivo se afasta dos tipos.
 * ------------------------------------------------------------------------- */

import CATALOG from '@/component-props.json'
import type { Piece, Prop } from '@/prop-types'

export type { Prop, Piece } from '@/prop-types'

const byName = new Map<string, Piece>(Object.entries(CATALOG as Record<string, Piece>))

export function propsOf(component: string): Prop[] {
  return byName.get(component)?.props ?? []
}

/** Se este componente repassa as props de raiz de sempre. */
export function forwardsRootProps(component: string) {
  return byName.get(component)?.forwardsRoot ?? false
}
