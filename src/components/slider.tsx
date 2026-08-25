"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

export type SliderProps = ComponentProps<typeof BaseSlider.Root> & {
  /** Texto acima do controle. Sem ele, passe `aria-label` no `thumbLabel`. */
  label?: ReactNode;
  /** Mostra o valor ao lado do rotulo. */
  showValue?: boolean;
  /**
   * O que o leitor de tela chama o pino. Numa faixa, passe um por pino: os
   * dois precisam de nomes diferentes para o leitor saber qual e qual.
   */
  thumbLabel?: string | string[];
};

/**
 * Escolha de valor numa faixa: desconto, prazo, tolerancia.
 *
 * So vale quando o numero exato nao importa. Se importa, o `NumberField` diz
 * mais e nao pede pontaria; arrastar um pino ate 37 e trabalho, digitar 37 nao.
 *
 * Com dois valores no `defaultValue`, vira faixa de dois pinos.
 */
export function Slider({ className, label, showValue, thumbLabel, ...props }: SliderProps) {
  // Um pino por valor: a Base UI so desenha os pinos que existem no markup, e
  // uma faixa com um pino so nao deixa mover o outro limite.
  const values = props.value ?? props.defaultValue;
  const quantos = Array.isArray(values) ? values.length : 1;
  const labels = Array.from({ length: quantos }, (_, index) =>
    Array.isArray(thumbLabel) ? thumbLabel[index] : thumbLabel,
  );

  return (
    <BaseSlider.Root {...props} className={cn("flex flex-col gap-2", className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label && <span className="font-sans text-sm text-fg">{label}</span>}
          {showValue && (
            <BaseSlider.Value className="font-mono text-xs text-fg-subtle tabular-nums" />
          )}
        </div>
      )}

      <BaseSlider.Control className="flex touch-none items-center py-2 select-none">
        <BaseSlider.Track className="h-1.5 w-full rounded-pill bg-skeleton select-none">
          <BaseSlider.Indicator className="rounded-pill bg-accent select-none" />
          {labels.map((label, index) => (
            <BaseSlider.Thumb
              key={index}
              index={index}
              aria-label={label}
              className={cn(
                "size-4 rounded-pill border border-accent bg-surface select-none",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                "has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg",
              )}
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
