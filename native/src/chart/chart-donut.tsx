import { useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { cn } from "../cn";
import { useRivo } from "../provider";
import { Text } from "../text";
import { arcPath } from "./arc";
import { PALETTE, type ChartConfig } from "./chart";

const OUTER = 44;

const GAP = 2;

export type ChartDonutProps<Slice> = {
  data: Slice[];
  /** De onde sai o número de cada fatia. */
  valueKey: keyof Slice & string;
  /** De onde sai o nome de cada fatia. É ele que o `config` procura. */
  nameKey: keyof Slice & string;
  config?: ChartConfig;
  /**
   * O número grande no meio. `string`, e não `ReactNode` como no web: aqui ele
   * também é o que o leitor de tela ouve quando não há legenda.
   */
  centerValue?: string;
  /** A linha pequena embaixo do número. */
  centerLabel?: string;
  /**
   * Espessura do anel, em fração do raio. `1` fecha e vira pizza. Anel mais
   * fino deixa buraco maior, e é ali que o total precisa caber.
   */
  thickness?: number;
  /**
   * A lista de fatias embaixo, com nome e valor. **Ligada por padrão, e aqui
   * ela carrega mais peso que no web**: é a legenda que responde ao toque e
   * ao leitor de tela, porque nenhuma dica se abre sem ponteiro.
   */
  legend?: boolean;
  /**
   * Como o número é escrito.
   *
   * Só função, ao contrário do web, que também aceita o nome de um formatador
   * da casa (`currencyShort`, `percent`). É a mesma decisão que o `Meter`
   * nativo já tomou e escreveu: resolver nome de formatador arrasta o `Intl`
   * inteiro para o bundle do celular, e quem chama já tem o número escrito.
   */
  format?: (value: number) => string;
  className?: string;
  /**
   * O que o leitor de tela ouve no lugar do desenho.
   *
   * Com a legenda ligada (o padrão) ela não é necessária, e nem é usada: o
   * desenho fica escondido e cada fatia é uma parada de verdade logo abaixo.
   * Sem legenda, o nome sai das fatias, com valor e tudo.
   */
  label?: string;
};

export function ChartDonut<Slice extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  config,
  centerValue,
  centerLabel,
  thickness = 0.34,
  legend = true,
  format,
  className,
  label,
}: ChartDonutProps<Slice>) {
  const { colors: theme } = useRivo();

  const [reading, setReading] = useState<number | null>(null);

  const inner = OUTER * (1 - thickness);
  const middle = (OUTER + inner) / 2;
  const band = OUTER - inner;

  const nameOf = (slice: Slice) => String(slice[nameKey]);
  const textOf = (slice: Slice) => config?.[nameOf(slice)]?.label ?? nameOf(slice);
  const colorOf = (slice: Slice, index: number) =>
    theme[config?.[nameOf(slice)]?.color ?? PALETTE[index % PALETTE.length]!];

  const write = (value: number) => (format ? format(value) : String(value));

  const values = data.map((slice) => Math.max(0, Number(slice[valueKey]) || 0));
  const total = values.reduce((sum, value) => sum + value, 0);

  let walked = 0;
  const wedges = values.map((value) => {
    const span = total > 0 ? (value / total) * 360 : 0;
    const from = walked;
    walked += span;
    return { from, span };
  });

  const drawn = wedges.filter((wedge) => wedge.span > 0);
  const sole = drawn.length === 1 ? wedges.findIndex((wedge) => wedge.span > 0) : -1;

  const read = reading !== null ? data[reading] : undefined;
  const readValue = reading !== null ? values[reading]! : 0;

  const name =
    label ??
    (legend
      ? undefined
      : `Rosca: ${data.map((slice, index) => `${textOf(slice)} ${write(values[index]!)}`).join(", ")}`);

  const spoken = name
    ? ({ accessible: true, accessibilityRole: "image", accessibilityLabel: name } as const)
    : ({
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      } as const);

  return (
    <View className={cn("w-full", className)}>
      <View className="h-48 w-full" {...spoken}>
        <Svg width="100%" height="100%" viewBox="-50 -50 100 100">
          {drawn.length === 0 ? null : sole >= 0 ? (
            <Circle r={middle} fill="none" stroke={colorOf(data[sole]!, sole)} strokeWidth={band} />
          ) : (
            wedges.map((wedge, index) => {
              if (wedge.span <= 0) return null;

              const edge = Math.min(GAP / 2, wedge.span / 3);
              const dim = reading !== null && reading !== index;

              return (
                <Path
                  key={nameOf(data[index]!)}
                  d={arcPath(middle, wedge.from + edge, wedge.from + wedge.span - edge)}
                  fill="none"
                  stroke={colorOf(data[index]!, index)}
                  strokeWidth={band}
                  strokeLinecap="butt"
                  strokeOpacity={dim ? 0.32 : 1}
                />
              );
            })
          )}
        </Svg>

        {(centerValue || centerLabel || read) && (
          <View
            className="absolute inset-0 items-center justify-center"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text
              numberOfLines={2}
              font="display"
              className="max-w-[52%] text-center text-xl font-semibold text-fg"
            >
              {read ? write(readValue) : centerValue}
            </Text>
            {(read || centerLabel) && (
              <Text numberOfLines={1} className="mt-0.5 max-w-[64%] text-center text-xs text-fg-subtle">
                {read ? textOf(read) : centerLabel}
              </Text>
            )}
          </View>
        )}
      </View>

      {legend && (
        <View className="mt-3">
          {data.map((slice, index) => {
            const selected = reading === index;

            return (
              <Pressable
                key={nameOf(slice)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${textOf(slice)}: ${write(values[index]!)}`}
                accessibilityHint="Acende esta fatia e mostra o valor dela no meio"
                onPress={() => setReading(selected ? null : index)}
                className={cn(
                  "h-11 flex-row items-center gap-2 rounded-sm px-1",
                  selected && "bg-selected",
                )}
              >
                <View
                  className="size-2 rounded-sm"
                  style={{ backgroundColor: colorOf(slice, index) }}
                />
                <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-fg-muted">
                  {textOf(slice)}
                </Text>
                <Text font="mono" className="text-sm text-fg">{write(values[index]!)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
