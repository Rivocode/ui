import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";

import { Button } from "../button";
import { cn } from "../cn";
import { formatBrl, parsePixPayload } from "../shared/pix";
import { Skeleton } from "../skeleton";
import { Text } from "../text";
import { QRCode } from "./qr-code";

export type PixCodeLabels = {
  payload: string;
  expired: string;
  renew: string;
  invalid: string;
  loading: string;
  ready: string;
  receiver: (name: string) => string;
  code: (amount: string | undefined, receiver: string | undefined) => string;
};

const LABELS: PixCodeLabels = {
  payload: "Pix copia e cola",
  expired: "Este código Pix expirou.",
  renew: "Gerar novo código",
  invalid: "Este código Pix não é válido.",
  loading: "Gerando o código Pix…",
  ready: "Código Pix pronto.",
  receiver: (name) => `para ${name}`,
  code: (amount, receiver) =>
    `QR Code Pix${amount ? ` de ${amount}` : ""}${receiver ? ` para ${receiver}` : ""}`,
};

export type PixCodeProps = {
  /** O Pix copia e cola inteiro, como o PSP ou o `buildPixPayload` devolvem. O CRC e conferido, e o espaco em volta sai antes do QR e do copiar. */
  payload: string;
  /** O valor em reais em destaque, que vence o do codigo; no QR dinamico so vale este. */
  amount?: number;
  /** O nome do recebedor como a tela deve mostrar, com acento. Sem ele, o gravado no codigo, que o EMV guarda em ASCII e sem acento. */
  receiver?: string;
  /**
   * O botao de copiar, que mora em `@rivocode/ui-native/clipboard` por causa do
   * `expo-clipboard`. Recebe o copia e cola e so e chamado quando ha o que copiar.
   */
  renderCopy?: (payload: string) => ReactNode;
  /** Troca o QR por um aviso e tira o copiar: codigo vencido nao se oferece para pagar. */
  expired?: boolean;
  /** Enquanto a cobranca e gerada: marca de lugar no QR e no texto, e o aviso ao leitor de tela. */
  loading?: boolean;
  /** Liga o botao de gerar outro codigo, no aviso de expirado. */
  onRenew?: () => void;
  /** O lado do QR em px. */
  size?: number;
  /** Os textos da peca, para quem precisa de outro idioma ou outro tom. `loading`, `ready` e `expired` sao ditos ao leitor de tela. */
  labels?: Partial<PixCodeLabels>;
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
  const text = { ...LABELS, ...labels };
  const code = payload.trim();

  const parsed = useMemo(() => (loading ? null : parsePixPayload(code)), [code, loading]);
  const broken = !loading && parsed === null;

  const [waited, setWaited] = useState(loading);
  if (loading && !waited) setWaited(true);

  const shownAmount = amount ?? (parsed && !parsed.url ? parsed.amount : undefined);
  const shownName = receiver ?? parsed?.name;
  const money = shownAmount !== undefined ? formatBrl(shownAmount) : null;
  const qrLabel = text.code(money ?? undefined, shownName);
  const heard = loading ? text.loading : expired && !broken ? text.expired : waited && !broken ? text.ready : "";

  const spoken = useRef("");
  useEffect(() => {
    if (heard && heard !== spoken.current) AccessibilityInfo.announceForAccessibility(heard);
    spoken.current = heard;
  }, [heard]);

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
          {text.invalid}
        </Text>
      ) : expired ? (
        <View
          style={{ width: size, height: size }}
          className="items-center justify-center gap-3 rounded-md border border-dashed border-border-strong bg-bg p-4"
        >
          <Text className="text-center text-sm text-fg">{text.expired}</Text>
          {onRenew ? (
            <Button size="sm" variant="secondary" onPress={onRenew}>
              {text.renew}
            </Button>
          ) : null}
        </View>
      ) : (
        <QRCode value={code} label={qrLabel} size={size} />
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
          {shownName ? (
            <Text className="text-sm text-fg-muted">{text.receiver(shownName)}</Text>
          ) : null}
        </View>
      ) : null}

      {!broken && !expired ? (
        <View className="w-full gap-1.5">
          <Text className="text-xs text-fg-subtle">{text.payload}</Text>
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
                {code}
              </Text>
            )}
            {!loading && renderCopy ? renderCopy(code) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
