import Animated, { useAnimatedProps } from "react-native-reanimated";
import { Path, Rect } from "react-native-svg";

import { useTween } from "../motion";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type ChartBarProps = {
  /** A borda esquerda, em px do quadro que a moldura mediu. */
  x: number;
  /** O topo da barra, em px. Na entrada ele sobe da base; quando o valor muda, e ele que anda. */
  y: number;
  /** A largura, em px. */
  width: number;
  /** A altura, em px. Na entrada cresce do zero; anda junto com o `y`, e a base fica parada. */
  height: number;
  /** A cor final, como o `colors` do quadro entrega: `colors.receita`. */
  fill: string;
  /** O raio do canto, em px. */
  radius?: number;
};

export function ChartBar({ x, y, width, height, fill, radius = 0 }: ChartBarProps) {
  const base = y + Math.max(0, height);
  const left = useTween(x);
  const top = useTween(y, "slow", base);
  const wide = useTween(Math.max(0, width));
  const tall = useTween(Math.max(0, height), "slow", 0);

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    return { x: left.value, y: top.value, width: wide.value, height: tall.value };
  });

  return <AnimatedRect animatedProps={animatedProps} fill={fill} rx={radius} ry={radius} />;
}

export type ChartPoint = { x: number; y: number };

export type ChartLineProps = {
  /**
   * Os pontos, ja em px do quadro, na ordem do eixo. Com a mesma quantidade de
   * antes, cada ponto anda ate o novo lugar; com quantidade diferente, a linha
   * troca de uma vez, porque nao ha par para interpolar.
   */
  points: readonly ChartPoint[];
  /** A cor final do traco: `colors.receita`. */
  stroke: string;
  /** A espessura do traco, em px. */
  strokeWidth?: number;
  /**
   * O `y` de onde a linha sobe na entrada, em px do quadro: a base do eixo.
   * Sem ele, a linha nasce deitada no ponto mais baixo.
   */
  baseline?: number;
};

export function ChartLine({ points, stroke, strokeWidth = 2, baseline }: ChartLineProps) {
  const floor = baseline ?? Math.max(...points.map((point) => point.y));
  const flat = useTween(
    points.flatMap((point) => [point.x, point.y]),
    "slow",
    points.flatMap((point) => [point.x, floor]),
  );

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    const coordinates = flat.value;
    let d = "";
    for (let index = 0; index + 1 < coordinates.length; index += 2) {
      d += `${index === 0 ? "M" : " L"} ${coordinates[index]!.toFixed(2)} ${coordinates[index + 1]!.toFixed(2)}`;
    }
    return { d };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
