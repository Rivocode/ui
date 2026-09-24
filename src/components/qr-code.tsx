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
  /** O fundo, com a margem de silencio de 4 modulos: `surface` dentro de cartao, `bg` solto na pagina. */
  background?: "bg" | "surface";
  /** A marca no centro, que so aparece com `level="H"`: os modulos embaixo dela sao apagados. */
  logo?: ReactNode;
  /** Classe por parte: `code` (o svg) e `logo`. */
  classNames?: Slots<"code" | "logo">;
};

const BACKGROUND = { bg: "fill-bg", surface: "fill-surface" } as const;
const PLATE = { bg: "bg-bg", surface: "bg-surface" } as const;

export function QRCode({
  value,
  label,
  size = 160,
  level,
  background = "surface",
  logo,
  className,
  classNames,
  style,
  ...props
}: QRCodeProps) {
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

  const matrix = useMemo(() => (value ? encodeQr(value, chosen) : null), [value, chosen]);
  const side = (matrix?.size ?? 21) + QR_QUIET_ZONE * 2;
  const hole = matrix && withLogo ? qrLogoArea(matrix.size) : null;

  return (
    <div
      {...props}
      role="img"
      aria-label={label}
      data-level={chosen}
      style={{ width: size, height: size, ...style }}
      className={cn("relative inline-block shrink-0", className)}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${side} ${side}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className={cn("block", classNames?.code)}
      >
        <rect width={side} height={side} className={BACKGROUND[background]} />
        {matrix ? <path d={qrPath(matrix, { hole: withLogo })} className="fill-fg" /> : null}
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
            "absolute flex items-center justify-center overflow-hidden rounded-sm",
            PLATE[background],
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
