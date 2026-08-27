import { useRef, useState } from "react";
import { PanResponder, View, type LayoutChangeEvent } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type TrackerPoint = {
  /** O que aconteceu nesse período. */
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  /**
   * O que o leitor de tela ouve e o que a linha de baixo mostra.
   *
   * `string`, e não `ReactNode` como no web: aqui ele vai inteiro para o
   * `accessibilityValue` da faixa, que só aceita texto, e num `ReactNode` não
   * há como ler o texto de volta.
   */
  label: string;
};

const TONE: Record<NonNullable<TrackerPoint["tone"]>, string> = {
  neutral: "bg-skeleton",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
};

export type TrackerProps = {
  data: TrackerPoint[];
  /** O que a faixa mede, dito por extenso: "Emissões dos últimos 90 dias". */
  label: string;
  className?: string;
};

export function Tracker({ data, label, className }: TrackerProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const countRef = useRef(data.length);
  countRef.current = data.length;

  const [index, setIndex] = useState(data.length - 1);
  const at = Math.min(Math.max(index, 0), Math.max(data.length - 1, 0));
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
    <View className={cn("gap-1.5", className)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${at + 1} de ${data.length}: ${point?.label ?? ""}` }}
        accessibilityActions={[
          { name: "increment", label: "Período seguinte" },
          { name: "decrement", label: "Período anterior" },
        ]}
        onAccessibilityAction={(event) => {
          const delta = event.nativeEvent.actionName === "increment" ? 1 : -1;
          setIndex(Math.min(Math.max(at + delta, 0), data.length - 1));
        }}
        onLayout={(event: LayoutChangeEvent) => {
          widthRef.current = event.nativeEvent.layout.width;
          setWidth(event.nativeEvent.layout.width);
        }}
        className="h-11 w-full flex-row items-center gap-0.5"
        {...pan.panHandlers}
      >
        {data.map((entry, position) => (
          <View
            key={position}
            className={cn("h-7 min-w-0 flex-1 rounded-sm", TONE[entry.tone ?? "neutral"])}
          />
        ))}

        {width > 0 && (
          <View
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
    </View>
  );
}
