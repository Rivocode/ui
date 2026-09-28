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
 *
 * O JSON tem 500 KB - toda prop de toda peca, com nota e versao -, e a pagina
 * de uma peca so le as tabelas dela. Ele chega fatiado, um chunk por pagina, pelo
 * `propsByPage` em `vite.config.ts`: inteiro, ele era o maior download da
 * pagina de peca e o ultimo a chegar.
 * ------------------------------------------------------------------------- */

import { LOADERS } from 'virtual:component-props'
import type { Piece, Prop } from '@/prop-types'

export type { Prop, Piece } from '@/prop-types'

/*
 * Uma promessa por peca, e nao uma por render: e por essa identidade que o
 * `use()` reconhece o dado que ja chegou. Peca sem tabela nao pede nada.
 */
const byComponent = new Map<string, Promise<Piece | undefined>>()

export function pieceOf(component: string): Promise<Piece | undefined> {
  let found = byComponent.get(component)
  if (!found) {
    const load = LOADERS[component]
    found = load ? load().then((mod) => mod.default[component]) : Promise.resolve(undefined)
    byComponent.set(component, found)
  }
  return found
}

export function propsOf(piece: Piece | undefined): Prop[] {
  return piece?.props ?? []
}

/** Se este componente repassa as props de raiz de sempre. */
export function forwardsRootProps(piece: Piece | undefined) {
  return piece?.forwardsRoot ?? false
}
