import { useRef, useState } from "react";
import { PanResponder, View, type LayoutChangeEvent } from "react-native";

import { cn } from "./cn";

export type SliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** O nome que o leitor de tela anuncia: "Volume do alerta". */
  label: string;
  disabled?: boolean;
  className?: string;
};

const snap = (raw: number, min: number, max: number, step: number) => {
  const stepped = Math.round((raw - min) / step) * step + min;
  return Math.min(max, Math.max(min, stepped));
};

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  disabled,
  className,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const fraction = max > min ? (value - min) / (max - min) : 0;

  const moveTo = (x: number) => {
    if (widthRef.current <= 0) return;
    const raw = min + (x / widthRef.current) * (max - min);
    onValueChange(snap(raw, min, max, step));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => moveTo(event.nativeEvent.locationX),
      onPanResponderMove: (event) => moveTo(event.nativeEvent.locationX),
    }),
  ).current;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[
        { name: "increment", label: "Aumentar" },
        { name: "decrement", label: "Diminuir" },
      ]}
      onAccessibilityAction={(event) => {
        const delta = event.nativeEvent.actionName === "increment" ? step : -step;
        onValueChange(snap(value + delta, min, max, step));
      }}
      onLayout={(event: LayoutChangeEvent) => {
        widthRef.current = event.nativeEvent.layout.width;
        setWidth(event.nativeEvent.layout.width);
      }}
      className={cn("h-11 justify-center", disabled && "opacity-50", className)}
      {...(disabled ? {} : pan.panHandlers)}
    >
      <View className="h-1.5 overflow-hidden rounded-pill bg-skeleton">
        <View className="h-full rounded-pill bg-accent" style={{ width: fraction * width }} />
      </View>
      <View
        className="absolute size-5 rounded-pill border border-border-strong bg-fg"
        style={{ left: Math.max(0, fraction * width - 10) }}
      />
    </View>
  );
}
