"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltipContent } from "./chart-tooltip";

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
  /**
   * A lista de fatias embaixo, com nome e valor. Ligada por padrao: uma rosca
   * sem ela e um desenho bonito que nao diz qual fatia e qual, e a dica so
   * responde para quem tem ponteiro.
   */
  legend?: boolean;
  /** Como escrever o valor, na legenda e na dica. */
  format?: (valor: number) => string;
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
  legend = true,
  format,
  className,
}: ChartDonutProps<Fatia>) {
  // Em fracao do raio disponivel, e nao em pixel: assim a rosca acompanha a
  // altura que a classe deu ao contentor.
  const externo = "88%";
  const interno = `${Math.round(88 * (1 - thickness))}%`;

  const corDe = (fatia: Fatia, indice: number) =>
    config?.[String(fatia[nameKey])]?.color ?? PALETA[indice % PALETA.length];

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-48 w-full">
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
                    fill={corDe(fatia, indice)}
                  />
                );
              })}
            </Pie>

            <Tooltip
              cursor={false}
              content={<ChartTooltipContent config={config} formatValue={format} />}
            />
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

      {legend && (
        <ul className="mt-3 space-y-1.5">
          {data.map((fatia, indice) => {
            const nome = String(fatia[nameKey]);
            const valor = Number(fatia[valueKey]);

            return (
              <li key={nome} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: corDe(fatia, indice) }}
                />
                <span className="min-w-0 flex-1 truncate text-fg-muted">
                  {config?.[nome]?.label ?? nome}
                </span>
                <span className="shrink-0 font-mono text-fg">{format ? format(valor) : valor}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
