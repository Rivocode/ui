"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { cn } from "../lib/cn";
import { PALETA, type ChartConfig } from "./chart";

export type ChartDonutProps<Fatia> = {
  data: Fatia[];
  /** De onde sai o numero de cada fatia. */
  valueKey: keyof Fatia & string;
  /** De onde sai o nome de cada fatia. E ele que o `config` procura. */
  nameKey: keyof Fatia & string;
  config?: ChartConfig;
  /** O numero grande no meio. Sem ele, o miolo fica vazio. */
  centerValue?: ReactNode;
  /** A linha pequena embaixo do numero. */
  centerLabel?: ReactNode;
  /**
   * Espessura do anel, em fracao do raio. `1` fecha e vira pizza. Anel mais
   * fino deixa buraco maior, e e ali que o total precisa caber.
   */
  thickness?: number;
  className?: string;
};

/**
 * Rosca com o total no meio.
 *
 * A pizza responde "qual e a maior fatia" e nada mais; a rosca responde a mesma
 * coisa e ainda usa o buraco para dizer o total, que e o numero que a pessoa
 * veio buscar. Um painel que mostra a divisao sem mostrar o total obriga a
 * somar de cabeca.
 *
 * ```tsx
 * <ChartDonut
 *   data={porNatureza}
 *   valueKey="total"
 *   nameKey="natureza"
 *   config={NATUREZA}
 *   centerValue={moedaCurta(246700)}
 *   centerLabel="faturado"
 * />
 * ```
 *
 * Acima de seis fatias ela para de informar: as menores viram tiras finas e a
 * legenda vira uma lista. Nesse caso, barra deitada le melhor.
 */
export function ChartDonut<Fatia extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  config,
  centerValue,
  centerLabel,
  thickness = 0.34,
  className,
}: ChartDonutProps<Fatia>) {
  // Em fracao do raio disponivel, e nao em pixel: assim a rosca acompanha a
  // altura que a classe deu ao contentor.
  const externo = "88%";
  const interno = `${Math.round(88 * (1 - thickness))}%`;

  return (
    <div className={cn("relative h-48 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius={interno}
            outerRadius={externo}
            paddingAngle={2}
            isAnimationActive={false}
            // Sem traco entre as fatias: no tema escuro ele vira uma linha
            // clara que compete com a propria cor da fatia.
            stroke="none"
          >
            {data.map((fatia, indice) => {
              const nome = String(fatia[nameKey]);

              return (
                <Cell
                  key={nome}
                  // A cor escrita no `config`, ou a paleta na ordem. O que nao
                  // da e cair em `var(--color-<nome>)`: essas variaveis sao
                  // escritas pelo `ChartContainer`, e a rosca desenha sozinha,
                  // fora dele. Foi assim que ela saiu inteira preta.
                  fill={config?.[nome]?.color ?? PALETA[indice % PALETA.length]}
                />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {(centerValue || centerLabel) && (
        // `pointer-events-none` para o miolo nao roubar a dica das fatias de
        // dentro do anel.
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {/* Preso a largura do buraco: um total longo escapando por cima do
              anel e o defeito classico da rosca com numero no meio. */}
          {centerValue && (
            <span className="max-w-[52%] text-center font-display text-xl leading-tight text-balance text-fg">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="mt-0.5 max-w-[52%] truncate text-xs text-fg-subtle">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
