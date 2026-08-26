"use client";

import type { ComponentProps } from "react";
import { XAxis, YAxis } from "recharts";

import { resolveFormat, type Format } from "./format";

/* ---------------------------------------------------------------------------
 * Os eixos.
 *
 * A Recharts desenha eixo do jeito de 2015: fio grosso, um risquinho em cada
 * valor, numero cru. Todo grafico da biblioteca desligava os tres na mao e
 * repetia `tickLine={false} axisLine={false}` em cada tela, ate alguem
 * esquecer, e um grafico sair diferente do resto.
 *
 * Aqui o padrao ja nasce certo, e o que sobra e o que muda de verdade: qual
 * campo o eixo le, e como o numero aparece.
 * ------------------------------------------------------------------------- */

type BaseX = ComponentProps<typeof XAxis>;
type BaseY = ComponentProps<typeof YAxis>;

export type ChartXAxisProps = Omit<BaseX, "tickFormatter"> & {
  /** `'monthShort'`, `'dayMonth'`, ou uma funcao propria. */
  format?: Format;
};

export type ChartYAxisProps = Omit<BaseY, "tickFormatter"> & {
  /** `'currencyShort'`, `'compact'`, `'percent'`, `'integer'`, ou uma funcao propria. */
  format?: Format;
};

/**
 * O eixo de baixo: categoria ou tempo.
 *
 * ```tsx
 * <ChartXAxis dataKey="month" />
 * <ChartXAxis dataKey="day" format="dayMonth" />
 * ```
 */
export function ChartXAxis({ format, ...props }: ChartXAxisProps) {
  return (
    <XAxis
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      minTickGap={16}
      tickFormatter={resolveFormat(format)}
      {...props}
    />
  );
}

/**
 * O eixo da esquerda: a grandeza.
 *
 * ```tsx
 * <ChartYAxis format="currencyShort" />
 * <ChartYAxis format="percent" domain={[0, 100]} />
 * ```
 *
 * O `width` e menor que o da Recharts de proposito: com o numero abreviado pelo
 * `format`, a largura padrao deles deixa um vao entre o eixo e a area do
 * grafico, e todo mundo compensava com `margin={{ left: -20 }}`. Passe a sua
 * quando os numeros forem mais longos que uma moeda curta.
 */
export function ChartYAxis({ format, ...props }: ChartYAxisProps) {
  return (
    <YAxis
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      // Largo o bastante para `R$ 246,7K`, que e o que o `currencyShort`
      // escreve no topo do eixo de um painel. Em 48 o rotulo quebrava em tres
      // linhas e o eixo virava paragrafo. Com `currencyShortWords`, que
      // escreve `mil` por extenso, passe um `width` maior.
      width={56}
      tickFormatter={resolveFormat(format)}
      {...props}
    />
  );
}
