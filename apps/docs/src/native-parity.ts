/* ---------------------------------------------------------------------------
 * Quantas peças existem no React Native
 *
 * Contadas da tabela de paridade do guia, e não escritas aqui. A tabela é
 * gerada por `scripts/paridade-nativo.ts` e o `bun run check:paridade` a
 * segura contra o `native/src/index.ts` — ela não consegue dizer que uma peça
 * falta depois que a peça chegou. Um número que se derive dela nasce com essa
 * garantia de graça.
 *
 * Isso importa porque a home já teve dígito escrito à mão, e ele envelheceu
 * duas vezes: ficou em 292 e depois em 348 enquanto a suíte chegava a 552. A
 * fila do nativo anda toda semana, então este seria o próximo a mentir.
 * ------------------------------------------------------------------------- */

import { findGuide } from '@/guides'

/**
 * As duas formas de estar presente contam: `✔ traduz` é a peça com o mesmo
 * nome, `✔ vira` é a que chegou com outro — `Autocomplete` virou `Combobox`,
 * `DataTable` virou `DataList`. Quem escolhe a peça no celular acha as duas.
 *
 * `○ na fila` e `✕ não porta` ficam de fora, e a distinção entre elas é o que
 * a tabela existe para fazer: a primeira muda com o tempo, a segunda é
 * decisão.
 */
export const NATIVE_PIECES = (findGuide('react-native')?.body.match(/^\| `[^`]+` \| ✔/gm) ?? [])
  .length
