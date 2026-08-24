"use client";

import { useId, type ComponentProps, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

import { cn } from "../lib/cn";

export type ChartConfig = Record<
  string,
  {
    /** O nome legivel da serie. Vai para a dica e para a legenda. */
    label: string;
    /**
     * A cor da serie. Sem ela, entra a proxima da paleta, na ordem em que a
     * serie aparece no `config`.
     */
    color?: string;
  }
>;

export type ChartContainerProps = Omit<ComponentProps<"div">, "children"> & {
  config: ChartConfig;
  /** Um unico grafico da Recharts: `LineChart`, `BarChart`, `AreaChart`. */
  children: ReactElement;
};

/** As oito cores de serie do tema, na ordem de uso. */
const PALETA = Array.from({ length: 8 }, (_, indice) => `var(--rc-chart-${indice + 1})`);

/**
 * A moldura de todo grafico: tamanho que acompanha o pai, cor de eixo e de
 * grade vindas do tema, e as cores de serie publicadas como variaveis com o
 * nome da serie.
 *
 * E esse ultimo ponto que muda a escrita do grafico. A serie chamada `pagas`
 * vira `var(--color-pagas)`, entao o `Line`, o `Bar` e a dica falam do mesmo
 * jeito e trocar a cor de uma serie e mexer num lugar so:
 *
 *     <Line dataKey="pagas" stroke="var(--color-pagas)" />
 *
 * A Recharts nao conhece nossos tokens e nao le classe do Tailwind, entao a
 * ponte tem que ser por variavel de CSS. Escrever a cor direta no `stroke`
 * funciona ate o tema mudar.
 *
 * A altura fica com quem usa, por classe: grafico sem altura definida some,
 * porque o `ResponsiveContainer` mede o pai e o pai mede o filho.
 */
export function ChartContainer({ config, className, children, ...props }: ChartContainerProps) {
  const id = useId().replace(/:/g, "");

  const cores = Object.entries(config)
    .map(([chave, serie], indice) => {
      const cor = serie.color ?? PALETA[indice % PALETA.length];
      return `--color-${chave}: ${cor};`;
    })
    .join("\n  ");

  return (
    <div
      {...props}
      data-rc-chart={id}
      className={cn(
        "w-full font-sans",
        // O texto dos eixos e da legenda sai da Recharts com cor propria; as
        // classes abaixo devolvem o comando ao tema.
        "[&_.recharts-cartesian-axis-tick_text]:fill-fg-subtle",
        "[&_.recharts-cartesian-axis-tick_text]:text-xs",
        "[&_.recharts-cartesian-grid_line]:stroke-chart-grid",
        "[&_.recharts-cartesian-axis-line]:stroke-border",
        "[&_.recharts-cartesian-axis-tick-line]:stroke-border",
        "[&_.recharts-legend-item-text]:text-sm",
        "[&_.recharts-legend-item-text]:!text-fg-muted",
        // O rastro que segue o ponteiro. Sem isto ele sai cinza fixo, que some
        // no tema escuro e escurece demais no claro.
        "[&_.recharts-tooltip-cursor]:fill-accent-subtle",
        "[&_.recharts-tooltip-cursor]:stroke-border",
        "[&_.recharts-reference-line_line]:stroke-border-strong",
        "[&_.recharts-surface]:outline-none",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: `[data-rc-chart="${id}"] {\n  ${cores}\n}` }} />
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
