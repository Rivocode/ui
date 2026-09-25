import type { Ref } from "react";
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps as NativeTextInputProps,
  type TextProps as NativeTextProps,
} from "react-native";

import { cn } from "./cn";
import { useRivoFonts, warnFamilyClass, type RivoFontRole } from "./font";

export type TextSize = "xs" | "sm" | "base" | "md" | "lg";

export type TextTone =
  | "neutral"
  | "muted"
  | "subtle"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type TextWeight = "regular" | "medium" | "semibold" | "bold";

const SIZE: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  md: "text-md",
  lg: "text-lg",
};

const TONE: Record<TextTone, string> = {
  neutral: "text-fg",
  muted: "text-fg-muted",
  subtle: "text-fg-subtle",
  accent: "text-accent-text",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
  info: "text-info-text",
};

const WEIGHT: Record<TextWeight, string> = {
  regular: "font-rc-regular",
  medium: "font-rc-medium",
  semibold: "font-rc-strong",
  bold: "font-rc-bold",
};

export type TextProps = NativeTextProps & {
  /**
   * Qual das tres familias do provider veste este texto: `sans` no corrido,
   * `display` no titulo, `mono` onde a largura fixa alinha coluna. O estilo de
   * quem chama continua vencendo, porque entra depois.
   */
  font?: RivoFontRole;
  /**
   * O corpo na escala da casa, de `xs` (12px) a `lg` (18px); acima disso e o
   * `Heading`. Sem ele, o `Text` dentro de outro `Text` herda o corpo do de
   * fora, e o de fora fica no padrao do aparelho.
   */
  size?: TextSize;
  /**
   * O papel de cor, os mesmos oito do web. Sem ele, o `Text` aninhado herda a
   * cor do de fora; no topo, passe o tom, porque o React Native nao herda cor
   * de `View`.
   */
  tone?: TextTone;
  /**
   * O peso da letra, lido dos tokens de peso do tema: `regular` e
   * `--rc-weight-regular`, `medium` e `--rc-weight-medium`, `semibold` e
   * `--rc-weight-strong` e `bold` e `--rc-weight-bold`. Sem ele herda, como o
   * corpo e a cor.
   */
  weight?: TextWeight;
  /** Corta em uma linha com reticencias no fim. */
  truncate?: boolean;
  /** Corta depois de tantas linhas, de 1 a 6. Vence o `truncate` e o `numberOfLines`. */
  lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;
};

export function Text({
  font = "sans",
  size,
  tone,
  weight,
  truncate,
  lineClamp,
  numberOfLines,
  className,
  style,
  ...props
}: TextProps) {
  const family = useRivoFonts()[font];
  const dressed = size || tone || weight;

  if (__DEV__) warnFamilyClass(className);

  return (
    <NativeText
      {...props}
      numberOfLines={lineClamp ?? (truncate ? 1 : numberOfLines)}
      className={
        dressed
          ? cn(size && SIZE[size], tone && TONE[tone], weight && WEIGHT[weight], className)
          : className
      }
      style={family ? [{ fontFamily: family }, style] : style}
    />
  );
}

export type TextInputProps = NativeTextInputProps & {
  /** A familia do provider que veste o que se digita. */
  font?: RivoFontRole;
  ref?: Ref<NativeTextInput>;
};

export function TextInput({ font = "sans", style, ...props }: TextInputProps) {
  const family = useRivoFonts()[font];

  if (__DEV__) warnFamilyClass(props.className);

  return <NativeTextInput {...props} style={family ? [{ fontFamily: family }, style] : style} />;
}
