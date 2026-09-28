import { View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { RivoNativeColorRole } from "../../tokens";
import { cn, type Slots } from "../cn";
import { useTween } from "../motion";
import { useRivo } from "../provider";
import { funnelRates } from "../shared/chart-layout";
import { Text } from "../text";
import { resolveFormat, type Format } from "../shared/format";
import { ChartEmpty, type ChartEmptyContent } from "./empty";

export type ChartFunnelProps<Stage> = {
  /**
   * The stages, in the order the person goes through them: the first is the
   * mouth of the funnel.
   */
  data: Stage[];
  /** Where each stage's number comes from. */
  valueKey: keyof Stage & string;
  /** Where each stage's name comes from. */
  nameKey: keyof Stage & string;
  /**
   * The bar color, as a token role. Without it, `chart-1`. A role, and not a
   * CSS color as on the web, for the same reason as the frame's `config`.
   */
  color?: RivoNativeColorRole;
  /**
   * How the number is written: the name of a house formatter (`currencyShort`,
   * `percent`, `integer`...) or your own function, the same vocabulary as the
   * web.
   */
  format?: Format;
  /** How the rate is written, receiving 0 to 100. Without it, `38,5%`. */
  formatRate?: (rate: number) => string;
  /** `center` draws the funnel centered; `start` aligns the bars to the left. */
  align?: "center" | "start";
  className?: string;
  /** Shows the end-to-end conversion line, below. Without it, it shows. */
  showOverall?: boolean;
  /**
   * The component's texts, to change the language: `rate` is what follows the
   * rate between two stages, "da etapa anterior" without it, and `overall` the
   * end-to-end conversion sentence, "do inicio ao fim" without it. Pass only
   * the ones that change.
   */
  labels?: Partial<ChartFunnelLabels>;
  /**
   * Class per part: `stage` (each stage's block), `bar` (the bar) and `rate`
   * (the rate line between two stages).
   */
  classNames?: Slots<"stage" | "bar" | "rate">;
  /**
   * What appears in place of the drawing when the list arrives empty or the sum
   * is zero. The same shape as the `ChartContainer` `empty`.
   */
  empty?: ChartEmptyContent;
};

function valueOf(raw: unknown): number {
  const number = Number(raw);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function writeRate(rate: number) {
  return `${(Math.round(rate * 10) / 10).toString().replace(".", ",")}%`;
}

export type ChartFunnelLabels = {
  rate: string;
  overall: string;
};

export function ChartFunnel<Stage extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  color = "chart-1",
  format,
  formatRate = writeRate,
  align = "center",
  showOverall = true,
  labels,
  className,
  classNames,
  empty,
}: ChartFunnelProps<Stage>) {
  const rateLabel = labels?.rate ?? "da etapa anterior";
  const overallLabel = labels?.overall ?? "do início ao fim";
  const { colors: theme } = useRivo();
  const resolved = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (value: number) => (resolved ? resolved(value) : String(value));

  const values = data.map((stage) => valueOf(stage[valueKey]));
  const widest = Math.max(0, ...values);
  const rates = funnelRates(values);

  if (empty && widest <= 0) {
    return (
      <View className={cn("w-full", className)}>
        <ChartEmpty empty={empty} className="min-h-48" />
      </View>
    );
  }

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
            <View
              key={`${index}-${name}`}
              accessible
              accessibilityLabel={spoken}
              className={cn("gap-1", classNames?.stage)}
            >
              {index > 0 && (
                <View
                  className={cn(
                    "flex-row items-center gap-1",
                    align === "center" && "justify-center",
                    classNames?.rate,
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
                <Bar
                  percent={widest > 0 ? (value / widest) * 100 : 0}
                  color={theme[color]}
                  className={classNames?.bar}
                />
              </View>
            </View>
          );
        })}
      </View>

      {showOverall && rates.overall !== null && (
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

function Bar({
  percent,
  color,
  className,
}: {
  percent: number;
  color: string;
  className?: string;
}) {
  const width = useTween(percent, "slow", 0);

  const style = useAnimatedStyle(() => {
    "worklet";
    return { width: `${width.value}%`, backgroundColor: color };
  });

  return <Animated.View className={cn("h-full rounded-sm", className)} style={style} />;
}
