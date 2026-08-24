"use client";

import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type InputGroupProps = ComponentProps<"div">;

/**
 * Moldura que encosta texto ou botao no campo: `R$` antes, `,00` depois,
 * lupa de busca, botao de copiar.
 *
 * A borda e o foco passam para a moldura, e o campo de dentro fica sem os
 * dois. Sem isso aparecem duas bordas encaixadas e dois aneis de foco, e o
 * conjunto deixa de parecer um campo so.
 */
export function InputGroup({ className, ...props }: InputGroupProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-md border border-border bg-surface",
        "h-[var(--rc-control-md)] font-sans text-base text-fg",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "focus-within:ring-offset-bg",
        "has-[[data-invalid]]:border-danger has-[[data-disabled]]:opacity-60",
        // O campo de dentro entrega borda, fundo e anel para a moldura.
        "[&_input]:h-full [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent",
        "[&_input]:px-[var(--rc-control-pad-md)] [&_input]:outline-none",
        "[&_input]:focus-visible:ring-0 [&_input]:focus-visible:ring-offset-0",
        className,
      )}
    />
  );
}

const ENCOSTO = cn(
  "flex shrink-0 items-center gap-2 px-[var(--rc-control-pad-md)]",
  "text-base text-fg-subtle select-none",
);

/** O que fica antes do campo. Texto curto, sigla ou icone. */
export function InputPrefix({ className, ...props }: ComponentProps<"span">) {
  return <span {...props} className={cn(ENCOSTO, "border-r border-border", className)} />;
}

/** O que fica depois do campo. */
export function InputSuffix({ className, ...props }: ComponentProps<"span">) {
  return <span {...props} className={cn(ENCOSTO, "border-l border-border", className)} />;
}

/**
 * Botao colado no campo, sem borda propria e ocupando a altura toda. Serve
 * para buscar, copiar, mostrar a senha.
 */
export function InputAction({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex shrink-0 items-center justify-center gap-2 border-l border-border px-3",
        "text-fg-muted transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:-outline-offset-2",
        "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent",
        className,
      )}
    />
  );
}
