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
  /**
   * `solid` desenha um arco liso; `segmented` desenha o arco em tracinhos, que
   * e a variacao mais pedida de medidor em painel e custava 42 linhas de SVG
   * no projeto de quem usa - com a cor cravada, entao sem responder ao tema.
   */
  variant?: "solid" | "segmented";
  /** Quantos tracinhos, no `segmented`. */
  segments?: number;
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
  variant = "solid",
  segments = 44,
}: ChartRadialProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const percentage = Math.round((clamped / max) * 100);

  // O arco comeca no topo e anda no sentido do relogio. Com `sweep` de 270 ele
  // deixa a base aberta, que e onde o rotulo de baixo respira.
  const start = 90 + sweep / 2;
  const end = start - sweep;

  return (
    <div
      className={cn("relative h-44 w-full", className)}
      role="img"
      aria-label={label ?? `${percentage}%`}
    >
      {variant === "segmented" ? (
        <SegmentedArc
          percentage={percentage}
          sweep={sweep}
          segments={segments}
          color={color}
        />
      ) : (
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={[{ value: clamped }]}
          startAngle={start}
          endAngle={end}
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
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {/* Preso a largura do miolo, como na rosca: um total longo escapando
            por cima do arco e o defeito classico desta peca. */}
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

/**
 * O arco em tracinhos.
 *
 * E SVG puro e nao Recharts: a Recharts desenha barra radial, e o que separa
 * um tracinho do outro aqui e o espaco vazio - pedir isso a ela seria uma
 * serie de 44 pontos com valor igual, que e mais codigo e menos controle.
 *
 * Os tracos acesos e apagados sao os mesmos elementos, so com cor diferente:
 * esconder o que passou do valor tiraria a escala da tela, e sem escala um
 * traco aceso nao significa nada.
 */
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
            // Cada traco e o mesmo desenho girado em volta do centro: assim a
            // espessura e o comprimento nao mudam com o angulo, que e o que
            // acontece quando se calcula ponta a ponta com seno e cosseno.
            transform={`rotate(${angle})`}
          />
        );
      })}
    </svg>
  );
}
