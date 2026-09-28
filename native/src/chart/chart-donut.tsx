import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { cn } from "../cn";
import { useTween } from "../motion";
import { useRivo } from "../provider";
import { resolveFormat, type Format } from "../shared/format";
import { Text } from "../text";
import { arcPath } from "./arc";
import { PALETTE, type ChartConfig } from "./chart";
import { ChartEmpty, type ChartEmptyContent } from "./empty";

const OUTER = 44;
const CENTER_WIDTH = { width: "52%" } as const;

const GAP = 2;

export type ChartDonutProps<Slice> = {
  data: Slice[];
  /** Where each slice's number comes from. */
  valueKey: keyof Slice & string;
  /** Where each slice's name comes from. It is what `config` looks up. */
  nameKey: keyof Slice & string;
  config?: ChartConfig;
  /**
   * The big number in the middle. `string`, and not `ReactNode` as on the web:
   * here it is also what the screen reader hears when there is no legend.
   */
  centerValue?: string;
  /** The small line below the number. */
  centerLabel?: string;
  /**
   * Ring thickness, as a fraction of the radius. `1` closes it into a pie. A
   * thinner ring leaves a bigger hole, and that is where the total has to fit.
   */
  thickness?: number;
  /**
   * The list of slices below, with name and value. **On by default, and here it
   * carries more weight than on the web**: the legend is what responds to touch
   * and to the screen reader, because no tooltip opens without a pointer.
   */
  legend?: boolean;
  /**
   * How the number is written: the name of a house formatter (`currencyShort`,
   * `percent`, `integer`...) or your own function. The same vocabulary as the
   * web, `Meter` and `Stat`.
   */
  format?: Format;
  className?: string;
  /**
   * What the screen reader hears instead of the drawing. With the legend on
   * (the default) it is not needed, and not even used: the drawing is hidden
   * and each slice is a real stop just below. Without a legend, the name comes
   * from the slices, value included.
   */
  label?: string;
  /**
   * The component's texts, to change the language: `name` builds the drawing's
   * name without `label` and without a legend, and receives each slice already
   * written with its value; `hint` is the hint of each legend row. Pass only
   * the ones that change.
   */
  labels?: Partial<ChartDonutLabels>;
  /**
   * What appears in place of the donut when there is no slice or the sum is
   * zero. The same shape as the `ChartContainer` `empty`. Without it, the
   * background ring stays, empty and silent to the screen reader.
   */
  empty?: ChartEmptyContent;
};

export type ChartDonutLabels = {
  name: (slices: string[]) => string;
  hint: string;
};

const LABELS: ChartDonutLabels = {
  name: (slices) => `Rosca: ${slices.join(", ")}`,
  hint: "Acende esta fatia no desenho",
};

