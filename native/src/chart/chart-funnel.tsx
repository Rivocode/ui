import { View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { RivoNativeColorRole } from "../../tokens";
import { cn } from "../cn";
import { useTween } from "../motion";
import { useRivo } from "../provider";
import { funnelRates } from "../shared/chart-layout";
import { Text } from "../text";

export type ChartFunnelProps<Stage> = {
  /** As etapas, na ordem em que a pessoa atravessa: a primeira é a boca do funil. */
  data: Stage[];
  /** De onde sai o número de cada etapa. */
  valueKey: keyof Stage & string;
  /** De onde sai o nome de cada etapa. */
  nameKey: keyof Stage & string;
  /**
   * A cor das barras, como papel de token. Sem ela, `chart-1`. Papel, e não
   * cor de CSS como no web, pela mesma razão do `config` da moldura.
   */
  color?: RivoNativeColorRole;
  /** Como o número de cada etapa é escrito. Só função, como na rosca. */
  format?: (value: number) => string;
  /** Como a taxa é escrita, recebendo de 0 a 100. Sem ele, `38,5%`. */
  formatRate?: (rate: number) => string;
  /** `center` desenha o funil centrado; `start` alinha as barras à esquerda. */
  align?: "center" | "start";
  /** O que vem depois da taxa entre duas etapas. Sem ele, "da etapa anterior". */
  rateLabel?: string;
  /** A frase da conversão de ponta a ponta. `false` esconde a linha. */
  overallLabel?: string | false;
  className?: string;
};

function valueOf(raw: unknown): number {
  const number = Number(raw);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function writeRate(rate: number) {
  return `${(Math.round(rate * 10) / 10).toString().replace(".", ",")}%`;
}

export function ChartFunnel<Stage extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  color = "chart-1",
  format,
  formatRate = writeRate,
  align = "center",
  rateLabel = "da etapa anterior",
  overallLabel = "do início ao fim",
  className,
}: ChartFunnelProps<Stage>) {
  const { colors: theme } = useRivo();
  const say = (value: number) => (format ? format(value) : String(value));

  const values = data.map((stage) => valueOf(stage[valueKey]));
  const widest = Math.max(0, ...values);
  const rates = funnelRates(values);

  return (
    <View className={cn("w-full gap-3", className)}>
      <View className="gap-1">
        {data.map((stage, index) => {
          const value = values[index]!;
          const rate = rates.fromPrevious[index];
          const written = rate === null || rate === undefined ? "—" : formatRate(rate);
          const name = String(stage[nameKey]);
          const spoken =
            index > 0
              ? `${name}: ${say(value)}, ${written} ${rateLabel}`
              : `${name}: ${say(value)}`;

          return (
            <View key={`${index}-${name}`} accessible accessibilityLabel={spoken} className="gap-1">
              {index > 0 && (
                <View
                  className={cn(
                    "flex-row items-center gap-1",
                    align === "center" && "justify-center",
                  )}
                >
                  <Text className="text-xs text-fg-subtle">↓</Text>
                  <Text font="mono" className="text-xs text-fg-muted">
                    {written}
                  </Text>
                  <Text className="text-xs text-fg-subtle">{rateLabel}</Text>
                </View>
              )}

              <View className="flex-row items-baseline justify-between gap-3">
                <Text numberOfLines={2} className="min-w-0 flex-1 text-sm text-fg-muted">
                  {name}
                </Text>
                <Text font="mono" className="text-sm text-fg">
                  {say(value)}
                </Text>
              </View>

              <View
                className={cn(
                  "h-6 w-full flex-row",
                  align === "center" ? "justify-center" : "justify-start",
                )}
              >
                <Bar percent={widest > 0 ? (value / widest) * 100 : 0} color={theme[color]} />
              </View>
            </View>
          );
        })}
      </View>

      {overallLabel !== false && rates.overall !== null && (
        <View accessible className="flex-row items-baseline gap-1 border-t border-border pt-2">
          <Text font="mono" className="text-sm text-fg">
            {formatRate(rates.overall)}
          </Text>
          <Text className="text-xs text-fg-subtle">{overallLabel}</Text>
        </View>
      )}
    </View>
  );
}

function Bar({ percent, color }: { percent: number; color: string }) {
  const width = useTween(percent, "slow", 0);

  const style = useAnimatedStyle(() => {
    "worklet";
    return { width: `${width.value}%`, backgroundColor: color };
  });

  return <Animated.View className="h-full rounded-sm" style={style} />;
}
