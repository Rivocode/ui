import { useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";

import { cn, type Slots } from "../cn";
import { Entrance } from "../motion";
import { useRivo } from "../provider";
import { TREEMAP_TINT, labelFit, squarify } from "../shared/chart-layout";
import { Text } from "../text";
import { PALETTE, type ChartConfig } from "./chart";
import { resolveFormat, type Format } from "../shared/format";

export type ChartTreemapProps<Item> = {
  /** As categorias. Valor zero ou negativo não ganha área. */
  data: Item[];
  /** De onde sai o número, que vira área. */
  valueKey: keyof Item & string;
  /** De onde sai o nome de cada categoria. É ele que o `config` procura. */
  nameKey: keyof Item & string;
  /** Nome legível e papel de cor por categoria, o mesmo formato da rosca daqui. */
  config?: ChartConfig;
  /**
   * Como o numero e escrito: nome de formatador da casa (`currencyShort`,
   * `percent`, `integer`...) ou funcao propria, o mesmo vocabulario do web.
   */
  format?: Format;
  className?: string;
  /**
   * Classe por parte: `cell` (o bloco de cada categoria) e `label` (o nome e o
   * valor escritos dentro dele).
   */
  classNames?: Slots<"cell" | "label">;
};

function valueOf(raw: unknown): number {
  const number = Number(raw);
  return Number.isFinite(number) ? number : 0;
}

function share(value: number, total: number) {
  if (total <= 0) return "—";
  const rate = Math.round((Math.max(0, value) / total) * 1000) / 10;
  return `${rate.toString().replace(".", ",")}%`;
}

export function ChartTreemap<Item extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  config,
  format,
  className,
  classNames,
}: ChartTreemapProps<Item>) {
  const { colors: theme } = useRivo();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [reading, setReading] = useState<number | null>(null);

  const resolved = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (value: number) => (resolved ? resolved(value) : String(value));
  const values = data.map((item) => valueOf(item[valueKey]));
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  const boxes = squarify(values, size.width, size.height);

  const nameOf = (item: Item) => String(item[nameKey]);
  const textOf = (item: Item) => config?.[nameOf(item)]?.label ?? nameOf(item);
  const colorOf = (item: Item, index: number) =>
    theme[config?.[nameOf(item)]?.color ?? PALETTE[index % PALETTE.length]!];
  const describe = (index: number) =>
    `${textOf(data[index]!)}: ${say(values[index]!)} (${share(values[index]!, total)})`;

  return (
    <View className={cn("w-full gap-2", className)}>
      <Entrance
        effect="fadeIn"
        className="h-64 w-full"
        onLayout={(event: LayoutChangeEvent) => {
          const { width, height } = event.nativeEvent.layout;
          setSize((current) =>
            current.width === width && current.height === height ? current : { width, height },
          );
        }}
      >
        {data.map((item, index) => {
          const box = boxes[index]!;
          if (box.width <= 0 || box.height <= 0) return null;

          const color = colorOf(item, index);
          const name = textOf(item);
          const value = say(values[index]!);
          const fit = labelFit(name, value, box.width, box.height);
          const selected = reading === index;

          return (
            <Pressable
              key={`${index}-${nameOf(item)}`}
              accessibilityRole="button"
              accessibilityLabel={describe(index)}
              accessibilityState={{ selected }}
              onPress={() => setReading(selected ? null : index)}
              className="absolute p-0.5"
              style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
            >
              <View
                className={cn("h-full w-full overflow-hidden rounded-sm p-2", classNames?.cell)}
                style={{ borderWidth: selected ? 2 : 1, borderColor: selected ? theme.fg : color }}
              >
                <View
                  className="absolute inset-0"
                  style={{ backgroundColor: color, opacity: TREEMAP_TINT }}
                />
                {fit !== "none" && (
                  <View className={classNames?.label}>
                    <Text numberOfLines={1} className="text-xs font-rc-medium text-fg">
                      {name}
                    </Text>
                    {fit === "both" && (
                      <Text numberOfLines={1} font="mono" className="text-xs text-fg">
                        {value}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </Entrance>

      <Text
        numberOfLines={1}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="min-h-4 text-xs text-fg-muted"
      >
        {reading !== null && data[reading] ? describe(reading) : ""}
      </Text>
    </View>
  );
}
