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
   * O lugar do titulo no esboco da pagina, de 1 a 6: decide a tag, de `h1` a
   * `h6`, e e o que o leitor de tela usa para saltar de secao em secao. Sem
   * padrao de proposito, porque quem sabe o nivel e a pagina, e nao a peca.
   */
  level: HeadingLevel;
  /**
   * O corpo na escala da casa, de `sm` (13px) a `3xl` (30px). Sem ele o
   * tamanho acompanha o nivel: `h1` e `2xl`, `h2` e `xl`, `h3` e `lg`, `h4` e
   * `md`, `h5` e `base` e `h6` e `sm`. Troque o tamanho, e nunca o nivel, quando
   * o titulo precisar parecer maior ou menor.
   */
  size?: HeadingSize;
  /** Corta em uma linha com reticencias, para titulo dentro de coluna estreita. */
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
