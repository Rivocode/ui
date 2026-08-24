"use client";

import { Meter as BaseMeter } from "@base-ui/react/meter";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

export type MeterProps = ComponentProps<typeof BaseMeter.Root> & {
  label?: ReactNode;
  showValue?: boolean;
};

/**
 * Medida de quanto de uma capacidade esta em uso: espaco, cota, limite.
 *
 * Parece o `Progress` e nao e. O progresso anda para o fim e termina; a medida
 * fica parada mostrando um estado que pode subir e descer. Trocar um pelo outro
 * faz o leitor de tela anunciar "carregando" para algo que nao carrega.
 */
export function Meter({ className, label, showValue, ...props }: MeterProps) {
  return (
    <BaseMeter.Root {...props} className={cn("flex flex-col gap-2", className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && (
            <BaseMeter.Label className="font-sans text-sm text-fg">{label}</BaseMeter.Label>
          )}
          {showValue && (
            <BaseMeter.Value className="font-mono text-xs text-fg-subtle tabular-nums" />
          )}
        </div>
      )}

      <BaseMeter.Track className="h-1.5 w-full overflow-hidden rounded-pill bg-skeleton">
        <BaseMeter.Indicator
          className={cn(
            "h-full rounded-pill bg-accent",
            "transition-[width] duration-[var(--rc-duration-base)] ease-rc",
          )}
        />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
