"use client";

import type { ReactNode } from "react";
import { Tooltip, type TooltipContentProps } from "recharts";

import { cn } from "../lib/cn";
import type { ChartConfig } from "./chart";

export const ChartTooltip = Tooltip;

export type ChartTooltipContentProps = Partial<TooltipContentProps<number, string>> & {
  config?: ChartConfig;
  /** Esconde a bolinha de cor de cada linha. */
  hideIndicator?: boolean;
  /** Formata o valor. Use para dinheiro e para porcentagem. */
  formatValue?: (valor: number, chave: string) => ReactNode;
  className?: string;
};

/**
 * A dica que segue o ponteiro, vestida com os nossos tokens.
 *
 * A dica da Recharts sai com fundo branco e borda cinza fixos, escritos em
 * estilo embutido. No tema escuro ela vira um retangulo branco no meio do
 * grafico, e nao ha classe que corrija estilo embutido: por isso ela e
 * substituida inteira em vez de ser pintada por cima.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  config,
  hideIndicator,
  formatValue,
  className,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface-raised px-2.5 py-2 shadow-3",
        "font-sans text-sm text-fg",
        className,
      )}
    >
      {label !== undefined && <p className="mb-1.5 font-medium text-fg">{label}</p>}

      <ul className="flex flex-col gap-1">
        {payload.map((linha) => {
          // Na pizza todas as fatias tem o mesmo `dataKey`, e quem separa e o
          // `name`. Ver `chaveDaSerie` na legenda: mesma armadilha.
          const candidatos = [linha.dataKey, linha.name].filter((x) => x != null).map(String);
          const chave = candidatos.find((candidato) => config?.[candidato]) ?? candidatos[0] ?? "";
          const nome = config?.[chave]?.label ?? linha.name ?? chave;
          const valor = typeof linha.value === "number" ? linha.value : Number(linha.value ?? 0);

          return (
            <li key={chave} className="flex items-center gap-2">
              {!hideIndicator && (
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: linha.color ?? `var(--color-${chave})` }}
                />
              )}
              <span className="flex-1 text-fg-muted">{nome}</span>
              <span className="font-mono tabular-nums text-fg">
                {formatValue ? formatValue(valor, chave) : valor.toLocaleString("pt-BR")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
