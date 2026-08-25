import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { Card, CardContent } from "./card";

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
};

/** O numero de painel, na mesma hierarquia do web: rotulo, valor, variacao. */
export function Stat({ label, value, delta, deltaLabel, invert, chart }: StatProps) {
  const rose = (delta ?? 0) >= 0;
  const good = invert ? !rose : rose;

  return (
    <Card className="flex-1">
      <CardContent className="gap-1">
        <Text className="text-sm text-fg-muted">{label}</Text>
        <Text className="text-2xl font-semibold text-fg">{value}</Text>

        {delta !== undefined && (
          <Text className={`text-xs ${good ? "text-success-text" : "text-danger-text"}`}>
            {rose ? "↗" : "↘"} {Math.abs(delta)}%{deltaLabel ? ` ${deltaLabel}` : ""}
          </Text>
        )}

        {chart && <View className="mt-2">{chart}</View>}
      </CardContent>
    </Card>
  );
}
