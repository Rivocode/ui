import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { cn } from "../cn";
import { useTween } from "../motion";
import { useRivo } from "../provider";
import { GAUGE_GAP, GAUGE_REACH, GAUGE_RING, bandAt } from "../shared/chart-layout";
import { Text } from "../text";
import { radialLine, ringPath } from "./arc";

const HOLE = 0.52;

export type ChartGaugeBand = {
  /** Onde a faixa termina, na mesma unidade do `value`. Ela começa onde a anterior parou. */
  until: number;
  /** A cor da faixa, e do arco quando o valor cai nela. */
  tone: "success" | "warning" | "danger";
  /** O nome da faixa por extenso: vai para baixo do número e para o leitor de tela. */
  label: string;
};

export type ChartGaugeProps = {
  /**
   * De 0 a `max`. Fora disso o número escrito e o nome dizem o valor real
   * ("140 de 100"), e só o arco, o ponteiro e a faixa param na ponta. `NaN` ou
   * infinito vira "—", sem faixa.
   */
  value: number;
  max?: number;
  /**
   * As faixas, em ordem, cada uma até o seu `until`. Sem faixas, o medidor é
   * um arco neutro de acento, como no web.
   */
  bands?: readonly ChartGaugeBand[];
  /**
   * O número grande no meio. Sem ele, o `value` escrito pelo `format`. Ele
   * entra no nome no lugar do valor, e a fonte encolhe para caber no furo do arco.
   */
  centerValue?: string;
  /** A linha pequena embaixo do número. Sem ela, o nome da faixa em que o valor caiu. */
  centerLabel?: string;
  /**
   * Como o número é escrito. Só função, como no `Meter` e na rosca daqui: o
   * nome de formatador do web arrastaria o `Intl` inteiro para o celular.
   */
  format?: (value: number) => string;
  /** Quantos graus o arco cobre, com a abertura embaixo. De 0 a 360; 360 fecha o anel. */
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
  sweep: askedSweep = 240,
  label,
  className,
}: ChartGaugeProps) {
  const { colors: theme } = useRivo();
  const say = (number: number) => (format ? format(number) : String(number));

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
    .map(
      (item, index) =>
        `${item.label} de ${say(index === 0 ? 0 : bands![index - 1]!.until)} a ${say(item.until)}`,
    )
    .join("; ");
  const name =
    label ??
    [`${written} de ${say(max)}${band ? `, ${band.label}` : ""}`, ruler].filter(Boolean).join(". ");

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
            className="w-full text-center text-xl font-rc-strong text-fg"
          >
            {written}
          </Text>
          {(centerLabel ?? band?.label) && (
            <Text numberOfLines={2} className="mt-0.5 w-full text-center text-xs text-fg-subtle">
              {centerLabel ?? band?.label}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
