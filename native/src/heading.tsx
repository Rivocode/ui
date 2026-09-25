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

export type HeadingProps = Omit<NativeTextProps, "accessibilityRole" | "role"> & {
  /**
   * O lugar do titulo no esboco da tela, de 1 a 6. O leitor de tela do
   * celular anuncia "cabecalho" sem nivel, entao aqui ele decide so o tamanho
   * quando `size` nao vem - e fica escrito igual ao web, para a tela portar
   * sem reescrever.
   */
  level: HeadingLevel;
  /**
   * O corpo na escala da casa, de `sm` (13px) a `3xl` (30px). Sem ele o
   * tamanho acompanha o nivel: `h1` e `2xl`, `h2` e `xl`, `h3` e `lg`, `h4` e
   * `md`, `h5` e `base` e `h6` e `sm`.
   */
  size?: HeadingSize;
  /** Corta em uma linha com reticencias no fim. */
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
