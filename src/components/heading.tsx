import type { ComponentPropsWithoutRef, Ref } from "react";

import { cn } from "../lib/cn";
import { HEADING_SIZE_OF_LEVEL, type HeadingLevel, type HeadingSize } from "../shared/typography";

export type { HeadingLevel, HeadingSize };

const SIZE: Record<HeadingSize, string> = {
  sm: "text-sm tracking-tight",
  base: "text-base tracking-tight",
  md: "text-md tracking-tight",
  lg: "text-lg tracking-tight",
  xl: "text-xl tracking-display",
  "2xl": "text-2xl tracking-display",
  "3xl": "text-3xl tracking-display",
};

const TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export type HeadingProps = ComponentPropsWithoutRef<"h2"> & {
  /**
   * The heading's place in the page outline, from 1 to 6: decides the tag, from `h1` to
   * `h6`, and is what the screen reader uses to jump from section to section. No
   * default on purpose, because the page knows the level, not the piece.
   */
  level: HeadingLevel;
  /**
   * The size on the house scale, from `sm` (13px) to `3xl` (30px). Without it the
   * size follows the level: `h1` is `2xl`, `h2` is `xl`, `h3` is `lg`, `h4` is
   * `md`, `h5` is `base` and `h6` is `sm`. Change the size, and never the level, when
   * the heading needs to look bigger or smaller.
   */
  size?: HeadingSize;
  /** Truncates to one line with an ellipsis, for a heading inside a narrow column. */
  truncate?: boolean;
  ref?: Ref<HTMLHeadingElement>;
};

export function Heading({ level, size, truncate, className, ...props }: HeadingProps) {
  const Tag = TAG[level] ?? "h2";

  return (
    <Tag
      {...props}
      className={cn(
        "font-display font-rc-display leading-tight text-fg",
        SIZE[size ?? HEADING_SIZE_OF_LEVEL[level] ?? "xl"],
        truncate && "truncate",
        className,
      )}
    />
  );
}
