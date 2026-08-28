"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export type PageHeaderProps = Omit<ComponentProps<"header">, "title"> & {
  /** O nome da tela. Sai num `<h1>` por padrao, porque cabecalho de pagina e o topo dela. */
  title: ReactNode;
  /**
   * Em que nivel o titulo sai. Padrao `h1`: cabecalho de pagina e o topo dela.
   *
   * Baixe para `h2` quando o `PageHeader` nao e o topo - uma aplicacao que ja
   * tem `h1` no shell, um painel dentro de uma regiao, um exemplo dentro de
   * uma pagina de documentacao. Dois `h1` na mesma pagina nao dao erro em
   * lugar nenhum: quem navega por titulo de nivel 1 e que cai no lugar errado.
   */
  titleAs?: "h1" | "h2" | "h3";
  /** Uma frase sobre o que a tela mostra. */
  description?: ReactNode;
  /** A trilha ate aqui: o `Breadcrumb` da casa. */
  breadcrumb?: ReactNode;
  /** O que da para fazer daqui: botao de criar, exportar, filtrar. */
  actions?: ReactNode;
  /**
   * Classe por parte: `row`, `heading`, `title`, `description`, `actions`.
   *
   * A caixa de `actions` nasce `shrink-0`, para o botao nao ser espremido pelo
   * titulo. Quando o que vai ali e largo - um campo de busca, uma barra de
   * filtros -, e por aqui que ela ganha `min-w-0 shrink`, senao ela empurra a
   * linha inteira para fora da pagina.
   */
  classNames?: Slots<"row" | "heading" | "title" | "description" | "actions">;
};

export function PageHeader({
  title,
  titleAs: Title = "h1",
  description,
  breadcrumb,
  actions,
  className,
  classNames,
  ...props
}: PageHeaderProps) {
  return (
    <header {...props} className={cn("flex flex-col gap-3", className)}>
      {breadcrumb}

      <div
        className={cn("flex flex-wrap items-start justify-between gap-3", classNames?.row)}
      >
        <div className={cn("min-w-0", classNames?.heading)}>
          <Title
            className={cn(
              "font-display text-2xl leading-[var(--rc-leading-tight)] tracking-display text-fg",
              classNames?.title,
            )}
          >
            {title}
          </Title>
          {description && (
            <p className={cn("mt-1 text-sm text-fg-muted", classNames?.description)}>
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className={cn("flex shrink-0 items-center gap-2", classNames?.actions)}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
