import { useRef, useState } from "react";
import { PanResponder, View, type LayoutChangeEvent } from "react-native";

import { cn, type Slots } from "./cn";
import { Entrance } from "./motion";
import { Text } from "./text";

export type TrackerPoint = {
  /** What happened in that period. */
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  /**
   * What the screen reader hears and what the bottom line shows. `string`, and
   * not `ReactNode` as on the web: here it goes whole into the strip's
   * `accessibilityValue`, which accepts only text, and there is no way to read
   * the text back out of a `ReactNode`.
   */
  label: string;
};

const TONE: Record<NonNullable<TrackerPoint["tone"]>, string> = {
  neutral: "bg-skeleton",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent-text",
};

export type TrackerProps = {
  data: TrackerPoint[];
  /** What the strip measures, spelled out: "Emissões dos últimos 90 dias". */
  label: string;
  className?: string;
  /**
   * Class per part: `track` (the strip that receives the drag) and `cell` (each
   * period). `label` is only the strip's spoken name, and has no node to style.
   */
  classNames?: Slots<"track" | "cell">;
  /**
   * The component's texts, to change the language: `next` and `previous` are
   * the names of the two adjust actions that move between periods. Pass only
   * the ones that change.
   */
  labels?: Partial<TrackerLabels>;
};

export type TrackerLabels = {
  next: string;
  previous: string;
};

const LABELS: TrackerLabels = { next: "Período seguinte", previous: "Período anterior" };

export function Tracker({ data, label, className, classNames, labels: labelsProp }: TrackerProps) {
  const labels = { ...LABELS, ...labelsProp };
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const countRef = useRef(data.length);
  countRef.current = data.length;

  const [index, setIndex] = useState<number | null>(null);
  const at = Math.min(Math.max(index ?? data.length - 1, 0), Math.max(data.length - 1, 0));
  const point = data[at];

  const moveTo = (x: number) => {
    if (widthRef.current <= 0 || countRef.current === 0) return;
    const raw = Math.floor((x / widthRef.current) * countRef.current);
    setIndex(Math.min(Math.max(raw, 0), countRef.current - 1));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => moveTo(event.nativeEvent.locationX),
      onPanResponderMove: (event) => moveTo(event.nativeEvent.locationX),
    }),
  ).current;

  if (data.length === 0) return null;

  const step = width / data.length;

  return (
    <Entrance effect="fadeIn" className={cn("gap-1.5", className)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${at + 1} de ${data.length}: ${point?.label ?? ""}` }}
        accessibilityActions={[
          { name: "increment", label: labels.next },
          { name: "decrement", label: labels.previous },
        ]}
        onAccessibilityAction={(event) => {
          const delta = event.nativeEvent.actionName === "increment" ? 1 : -1;
          setIndex(Math.min(Math.max(at + delta, 0), data.length - 1));
        }}
        onLayout={(event: LayoutChangeEvent) => {
          widthRef.current = event.nativeEvent.layout.width;
          setWidth(event.nativeEvent.layout.width);
        }}
        className={cn("h-11 w-full flex-row items-center gap-0.5", classNames?.track)}
        {...pan.panHandlers}
      >
        {data.map((entry, position) => (
          <View
            key={position}
            pointerEvents="none"
            className={cn(
              "h-7 min-w-0 flex-1 rounded-sm",
              TONE[entry.tone ?? "neutral"],
              classNames?.cell,
            )}
          />
        ))}

        {width > 0 && (
          <View
            pointerEvents="none"
            className="absolute h-9 w-0.5 rounded-pill bg-fg"
            style={{ left: Math.max(0, at * step + step / 2 - 1) }}
          />
        )}
      </View>

      <Text
        numberOfLines={1}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="text-xs text-fg-muted"
      >
        {point?.label}
      </Text>
    </Entrance>
  );
}
