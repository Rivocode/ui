"use client";

export type ChartAreaGradientProps = {
  /**
   * O nome deste conjunto de gradientes, unico na pagina. Costuma ser o assunto
   * do grafico: `"faturamento"`, `"emissao"`.
   */
  id: string;
  /** As series que ganham gradiente. Os nomes sao os mesmos do `config`. */
  series: readonly string[];
  /** Opacidade no topo da area. */
  from?: number;
  /** Opacidade embaixo, onde ela encontra o eixo. */
  to?: number;
};

export function areaGradient(id: string, name: string) {
  return `url(#rc-grad-${id}-${name})`;
}

export function ChartAreaGradient({ id, series, from = 0.3, to = 0.02 }: ChartAreaGradientProps) {
  return (
    <defs>
      {series.map((name) => (
        <linearGradient key={name} id={`rc-grad-${id}-${name}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`var(--color-${name})`} stopOpacity={from} />
          <stop offset="100%" stopColor={`var(--color-${name})`} stopOpacity={to} />
        </linearGradient>
      ))}
    </defs>
  );
}
