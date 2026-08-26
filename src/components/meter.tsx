"use client";

import { Meter as BaseMeter } from "@base-ui/react/meter";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../lib/format";
import type { Slots } from "../lib/slots";

export type MeterProps = Omit<ComponentProps<typeof BaseMeter.Root>, "format"> & {
  label?: ReactNode;
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
 * Medida de quanto de uma capacidade esta em uso: espaco, cota, limite.
 *
 * Parece o `Progress` e nao e. O progresso anda para o fim e termina; a medida
 * fica parada mostrando um estado que pode subir e descer. Trocar um pelo outro
 * faz o leitor de tela anunciar "carregando" para algo que nao carrega.
 */
export function Meter({
  className,
  label,
  showValue,
  format,
  numberFormat,
  classNames,
  ...props
}: MeterProps) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;

  return (
    <BaseMeter.Root
      {...props}
      format={numberFormat}
      className={cn("flex flex-col gap-2", className)}
    >
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && (
            <BaseMeter.Label className={cn("font-sans text-sm text-fg", classNames?.label)}>
              {label}
            </BaseMeter.Label>
          )}
          {showValue && (
            <BaseMeter.Value
              className={cn("font-mono text-xs text-fg-subtle tabular-nums", classNames?.value)}
            >
              {write ? (_, value) => (value === null ? "" : write(value)) : null}
            </BaseMeter.Value>
          )}
        </div>
      )}

      <BaseMeter.Track
        className={cn("h-1.5 w-full overflow-hidden rounded-pill bg-skeleton", classNames?.track)}
      >
        <BaseMeter.Indicator
          className={cn(
            "h-full rounded-pill bg-accent",
            "transition-[width] duration-[var(--rc-duration-base)] ease-rc",
            classNames?.indicator,
          )}
        />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
