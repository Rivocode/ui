"use client";

import { Legend, type LegendPayload } from "recharts";

import { cn } from "../lib/cn";
import type { ChartConfig } from "./chart";

export const ChartLegend = Legend;

export type ChartLegendContentProps = {
  payload?: ReadonlyArray<LegendPayload>;
  config?: ChartConfig;
  className?: string;
};

/**
 * Qual nome procurar no `config`.
 *
 * Em grafico de linha e de barra a serie e o `dataKey`. Na pizza nao: todas as
 * fatias dividem o mesmo `dataKey` (`valor`), e quem separa uma da outra e o
 * `name`. Olhar so o `dataKey` faz a pizza inteira cair no mesmo nome.
 */
function chaveDaSerie(
  dataKey: unknown,
  value: unknown,
  config: ChartConfig | undefined,
): string {
  const candidatos = [dataKey, value].filter((x) => x != null).map(String);
  return candidatos.find((candidato) => config?.[candidato]) ?? candidatos[0] ?? "";
}

/**
 * A legenda, com o nome que o `config` deu a cada serie.
 *
 * Sem ela a Recharts mostra a chave crua do dado, `qtd_emitidas` em vez de
 * "Emitidas". A chave e nome de campo, e nome de campo nao e texto de tela.
 */
export function ChartLegendContent({ payload, config, className }: ChartLegendContentProps) {
  if (!payload?.length) return null;

  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-4 pt-3", className)}>
      {payload.map((serie) => {
        const chave = chaveDaSerie(serie.dataKey, serie.value, config);
        const nome = config?.[chave]?.label ?? serie.value ?? chave;

        return (
          <li key={chave} className="flex items-center gap-2 font-sans text-sm text-fg-muted">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-sm"
              style={{ background: serie.color ?? `var(--color-${chave})` }}
            />
            {String(nome)}
          </li>
        );
      })}
    </ul>
  );
}
