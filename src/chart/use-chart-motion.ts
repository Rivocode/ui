"use client";

import { useMediaQuery } from "../lib/tela";

export type ChartMotion = {
  /** Espalhe em `Line`, `Bar`, `Area` e `Pie`. */
  isAnimationActive: boolean;
};

/**
 * Liga a animacao da Recharts a preferencia de movimento do sistema.
 *
 * O resto do catalogo resolve isso por token: `--rc-duration-*` vai a zero e
 * toda transicao para. A Recharts nao anima por CSS, ela interpola em JS, e
 * nenhum token a alcanca. Sem isto, o unico movimento que sobra numa tela com
 * "reduzir movimento" ligado e justamente o maior deles.
 *
 *     const movimento = useChartMotion();
 *     <Line dataKey="pagas" {...movimento} />
 */
export function useChartMotion(): ChartMotion {
  const menosMovimento = useMediaQuery("(prefers-reduced-motion: reduce)");
  return { isAnimationActive: !menosMovimento };
}
