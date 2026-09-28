import { useRef, useState } from "react";
import { PanResponder, View, type LayoutChangeEvent } from "react-native";

import { cn, type Slots } from "./cn";
import { resolveFormat, type Format } from "./shared/format";
import { Text } from "./text";

export type SliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** The name the screen reader announces: "Volume do alerta". */
  label: string;
  /**
   * Writes the label above the control and the value next to it. The same name
   * as the web; without it, the label exists only for the screen reader.
   */
  showValue?: boolean;
  /**
   * How the number is written: the name of a house formatter or your own
   * function, the same vocabulary as the web. The text applies on screen and in
   * the announcement.
   */
  format?: Format;
  disabled?: boolean;
  /** Styles the root: without `showValue`, the control, the same node as `classNames.control`. */
  className?: string;
  /**
   * Class per part: `control` (the area that receives the drag), `track` (the
   * track), `indicator` (the fill), `thumb` (the thumb), and `label` and
   * `value` (the two texts, only with `showValue`).
   */
  classNames?: Slots<"control" | "track" | "indicator" | "thumb" | "label" | "value">;
  /**
   * The component's texts, to change the language: `increment` and `decrement`
   * are the names of the two adjust actions the screen reader offers. Pass only
   * the ones that change.
   */
  labels?: Partial<SliderLabels>;
};

export type SliderLabels = {
  increment: string;
  decrement: string;
};

const LABELS: SliderLabels = { increment: "Aumentar", decrement: "Diminuir" };

const plain = new Intl.NumberFormat("pt-BR");

const decimalsOf = (n: number) => {
  const [, fraction = ""] = String(n).split(".");
  return fraction.length;
};

const snap = (raw: number, min: number, max: number, step: number) => {
  const stepped = Math.round((raw - min) / step) * step + min;
  const places = Math.max(decimalsOf(step), decimalsOf(min));
  return Math.min(max, Math.max(min, Number(stepped.toFixed(places))));
};

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue,
  format,
  disabled,
  className,
  classNames,
  labels: labelsProp,
}: SliderProps) {
  const labels = { ...LABELS, ...labelsProp };
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const written = write?.(value);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const fraction = max > min ? (value - min) / (max - min) : 0;

  const latest = useRef({ min, max, step, disabled, onValueChange });
  latest.current = { min, max, step, disabled, onValueChange };

  const moveTo = (x: number) => {
    const now = latest.current;
    if (now.disabled || widthRef.current <= 0) return;
    const raw = now.min + (x / widthRef.current) * (now.max - now.min);
    now.onValueChange(snap(raw, now.min, now.max, now.step));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => moveTo(event.nativeEvent.locationX),
      onPanResponderMove: (event) => moveTo(event.nativeEvent.locationX),
    }),
  ).current;

  const control = (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{
        min,
        max,
        now: value,
        ...(written === undefined ? {} : { text: written }),
      }}
      accessibilityState={{ disabled: disabled === true }}
      accessibilityActions={
        disabled
          ? []
          : [
              { name: "increment", label: labels.increment },
              { name: "decrement", label: labels.decrement },
            ]
      }
      onAccessibilityAction={(event) => {
        if (disabled) return;
        const delta = event.nativeEvent.actionName === "increment" ? step : -step;
        onValueChange(snap(value + delta, min, max, step));
      }}
      onLayout={(event: LayoutChangeEvent) => {
        widthRef.current = event.nativeEvent.layout.width;
        setWidth(event.nativeEvent.layout.width);
      }}
      className={cn(
        "h-11 justify-center",
        disabled && "opacity-50",
        !showValue && className,
        classNames?.control,
      )}
      {...(disabled ? {} : pan.panHandlers)}
    >
      <View
        pointerEvents="none"
        className={cn("h-1.5 overflow-hidden rounded-pill bg-skeleton", classNames?.track)}>
        <View
          className={cn("h-full rounded-pill bg-accent-text", classNames?.indicator)}
          style={{ width: fraction * width }}
        />
      </View>
      <View
        pointerEvents="none"
        className={cn(
          "absolute size-5 rounded-pill border border-border-strong bg-fg",
          classNames?.thumb,
        )}
        style={{ left: Math.max(0, fraction * width - 10) }}
      />
    </View>
  );

  if (!showValue) return control;

  return (
    <View className={cn("gap-2", className)}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={cn("flex-row items-baseline justify-between gap-4", disabled && "opacity-50")}
      >
        <Text className={cn("text-sm text-fg", classNames?.label)}>{label}</Text>
        <Text className={cn("text-xs text-fg-subtle", classNames?.value)}>
          {written ?? plain.format(value)}
        </Text>
      </View>
      {control}
    </View>
  );
}
