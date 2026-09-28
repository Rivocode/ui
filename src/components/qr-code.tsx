"use client";

import { useEffect, useMemo, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { encodeQr, qrLogoArea, qrPath, QR_QUIET_ZONE } from "../shared/qr";

export type QRCodeProps = Omit<ComponentProps<"div">, "children"> & {
  /** The text the code carries: a link, a Pix copy-and-paste code, an access key. */
  value: string;
  /** The name the screen reader hears, saying what the code is for, not the raw content. */
  label: string;
  /** The side of the square in px, with the quiet zone included. */
  size?: number;
  /**
   * The error correction, from `L` (recovers 7% of the symbol) to `H` (30%), with `M` (15%) without
   * a logo and `H` with a logo.
   */
  level?: "L" | "M" | "Q" | "H";
  /**
   * The mark in the center, which only appears with `level="H"`: the modules under it are erased.
   */
  logo?: ReactNode;
  /**
   * The piece's texts. `tooLong` appears in place of the code when the text exceeds what version 40
   * holds at the chosen level.
   */
  labels?: { tooLong?: string };
  /** Class per part: `code` (the svg) and `logo`. */
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
      `QRCode: the logo only shows with level="H", and this code is at "${chosen}". ` +
        "The modules under the logo are lost, and only level H recovers that loss with room to spare.",
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
      `QRCode: the ${value.length}-character text does not fit in a QR Code at level "${chosen}", ` +
        "and the component draws the notice in place of the code. Shorten the text, swap it for a link or lower the level.",
      failure,
    );
  }, [failure, value.length, chosen]);

  if (!encoded || encoded instanceof RangeError) {
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
