import { useRender } from "@base-ui/react/use-render";
import type { ComponentPropsWithoutRef, ReactElement, Ref } from "react";

import { cn } from "../lib/cn";

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

const CLAMP = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
} as const;

export type TextProps = ComponentPropsWithoutRef<"p"> & {
  /**
   * The size on the house scale, from `xs` (12px) to `lg` (18px); above that it is a
   * heading, and the heading is `Heading`. Without it the text inherits the size of what
   * surrounds it, which is what a stretch inside another sentence needs.
   */
  size?: TextSize;
  /**
   * The color role: `neutral` is running text, `muted` the secondary, `subtle`
   * the caption, and the status tones are the `-text` ones, those that read over the page
   * background. Without it the text inherits the color of what surrounds it.
   */
  tone?: TextTone;
  /**
   * The font weight, read from the theme's weight tokens: `regular` is
   * `--rc-weight-regular`, `medium` is `--rc-weight-medium`, `semibold` is
   * `--rc-weight-strong` and `bold` is `--rc-weight-bold`. Without it inherits, like the
   * size and the color.
   */
  weight?: TextWeight;
  /**
   * Truncates to one line with an ellipsis. The whole sentence stays in the DOM, so
   * whoever listens to the screen hears everything; whoever sees it needs a `title` or a `Tooltip`.
   */
  truncate?: boolean;
  /**
   * Truncates after so many lines, from 1 to 6, with an ellipsis on the last. Wins over
   * `truncate` when both come together.
   */
  lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Swaps the element while keeping the look: `<Text render={<span />}>` for a
   * stretch inside a sentence, `<Text render={<div />}>` for a block that
   * contains another block. Without it a `<p>` is rendered.
   */
  render?: ReactElement;
  ref?: Ref<HTMLParagraphElement>;
};

export function Text({
  size,
  tone,
  weight,
  truncate,
  lineClamp,
  render,
  className,
  ...props
}: TextProps) {
  const clamp = lineClamp ? CLAMP[lineClamp] : undefined;

  return useRender({
    render: render ?? <p />,
    props: {
      ...props,
      className: cn(
        size && SIZE[size],
        tone && TONE[tone],
        weight && WEIGHT[weight],
        clamp ?? (truncate && "truncate"),
        className,
      ),
    },
  });
}
