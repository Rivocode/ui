"use client";

import {
  createContext,
  use,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { ResponsiveContainer } from "recharts";

import { Alert, AlertDescription, AlertTitle } from "../components/alert";
import { Button } from "../components/button";
import { EmptyState } from "../components/empty-state";
import { Skeleton } from "../components/skeleton";
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

  /* Os estados de uma consulta, como no `DataTable`. Um grafico que so sabe
   * desenhar dado pronto empurra para cada tela o mesmo `if` de tres galhos, e
   * cada tela resolve de um jeito. */
  isLoading?: boolean;
  isError?: boolean;
  /** Sem isto, o erro nao oferece nova tentativa. */
  onRetry?: () => void;
  errorMessage?: ReactNode;
  /** O que aparece quando a consulta volta sem nenhum ponto. */
  empty?: { title: string; description: string; icon?: ReactNode };
  /** Considera vazio tambem quando a serie existe mas nao tem ponto. */
  data?: readonly unknown[];
};

/** As oito cores de serie do tema, na ordem em que devem ser usadas. */
export const PALETTE = Array.from({ length: 8 }, (_, index) => `var(--rc-chart-${index + 1})`);

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
export function ChartContainer({
  config,
  className,
  children,
  isLoading,
  isError,
  onRetry,
  errorMessage,
  empty,
  data,
  ...props
}: ChartContainerProps) {
  const id = useId().replace(/:/g, "");

  const colors = Object.entries(config)
    .map(([key, series], index) => {
      const color = series.color ?? PALETTE[index % PALETTE.length];
      return `--color-${key}: ${color};`;
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
      <style dangerouslySetInnerHTML={{ __html: `[data-rc-chart="${id}"] {\n  ${colors}\n}` }} />

      {isLoading ? (
        <StateFrame>
          {/* Barras de altura desigual: um esqueleto retangular nao parece
           * grafico, e a espera fica sem forma. */}
          <div className="flex h-full w-full items-end gap-3 px-2 pb-6">
            {[0.45, 0.7, 0.35, 0.85, 0.6, 0.75].map((height, index) => (
              <Skeleton key={index} className="w-full" style={{ height: `${height * 100}%` }} />
            ))}
          </div>
        </StateFrame>
      ) : isError ? (
        <StateFrame>
          <Alert tone="danger" className="w-full">
            <AlertTitle>Não foi possível carregar o gráfico</AlertTitle>
            <AlertDescription>
              {errorMessage ?? "Tente de novo em alguns minutos."}
            </AlertDescription>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="mt-3">
                Tentar de novo
              </Button>
            )}
          </Alert>
        </StateFrame>
      ) : empty && data && data.length === 0 ? (
        <StateFrame>
          <EmptyState title={empty.title} description={empty.description} icon={empty.icon} />
        </StateFrame>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}

/** Ocupa a altura que o grafico ocuparia, para a tela nao pular entre estados. */
function StateFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center">{children}</div>;
}
