import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

export type EmptyStateProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  /** Simbolo ou ilustracao. Opcional. */
  icon?: ReactNode;
  /**
   * Aceita no e nao so texto, como o titulo do `PageHeader` e o do `Timeline`.
   * Era `string`, e por isso um numero formatado ou um `<strong>` no meio da
   * frase - "Nenhuma nota em **marco**" - nao cabia num estado vazio, cabendo
   * nas duas irmas.
   */
  title: ReactNode;
  /** Por que esta vazio. Obrigatorio: "sem dados" nao explica nada. */
  description: ReactNode;
  /** A saida. Sem ela a pessoa fica sabendo do problema e nao da solucao. */
  action?: ReactNode;
};

/**
 * Estado vazio. A descricao e obrigatoria e a acao e fortemente recomendada:
 * uma tela que so diz "nenhum resultado" transfere para a pessoa o trabalho de
 * adivinhar o que fazer em seguida.
 */
export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center font-sans",
        className,
      )}
    >
      {icon && <div className="text-fg-subtle [&_svg]:size-8">{icon}</div>}
      <p className="text-lg font-medium text-fg">{title}</p>
      <p className="max-w-sm text-base text-fg-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
