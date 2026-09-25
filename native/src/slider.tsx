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
  /** O nome que o leitor de tela anuncia: "Volume do alerta". */
  label: string;
  /**
   * Escreve o rotulo acima do controle e o valor ao lado dele. O mesmo nome do
   * web; sem ele, o rotulo so existe para o leitor de tela.
   */
  showValue?: boolean;
  /**
   * Como o numero e escrito: nome de formatador da casa ou funcao propria, o
   * mesmo vocabulario do web. O texto vale na tela e no anuncio.
   */
  format?: Format;
  disabled?: boolean;
  /** Veste a raiz: sem `showValue`, o controle, o mesmo no de `classNames.control`. */
  className?: string;
  /**
   * Classe por parte: `control` (a area que recebe o arrasto), `track` (o
   * trilho), `indicator` (o preenchimento), `thumb` (o polegar), e `label` e
   * `value` (os dois textos, so com `showValue`).
   */
  classNames?: Slots<"control" | "track" | "indicator" | "thumb" | "label" | "value">;
};

const plain = new Intl.NumberFormat("pt-BR");

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
  showValue,
  format,
  disabled,
  className,
  classNames,
}: SliderProps) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const written = write?.(value);
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
      className={cn(
        "h-11 justify-center",
        disabled && "opacity-50",
        !showValue && className,
        classNames?.control,
      )}
      {...(disabled ? {} : pan.panHandlers)}
    >
      <View className={cn("h-1.5 overflow-hidden rounded-pill bg-skeleton", classNames?.track)}>
        <View
          className={cn("h-full rounded-pill bg-accent-text", classNames?.indicator)}
          style={{ width: fraction * width }}
        />
      </View>
      <View
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
