/* ---------------------------------------------------------------------------
 * O que o Select e o Combobox compartilham quando `multiple` esta ligado.
 *
 * Mora fora dos dois de proposito: sao a MESMA escolha com dois desenhos de
 * lista - poucas opcoes fixas contra lista longa com busca - e a contagem do
 * gatilho e a regra de alternar precisam sair identicas. Escritas duas vezes,
 * a primeira que derivar (um dizendo "3 selecionados" e o outro "3 itens")
 * parece defeito de um dos dois para quem usa, e ninguem descobre qual.
 * ------------------------------------------------------------------------- */

export type PickerItem = { label: string; value: string };

/**
 * Marca ou desmarca um valor. A ordem e a de chegada, e nao a da lista de
 * origem: quem escolhe tres categorias le de volta na ordem em que tocou, que
 * e a unica ordem que a pessoa consegue prever.
 */
export function toggleValue(chosen: string[], value: string): string[] {
  return chosen.includes(value) ? chosen.filter((other) => other !== value) : [...chosen, value];
}

/**
 * O resumo do gatilho. `undefined` quer dizer "nada escolhido", e ai quem
 * chama poe o placeholder - a mesma saida do caso vazio da escolha unica.
 *
 * Com uma escolha so, vale o nome dela: "1 selecionado" seria uma contagem
 * gasta para esconder a informacao que cabia no lugar. De duas em diante o
 * nome nao cabe mais no gatilho, e ai a contagem e o que sobra de honesto -
 * cortar a lista em "Servico, Produto..." esconde justamente o que ficou de
 * fora das reticencias.
 *
 * O MESMO texto vai para a tela e para o `accessibilityValue` do gatilho: sem
 * isso o leitor de tela anunciava o primeiro escolhido e calava sobre os
 * outros dois, e quem nao ve a tela nao tinha como saber que havia mais.
 */
export function summarize(chosen: string[], items: PickerItem[]): string | undefined {
  if (chosen.length === 0) return undefined;
  if (chosen.length === 1) return items.find((item) => item.value === chosen[0])?.label;
  return `${chosen.length} selecionados`;
}
