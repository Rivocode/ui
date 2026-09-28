import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";

export type AspectRatioProps = {
  /** Largura sobre altura: `16 / 9`, `1`, `4 / 3`. */
  ratio: number;
  children: ReactNode;
  className?: string;
};

export function AspectRatio({ ratio, children, className }: AspectRatioProps) {
  return (
    <View
      style={{ aspectRatio: ratio }}
      className={cn("w-full overflow-hidden rounded-md", className)}
    >
      {children}
    </View>
  );
}
