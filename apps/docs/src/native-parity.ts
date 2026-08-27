/* ---------------------------------------------------------------------------
 * Quantas peças existem no React Native
 *
 * Contadas da tabela de paridade do guia, e não escritas aqui. A tabela é
 * gerada por `scripts/paridade-nativo.ts` e o `bun run check:paridade` a
 * segura contra o `native/src/index.ts`: ela não consegue dizer que uma peça
 * falta depois que a peça chegou. Um número que se derive dela nasce com essa
 * garantia de graça.
 *
 * Isso importa porque a home já teve dígito escrito à mão, e ele envelheceu
 * duas vezes: ficou em 292 e depois em 348 enquanto a suíte chegava a 552. A
 * fila do nativo anda toda semana, então este seria o próximo a mentir.
 *
 * A contagem passou a sair no build, e não no navegador: fazer a conta aqui
 * obrigava a home a carregar o guia inteiro (30 KB de tabela) para imprimir
 * dois dígitos. O `catalogIndex` em `vite.config.ts` lê a mesma tabela.
 * ------------------------------------------------------------------------- */

export { NATIVE_PIECES } from 'virtual:catalog-index'
