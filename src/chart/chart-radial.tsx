"use client";

import type { ReactNode } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { cn } from "../lib/cn";

export type ChartRadialProps = {
  /** De 0 a `max`. Acima disso o arco para no fim, e nao da a volta. */
  value: number;
  max?: number;
  /** A cor do arco. Sem ela, o acento do tema. */
  color?: string;
  /** O numero grande no meio. Sem ele, a porcentagem. */
  centerValue?: ReactNode;
  /** A linha pequena embaixo do numero. */
  centerLabel?: ReactNode;
  /** Onde o arco comeca e termina, em graus. `360` fecha o circulo. */
  sweep?: number;
  className?: string;
  /** O que o leitor de tela ouve. */
  label?: string;
};

/**
 * O arco de uma medida so: meta batida, uso de cota, taxa de conversao.
 *
 * Escolha entre ele e o `Meter` pelo espaco, nao pelo gosto: a barra do `Meter`
 * cabe numa linha de formulario e le mais rapido, e o arco pede um cartao
 * inteiro. O arco ganha quando o numero e o assunto do cartao, e nao um detalhe
 * dentro dele.
 *
 * ```tsx
 * <ChartRadial value={82} centerLabel="da meta do mes" />
 * ```
 *
 * Ele nao e `Progress`: o progresso anda para o fim e termina, e esta medida
 * sobe e desce enquanto o mes corre. Por isso sai como `img` com rotulo, e nao
 * como barra de carregamento.
 */
export function ChartRadial({
  value,
  max = 100,
  color = "var(--rc-accent)",
  centerValue,
  centerLabel,
  sweep = 270,
  className,
  label,
}: ChartRadialProps) {
  const preso = Math.max(0, Math.min(value, max));
  const porcento = Math.round((preso / max) * 100);

  // O arco comeca no topo e anda no sentido do relogio. Com `sweep` de 270 ele
  // deixa a base aberta, que e onde o rotulo de baixo respira.
  const inicio = 90 + sweep / 2;
  const fim = inicio - sweep;

  return (
    <div
      className={cn("relative h-44 w-full", className)}
      role="img"
      aria-label={label ?? `${porcento}%`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={[{ value: preso }]}
          startAngle={inicio}
          endAngle={fim}
          innerRadius="72%"
          outerRadius="100%"
          barSize={14}
        >
          {/* O eixo escondido e o que prende o arco a escala: sem ele a
           * Recharts normaliza pelo maior valor da serie, e um unico ponto
           * sempre daria a volta inteira. */}
          <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
          <RadialBar
            dataKey="value"
            angleAxisId={0}
            fill={color}
            cornerRadius={999}
            background={{ fill: "var(--rc-skeleton)" }}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl leading-tight text-fg">
          {centerValue ?? `${porcento}%`}
        </span>
        {centerLabel && (
          <span className="mt-0.5 max-w-[70%] text-center text-xs text-fg-subtle">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}
