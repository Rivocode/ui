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
   * Which of the provider's three families styles this text: `sans` for running
   * text, `display` for headings, `mono` where fixed width aligns a column. The
   * caller's style still wins, because it comes after.
   */
  font?: RivoFontRole;
  /**
   * The body size on the house scale, from `xs` (12px) to `lg` (18px); above
   * that is `Heading`. Without it, a `Text` inside another `Text` inherits the
   * outer one's size, and the outer one stays at the device default.
   */
  size?: TextSize;
  /**
   * The color role, the same eight as the web. Without it, a nested `Text`
   * inherits the outer one's color; at the top, pass the tone, because React
   * Native does not inherit color from `View`.
   */
  tone?: TextTone;
  /**
   * The font weight, read from the theme weight tokens: `regular` is
   * `--rc-weight-regular`, `medium` is `--rc-weight-medium`, `semibold` is
   * `--rc-weight-strong` and `bold` is `--rc-weight-bold`. Without it, it
   * inherits, like size and color.
   */
  weight?: TextWeight;
  /** Truncates to one line with an ellipsis at the end. */
  truncate?: boolean;
  /** Truncates after that many lines, from 1 to 6. Wins over `truncate` and `numberOfLines`. */
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
  /** The provider family that styles what is typed. */
  font?: RivoFontRole;
  ref?: Ref<NativeTextInput>;
};

export function TextInput({ font = "sans", style, ...props }: TextInputProps) {
  const family = useRivoFonts()[font];

  if (__DEV__) warnFamilyClass(props.className);

  return <NativeTextInput {...props} style={family ? [{ fontFamily: family }, style] : style} />;
}
