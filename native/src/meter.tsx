import { View } from "react-native";

import { cn, type Slots } from "./cn";
import { Fill } from "./motion";
import { resolveFormat, type Format } from "./shared/format";
import { Text } from "./text";

export type MeterProps = {
  /** Where the measurement is now, on the scale from `min` to `max`. */
  value: number;
  /** The floor of the scale. Almost always zero, hence the default. */
  min?: number;
  /**
   * The ceiling of the scale: the quota, the plan limit, the contracted disk.
   * The default 100 is the percentage case, the only one this package's
   * Progress covers.
   */
  max?: number;
  /** The measurement's name. It stays on screen AND is what the screen reader announces. */
  label: string;
  /** Writes the percentage next to the label. The same name as the web. */
  showValue?: boolean;
  /**
   * How the number is written: the name of a house formatter (`percent`,
   * `currencyShort`, `integer`...) or your own function, the same vocabulary as
   * the web. Receives the raw `value`, and the text applies on screen and in
   * the announcement.
   */
  format?: Format;
  /**
   * The measurement already written - "8 GB de 15 GB", "R$ 4.200 de R$ 5.000".
   * Replaces the percentage on screen and in the announcement, and wins over
   * `format` when both are passed.
   */
  valueLabel?: string;
  className?: string;
  /**
   * Class per part: `label`, `value` (the written number), `track` (the track)
   * and `indicator` (the fill).
   */
  classNames?: Slots<"label" | "value" | "track" | "indicator">;
};

export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  showValue,
  format,
  valueLabel,
  className,
  classNames,
}: MeterProps) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const span = max - min;
  const filled = span > 0 ? Math.min(1, Math.max(0, (value - min) / span)) : 0;
  const percent = Math.round(filled * 100);
  const spoken = valueLabel ?? (write ? write(value) : `${percent}%`);
  const announced = Math.min(max, Math.max(min, value));

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: announced, text: spoken }}
      className={cn("gap-2", className)}
    >
      <View className="flex-row items-baseline justify-between gap-4">
        <Text className={cn("text-sm text-fg", classNames?.label)}>{label}</Text>
        {(showValue || valueLabel !== undefined) && (
          <Text className={cn("text-xs text-fg-subtle", classNames?.value)}>{spoken}</Text>
        )}
      </View>

      <View className={cn("h-1.5 overflow-hidden rounded-pill bg-skeleton", classNames?.track)}>
        <Fill
          percent={percent}
          enter
          className={cn("h-full rounded-pill bg-accent-text", classNames?.indicator)}
        />
      </View>
    </View>
  );
}
