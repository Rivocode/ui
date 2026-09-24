import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { cn } from "../cn";
import { useRivo } from "../provider";
import { encodeQr, qrLogoArea, qrPath, QR_QUIET_ZONE } from "../shared/qr";
import { useSilentMisuse } from "../silent-misuse";

export type QRCodeProps = {
  /** O texto que o codigo carrega: link, copia e cola do Pix, chave de acesso. */
  value: string;
  /** O nome que o leitor de tela ouve, dizendo para que o codigo serve, e nao o conteudo cru. */
  label: string;
  /** O lado do quadrado em px, com a margem de silencio incluida. */
  size?: number;
  /** A correcao de erro, de `L` (recupera 7% do simbolo) a `H` (30%), com `M` (15%) sem logo e `H` com logo. */
  level?: "L" | "M" | "Q" | "H";
  /** O fundo, com a margem de silencio de 4 modulos: `surface` dentro de cartao, `bg` solto na tela. */
  background?: "bg" | "surface";
  /** A marca no centro, que so aparece com `level="H"`: os modulos embaixo dela sao apagados. */
  logo?: ReactNode;
  className?: string;
};

export function QRCode({
  value,
  label,
  size = 160,
  level,
  background = "surface",
  logo,
  className,
}: QRCodeProps) {
  const { colors } = useRivo();

  const chosen = level ?? (logo ? "H" : "M");
  const misused = Boolean(logo) && chosen !== "H";
  const withLogo = Boolean(logo) && !misused;

  useSilentMisuse(
    misused,
    `QRCode: o logo só aparece com level="H", e este código está em "${chosen}". ` +
      "Os módulos embaixo do logo se perdem, e só o nível H recupera essa perda com folga.",
  );

  const matrix = useMemo(() => (value ? encodeQr(value, chosen) : null), [value, chosen]);
  const side = (matrix?.size ?? 21) + QR_QUIET_ZONE * 2;
  const hole = matrix && withLogo ? qrLogoArea(matrix.size) : null;
  const unit = size / side;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ width: size, height: size }}
      className={cn("relative", className)}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${side} ${side}`}>
        <Rect x={0} y={0} width={side} height={side} fill={colors[background]} />
        {matrix ? <Path d={qrPath(matrix, { hole: withLogo })} fill={colors.fg} /> : null}
      </Svg>

      {hole ? (
        <View
          style={{
            left: (hole.start + QR_QUIET_ZONE + 0.5) * unit,
            top: (hole.start + QR_QUIET_ZONE + 0.5) * unit,
            width: (hole.end - hole.start - 1) * unit,
            height: (hole.end - hole.start - 1) * unit,
            backgroundColor: colors[background],
          }}
          className="absolute items-center justify-center overflow-hidden rounded-sm"
        >
          {logo}
        </View>
      ) : null}
    </View>
  );
}
