import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { type RivoNativeColorRole } from "../tokens";
import { cn } from "./cn";
import { Entrance } from "./motion";
import { useRivo } from "./provider";

const STROKE = 2;

export type SparklineProps = {
  /** Only the numbers, in time order. */
  data: number[];
  /** `line` for pure trend; `bar` when each period counts on its own. */
  variant?: "line" | "bar";
  /**
   * The token role that paints the stroke - `chart-1` to `chart-8` when the
   * component joins a series. Without it, the theme accent, which is the
   * neutral reading of "this is a number on this screen".
   */
  color?: RivoNativeColorRole;
  /**
   * Paints green or red depending on whether it rises or falls from the first
   * to the last point. Use only when rising is good: for cost, rising is bad.
   * It is not called `tone` on purpose, and the name matches the web: `tone` is
   * the semantic color scale in the rest of the catalog - `Badge`, `Alert`,
   * `Timeline` -, with other values.
   */
  trend?: "auto" | "none";
  /** The drawing height, in px. The width comes from the parent. */
  height?: number;
  className?: string;
  /** What the screen reader hears. Without it, the sparkline is hidden from it. */
  label?: string;
};

export function Sparkline({
  data,
  variant = "line",
  color,
  trend = "none",
  height = 32,
  className,
  label,
}: SparklineProps) {
  const { colors } = useRivo();

  const [width, setWidth] = useState(0);

  const rose = data.length > 1 && data[data.length - 1]! >= data[0]!;
  const role: RivoNativeColorRole =
    color ?? (trend === "auto" ? (rose ? "success-text" : "danger-text") : "accent-text");
  const stroke = colors[role];

  const access =
    label && data.length > 0
      ? ({ accessible: true, accessibilityRole: "image", accessibilityLabel: label } as const)
      : ({
          accessibilityElementsHidden: true,
          importantForAccessibility: "no-hide-descendants",
        } as const);

  if (variant === "bar") {
    const floor = Math.min(0, ...data);
    const span = Math.max(0, ...data) - floor;

    return (
      <Entrance
        effect="fadeIn"
        style={{ height }}
        className={cn("w-24 flex-row items-end gap-0.5", className)}
        {...access}
      >
        {data.map((value, index) => (
          <View
            key={index}
            className="flex-1 rounded-sm"
            style={{
              height: Math.max(STROKE, span === 0 ? 0 : ((value - floor) / span) * height),
              backgroundColor: stroke,
            }}
          />
        ))}
      </Entrance>
    );
  }

  const min = Math.min(...data);
  const range = Math.max(...data) - min;
  const usable = height - STROKE;

  const pointAt = (index: number) => {
    const ratio = range === 0 ? 0.5 : (data[index]! - min) / range;
    return {
      x: (index * width) / (data.length - 1),
      y: STROKE / 2 + (1 - ratio) * usable,
    };
  };

  const segments =
    width === 0 || data.length < 2
      ? []
      : data.slice(1).map((_, index) => {
          const from = pointAt(index);
          const to = pointAt(index + 1);
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          return {
            left: from.x,
            top: from.y - STROKE / 2,
            length: Math.hypot(dx, dy),
            angle: (Math.atan2(dy, dx) * 180) / Math.PI,
          };
        });

  return (
    <Entrance
      effect="fadeIn"
      style={{ height }}
      className={cn("w-24 overflow-hidden", className)}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      {...access}
    >
      {segments.map((segment, index) => (
        <View
          key={index}
          style={{
            position: "absolute",
            left: segment.left,
            top: segment.top,
            width: segment.length,
            height: STROKE,
            borderRadius: STROKE / 2,
            backgroundColor: stroke,
            transformOrigin: [0, STROKE / 2, 0],
            transform: [{ rotate: `${segment.angle}deg` }],
          }}
        />
      ))}
    </Entrance>
  );
}
