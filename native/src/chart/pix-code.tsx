import { useMemo, type ReactNode } from "react";
import { View } from "react-native";

import { Button } from "../button";
import { cn } from "../cn";
import { formatBrl, parsePixPayload } from "../shared/pix";
import { Skeleton } from "../skeleton";
import { Text } from "../text";
import { QRCode } from "./qr-code";

export type PixCodeProps = {
  /** O Pix copia e cola inteiro, como o PSP ou o `buildPixPayload` devolvem. O CRC e conferido. */
  payload: string;
  /** O valor em reais em destaque, que vence o do codigo; no QR dinamico so vale este. */
  amount?: number;
  /** O nome do recebedor. Sem ele, o gravado no codigo, que o app do pagador troca pelo do DICT. */
  receiver?: string;
  /**
   * O botao de copiar, que mora em `@rivocode/ui-native/clipboard` por causa do
   * `expo-clipboard`. Recebe o copia e cola e so e chamado quando ha o que copiar.
   */
  renderCopy?: (payload: string) => ReactNode;
  /** Troca o QR por um aviso e tira o copiar: codigo vencido nao se oferece para pagar. */
  expired?: boolean;
  /** Enquanto a cobranca e gerada: marca de lugar no QR e no texto. */
  loading?: boolean;
  /** Liga o botao de gerar outro codigo, no aviso de expirado. */
  onRenew?: () => void;
  /** O lado do QR em px. */
  size?: number;
  /** Os textos da peca, para quem precisa de outro idioma ou outro tom. */
  labels?: { payload?: string; expired?: string; renew?: string; invalid?: string };
  className?: string;
};

export function PixCode({
  payload,
  amount,
  receiver,
  renderCopy,
  expired = false,
  loading = false,
  onRenew,
  size = 192,
  labels = {},
  className,
}: PixCodeProps) {
  const {
    payload: payloadLabel = "Pix copia e cola",
    expired: expiredLabel = "Este código Pix expirou.",
    renew = "Gerar novo código",
    invalid = "Este código Pix não é válido.",
  } = labels;

  const parsed = useMemo(() => (loading ? null : parsePixPayload(payload)), [payload, loading]);
  const broken = !loading && parsed === null;

  const shownAmount = amount ?? (parsed && !parsed.url ? parsed.amount : undefined);
  const shownName = receiver ?? parsed?.name;
  const money = shownAmount !== undefined ? formatBrl(shownAmount) : null;
  const qrLabel = `QR Code Pix${money ? ` de ${money}` : ""}${shownName ? ` para ${shownName}` : ""}`;

  return (
    <View
      accessibilityState={{ busy: loading }}
      className={cn(
        "w-full items-center gap-4 rounded-lg border border-border bg-surface p-5",
        className,
      )}
    >
      {loading ? (
        <View style={{ width: size, height: size }}>
          <Skeleton className="h-full w-full" />
        </View>
      ) : broken ? (
        <Text accessibilityRole="alert" className="text-center text-sm text-danger-text">
          {invalid}
        </Text>
      ) : expired ? (
        <View
          style={{ width: size, height: size }}
          className="items-center justify-center gap-3 rounded-md border border-dashed border-border-strong bg-bg p-4"
        >
          <Text accessibilityLiveRegion="polite" className="text-center text-sm text-fg">
            {expiredLabel}
          </Text>
          {onRenew ? (
            <Button size="sm" variant="secondary" onPress={onRenew}>
              {renew}
            </Button>
          ) : null}
        </View>
      ) : (
        <QRCode value={payload} label={qrLabel} size={size} />
      )}

      {money || shownName || loading ? (
        <View className="items-center gap-0.5">
          {loading && !money ? (
            <View className="h-7 w-28">
              <Skeleton className="h-full w-full" />
            </View>
          ) : money ? (
            <Text font="display" className="text-2xl tracking-tight text-fg">{money}</Text>
          ) : null}
          {shownName ? <Text className="text-sm text-fg-muted">para {shownName}</Text> : null}
        </View>
      ) : null}

      {!broken && !expired ? (
        <View className="w-full gap-1.5">
          <Text className="text-xs text-fg-subtle">{payloadLabel}</Text>
          <View className="w-full flex-row items-center gap-2 rounded-md border border-border bg-bg py-1.5 pr-1.5 pl-3">
            {loading ? (
              <View className="h-4 flex-1">
                <Skeleton className="h-full w-full" />
              </View>
            ) : (
              <Text
                selectable
                numberOfLines={1}
                ellipsizeMode="middle"
                font="mono"
                className="flex-1 text-xs text-fg-muted"
              >
                {payload}
              </Text>
            )}
            {!loading && renderCopy ? renderCopy(payload) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
