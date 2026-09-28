import type { ReactNode } from "react";
import { View } from "react-native";

import { Card, CardContent } from "./card";
import { cn } from "./cn";
import { Entrance } from "./motion";
import { resolveFormat, type Format } from "./shared/format";
import { Text } from "./text";

export type StatProps = {
  label: string;
  /** Already formatted, as on the web: abbreviated money, raw count. */
  value: string;
  delta?: number;
  deltaLabel?: string;
  /** Rising is bad here: overdue items, cost, default rate. */
  invert?: boolean;
  /** The trend slot, when there is a native chart to put there. */
  chart?: ReactNode;
  /**
   * How the change is written: the name of a house formatter (`percent`,
   * `currencyShort`, `integer`...) or your own function, the same vocabulary as
   * the web. Without it, `percent`, which rounds to an integer. What reaches
   * the formatter is the absolute value of `delta`: the sign is carried by the
   * arrow.
   */
  deltaFormat?: Format;
  className?: string;
};

export function Stat({
  label,
  value,
  delta,
  deltaLabel,
  invert,
  chart,
  deltaFormat = "percent",
  className,
}: StatProps) {
  const rose = (delta ?? 0) > 0;
  const flat = delta === 0;
  const good = invert ? !rose : rose;
  const tone = flat ? "text-fg-muted" : good ? "text-success-text" : "text-danger-text";
  const arrow = flat ? "" : rose ? "↗ " : "↘ ";
  const writeDelta = resolveFormat(deltaFormat) as (value: number) => string;

  return (
    <Card className={cn("flex-1", className)}>
      <CardContent>
        <Entrance effect="fadeIn" className="gap-1">
        <Text className="text-sm text-fg-muted">{label}</Text>
        <Text font="display" className="text-2xl font-rc-display text-fg">
          {value}
        </Text>

        {delta !== undefined && (
          <Text className={`text-xs ${tone}`}>
            {arrow}
            {writeDelta(Math.abs(delta))}{deltaLabel ? ` ${deltaLabel}` : ""}
          </Text>
        )}

        {chart && <View className="mt-2">{chart}</View>}
        </Entrance>
      </CardContent>
    </Card>
  );
}
