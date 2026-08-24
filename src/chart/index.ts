export { ChartContainer, type ChartConfig, type ChartContainerProps } from "./chart";
export { ChartTooltip, ChartTooltipContent, type ChartTooltipContentProps } from "./chart-tooltip";
export { ChartLegend, ChartLegendContent, type ChartLegendContentProps } from "./chart-legend";
export { useChartMotion, type MovimentoDoGrafico } from "./use-chart-motion";

/**
 * As pecas da Recharts que o nosso grafico compoe, reexportadas por aqui.
 *
 * Sem isto, quem recebe so o `ChartContainer` tem a moldura e nada para pôr
 * dentro: as marcas e os eixos vivem na Recharts, e o consumidor teria que
 * importar de dois lugares e acertar a versao na mao. E o mesmo motivo de o
 * `Tooltip` e o `Legend` dela **nao** entrarem aqui: os nossos ja embrulham os
 * dois, e o nome colidiria com o `Tooltip` do catalogo.
 *
 * A lista e curada, e nao um `export *`: sao as pecas dos quatro tipos de
 * grafico que a biblioteca veste. Precisou de algo fora dela, importe da
 * Recharts direto.
 */
export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
