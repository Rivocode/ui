"use client";

import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts";

import { cn } from "../lib/cn";

export type SparklineProps = {
  /** So os numeros, na ordem do tempo. */
  data: number[];
  /**
   * `line` para tendencia pura, `area` quando o volume tambem conta, `bar`
   * para contagem por periodo - emissoes por dia, chamados por semana.
   *
   * O `bar` e o unico que atravessa para o `@rivocode/ui-native`: area pede
   * poligono preenchido, que sem SVG nao sai. O nome significa a mesma coisa
   * nos dois, e a ausencia esta escrita na tabela de paridade.
   */
  variant?: "line" | "area" | "bar";
  /**
   * A cor. Aceita token: `var(--rc-accent)`. Sem ela, o acento do tema, que e
   * a leitura neutra de "isto e um numero desta tela".
   */
  color?: string;
  /**
   * Pinta de verde ou vermelho conforme suba ou desca do primeiro ao ultimo
   * ponto. Use so quando subir for bom: em custo, subir e ruim.
   *
   * Nao se chama `tone` de proposito, e nao adianta "corrigir": no resto do
   * catalogo - `Badge`, `Alert`, `Tracker`, `Timeline`, `MenuItem` - `tone` e
   * a escala semantica de cor (`success`, `danger`, `warning`, `info`), com
   * outros valores. Duas coisas com o mesmo nome custam mais que um nome so
   * desta peca.
   */
  trend?: "auto" | "none";
  className?: string;
  /** O que o leitor de tela ouve. Sem isto ela e escondida dele. */
  label?: string;
};

export function Sparkline({
  data,
  variant = "line",
  color,
  trend = "none",
  className,
  label,
}: SparklineProps) {
  const points = data.map((value, index) => ({ i: index, v: value }));

  const rising = data.length > 1 && data[data.length - 1] >= data[0];
  const autoColor = rising ? "var(--rc-success)" : "var(--rc-danger)";
  const stroke = color ?? (trend === "auto" ? autoColor : "var(--rc-accent)");

  const shared = {
    data: points,
    margin: { top: 2, right: 2, bottom: 2, left: 2 },
    tabIndex: -1,
    "aria-hidden": true,
  };

  return (
    <div
      className={cn("h-8 w-24", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart {...shared}>
            <Bar dataKey="v" fill={stroke} radius={1} isAnimationActive={false} />
          </BarChart>
        ) : variant === "area" ? (
          <AreaChart {...shared}>
            <Area
              dataKey="v"
              stroke={stroke}
              strokeWidth={1.5}
              fill={stroke}
              fillOpacity={0.16}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart {...shared}>
            <Line
              dataKey="v"
              stroke={stroke}
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
