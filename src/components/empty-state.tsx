import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

export type EmptyStateProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  /**
   * Simbolo ou ilustracao. Opcional.
   *
   * Sai `aria-hidden`, como o do `Alert`: o titulo e a descricao ao lado ja
   * dizem o que ele desenha. Vale para `<img>` e para SVG proprio tambem, e
   * nao so para o icone do lucide, que se protege sozinho.
   */
  icon?: ReactNode;
  /**
   * Desenho maior que o icone, para o vazio de primeira vez: a tela inicial
   * sem nada ainda, o passo de onboarding. Filtro sem resultado e lista que
   * esvaziou pedem `icon`, e nao isto.
   *
   * O tamanho e de quem desenha: o `icon` forca 32px em todo SVG, e aqui nada
   * e forcado. Sai `aria-hidden`, como o `icon`, e em `text-fg-subtle`: pinte
   * com `currentColor` ou com classe de token (`fill-accent-subtle`), nunca
   * com cor literal, senao o desenho nao acompanha o tema do cliente. Quando
   * vem, toma o lugar do `icon`.
   */
  illustration?: ReactNode;
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

export function EmptyState({
  className,
  icon,
  illustration,
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
        "animate-enter",
        className,
      )}
    >
      {illustration ? (
        <div aria-hidden="true" className="text-fg-subtle">
          {illustration}
        </div>
      ) : (
        icon && (
          <div aria-hidden="true" className="text-fg-subtle [&_svg]:size-8">
            {icon}
          </div>
        )
      )}
      <p className="text-lg font-medium text-fg">{title}</p>
      <p className="max-w-sm text-base text-fg-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
