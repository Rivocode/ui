"use client";

import type { ReactNode } from "react";
import { Tooltip, type TooltipContentProps } from "recharts";

import { cn } from "../lib/cn";
import type { ChartConfig } from "./chart";

export const ChartTooltip = Tooltip;

/**
 * So o que a Recharts injeta E esta funcao le.
 *
 * O tipo era `Partial<TooltipContentProps<…>>` inteiro, e isso publicava 34
 * props da Recharts na NOSSA tabela de props - `wrapperClassName`,
 * `labelClassName`, `contentStyle`, `separator`, `offset` e companhia. Nenhuma
 * era desestruturada aqui, entao todas apareciam no site e nao faziam nada: a
 * pessoa escrevia `labelClassName` e ficava procurando o proprio erro.
 *
 * Nao ha o que honrar nelas. Esta dica substitui a `DefaultTooltipContent`
 * inteira - e por isso que ela existe -, e as duas classes que a Recharts
 * oferece ja tem endereco na casa: a raiz se veste por `className`, como toda
 * peca da biblioteca, e nao vale ter dois nomes para a mesma raiz. As de
 * estilo embutido vao contra o motivo da substituicao, que foi tirar estilo
 * embutido do caminho do tema.
 *
 * As tres que sobram sao as que a Recharts clona para dentro do elemento a
 * cada movimento do ponteiro, e as unicas que este corpo consulta. O `Partial`
 * continua: no tipo da Recharts `active` e `payload` sao obrigatorias porque
 * quem as escreve e ela, no clone - quem monta o grafico escreve so
 * `<ChartTooltipContent config={…} />`, e sem o `Partial` isso nao compila.
 */
export type ChartTooltipContentProps = Partial<
  Pick<TooltipContentProps<number, string>, "active" | "payload" | "label">
> & {
  config?: ChartConfig;
  /** Esconde a bolinha de cor de cada linha. */
  hideIndicator?: boolean;
  /** Formata o valor. Use para dinheiro e para porcentagem. */
  formatValue?: (value: number, key: string) => ReactNode;
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
        {payload.map((entry) => {
          // Na pizza todas as fatias tem o mesmo `dataKey`, e quem separa e o
          // `name`. Ver `seriesKey` na legenda: mesma armadilha.
          const candidates = [entry.dataKey, entry.name].filter((x) => x != null).map(String);
          const key = candidates.find((candidate) => config?.[candidate]) ?? candidates[0] ?? "";
          const name = config?.[key]?.label ?? entry.name ?? key;
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value ?? 0);

          return (
            <li key={key} className="flex items-center gap-2">
              {!hideIndicator && (
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: entry.color ?? `var(--color-${key})` }}
                />
              )}
              <span className="flex-1 text-fg-muted">{name}</span>
              <span className="font-mono tabular-nums text-fg">
                {formatValue ? formatValue(value, key) : value.toLocaleString("pt-BR")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
