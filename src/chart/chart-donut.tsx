"use client";

import { useState, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltipContent } from "./chart-tooltip";

import { cn } from "../lib/cn";
import { PALETTE, type ChartConfig } from "./chart";
import { resolveFormat, type Format } from "../lib/format";

export type ChartDonutProps<Slice> = {
  data: Slice[];
  /** De onde sai o numero de cada fatia. */
  valueKey: keyof Slice & string;
  /** De onde sai o nome de cada fatia. E ele que o `config` procura. */
  nameKey: keyof Slice & string;
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
  /**
   * Como o numero e escrito: nome de formatador da casa (`currencyShort`,
   * `percent`, `integer`...) ou funcao propria. O mesmo vocabulario do eixo e
   * do Meter - antes daqui so a funcao entrava, e o nome dava erro de tipo.
   */
  format?: Format;
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
export function ChartDonut<Slice extends Record<string, unknown>>({
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
}: ChartDonutProps<Slice>) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;

  /** Verdadeiro enquanto o ponteiro esta sobre alguma fatia. */
  const [reading, setReading] = useState(false);

  // Em fracao do raio disponivel, e nao em pixel: assim a rosca acompanha a
  // altura que a classe deu ao contentor.
  const outer = "88%";
  const internal = `${Math.round(88 * (1 - thickness))}%`;

  const colorOf = (slice: Slice, index: number) =>
    config?.[String(slice[nameKey])]?.color ?? PALETTE[index % PALETTE.length];

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              innerRadius={internal}
              outerRadius={outer}
              paddingAngle={2}
              // A ponta reta e o que faz a rosca parecer recortada a tesoura,
              // ainda mais com a folga do `paddingAngle` mostrando o corte. O
              // raio acompanha a curva do resto da biblioteca.
              cornerRadius={4}
              isAnimationActive={false}
              onMouseEnter={() => setReading(true)}
              onMouseLeave={() => setReading(false)}
              // Sem traco entre as fatias: no tema escuro ele vira uma linha
              // clara que compete com a propria cor da fatia.
              stroke="none"
            >
              {data.map((slice, index) => {
                const name = String(slice[nameKey]);

                return (
                  <Cell
                    key={name}
                    // A cor escrita no `config`, ou a paleta na ordem. O que nao
                    // da e cair em `var(--color-<nome>)`: essas variaveis sao
                    // escritas pelo `ChartContainer`, e a rosca desenha sozinha,
                    // fora dele. Foi assim que ela saiu inteira preta.
                    fill={colorOf(slice, index)}
                  />
                );
              })}
            </Pie>

            <Tooltip
              cursor={false}
              content={<ChartTooltipContent config={config} formatValue={write} />}
            />
          </PieChart>
        </ResponsiveContainer>

        {(centerValue || centerLabel) && (
          // `pointer-events-none` para o miolo nao roubar a dica das fatias de
          // dentro do anel.
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex flex-col items-center justify-center",
              "transition-opacity duration-[var(--rc-duration-fast)] ease-rc",
              // A dica nasce colada no cursor, e com o cursor no anel ela cai
              // justamente sobre o meio: dois numeros um por cima do outro, e
              // nenhum dos dois legivel. Enquanto se le uma fatia, o total sai
              // de cena e volta sozinho.
              reading && "opacity-0",
            )}
          >
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
          {data.map((slice, index) => {
            const name = String(slice[nameKey]);
            const value = Number(slice[valueKey]);

            return (
              <li key={name} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: colorOf(slice, index) }}
                />
                <span className="min-w-0 flex-1 truncate text-fg-muted">
                  {config?.[name]?.label ?? name}
                </span>
                <span className="shrink-0 font-mono text-fg">{write ? write(value) : value}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
