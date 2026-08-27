import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { type RivoNativeColorRole } from "../tokens";
import { cn } from "./cn";
import { useRivo } from "./provider";

const STROKE = 2;

export type SparklineProps = {
  /** So os numeros, na ordem do tempo. */
  data: number[];
  /** `line` para tendencia pura; `bar` quando cada periodo conta sozinho. */
  variant?: "line" | "bar";
  /**
   * O papel de token que pinta o traco - `chart-1` a `chart-8` quando a peca
   * entra numa serie. Sem ele, o acento do tema, que e a leitura neutra de
   * "isto e um numero desta tela".
   */
  color?: RivoNativeColorRole;
  /**
   * Pinta de verde ou vermelho conforme suba ou desca do primeiro ao ultimo
   * ponto. Use so quando subir for bom: em custo, subir e ruim.
   *
   * Nao se chama `tone` de proposito, e o nome acompanha o do web: `tone` e a
   * escala semantica de cor no resto do catalogo - `Badge`, `Alert`,
   * `Timeline` -, com outros valores.
   */
  trend?: "auto" | "none";
  /** A altura do desenho, em px. A largura vem do pai. */
  height?: number;
  className?: string;
  /** O que o leitor de tela ouve. Sem isto ela e escondida dele. */
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

  const access = label
    ? ({ accessibilityRole: "image", accessibilityLabel: label } as const)
    : ({
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      } as const);

  if (variant === "bar") {
    const floor = Math.min(0, ...data);
    const span = Math.max(0, ...data) - floor;

    return (
      <View
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
      </View>
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
    <View
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
    </View>
  );
}
