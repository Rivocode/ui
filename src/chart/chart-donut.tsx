"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltipContent } from "./chart-tooltip";

import { cn } from "../lib/cn";
import { PALETTE, type ChartConfig } from "./chart";
import { resolveFormat, type Format } from "../lib/format";

export type ChartDonutProps<Slice> = Omit<ComponentProps<"div">, "children"> & {
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
  /**
   * O que o leitor de tela ouve no lugar do desenho.
   *
   * Com a legenda ligada - que e o padrao - ela nao e necessaria: cada fatia ja
   * esta ali embaixo em texto, com nome e valor, e nomear o anel de novo faria
   * a mesma lista ser lida duas vezes. Sem legenda, o nome sai dos nomes das
   * fatias; escreva o seu quando a rosca responder a uma pergunta ("Faturamento
   * por natureza").
   */
  label?: string;
};

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
  label,
  ...rest
}: ChartDonutProps<Slice>) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;

  const [reading, setReading] = useState(false);

  const outer = "88%";
  const internal = `${Math.round(88 * (1 - thickness))}%`;

  const colorOf = (slice: Slice, index: number) =>
    config?.[String(slice[nameKey])]?.color ?? PALETTE[index % PALETTE.length];

  const sliceNames = () =>
    data.map((slice) => config?.[String(slice[nameKey])]?.label ?? String(slice[nameKey]));

  const name = label ?? (legend ? undefined : `Rosca de ${sliceNames().join(", ")}`);

  return (
    <div {...rest} className={cn("w-full", className)}>
      <div className="relative h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart
            tabIndex={-1}
            role={name ? "img" : undefined}
            aria-label={name}
            aria-hidden={name ? undefined : true}
          >
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              innerRadius={internal}
              outerRadius={outer}
              paddingAngle={2}
              cornerRadius={4}
              isAnimationActive={false}
              onMouseEnter={() => setReading(true)}
              onMouseLeave={() => setReading(false)}
              stroke="none"
            >
              {data.map((slice, index) => {
                const name = String(slice[nameKey]);

                return <Cell key={name} fill={colorOf(slice, index)} />;
              })}
            </Pie>

            <Tooltip
              cursor={false}
              content={<ChartTooltipContent config={config} formatValue={write} />}
            />
          </PieChart>
        </ResponsiveContainer>

        {(centerValue || centerLabel) && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex flex-col items-center justify-center",
              "transition-opacity duration-[var(--rc-duration-fast)] ease-rc",
              reading && "opacity-0",
            )}
          >
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
