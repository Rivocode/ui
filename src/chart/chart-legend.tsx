"use client";

import { useCallback, useState } from "react";
import { Legend, type LegendPayload } from "recharts";

import { cn } from "../lib/cn";
import type { ChartConfig } from "./chart";

export const ChartLegend = Legend;

export type ChartLegendContentProps = {
  payload?: ReadonlyArray<LegendPayload>;
  config?: ChartConfig;
  className?: string;
  /**
   * As series escondidas agora. Passe junto com `onToggle` para a legenda
   * virar filtro.
   */
  hidden?: readonly string[];
  /**
   * Chamado com a chave da serie clicada. Com ele a legenda vira botao; sem
   * ele ela continua sendo so texto, e nao finge ser clicavel.
   */
  onToggle?: (key: string) => void;
};

/**
 * Qual nome procurar no `config`.
 *
 * Em grafico de linha e de barra a serie e o `dataKey`. Na pizza nao: todas as
 * fatias dividem o mesmo `dataKey` (`valor`), e quem separa uma da outra e o
 * `name`. Olhar so o `dataKey` faz a pizza inteira cair no mesmo nome.
 */
function seriesKey(dataKey: unknown, value: unknown, config: ChartConfig | undefined): string {
  const candidates = [dataKey, value].filter((x) => x != null).map(String);
  return candidates.find((candidate) => config?.[candidate]) ?? candidates[0] ?? "";
}

/**
 * A legenda, com o nome que o `config` deu a cada serie.
 *
 * Sem ela a Recharts mostra a chave crua do dado, `qtd_emitidas` em vez de
 * "Emitidas". A chave e nome de campo, e nome de campo nao e texto de tela.
 */
export function ChartLegendContent({
  payload,
  config,
  className,
  hidden,
  onToggle,
}: ChartLegendContentProps) {
  if (!payload?.length) return null;

  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-4 pt-3", className)}>
      {payload.map((series) => {
        const key = seriesKey(series.dataKey, series.value, config);
        const name = config?.[key]?.label ?? series.value ?? key;
        const escondida = hidden?.includes(key) ?? false;

        const content = (
          <>
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0 rounded-sm transition-opacity",
                escondida && "opacity-30",
              )}
              style={{ background: series.color ?? `var(--color-${key})` }}
            />
            <span className={cn(escondida && "line-through opacity-60")}>{String(name)}</span>
          </>
        );

        if (!onToggle) {
          return (
            <li key={key} className="flex items-center gap-2 font-sans text-sm text-fg-muted">
              {content}
            </li>
          );
        }

        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onToggle(key)}
              aria-pressed={!escondida}
              className={cn(
                "flex items-center gap-2 rounded-sm px-1 py-0.5",
                "font-sans text-sm text-fg-muted",
                "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
                "hover:text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {content}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * O estado de quais series estao escondidas.
 *
 * Vive aqui e nao dentro da legenda porque quem esconde a serie tambem precisa
 * deixar de desenhar a linha dela, e isso acontece no grafico, um nivel acima.
 *
 * ```tsx
 * const series = useSeriesToggle()
 * <ChartLegend content={<ChartLegendContent config={CONFIG} {...series} />} />
 * {!series.isHidden('pagas') && <Line dataKey="pagas" />}
 * ```
 */
export function useSeriesToggle(initial: readonly string[] = []) {
  const [hidden, setHidden] = useState<readonly string[]>(initial);

  const onToggle = useCallback((key: string) => {
    setHidden((current) =>
      current.includes(key) ? current.filter((outra) => outra !== key) : [...current, key],
    );
  }, []);

  const isHidden = useCallback((key: string) => hidden.includes(key), [hidden]);

  return { hidden, onToggle, isHidden };
}
