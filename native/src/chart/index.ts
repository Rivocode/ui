/**
 * `@rivocode/ui-native/chart` — o gráfico, num caminho próprio.
 *
 * Separado da raiz pela mesma regra do `@rivocode/ui/chart` e do
 * `@rivocode/ui-native/form`: o `react-native-svg` é peer **opcional**, e o
 * metro resolve import por arquivo. Dentro do índice principal, um aplicativo
 * que só quer um `Button` teria de instalar — e ligar ao projeto nativo, que
 * no `react-native-svg` custa build — uma dependência que ele nunca desenha.
 *
 * A fronteira é a mesma do web, e `scripts/check-fronteira-do-chart.ts` a
 * guarda nos dois pacotes: nada em `native/src/` alcançável pelo índice da
 * raiz pode importar daqui, porque importar qualquer peça daqui arrasta o
 * `react-native-svg` junto.
 *
 * É por isso que a `Sparkline` continua onde está, desenhada com `View`: ela
 * é o slot `chart` do `Stat`, o `Stat` sai do índice da raiz, e trazê-la para
 * cá custaria o peer a quem só queria um número num cartão.
 */
export {
  ChartContainer,
  PALETTE,
  type ChartConfig,
  type ChartContainerProps,
  type ChartFrame,
} from "./chart";
export { ChartDonut, type ChartDonutProps } from "./chart-donut";
export { ChartRadial, type ChartRadialProps } from "./chart-radial";
