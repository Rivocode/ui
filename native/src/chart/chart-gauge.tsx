import { View } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { cn } from "../cn";
import { useTween } from "../motion";
import { useRivo } from "../provider";
import { GAUGE_GAP, GAUGE_REACH, GAUGE_RING, bandAt } from "../shared/chart-layout";
import { Text } from "../text";
import { arcPath, radialLine } from "./arc";

const CENTER_WIDTH = { width: "60%" } as const;

export type ChartGaugeBand = {
  /** Onde a faixa termina, na mesma unidade do `value`. Ela começa onde a anterior parou. */
  until: number;
  /** A cor da faixa, e do arco quando o valor cai nela. */
  tone: "success" | "warning" | "danger";
  /** O nome da faixa por extenso: vai para baixo do número e para o leitor de tela. */
  label: string;
};

export type ChartGaugeProps = {
  /** De 0 a `max`. Fora disso o ponteiro para na ponta, e não dá a volta. */
  value: number;
  max?: number;
  /**
   * As faixas, em ordem, cada uma até o seu `until`. Sem faixas, o medidor é
   * um arco neutro de acento, como no web.
   */
  bands?: readonly ChartGaugeBand[];
  /** O número grande no meio. Sem ele, o `value` escrito pelo `format`. */
  centerValue?: string;
  /** A linha pequena embaixo do número. Sem ela, o nome da faixa em que o valor caiu. */
  centerLabel?: string;
  /**
   * Como o número é escrito. Só função, como no `Meter` e na rosca daqui: o
   * nome de formatador do web arrastaria o `Intl` inteiro para o celular.
   */
  format?: (value: number) => string;
  /** Quantos graus o arco cobre, com a abertura embaixo. */
  sweep?: number;
  /**
   * O que o leitor de tela ouve. Sem ela, o valor, o máximo, a faixa e a
   * régua das faixas, na mesma frase.
   */
  label?: string;
  className?: string;
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
  sweep = 240,
  label,
  className,
}: ChartGaugeProps) {
  const { colors: theme } = useRivo();
  const say = (number: number) => (format ? format(number) : String(number));

  const clamped = Math.max(0, Math.min(value, max));
  const band = bands && bands.length > 0 ? bandAt(bands, clamped) : undefined;
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
    .map(
      (item, index) =>
        `${item.label} de ${say(index === 0 ? 0 : bands![index - 1]!.until)} a ${say(item.until)}`,
    )
    .join("; ");
  const name =
    label ??
    [`${say(clamped)} de ${say(max)}${band ? `, ${band.label}` : ""}`, ruler]
      .filter(Boolean)
      .join(". ");

  const reach = useTween(to, "slow", from);

  const arc = useAnimatedProps(() => {
    "worklet";
    return {
      d: reach.value > from ? arcPath(GAUGE_REACH, from, reach.value) : "",
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
    >
      <Svg width="100%" height="100%" viewBox="-50 -50 100 100">
        {ring.map(({ item, begin, end }, index) =>
          end - begin > GAUGE_GAP ? (
            <Path
              key={index}
              d={arcPath(
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
          d={arcPath(GAUGE_REACH, from, from + sweep)}
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

        {ring.length > 0 && (
          <AnimatedPath
            animatedProps={needle}
            stroke={theme.fg}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
      </Svg>

      <View className="absolute inset-0 items-center justify-center">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          font="display"
          style={CENTER_WIDTH}
          className="text-center text-xl font-rc-strong text-fg"
        >
          {centerValue ?? say(clamped)}
        </Text>
        {(centerLabel ?? band?.label) && (
          <Text numberOfLines={2} className="mt-0.5 max-w-[70%] text-center text-xs text-fg-subtle">
            {centerLabel ?? band?.label}
          </Text>
        )}
      </View>
    </View>
  );
}
