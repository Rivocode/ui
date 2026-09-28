import { View } from "react-native";
import Animated, { useAnimatedProps, type SharedValue } from "react-native-reanimated";
import Svg, { Circle, Line, Path } from "react-native-svg";

import type { RivoNativeColorRole } from "../../tokens";
import { cn } from "../cn";
import { useTween } from "../motion";
import { useRivo } from "../provider";
import { Text } from "../text";
import { arcPath } from "./arc";

const RADIUS = 42;

const BAND = 8;

const WHOLE = 359.9;
const CENTER_WIDTH = { width: "60%" } as const;

export type ChartRadialProps = {
  /** From 0 to `max`. Above that the arc stops at the end, and does not wrap around. */
  value: number;
  max?: number;
  /**
   * The arc color, as a token role. Without it, the theme accent. A role, and
   * not a CSS color as on the web, for the same reason as the frame's `config`:
   * here the component paints with the final value, and a hand-written color
   * would be the only thing on screen deaf to the client's theme.
   */
  color?: RivoNativeColorRole;
  /** The big number in the middle. Without it, the percentage. */
  centerValue?: string;
  /** The small line below the number. */
  centerLabel?: string;
  /** How many degrees the arc covers. `360` closes the circle. */
  sweep?: number;
  className?: string;
  /**
   * What the screen reader hears. Without it, the name comes from what is
   * written in the middle: the number and the line below, in that order. The
   * web uses only the percentage, and that is too little: "82 por cento" alone
   * does not say percent of what.
   */
  label?: string;
  /**
   * `solid` draws a smooth arc; `segmented` draws the arc in dashes, the most
   * requested gauge variation in dashboards.
   */
  variant?: "solid" | "segmented";
  /** How many dashes, in `segmented`. */
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
            <Reach from={from} to={to} stroke={paint} />
          </>
        )}
      </Svg>

      <View className="absolute inset-0 items-center justify-center">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          font="display"
          style={CENTER_WIDTH}
          className="text-center text-xl font-rc-display text-fg"
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
  if (to - from >= WHOLE) {
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

const AnimatedPath = Animated.createAnimatedComponent(Path);

function Reach({ from, to, stroke }: { from: number; to: number; stroke: string }) {
  const end = useTween(to, "slow", from);

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    const reach = Math.min(end.value, from + WHOLE);
    return {
      d: reach > from ? arcPath(RADIUS, from, reach) : "",
      strokeOpacity: reach > from ? 1 : 0,
    };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
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
  const reach = useTween(lit, "slow", 0);
  const first = -sweep / 2;
  const step = segments > 1 ? sweep / (segments - 1) : 0;

  return (
    <>
      {Array.from({ length: segments }, (_, index) => (
        <Tick
          key={index}
          index={index}
          reach={reach}
          paint={paint}
          track={track}
          rotation={first + index * step}
        />
      ))}
    </>
  );
}

const AnimatedLine = Animated.createAnimatedComponent(Line);

function Tick({
  index,
  reach,
  paint,
  track,
  rotation,
}: {
  index: number;
  reach: SharedValue<number>;
  paint: string;
  track: string;
  rotation: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    "worklet";
    return { stroke: index < reach.value - 0.5 ? paint : track };
  });

  return (
    <AnimatedLine
      animatedProps={animatedProps}
      x1={0}
      y1={-46}
      x2={0}
      y2={-38}
      strokeWidth={2.4}
      strokeLinecap="round"
      rotation={rotation}
    />
  );
}
