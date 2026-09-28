import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { cn, type Slots } from "../cn";
import { useTween } from "../motion";
import { useRivo } from "../provider";
import { GAUGE_GAP, GAUGE_REACH, GAUGE_RING, bandAt } from "../shared/chart-layout";
import { Text } from "../text";
import { radialLine, ringPath } from "./arc";
import { resolveFormat, type Format } from "../shared/format";

const HOLE = 0.52;

export type ChartGaugeBand = {
  /** Where the band ends, in the same unit as `value`. It starts where the previous one stopped. */
  until: number;
  /** The band color, and the arc's color when the value falls in it. */
  tone: "success" | "warning" | "danger";
  /** The band's full name: it goes below the number and to the screen reader. */
  label: string;
};

export type ChartGaugeProps = {
  /**
   * From 0 to `max`. Outside that, the written number and the name state the
   * real value ("140 de 100"), and only the arc, the needle and the band stop
   * at the end. `NaN` or infinity becomes "—", with no band.
   */
  value: number;
  max?: number;
  /**
   * The bands, in order, each one up to its `until`. Without bands, the gauge
   * is a neutral accent arc, as on the web.
   */
  bands?: readonly ChartGaugeBand[];
  /**
   * The big number in the middle. Without it, `value` written by `format`. It
   * goes into the name in place of the value, and the font shrinks to fit the
   * arc's hole.
   */
  centerValue?: string;
  /** The small line below the number. Without it, the name of the band the value fell in. */
  centerLabel?: string;
  /**
   * How the number is written: the name of a house formatter (`currencyShort`,
   * `percent`, `integer`...) or your own function, the same vocabulary as the
   * web.
   */
  format?: Format;
  /**
   * How many degrees the arc covers, with the opening at the bottom. From 0 to
   * 360; 360 closes the ring.
   */
  sweep?: number;
  /**
   * What the screen reader hears. Without it, the value, the maximum, the band
   * and the band scale, in one sentence.
   */
  label?: string;
  /**
   * The component's texts, to change the language: `value` joins the written
   * value to the maximum in the name, and `band` describes each band in the
   * scale that comes with it. Pass only the ones that change.
   */
  labels?: Partial<ChartGaugeLabels>;
  className?: string;
  /**
   * Class per part: `value` (the big number in the middle) and `label` (the
   * line below it). The arc is drawn in the `Svg`, and `react-native-svg` takes
   * no class: its color comes from the band.
   */
  classNames?: Slots<"value" | "label">;
};

export type ChartGaugeLabels = {
  value: (value: string, max: string) => string;
  band: (name: string, from: string, to: string) => string;
};

const LABELS: ChartGaugeLabels = {
  value: (value, max) => `${value} de ${max}`,
  band: (name, from, to) => `${name} de ${from} a ${to}`,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TONE_ROLE = {
  success: "success-text",
  warning: "warning-text",
  danger: "danger-text",
} as const;

export function ChartGauge({
  value,
  max = 100,
  bands,
  centerValue,
  centerLabel,
  format,
  sweep: askedSweep = 240,
  label,
  labels: labelsProp,
  className,
  classNames,
}: ChartGaugeProps) {
  const labels = { ...LABELS, ...labelsProp };
  const { colors: theme } = useRivo();
  const resolved = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (number: number) => (resolved ? resolved(number) : String(number));

  const known = Number.isFinite(value);
  const sweep = Math.min(Math.max(askedSweep, 0), 360);
  const clamped = known ? Math.max(0, Math.min(value, max)) : 0;
  const band = known && bands && bands.length > 0 ? bandAt(bands, clamped) : undefined;
  const written = centerValue ?? (known ? say(value) : "—");
  const [side, setSide] = useState(0);
  const paint = theme[band ? TONE_ROLE[band.tone] : "accent-text"];

  const from = -sweep / 2;
  const angleOf = (number: number) =>
    from + sweep * (max > 0 ? Math.max(0, Math.min(number, max)) / max : 0);
  const to = angleOf(clamped);

  let start = 0;
  const ring = (bands ?? []).map((item) => {
    const begin = angleOf(start);
    const end = angleOf(item.until);
    start = item.until;
    return { item, begin, end };
  });

  const ruler = (bands ?? [])
    .map((item, index) =>
      labels.band(item.label, say(index === 0 ? 0 : bands![index - 1]!.until), say(item.until)),
    )
    .join("; ");
  const name =
    label ??
    [`${labels.value(written, say(max))}${band ? `, ${band.label}` : ""}`, ruler]
      .filter(Boolean)
      .join(". ");

  const reach = useTween(to, "slow", from);

  const arc = useAnimatedProps(() => {
    "worklet";
    return {
      d: reach.value > from ? ringPath(GAUGE_REACH, from, reach.value) : "",
      strokeOpacity: reach.value > from ? 1 : 0,
    };
  });

  const needle = useAnimatedProps(() => {
    "worklet";
    return { d: radialLine(GAUGE_RING - 4, GAUGE_RING + 3.5, reach.value) };
  });

  return (
    <View
      className={cn("h-44 w-full", className)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      onLayout={(event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSide(Math.min(width, height));
      }}
    >
      <Svg width="100%" height="100%" viewBox="-50 -50 100 100">
        {ring.map(({ item, begin, end }, index) =>
          end - begin > GAUGE_GAP ? (
            <Path
              key={index}
              d={ringPath(
                GAUGE_RING,
                index === 0 ? begin : begin + GAUGE_GAP / 2,
                index === ring.length - 1 ? end : end - GAUGE_GAP / 2,
              )}
              fill="none"
              stroke={theme[TONE_ROLE[item.tone]]}
              strokeWidth={3}
            />
          ) : null,
        )}

        <Path
          d={ringPath(GAUGE_REACH, from, from + sweep)}
          fill="none"
          stroke={theme.skeleton}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={arc}
          fill="none"
          stroke={paint}
          strokeWidth={10}
          strokeLinecap="round"
        />

        {known && ring.length > 0 && (
          <AnimatedPath
            animatedProps={needle}
            stroke={theme.fg}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
      </Svg>

      <View className="absolute inset-0 items-center justify-center">
        <View
          className="items-center"
          style={side > 0 ? { width: side * HOLE, maxWidth: side * HOLE } : { width: "52%" }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
            font="display"
            className={cn("w-full text-center text-xl font-rc-strong text-fg", classNames?.value)}
          >
            {written}
          </Text>
          {(centerLabel ?? band?.label) && (
            <Text
              numberOfLines={2}
              className={cn("mt-0.5 w-full text-center text-xs text-fg-subtle", classNames?.label)}
            >
              {centerLabel ?? band?.label}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
