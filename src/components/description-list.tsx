"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

export type DescriptionListProps = ComponentProps<"dl">;

/**
 * Pares de rotulo e valor, na marcacao que ja existe para isso: `<dl>`.
 *
 * E a folha de detalhes de toda listagem - CNPJ, emissao, vencimento, valor -
 * que cada tela montava com um par de `<span>` num flex. Aqui o leitor de
 * tela ouve "termo, definicao" em vez de dois textos soltos.
 */
export function DescriptionList({ className, ...props }: DescriptionListProps) {
  return <dl {...props} className={cn("divide-y divide-border", className)} />;
}

export type DescriptionItemProps = Omit<ComponentProps<"div">, "children"> & {
  label: ReactNode;
  /** O valor. Texto, `Badge`, dinheiro do `currencyShort` - o que a linha pedir. */
  children: ReactNode;
};

export function DescriptionItem({ label, children, className, ...props }: DescriptionItemProps) {
  return (
    <div {...props} className={cn("flex items-center justify-between gap-4 py-2.5", className)}>
      <dt className="shrink-0 text-sm text-fg-muted">{label}</dt>
      {/* min-w-0 e text-right: valor comprido quebra do lado dele, sem
          empurrar o rotulo. */}
      <dd className="min-w-0 text-right text-sm text-fg">{children}</dd>
    </div>
  );
}
