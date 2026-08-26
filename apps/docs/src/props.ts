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
 * O JSON tem 500 KB - toda prop de toda peca, com nota e versao -, e so a
 * pagina de uma peca aberta olha para ele. Ele chega por import dinamico: como
 * import estatico, ele entrava inteiro no chunk de quem o citasse, e a tabela
 * de props e a ultima coisa que alguem le numa pagina.
 * ------------------------------------------------------------------------- */

import type { Piece, Prop } from '@/prop-types'

export type { Prop, Piece } from '@/prop-types'

/*
 * Uma requisicao por sessao, e nao uma por tabela. Uma pagina de peca com seis
 * partes monta sete tabelas, e sem isto seriam sete promessas do mesmo chunk.
 */
let pending: Promise<Map<string, Piece>> | null = null

function catalog() {
  pending ??= import('@/component-props.json').then(
    (mod) => new Map<string, Piece>(Object.entries(mod.default as Record<string, Piece>)),
  )
  return pending
}

export async function pieceOf(component: string): Promise<Piece | undefined> {
  return (await catalog()).get(component)
}

export function propsOf(piece: Piece | undefined): Prop[] {
  return piece?.props ?? []
}

/** Se este componente repassa as props de raiz de sempre. */
export function forwardsRootProps(piece: Piece | undefined) {
  return piece?.forwardsRoot ?? false
}
