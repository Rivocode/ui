"use client";

import { useEffect, useMemo, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { encodeQr, qrLogoArea, qrPath, QR_QUIET_ZONE } from "../shared/qr";

export type QRCodeProps = Omit<ComponentProps<"div">, "children"> & {
  /** O texto que o codigo carrega: link, copia e cola do Pix, chave de acesso. */
  value: string;
  /** O nome que o leitor de tela ouve, dizendo para que o codigo serve, e nao o conteudo cru. */
  label: string;
  /** O lado do quadrado em px, com a margem de silencio incluida. */
  size?: number;
  /** A correcao de erro, de `L` (recupera 7% do simbolo) a `H` (30%), com `M` (15%) sem logo e `H` com logo. */
  level?: "L" | "M" | "Q" | "H";
  /** A marca no centro, que so aparece com `level="H"`: os modulos embaixo dela sao apagados. */
  logo?: ReactNode;
  /** Os textos da peca. `tooLong` aparece no lugar do codigo quando o texto passa do que a versao 40 guarda no nivel escolhido. */
  labels?: { tooLong?: string };
  /** Classe por parte: `code` (o svg) e `logo`. */
  classNames?: Slots<"code" | "logo">;
};

export function QRCode({
  value,
  label,
  size = 160,
  level,
  logo,
  labels,
  className,
  classNames,
  style,
  ...props
}: QRCodeProps) {
  const tooLong = labels?.tooLong ?? "Conteúdo longo demais para um QR Code.";
  const chosen = level ?? (logo ? "H" : "M");
  const misused = Boolean(logo) && chosen !== "H";
  const withLogo = Boolean(logo) && !misused;

  useEffect(() => {
    if (!misused || process.env.NODE_ENV === "production") return;
    console.warn(
      `QRCode: o logo só aparece com level="H", e este código está em "${chosen}". ` +
        "Os módulos embaixo do logo se perdem, e só o nível H recupera essa perda com folga.",
    );
  }, [misused, chosen]);

  const encoded = useMemo(() => {
    if (!value) return null;
    try {
      return encodeQr(value, chosen);
    } catch (error) {
      if (error instanceof RangeError) return error;
      throw error;
    }
  }, [value, chosen]);

  const failure = encoded instanceof RangeError ? encoded : null;

  useEffect(() => {
    if (!failure || process.env.NODE_ENV === "production") return;
    console.warn(
      `QRCode: o texto de ${value.length} caracteres não cabe num QR Code de nível "${chosen}", ` +
        "e a peça desenha o aviso no lugar do código. Encurte o texto, troque por um link ou baixe o nível.",
      failure,
    );
  }, [failure, value.length, chosen]);

  if (!encoded || failure) {
    return (
      <div
        {...props}
        role="img"
        aria-label={failure ? `${label}: ${tooLong}` : label}
        data-level={chosen}
        data-state={failure ? "error" : "empty"}
        style={{ width: size, height: size, ...style }}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border-strong bg-surface p-3 text-center",
          className,
        )}
      >
        {failure ? <span className="text-xs text-fg-muted">{tooLong}</span> : null}
      </div>
    );
  }

  const matrix = encoded;
  const side = matrix.size + QR_QUIET_ZONE * 2;
  const hole = withLogo ? qrLogoArea(matrix.size) : null;

  return (
    <div
      {...props}
      role="img"
      aria-label={label}
      data-level={chosen}
      style={{ width: size, height: size, ...style }}
      className={cn("relative inline-block shrink-0 overflow-hidden rounded-md bg-code-paper", className)}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${side} ${side}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className={cn("block", classNames?.code)}
      >
        <rect width={side} height={side} className="fill-code-paper" />
        <path d={qrPath(matrix, { hole: withLogo })} className="fill-code-ink" />
      </svg>

      {hole ? (
        <div
          aria-hidden="true"
          style={{
            left: `${((hole.start + QR_QUIET_ZONE + 0.5) / side) * 100}%`,
            top: `${((hole.start + QR_QUIET_ZONE + 0.5) / side) * 100}%`,
            width: `${((hole.end - hole.start - 1) / side) * 100}%`,
            height: `${((hole.end - hole.start - 1) / side) * 100}%`,
          }}
          className={cn(
            "absolute flex items-center justify-center overflow-hidden rounded-sm bg-code-paper text-code-ink",
            "[&>img]:size-full [&>img]:object-contain [&>svg]:size-full",
            classNames?.logo,
          )}
        >
          {logo}
        </div>
      ) : null}
    </div>
  );
}
