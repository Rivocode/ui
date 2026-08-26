import type { Ref } from "react";
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps as NativeTextInputProps,
  type TextProps as NativeTextProps,
} from "react-native";

import { useRivoFonts, type RivoFontRole } from "./font";

export type TextProps = NativeTextProps & {
  /**
   * Qual das tres familias do provider veste este texto: `sans` no corrido,
   * `display` no titulo, `mono` onde a largura fixa alinha coluna. O estilo de
   * quem chama continua vencendo, porque entra depois.
   */
  font?: RivoFontRole;
};

export function Text({ font = "sans", style, ...props }: TextProps) {
  const family = useRivoFonts()[font];

  return <NativeText {...props} style={family ? [{ fontFamily: family }, style] : style} />;
}

export type TextInputProps = NativeTextInputProps & {
  /** A familia do provider que veste o que se digita. */
  font?: RivoFontRole;
  ref?: Ref<NativeTextInput>;
};

export function TextInput({ font = "sans", style, ...props }: TextInputProps) {
  const family = useRivoFonts()[font];

  return <NativeTextInput {...props} style={family ? [{ fontFamily: family }, style] : style} />;
}
