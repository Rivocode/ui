/* ---------------------------------------------------------------------------
 * A geometria que a rosca e o arco dividem.
 *
 * As duas peças desenham a mesma figura — um pedaço de circunferência com
 * espessura — e só discordam em quantos pedaços e de que cor. Escrita duas
 * vezes, essa trigonometria daria dois desenhos ligeiramente diferentes, e o
 * erro de meio grau só aparece na tela, nunca no teste de contagem.
 *
 * Tudo aqui mora num espaço fixo de 100 por 100 com o centro em (0,0) — o
 * `viewBox` que as duas peças declaram. É por isso que nenhuma delas mede o
 * próprio tamanho com `onLayout`, como a `Sparkline` é obrigada a fazer: o
 * `react-native-svg` escala o desenho inteiro para a caixa que a classe deu,
 * e a conta acontece uma vez, em unidade que não muda com o aparelho.
 * ------------------------------------------------------------------------- */

/**
 * Onde cai um ponto da circunferência, em graus a partir do topo e no sentido
 * do relógio.
 *
 * O SVG conta ângulo a partir das três horas, e o y dele cresce para baixo;
 * rosca e medidor se descrevem a partir do topo, que é onde a leitura começa.
 * Os `-90` fazem essa troca uma vez, e é o que deixa o resto do arquivo dizer
 * "45 graus a partir do topo" sem corrigir nada depois.
 *
 * O arredondamento não é enfeite: sem ele cada ponto entra no caminho com
 * dezessete casas, e o `d` de uma rosca de seis fatias passa de mil e
 * duzentos caracteres — uma string que o compilador nativo remonta a cada
 * quadro do desenho.
 */
function pointAt(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  const x = radius * Math.cos(radians);
  const y = radius * Math.sin(radians);
  return `${x.toFixed(3)} ${y.toFixed(3)}`;
}

/**
 * O caminho de um pedaço de circunferência, para ser **traçado** e não
 * preenchido: `stroke` na cor, `strokeWidth` igual à espessura, `fill="none"`.
 *
 * Traçar em vez de preencher é o que dispensa metade do desenho. A fatia
 * preenchida de uma rosca é arco de fora, reta para dentro, arco de dentro no
 * sentido inverso e fecha — quatro comandos, dois raios e duas chances de
 * errar o sentido. Traçada, ela é UM arco no raio do meio, e a espessura
 * passa a ser um número solto, que é exatamente o que a prop `thickness` já é.
 *
 * `to` tem que ser maior que `from`: o sinalizador de sentido vai cravado em
 * 1, que no SVG é o sentido do relógio.
 */
export function arcPath(radius: number, from: number, to: number) {
  // O sinalizador de arco longo. Sem ele, todo pedaço acima de meia volta sai
  // desenhado pelo lado curto - uma fatia de 70% aparece como 30%.
  const long = Math.abs(to - from) > 180 ? 1 : 0;

  // O raio arredonda pelo mesmo motivo dos pontos: `44 * (1 - 0.34)` não é um
  // número redondo em ponto flutuante, e ele entraria no caminho com dezessete
  // casas, duas vezes.
  const r = radius.toFixed(3);

  return `M ${pointAt(radius, from)} A ${r} ${r} 0 ${long} 1 ${pointAt(radius, to)}`;
}
