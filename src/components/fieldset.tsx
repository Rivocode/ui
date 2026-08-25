"use client";

import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const Fieldset = BaseFieldset.Root;

/**
 * Agrupa campos que respondem a mesma pergunta: endereco, dados do cliente,
 * pagamento.
 *
 * A legenda nao e so titulo: o leitor de tela anuncia ela junto com o rotulo de
 * cada campo dentro. "Numero" sozinho nao diz nada; "Endereco, numero" diz.
 */
export function FieldsetRoot({ className, ...props }: ComponentProps<typeof BaseFieldset.Root>) {
  return <BaseFieldset.Root {...props} className={cn("flex flex-col gap-4", className)} />;
}

export function FieldsetLegend({
  className,
  ...props
}: ComponentProps<typeof BaseFieldset.Legend>) {
  return (
    <BaseFieldset.Legend
      {...props}
      className={cn("font-display text-md leading-[var(--rc-leading-tight)] tracking-tight text-fg", className)}
    />
  );
}
