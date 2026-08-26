import { Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import type { RivoNativeColorRole } from "../../tokens";
import { cn } from "../cn";
import { useRivo } from "../provider";
import { arcPath } from "./arc";

const RADIUS = 42;

const BAND = 8;

export type ChartRadialProps = {
  /** De 0 a `max`. Acima disso o arco para no fim, e não dá a volta. */
  value: number;
  max?: number;
  /**
   * A cor do arco, como papel de token. Sem ela, o acento do tema.
   *
   * Papel, e não cor de CSS como no web, pela mesma razão do `config` da
   * moldura: aqui a peça pinta com o valor final, e cor escrita à mão seria a
   * única coisa da tela surda ao tema do cliente.
   */
  color?: RivoNativeColorRole;
  /** O número grande no meio. Sem ele, a porcentagem. */
  centerValue?: string;
  /** A linha pequena embaixo do número. */
  centerLabel?: string;
  /** Quantos graus o arco cobre. `360` fecha o círculo. */
  sweep?: number;
  className?: string;
  /**
   * O que o leitor de tela ouve.
   *
   * Sem ela, o nome sai do que está escrito no meio — o número e a linha de
   * baixo, nessa ordem. O web usa só a porcentagem, e é pouco: "82 por cento"
   * sozinho não diz por cento de quê.
   */
  label?: string;
  /**
   * `solid` desenha um arco liso; `segmented` desenha o arco em tracinhos, que
   * é a variação mais pedida de medidor em painel.
   */
  variant?: "solid" | "segmented";
  /** Quantos tracinhos, no `segmented`. */
  segments?: number;
};

export function ChartRadial({
  value,
  max = 100,
  color,
  centerValue,
  centerLabel,
  sweep = 270,
  className,
  label,
  variant = "solid",
  segments = 44,
}: ChartRadialProps) {
  const { colors: theme } = useRivo();
  const paint = theme[color ?? "accent"];
  const track = theme.skeleton;

  const clamped = Math.max(0, Math.min(value, max));
  const percentage = max > 0 ? Math.round((clamped / max) * 100) : 0;

  const from = -sweep / 2;
  const to = from + sweep * (max > 0 ? clamped / max : 0);

  const middle = centerValue ?? `${percentage}%`;
  const name = label ?? (centerLabel ? `${middle}, ${centerLabel}` : middle);

  return (
    <View
      className={cn("h-44 w-full", className)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      <Svg width="100%" height="100%" viewBox="-50 -50 100 100">
        {variant === "segmented" ? (
          <SegmentedArc
            percentage={percentage}
            sweep={sweep}
            segments={segments}
            paint={paint}
            track={track}
          />
        ) : (
          <>
            <Band from={from} to={from + sweep} stroke={track} />
            {to > from && <Band from={from} to={to} stroke={paint} />}
          </>
        )}
      </Svg>

      <View className="absolute inset-0 items-center justify-center">
        <Text
          numberOfLines={2}
          className="max-w-[62%] text-center text-2xl font-semibold text-fg"
        >
          {middle}
        </Text>
        {centerLabel && (
          <Text numberOfLines={2} className="mt-0.5 max-w-[70%] text-center text-xs text-fg-subtle">
            {centerLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

function Band({ from, to, stroke }: { from: number; to: number; stroke: string }) {
  if (to - from >= 359.9) {
    return <Circle r={RADIUS} fill="none" stroke={stroke} strokeWidth={BAND} />;
  }

  return (
    <Path
      d={arcPath(RADIUS, from, to)}
      fill="none"
      stroke={stroke}
      strokeWidth={BAND}
      strokeLinecap="round"
    />
  );
}

function SegmentedArc({
  percentage,
  sweep,
  segments,
  paint,
  track,
}: {
  percentage: number;
  sweep: number;
  segments: number;
  paint: string;
  track: string;
}) {
  const lit = Math.round((percentage / 100) * segments);
  const first = -sweep / 2;
  const step = segments > 1 ? sweep / (segments - 1) : 0;

  return (
    <>
      {Array.from({ length: segments }, (_, index) => (
        <Line
          key={index}
          x1={0}
          y1={-46}
          x2={0}
          y2={-38}
          stroke={index < lit ? paint : track}
          strokeWidth={2.4}
          strokeLinecap="round"
          rotation={first + index * step}
        />
      ))}
    </>
  );
}
