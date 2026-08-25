"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

export type PageHeaderProps = Omit<ComponentProps<"header">, "title"> & {
  /** O nome da tela. Sai num `<h1>`, porque cabecalho de pagina e o topo dela. */
  title: ReactNode;
  /** Uma frase sobre o que a tela mostra. */
  description?: ReactNode;
  /** A trilha ate aqui: o `Breadcrumb` da casa. */
  breadcrumb?: ReactNode;
  /** O que da para fazer daqui: botao de criar, exportar, filtrar. */
  actions?: ReactNode;
};

/**
 * O topo que toda rota reescreve um pouco diferente: trilha, titulo,
 * descricao e as acoes da tela, na mesma hierarquia em todas as paginas.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header {...props} className={cn("flex flex-col gap-3", className)}>
      {breadcrumb}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-[var(--rc-leading-tight)] tracking-display text-fg">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
