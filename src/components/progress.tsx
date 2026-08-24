"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

export type ProgressProps = Omit<ComponentProps<typeof BaseProgress.Root>, "children"> & {
  /** Texto acima da barra. Sem ele, passe `aria-label`. */
  label?: ReactNode;
  /** Mostra a porcentagem ao lado do rotulo. */
  showValue?: boolean;
};

/**
 * Barra de progresso de tarefa que tem fim conhecido: enviar arquivo, gerar
 * relatorio.
 *
 * Com `value` indefinido ela vira indeterminada, para espera sem fim previsto.
 * Nesse caso prefira o `Spinner`, que ocupa menos e nao promete um fim que
 * ninguem sabe medir.
 */
export function Progress({ className, label, showValue, ...props }: ProgressProps) {
  return (
    <BaseProgress.Root {...props} className={cn("flex flex-col gap-2", className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && (
            <BaseProgress.Label className="font-sans text-sm text-fg">{label}</BaseProgress.Label>
          )}
          {showValue && (
            <BaseProgress.Value className="font-mono text-xs text-fg-subtle tabular-nums" />
          )}
        </div>
      )}

      <BaseProgress.Track className="h-1.5 w-full overflow-hidden rounded-pill bg-skeleton">
        <BaseProgress.Indicator
          className={cn(
            "h-full rounded-pill bg-accent",
            "transition-[width] duration-[var(--rc-duration-base)] ease-rc",
          )}
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
