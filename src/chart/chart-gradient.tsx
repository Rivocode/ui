"use client";

/* ---------------------------------------------------------------------------
 * Gradiente de area
 *
 * Area chapada compete com a linha que a delimita: a cor cheia embaixo pesa
 * tanto quanto o traco em cima, e num grafico de duas series a de tras some
 * atras da da frente. O gradiente resolve as duas coisas, e e o que todo painel
 * acaba escrevendo a mao, em `<defs>` copiados de tela em tela.
 *
 * O nome e seu, e nao nosso. A primeira versao disto tirava um `id` unico do
 * contexto do `ChartContainer`, o que parecia mais seguro e escondia uma
 * armadilha: o `fill` de `<Area>` e avaliado no render do componente de fora,
 * onde aquele contexto ainda nao existe. Quem escrevia o obvio levava um erro
 * em tempo de execucao.
 *
 * Com o nome explicito nao ha o que quebrar, e a unicidade fica visivel em
 * revisao: dois graficos na mesma pagina precisam de `id` diferentes, porque
 * `id` de SVG e global no documento.
 * ------------------------------------------------------------------------- */

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

/**
 * O `fill` que aponta para o gradiente de uma serie.
 *
 * Funcao pura: pode ser chamada em qualquer lugar, inclusive no render do
 * componente que monta o grafico.
 *
 * ```tsx
 * <AreaChart data={meses}>
 *   <ChartAreaGradient id="faturamento" series={["faturado"]} />
 *   <Area dataKey="faturado" fill={areaGradient("faturamento", "faturado")} />
 * </AreaChart>
 * ```
 */
export function areaGradient(id: string, name: string) {
  return `url(#rc-grad-${id}-${name})`;
}

/** Os gradientes de area, declarados de uma vez. */
export function ChartAreaGradient({ id, series, from = 0.3, to = 0.02 }: ChartAreaGradientProps) {
  return (
    <defs>
      {series.map((name) => (
        <linearGradient key={name} id={`rc-grad-${id}-${name}`} x1="0" y1="0" x2="0" y2="1">
          {/* A cor sai da propria variavel da serie, entao o gradiente
           * acompanha o tema sem saber qual e. */}
          <stop offset="0%" stopColor={`var(--color-${name})`} stopOpacity={from} />
          <stop offset="100%" stopColor={`var(--color-${name})`} stopOpacity={to} />
        </linearGradient>
      ))}
    </defs>
  );
}
