export { ChartContainer, type ChartConfig, type ChartContainerProps } from "./chart";
export { ChartAreaGradient, areaGradient, type ChartAreaGradientProps } from "./chart-gradient";
export { ChartXAxis, ChartYAxis, type ChartXAxisProps, type ChartYAxisProps } from "./chart-axis";
export {
  formatters,
  currency,
  currencyShort,
  compact,
  integer,
  percent,
  monthShort,
  dayMonth,
  type Format,
  type FormatName,
} from "./format";
export { ChartTooltip, ChartTooltipContent, type ChartTooltipContentProps } from "./chart-tooltip";
export {
  ChartLegend,
  ChartLegendContent,
  useSeriesToggle,
  type ChartLegendContentProps,
} from "./chart-legend";
export { ChartDonut, type ChartDonutProps } from "./chart-donut";
export { ChartRadial, type ChartRadialProps } from "./chart-radial";
export { Sparkline, type SparklineProps } from "./sparkline";
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
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Rectangle,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
