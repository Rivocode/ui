import type { TextProps as NativeTextProps } from "react-native";

import { cn } from "./cn";
import { HEADING_SIZE_OF_LEVEL, type HeadingLevel, type HeadingSize } from "./shared/typography";
import { Text } from "./text";

export type { HeadingLevel, HeadingSize };

const SIZE: Record<HeadingSize, string> = {
  sm: "text-sm",
  base: "text-base",
  md: "text-md",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

export type HeadingProps = Omit<NativeTextProps, "accessibilityRole" | "role" | "className"> & {
  /**
   * The heading's place in the screen outline, from 1 to 6. The phone screen
   * reader announces "heading" with no level, so here it decides only the size
   * when `size` is absent - and it is written the same as on the web, so the
   * screen ports without rewriting.
   */
  level: HeadingLevel;
  /**
   * The body size on the house scale, from `sm` (13px) to `3xl` (30px). Without
   * it the size follows the level: `h1` is `2xl`, `h2` is `xl`, `h3` is `lg`,
   * `h4` is `md`, `h5` is `base` and `h6` is `sm`.
   */
  size?: HeadingSize;
  /** Truncates to one line with an ellipsis at the end. */
  truncate?: boolean;
  className?: string;
};

export function Heading({ level, size, truncate, className, ...props }: HeadingProps) {
  return (
    <Text
      {...props}
      accessibilityRole="header"
      font="display"
      truncate={truncate}
      className={cn(
        "font-rc-display text-fg",
        SIZE[size ?? HEADING_SIZE_OF_LEVEL[level] ?? "xl"],
        className,
      )}
    />
  );
}
