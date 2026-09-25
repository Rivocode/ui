import type { ReactNode } from "react";
import { View } from "react-native";

import { Card, CardContent } from "./card";
import { cn } from "./cn";
import { Entrance } from "./motion";
import { resolveFormat, type Format } from "./shared/format";
import { Text } from "./text";

export type StatProps = {
  label: string;
  /** Ja formatado, como no web: dinheiro abreviado, contagem crua. */
  value: string;
  delta?: number;
  deltaLabel?: string;
  /** Subir e ruim aqui: vencidas, custo, inadimplencia. */
  invert?: boolean;
  /** O slot de tendencia, quando houver um grafico nativo para por. */
  chart?: ReactNode;
  /**
   * Como a variacao e escrita: nome de formatador da casa (`percent`,
   * `currencyShort`, `integer`...) ou funcao propria, o mesmo vocabulario do
   * web. Sem ele, `percent`, que arredonda para inteiro. O que chega ao
   * formatador e o modulo do `delta`: quem carrega o sinal e a seta.
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
  const rose = (delta ?? 0) >= 0;
  const good = invert ? !rose : rose;
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
          <Text className={`text-xs ${good ? "text-success-text" : "text-danger-text"}`}>
            {rose ? "↗" : "↘"} {writeDelta(Math.abs(delta))}{deltaLabel ? ` ${deltaLabel}` : ""}
          </Text>
        )}

        {chart && <View className="mt-2">{chart}</View>}
        </Entrance>
      </CardContent>
    </Card>
  );
}
