import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export type AspectRatioProps = ComponentPropsWithoutRef<"div"> & {
  /** Largura dividida por altura. `16 / 9`, `1`, `4 / 3`. */
  ratio?: number;
};

export function AspectRatio({ className, ratio = 16 / 9, style, ...props }: AspectRatioProps) {
  return (
    <div
      {...props}
      style={{ aspectRatio: String(ratio), ...style }}
      className={cn(
        "relative w-full overflow-hidden",
        "[&>img]:size-full [&>img]:object-cover",
        "[&>video]:size-full [&>video]:object-cover",
        "[&>iframe]:size-full [&>iframe]:border-0",
        className,
      )}
    />
  );
}
