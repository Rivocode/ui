"use client";

import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactElement } from "react";

import { cn } from "../lib/cn";

export const itemVariants = cva(
  cn(
    "flex w-full items-center gap-3 text-left font-sans text-fg",
    "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
  ),
  {
    variants: {
      variant: {
        /** Linha solta, para lista dentro de card ou de folha. */
        plain: "px-1 py-2",
        /** Linha com moldura propria, para grade de escolhas. */
        outline: "rounded-lg border border-border bg-surface p-3",
      },
      interactive: {
        true: cn(
          "cursor-pointer outline-none hover:bg-accent-subtle",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus-visible:ring-offset-bg",
        ),
        false: "",
      },
    },
    defaultVariants: { variant: "plain", interactive: false },
  },
);

export type ItemProps = ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & {
    /**
     * Troca o elemento renderizado mantendo a aparencia:
     * `<Item render={<a href="..." />}>`. E o par obrigatorio do
     * `interactive`, porque cor de passagem em `div` nao vira alvo de
     * teclado - o JSDoc ja mandava usar os dois juntos e a prop nao existia.
     */
    render?: ReactElement;
  };

/**
 * A linha de lista: alguma coisa a esquerda, texto no meio, acao a direita.
 *
 * Existe porque metade de qualquer tela e isso, e sem uma peca com nome cada
 * projeto reinventa com div solta, cada um com um respiro diferente. Nao e um
 * componente de dado, e de arranjo: quem preenche decide o que vai em cada
 * lugar.
 *
 * Com `interactive`, ganha o estado de foco e de passagem. Use junto com
 * `render` de link ou botao para virar clicavel de verdade, porque cor de
 * passagem em div nao vira alvo de teclado.
 */
export function Item({ className, variant, interactive, render, ...props }: ItemProps) {
  return useRender({
    render: render ?? <div />,
    props: {
      ...props,
      className: cn(itemVariants({ variant, interactive }), className),
    },
  });
}

/** O canto de imagem, icone ou avatar. */
export function ItemMedia({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("flex shrink-0 items-center text-fg-muted", className)} />;
}

/** O miolo de texto. Encolhe antes dos cantos, para o titulo cortar com "..." */
export function ItemContent({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)} />;
}

export function ItemTitle({ className, ...props }: ComponentProps<"p">) {
  return <p {...props} className={cn("truncate text-base text-fg", className)} />;
}

export function ItemDescription({ className, ...props }: ComponentProps<"p">) {
  return <p {...props} className={cn("truncate text-sm text-fg-muted", className)} />;
}

/** O canto de acao. */
export function ItemActions({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("flex shrink-0 items-center gap-2", className)} />;
}
