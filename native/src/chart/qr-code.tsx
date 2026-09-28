import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { tokens } from "../../tokens";
import { cn, type Slots } from "../cn";
import { encodeQr, qrLogoArea, qrPath, QR_QUIET_ZONE } from "../shared/qr";
import { useSilentMisuse } from "../silent-misuse";
import { Text } from "../text";

export type QRCodeProps = {
  /** The text the code carries: a link, a Pix copy-and-paste code, an access key. */
  value: string;
  /** The name the screen reader hears, saying what the code is for, and not the raw content. */
  label: string;
  /** The square side in px, quiet zone included. */
  size?: number;
  /**
   * Error correction, from `L` (recovers 7% of the symbol) to `H` (30%), with
   * `M` (15%) without a logo and `H` with a logo.
   */
  level?: "L" | "M" | "Q" | "H";
  /**
   * The mark in the center, which appears only with `level="H"`: the modules
   * under it are erased.
   */
  logo?: ReactNode;
  /**
   * The component's texts. `tooLong` appears in place of the code when the text
   * exceeds what version 40 holds at the chosen level.
   */
  labels?: { tooLong?: string };
  className?: string;
  /** Class per part: `logo`, the paper box that holds the mark in the center. */
  classNames?: Slots<"logo">;
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
}: QRCodeProps) {
  const tooLong = labels?.tooLong ?? "Conteúdo longo demais para um QR Code.";
  const chosen = level ?? (logo ? "H" : "M");
  const misused = Boolean(logo) && chosen !== "H";
  const withLogo = Boolean(logo) && !misused;

  useSilentMisuse(
    misused,
    `QRCode: the logo only appears with level="H", and this code is at "${chosen}". ` +
      "The modules under the logo are lost, and only level H recovers that loss with room to spare.",
  );

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

  useSilentMisuse(
    failure !== null,
    `QRCode: the ${value.length}-character text does not fit in a QR Code at level "${chosen}", ` +
      "and the component draws the notice in place of the code. Shorten the text, replace it with a link or lower the level.",
  );

  if (!encoded || encoded instanceof RangeError) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={failure ? `${label}: ${tooLong}` : label}
        style={{ width: size, height: size }}
        className={cn(
          "items-center justify-center overflow-hidden rounded-md border border-dashed border-border-strong bg-surface p-3",
          className,
        )}
      >
        {failure ? <Text className="text-center text-xs text-fg-muted">{tooLong}</Text> : null}
      </View>
    );
  }

  const matrix = encoded;
  const side = matrix.size + QR_QUIET_ZONE * 2;
  const hole = withLogo ? qrLogoArea(matrix.size) : null;
  const unit = size / side;
  const ink = tokens.code["code-ink"];
  const paper = tokens.code["code-paper"];

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ width: size, height: size, backgroundColor: paper }}
      className={cn("relative overflow-hidden rounded-md", className)}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${side} ${side}`}>
        <Rect x={0} y={0} width={side} height={side} fill={paper} />
        <Path d={qrPath(matrix, { hole: withLogo })} fill={ink} />
      </Svg>

      {hole ? (
        <View
          style={{
            left: (hole.start + QR_QUIET_ZONE + 0.5) * unit,
            top: (hole.start + QR_QUIET_ZONE + 0.5) * unit,
            width: (hole.end - hole.start - 1) * unit,
            height: (hole.end - hole.start - 1) * unit,
            backgroundColor: paper,
          }}
          className={cn(
            "absolute items-center justify-center overflow-hidden rounded-sm",
            classNames?.logo,
          )}
        >
          {logo}
        </View>
      ) : null}
    </View>
  );
}
