"use client";

import { useMemo, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { formatBrl, parsePixPayload } from "../shared/pix";
import { Button } from "./button";
import { Clipboard } from "./clipboard";
import { QRCode } from "./qr-code";
import { Skeleton } from "./skeleton";

export type PixCodeProps = Omit<ComponentProps<"div">, "children"> & {
  /** O Pix copia e cola inteiro, como o PSP ou o `buildPixPayload` devolvem. O CRC e conferido. */
  payload: string;
  /**
   * O valor em reais que aparece em destaque. Sem ele, o do proprio codigo,
   * e so no QR estatico: no dinamico o manual do BCB manda ignorar o campo 54.
   */
  amount?: number;
  /** O nome do recebedor. Sem ele, o gravado no codigo, que o app do pagador troca pelo do DICT. */
  receiver?: string;
  /** Troca o QR por um aviso e tira o copiar: codigo vencido nao se oferece para pagar. */
  expired?: boolean;
  /** Enquanto a cobranca e gerada: marca de lugar no QR e no texto, com `aria-busy`. */
  loading?: boolean;
  /** Liga o botao de gerar outro codigo, no aviso de expirado. */
  onRenew?: () => void;
  /** O lado do QR em px. */
  size?: number;
  /** Os textos da peca, para quem precisa de outro idioma ou outro tom. */
  labels?: {
    copy?: string;
    copied?: string;
    payload?: string;
    expired?: string;
    renew?: string;
    invalid?: string;
  };
  /** Classe por parte: `code`, `amount`, `receiver`, `payload`, `copy`. */
  classNames?: Slots<"code" | "amount" | "receiver" | "payload" | "copy">;
};

export function PixCode({
  payload,
  amount,
  receiver,
  expired = false,
  loading = false,
  onRenew,
  size = 192,
  labels = {},
  className,
  classNames,
  ...props
}: PixCodeProps) {
  const {
    copy = "Copiar código",
    copied = "Código copiado",
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
    <div
      {...props}
      aria-busy={loading || undefined}
      className={cn(
        "flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-surface p-5 text-center",
        className,
      )}
    >
      {loading ? (
        <Skeleton style={{ width: size, height: size }} className={classNames?.code} />
      ) : broken ? (
        <p role="alert" className="text-sm text-danger-text">
          {invalid}
        </p>
      ) : expired ? (
        <div
          style={{ width: size, height: size }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-strong bg-bg p-4",
            classNames?.code,
          )}
        >
          <p role="status" className="text-sm text-fg">
            {expiredLabel}
          </p>
          {onRenew ? (
            <Button size="sm" variant="secondary" onClick={onRenew}>
              {renew}
            </Button>
          ) : null}
        </div>
      ) : (
        <QRCode
          value={payload}
          label={qrLabel}
          size={size}
          className={classNames?.code}
        />
      )}

      {money || shownName || loading ? (
        <div className="flex flex-col items-center gap-0.5">
          {loading && !money ? (
            <Skeleton className="h-7 w-28" />
          ) : money ? (
            <p
              className={cn(
                "font-display text-2xl tracking-tight text-fg tabular-nums",
                classNames?.amount,
              )}
            >
              {money}
            </p>
          ) : null}
          {shownName ? (
            <p className={cn("text-sm text-fg-muted", classNames?.receiver)}>para {shownName}</p>
          ) : null}
        </div>
      ) : null}

      {!broken && !expired ? (
        <div className="flex w-full flex-col gap-1.5 text-left">
          <p className="text-xs text-fg-subtle">{payloadLabel}</p>
          <div className="flex w-full items-center gap-2 rounded-md border border-border bg-bg py-1.5 pr-1.5 pl-3">
            {loading ? (
              <Skeleton className="h-4 flex-1" />
            ) : (
              <p
                className={cn(
                  "min-w-0 flex-1 truncate font-mono text-xs text-fg-muted",
                  classNames?.payload,
                )}
              >
                {payload}
              </p>
            )}
            <Clipboard
              value={payload}
              disabled={loading}
              labels={{ copy, copied }}
              className={classNames?.copy}
            >
              {copy}
            </Clipboard>
          </div>
        </div>
      ) : null}
    </div>
  );
}
