"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../lib/format";
import type { Slots } from "../lib/slots";

export type ProgressProps = Omit<
  ComponentProps<typeof BaseProgress.Root>,
  "children" | "format"
> & {
  /** Texto acima da barra. Sem ele, passe `aria-label`. */
  label?: ReactNode;
  /** Mostra a porcentagem ao lado do rotulo. */
  showValue?: boolean;
  /**
   * Como o numero e escrito: nome de formatador da casa (`percent`,
   * `currencyShort`, `integer`...) ou funcao propria. E o mesmo vocabulario do
   * eixo do grafico - `format` significava tres coisas diferentes na mesma
   * biblioteca, e a que nao dava erro de tipo era a pior: `{ style: "percent" }`
   * num medidor de 0 a 100 imprime 8.200% ao lado de uma barra em 82%.
   */
  format?: Format;
  /** As opcoes do `Intl.NumberFormat`, para quem precisa delas. */
  numberFormat?: Intl.NumberFormatOptions;
  /** Classe por parte: `label`, `value`, `track`, `indicator`. */
  classNames?: Slots<"label" | "value" | "track" | "indicator">;
};

/**
 * Barra de progresso de tarefa que tem fim conhecido: enviar arquivo, gerar
 * relatorio.
 *
 * Com `value={null}` ela vira indeterminada, para espera sem fim previsto.
 * Nesse caso prefira o `Spinner`, que ocupa menos e nao promete um fim que
 * ninguem sabe medir.
 */
export function Progress({
  className,
  label,
  showValue,
  format,
  numberFormat,
  classNames,
  ...props
}: ProgressProps) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;

  return (
    <BaseProgress.Root
      {...props}
      format={numberFormat}
      className={cn("flex flex-col gap-2", className)}
    >
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && (
            <BaseProgress.Label className={cn("font-sans text-sm text-fg", classNames?.label)}>
              {label}
            </BaseProgress.Label>
          )}
          {showValue && (
            <BaseProgress.Value
              className={cn("font-mono text-xs text-fg-subtle tabular-nums", classNames?.value)}
            >
              {write ? (_, value) => (value === null ? "" : write(value)) : null}
            </BaseProgress.Value>
          )}
        </div>
      )}

      <BaseProgress.Track
        className={cn("h-1.5 w-full overflow-hidden rounded-pill bg-skeleton", classNames?.track)}
      >
        <BaseProgress.Indicator
          className={cn(
            "h-full rounded-pill bg-accent",
            "transition-[width] duration-[var(--rc-duration-base)] ease-rc",
            // Indeterminada, o indicador nao recebe largura da Base UI e
            // ocuparia a trilha inteira, parado - que e como se le uma barra
            // em 100%. Um quinto da trilha atravessando diz espera.
            "data-[indeterminate]:w-1/5 data-[indeterminate]:animate-indeterminate",
            "motion-reduce:animate-none",
            classNames?.indicator,
          )}
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