export function ChartDonut<Slice extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  config,
  centerValue,
  centerLabel,
  thickness = 0.34,
  legend = true,
  format,
  className,
  label,
  labels: labelsProp,
  empty,
}: ChartDonutProps<Slice>) {
  const labels = { ...LABELS, ...labelsProp };
  const { colors: theme } = useRivo();

  const [reading, setReading] = useState<number | null>(null);

  const inner = OUTER * (1 - thickness);
  const middle = (OUTER + inner) / 2;
  const band = OUTER - inner;

  const nameOf = (slice: Slice) => String(slice[nameKey]);
  const textOf = (slice: Slice) => config?.[nameOf(slice)]?.label ?? nameOf(slice);
  const colorOf = (slice: Slice, index: number) =>
    theme[config?.[nameOf(slice)]?.color ?? PALETTE[index % PALETTE.length]!];

  const resolved = resolveFormat(format) as ((value: number) => string) | undefined;
  const write = (value: number) => (resolved ? resolved(value) : String(value));

  const values = data.map((slice) => Number(slice[valueKey]) || 0);
  const sizes = values.map((value) => Math.max(0, value));
  const total = sizes.reduce((sum, value) => sum + value, 0);
  const blank = data.length === 0 || total <= 0;

  let walked = 0;
  const wedges = sizes.map((value) => {
    const span = total > 0 ? (value / total) * 360 : 0;
    const from = walked;
    walked += span;
    return { from, span };
  });

  const drawn = wedges.filter((wedge) => wedge.span > 0);
  const sole = drawn.length === 1 ? wedges.findIndex((wedge) => wedge.span > 0) : -1;

  const read = reading !== null ? data[reading] : undefined;
  const readValue = reading !== null ? values[reading]! : 0;

  const name =
    data.length === 0
      ? undefined
      : (label ??
        (legend
          ? undefined
          : labels.name(data.map((slice, index) => `${textOf(slice)} ${write(values[index]!)}`))));

  const spoken = name
    ? ({ accessible: true, accessibilityRole: "image", accessibilityLabel: name } as const)
    : ({
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      } as const);

  const miolo = Boolean(centerValue || centerLabel);

  if (blank && empty) {
    return (
      <View className={cn("w-full", className)}>
        <ChartEmpty empty={empty} className="min-h-48" />
      </View>
    );
  }

  return (
    <View className={cn("w-full", className)}>
      <View className="h-48 w-full" {...spoken}>
        <Svg width="100%" height="100%" viewBox="-50 -50 100 100">
          <Circle r={middle} fill="none" stroke={theme.border} strokeWidth={band} />
          {drawn.length === 0 ? null : sole >= 0 ? (
            <Circle r={middle} fill="none" stroke={colorOf(data[sole]!, sole)} strokeWidth={band} />
          ) : (
            wedges.map((wedge, index) => {
              if (wedge.span <= 0) return null;

              const edge = Math.min(GAP / 2, wedge.span / 3);
              const dim = reading !== null && reading !== index;

              return (
                <Wedge
                  key={nameOf(data[index]!)}
                  radius={middle}
                  from={wedge.from + edge}
                  to={wedge.from + wedge.span - edge}
                  stroke={colorOf(data[index]!, index)}
                  band={band}
                  dim={dim}
                />
              );
            })
          )}
        </Svg>

        {(miolo || read) && (
          <View
            className="absolute inset-0 items-center justify-center"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              font="display"
              style={CENTER_WIDTH}
              className="text-center text-lg font-rc-display text-fg"
            >
              {miolo ? centerValue : write(readValue)}
            </Text>
            {(miolo ? Boolean(centerLabel) : Boolean(read)) && (
              <Text
                numberOfLines={1}
                style={CENTER_WIDTH}
                className="mt-0.5 text-center text-xs text-fg-subtle"
              >
                {miolo ? centerLabel : textOf(read!)}
              </Text>
            )}
          </View>
        )}
      </View>

      {legend && (
        <View className="mt-3">
          {data.map((slice, index) => {
            const selected = reading === index;

            return (
              <Pressable
                key={nameOf(slice)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${textOf(slice)}: ${write(values[index]!)}`}
                accessibilityHint={labels.hint}
                onPress={() => setReading(selected ? null : index)}
                className={cn(
                  "h-11 flex-row items-center gap-2 rounded-sm px-1",
                  selected && "bg-selected",
                )}
              >
                <View
                  className="size-2 rounded-sm"
                  style={{ backgroundColor: colorOf(slice, index) }}
                />
                <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-fg-muted">
                  {textOf(slice)}
                </Text>
                <Text font="mono" className="text-sm text-fg">
                  {write(values[index]!)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function Wedge({
  radius,
  from,
  to,
  stroke,
  band,
  dim,
}: {
  radius: number;
  from: number;
  to: number;
  stroke: string;
  band: number;
  dim: boolean;
}) {
  const start = useTween(from, "slow", 0);
  const end = useTween(to, "slow", 0);

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    return { d: arcPath(radius, start.value, end.value) };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      fill="none"
      stroke={stroke}
      strokeWidth={band}
      strokeLinecap="butt"
      strokeOpacity={dim ? 0.32 : 1}
    />
  );
}
