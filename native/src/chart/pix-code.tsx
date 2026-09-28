import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";

import { Button } from "../button";
import { cn, type Slots } from "../cn";
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
  /**
   * The whole Pix copy-and-paste code, as the PSP or `buildPixPayload` returns
   * it. The CRC is checked, and surrounding whitespace is removed before the QR
   * and the copy.
   */
  payload: string;
  /**
   * The amount in reais, highlighted, which overrides the one in the code; in a
   * dynamic QR only this one applies.
   */
  amount?: number;
  /**
   * The receiver's name as the screen should show it, with accents. Without it,
   * the one recorded in the code, which EMV stores in ASCII without accents.
   */
  receiver?: string;
  /**
   * The copy button, which lives in `@rivocode/ui-native/clipboard` because of
   * `expo-clipboard`. Receives the copy-and-paste code and is called only when
   * there is something to copy.
   */
  renderCopy?: (payload: string) => ReactNode;
  /**
   * Replaces the QR with a notice and removes the copy: an expired code is not
   * offered for payment.
   */
  expired?: boolean;
  /**
   * While the charge is being generated: a placeholder in the QR and in the
   * text, and the notice to the screen reader.
   */
  loading?: boolean;
  /** Turns on the button that generates another code, in the expired notice. */
  onRenew?: () => void;
  /** The QR side in px. */
  size?: number;
  /**
   * The component's texts, for another language or another tone. `loading`,
   * `ready` and `expired` are spoken to the screen reader.
   */
  labels?: Partial<PixCodeLabels>;
  className?: string;
  /**
   * Class per part: `code` (the QR, its placeholder or the expired notice),
   * `amount`, `receiver` and `payload` (the copy-and-paste text).
   */
  classNames?: Slots<"code" | "amount" | "receiver" | "payload">;
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
  classNames,
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
        <View style={{ width: size, height: size }} className={classNames?.code}>
          <Skeleton className="h-full w-full" />
        </View>
      ) : broken ? (
        <Text accessibilityRole="alert" className="text-center text-sm text-danger-text">
          {text.invalid}
        </Text>
      ) : expired ? (
        <View
          style={{ width: size, height: size }}
          className={cn(
            "items-center justify-center gap-3 rounded-md border border-dashed border-border-strong bg-bg p-4",
            classNames?.code,
          )}
        >
          <Text className="text-center text-sm text-fg">{text.expired}</Text>
          {onRenew ? (
            <Button size="sm" variant="secondary" onPress={onRenew}>
              {text.renew}
            </Button>
          ) : null}
        </View>
      ) : (
        <QRCode value={code} label={qrLabel} size={size} className={classNames?.code} />
      )}

      {money || shownName || loading ? (
        <View className="items-center gap-0.5">
          {loading && !money ? (
            <View className="h-7 w-28">
              <Skeleton className="h-full w-full" />
            </View>
          ) : money ? (
            <Text
              font="display"
              className={cn("text-2xl tracking-tight text-fg", classNames?.amount)}
            >
              {money}
            </Text>
          ) : null}
          {shownName ? (
            <Text className={cn("text-sm text-fg-muted", classNames?.receiver)}>
              {text.receiver(shownName)}
            </Text>
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
                className={cn("flex-1 text-xs text-fg-muted", classNames?.payload)}
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
