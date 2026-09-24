/* Gerado de src/shared/typography.ts por bun run gen:compartilhado. Nao editar. */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingSize = "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl";

export const HEADING_SIZE_OF_LEVEL: Record<HeadingLevel, HeadingSize> = {
  1: "2xl",
  2: "xl",
  3: "lg",
  4: "md",
  5: "base",
  6: "sm",
};
