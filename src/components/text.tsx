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
   * O corpo na escala da casa, de `xs` (12px) a `lg` (18px); acima disso e
   * titulo, e o titulo e o `Heading`. Sem ele o texto herda o corpo de quem o
   * cerca, que e o que um trecho dentro de outra frase precisa.
   */
  size?: TextSize;
  /**
   * O papel de cor: `neutral` e o texto corrido, `muted` o secundario, `subtle`
   * a legenda, e os tons de estado sao os `-text`, os que se leem sobre o fundo
   * da pagina. Sem ele o texto herda a cor de quem o cerca.
   */
  tone?: TextTone;
  /**
   * O peso da letra, lido dos tokens de peso do tema: `regular` e
   * `--rc-weight-regular`, `medium` e `--rc-weight-medium`, `semibold` e
   * `--rc-weight-strong` e `bold` e `--rc-weight-bold`. Sem ele herda, como o
   * corpo e a cor.
   */
  weight?: TextWeight;
  /**
   * Corta em uma linha com reticencias. A frase inteira continua no DOM, entao
   * quem ouve a tela ouve tudo; quem ve precisa de um `title` ou de um `Tooltip`.
   */
  truncate?: boolean;
  /**
   * Corta depois de tantas linhas, de 1 a 6, com reticencias na ultima. Vence o
   * `truncate` quando os dois vem juntos.
   */
  lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Troca o elemento mantendo a aparencia: `<Text render={<span />}>` para o
   * trecho dentro de uma frase, `<Text render={<div />}>` para o bloco que
   * contem outro bloco. Sem ele sai um `<p>`.
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
