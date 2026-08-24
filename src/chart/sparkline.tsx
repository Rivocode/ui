"use client";

import { Area, AreaChart, Line, LineChart, ResponsiveContainer } from "recharts";

import { cn } from "../lib/cn";

export type SparklineProps = {
  /** So os numeros, na ordem do tempo. */
  data: number[];
  /** `line` para tendencia pura; `area` quando o volume tambem conta. */
  variant?: "line" | "area";
  /**
   * A cor. Aceita token: `var(--rc-accent)`. Sem ela, o acento do tema, que e
   * a leitura neutra de "isto e um numero desta tela".
   */
  color?: string;
  /**
   * Pinta de verde ou vermelho conforme suba ou desca do primeiro ao ultimo
   * ponto. Use so quando subir for bom: em custo, subir e ruim.
   */
  tone?: "auto" | "none";
  className?: string;
  /** O que o leitor de tela ouve. Sem isto ela e escondida dele. */
  label?: string;
};

/**
 * A linha miuda que cabe dentro de um numero.
 *
 * Sem eixo, sem grade, sem dica: ela nao responde "quanto foi em maio", e sim
 * "isto vem subindo ou descendo". Um KPI sozinho e um numero sem historia, e
 * abrir um grafico inteiro ao lado de cada KPI enche o painel de moldura.
 *
 * ```tsx
 * <Sparkline data={[12, 15, 14, 19, 22, 28]} className="h-8 w-24" />
 * ```
 *
 * Por padrao ela sai escondida do leitor de tela: um desenho de tendencia sem
 * numero nao tem o que ler em voz alta, e o numero ao lado dela ja foi lido.
 * Passe `label` quando ela for a unica informacao ali.
 */
export function Sparkline({
  data,
  variant = "line",
  color,
  tone = "none",
  className,
  label,
}: SparklineProps) {
  const pontos = data.map((valor, indice) => ({ i: indice, v: valor }));

  const subiu = data.length > 1 && data[data.length - 1] >= data[0];
  const corAutomatica = subiu ? "var(--rc-success)" : "var(--rc-danger)";
  const traco = color ?? (tone === "auto" ? corAutomatica : "var(--rc-accent)");

  const comum = {
    data: pontos,
    margin: { top: 2, right: 2, bottom: 2, left: 2 },
  };

  return (
    <div
      className={cn("h-8 w-24", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === "area" ? (
          <AreaChart {...comum}>
            <Area
              dataKey="v"
              stroke={traco}
              strokeWidth={1.5}
              fill={traco}
              fillOpacity={0.16}
              // Sem ponto e sem animacao: numa altura de 32px o ponto vira
              // ruido, e a animacao chama atencao para o que e so contexto.
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart {...comum}>
            <Line
              dataKey="v"
              stroke={traco}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
