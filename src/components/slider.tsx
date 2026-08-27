"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../lib/format";
import type { Slots } from "../lib/slots";

export type SliderProps = Omit<ComponentProps<typeof BaseSlider.Root>, "format"> & {
  /** Texto acima do controle. Sem ele, passe `aria-label` no `thumbLabel`. */
  label?: ReactNode;
  /** Mostra o valor ao lado do rotulo. */
  showValue?: boolean;
  /**
   * Como o numero e escrito: nome de formatador da casa ou funcao propria, o
   * mesmo vocabulario do eixo do grafico. Numa faixa de dois valores, ele
   * escreve cada ponta.
   */
  format?: Format;
  /** As opcoes do `Intl.NumberFormat`, para quem precisa delas. */
  numberFormat?: Intl.NumberFormatOptions;
  /**
   * O que o leitor de tela chama o pino. Numa faixa, passe um por pino: os
   * dois precisam de nomes diferentes para o leitor saber qual e qual.
   */
  thumbLabel?: string | string[];
  /** Classe por parte: `label`, `value`, `control`, `track`, `indicator`, `thumb`. */
  classNames?: Slots<"label" | "value" | "control" | "track" | "indicator" | "thumb">;
};

export function Slider({
  className,
  label,
  showValue,
  thumbLabel,
  format,
  numberFormat,
  classNames,
  ...props
}: SliderProps) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;

  const values = props.value ?? props.defaultValue;
  const count = Array.isArray(values) ? values.length : 1;
  const labels = Array.from({ length: count }, (_, index) =>
    Array.isArray(thumbLabel) ? thumbLabel[index] : thumbLabel,
  );

  return (
    <BaseSlider.Root
      {...props}
      format={numberFormat}
      className={cn("flex flex-col gap-2", className)}
    >
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && (
            <span className={cn("font-sans text-sm text-fg", classNames?.label)}>{label}</span>
          )}
          {showValue && (
            <BaseSlider.Value
              className={cn("font-mono text-xs text-fg-subtle tabular-nums", classNames?.value)}
            >
              {write ? (_, values) => values.map(write).join(" – ") : null}
            </BaseSlider.Value>
          )}
        </div>
      )}

      <BaseSlider.Control
        className={cn("flex touch-none items-center py-2 select-none", classNames?.control)}
      >
        <BaseSlider.Track
          className={cn("h-1.5 w-full rounded-pill bg-skeleton select-none", classNames?.track)}
        >
          <BaseSlider.Indicator
            className={cn("rounded-pill bg-accent select-none", classNames?.indicator)}
          />
          {labels.map((label, index) => (
            <BaseSlider.Thumb
              key={index}
              index={index}
              aria-label={label}
              className={cn(
                "size-4 rounded-pill border border-accent bg-surface select-none",
                "relative after:absolute after:-inset-1.5",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                "has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg",
                classNames?.thumb,
              )}
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
