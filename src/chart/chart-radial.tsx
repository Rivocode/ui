"use client";

import type { ComponentProps, ReactNode } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { cn } from "../lib/cn";

export type ChartRadialProps = Omit<ComponentProps<"div">, "color" | "children"> & {
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
  /**
   * `solid` desenha um arco liso; `segmented` desenha o arco em tracinhos, que
   * e a variacao mais pedida de medidor em painel e custava 42 linhas de SVG
   * no projeto de quem usa - com a cor cravada, entao sem responder ao tema.
   */
  variant?: "solid" | "segmented";
  /** Quantos tracinhos, no `segmented`. */
  segments?: number;
};

export function ChartRadial({
  value,
  max = 100,
  color = "var(--rc-accent)",
  centerValue,
  centerLabel,
  sweep = 270,
  className,
  label,
  variant = "solid",
  segments = 44,
  ...rest
}: ChartRadialProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const percentage = Math.round((clamped / max) * 100);

  const start = 90 + sweep / 2;
  const end = start - sweep;

  return (
    <div
      className={cn("relative h-44 w-full", className)}
      role="img"
      aria-label={label ?? `${percentage}%`}
      {...rest}
    >
      {variant === "segmented" ? (
        <SegmentedArc percentage={percentage} sweep={sweep} segments={segments} color={color} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ value: clamped }]}
            startAngle={start}
            endAngle={end}
            innerRadius="72%"
            outerRadius="100%"
            barSize={14}
            tabIndex={-1}
            aria-hidden="true"
          >
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
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="max-w-[62%] text-center font-display text-2xl leading-tight text-balance text-fg">
          {centerValue ?? `${percentage}%`}
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

function SegmentedArc({
  percentage,
  sweep,
  segments,
  color,
}: {
  percentage: number;
  sweep: number;
  segments: number;
  color: string;
}) {
  const lit = Math.round((percentage / 100) * segments);
  const first = -sweep / 2;
  const step = segments > 1 ? sweep / (segments - 1) : 0;

  return (
    <svg viewBox="-50 -50 100 100" className="h-full w-full" aria-hidden="true">
      {Array.from({ length: segments }, (_, index) => {
        const angle = first + index * step;
        const on = index < lit;

        return (
          <line
            key={index}
            data-rc-tick={on ? "on" : "off"}
            x1={0}
            y1={-46}
            x2={0}
            y2={-38}
            stroke={on ? color : "var(--rc-skeleton)"}
            strokeWidth={2.4}
            strokeLinecap="round"
            transform={`rotate(${angle})`}
          />
        );
      })}
    </svg>
  );
}
