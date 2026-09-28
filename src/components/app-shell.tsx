"use client";

import { useId, useRef, type MouseEvent, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { Container, type ContainerProps } from "./container";
import { Sidebar, SidebarProvider, SidebarTrigger, type SidebarProviderProps } from "./sidebar";

export type AppShellLabels = {
  skipLink: string;
  navigation: string;
  aside: string;
};

const LABELS: AppShellLabels = {
  skipLink: "Pular para o conteúdo",
  navigation: "Navegação principal",
  aside: "Informações complementares",
};

export type AppShellProps = Omit<SidebarProviderProps, "children"> & {
  /** A pagina que esta aberta. Vai dentro do `<main>`, que e o alvo do link de pular. */
  children: ReactNode;
  /**
   * O que mora no cabecalho fixo: marca, busca, sininho, menu da conta. O
   * botao que abre e fecha a barra lateral entra sozinho na frente, quando ha
   * `sidebar`. Sai num `<header>`, que o leitor de tela anuncia como banner.
   */
  header?: ReactNode;
  /**
   * O miolo da barra lateral: `SidebarHeader`, `SidebarContent`,
   * `SidebarFooter` e o resto da familia do `Sidebar`. A casca embrulha num
   * `<nav>` e no `Sidebar` da casa, que encolhe na mesa e vira folha no celular.
   */
  sidebar?: ReactNode;
  /** De que lado mora a barra lateral. */
  sidebarSide?: "left" | "right";
  /**
   * Coluna ao lado do conteudo: ajuda, resumo, atividade recente. Sai num
   * `<aside>`, a direita a partir de `lg` e embaixo do conteudo antes disso.
   */
  aside?: ReactNode;
  /** O rodape da aplicacao, embaixo do conteudo. Sai num `<footer>`. */
  footer?: ReactNode;
  /**
   * Poe o conteudo num `Container` da casa, com a largura maxima e o respiro
   * lateral dele e o respiro de cima e de baixo do painel. `true` usa o `lg`;
   * um tamanho escolhe outro. Sem ele, o conteudo encosta nas bordas.
   */
  container?: boolean | ContainerProps["size"];
  /**
   * Ocupa a caixa do pai em vez da janela: a barra lateral e a coluna de
   * conteudo passam a rolar por dentro. Para shell dentro de um painel, de um
   * `Splitter` ou de um exemplo de documentacao.
   */
  contained?: boolean;
  /** O `id` do `<main>`, alvo do link de pular. Sem ele, um gerado. */
  mainId?: string;
  /** Os textos do link de pular e os nomes das regioes que o leitor de tela anuncia. */
  labels?: Partial<AppShellLabels>;
  classNames?: Slots<
    "skipLink" | "sidebar" | "column" | "header" | "body" | "main" | "aside" | "footer"
  >;
};

export function AppShell({
  children,
  header,
  sidebar,
  sidebarSide = "left",
  aside,
  footer,
  container,
  contained = false,
  mainId,
  labels,
  className,
  classNames,
  ...props
}: AppShellProps) {
  const text = { ...LABELS, ...labels };
  const generated = useId();
  const target = mainId ?? `rc-main-${generated.replace(/:/g, "")}`;
  const main = useRef<HTMLElement>(null);
  const size = container === true ? "lg" : container || undefined;

  function skip(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    main.current?.focus();
    main.current?.scrollIntoView?.({ block: "start" });
  }

  return (
    <SidebarProvider
      {...props}
      className={cn("relative", contained && "h-full min-h-0 overflow-hidden", className)}
    >
      <a
        href={`#${target}`}
        onClick={skip}
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2",
          "focus:z-[var(--rc-z-popover)] focus:rounded-md focus:bg-surface-raised focus:px-3",
          "focus:py-2 focus:font-sans focus:text-sm focus:text-fg focus:shadow-2",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          classNames?.skipLink,
        )}
      >
        {text.skipLink}
      </a>

      {sidebar !== undefined && (
        <Sidebar
          side={sidebarSide}
          title={text.navigation}
          role="none"
          className={cn(contained && "h-full", classNames?.sidebar)}
        >
          <nav aria-label={text.navigation} className="flex min-h-0 flex-1 flex-col gap-2">
            {sidebar}
          </nav>
        </Sidebar>
      )}

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          contained && "min-h-0 overflow-y-auto",
          classNames?.column,
        )}
      >
        {(header !== undefined || sidebar !== undefined) && (
          <header
            className={cn(
              "sticky top-0 z-[var(--rc-z-sticky)] flex shrink-0 items-center gap-2",
              "min-h-[calc(var(--rc-control-md)+1rem)] border-b border-border bg-bg py-2",
              "px-[var(--rc-pad-panel-sm)] sm:px-[var(--rc-pad-panel)]",
              classNames?.header,
            )}
          >
            {sidebar !== undefined && <SidebarTrigger className="-ml-2 shrink-0" />}
            <div className="flex min-w-0 flex-1 items-center gap-3">{header}</div>
          </header>
        )}

        <div className={cn("flex flex-1 flex-col lg:flex-row", classNames?.body)}>
          <main
            ref={main}
            id={target}
            tabIndex={-1}
            className={cn(
              "min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              size && "py-[var(--rc-pad-panel)]",
              classNames?.main,
            )}
          >
            {size ? <Container size={size}>{children}</Container> : children}
          </main>

          {aside !== undefined && (
            <aside
              aria-label={text.aside}
              className={cn(
                "shrink-0 border-t border-border bg-surface p-[var(--rc-pad-panel)]",
                "lg:w-[var(--rc-sidebar)] lg:border-t-0 lg:border-l",
                classNames?.aside,
              )}
            >
              {aside}
            </aside>
          )}
        </div>

        {footer !== undefined && (
          <footer
            className={cn(
              "shrink-0 border-t border-border py-4 font-sans text-sm text-fg-muted",
              "px-[var(--rc-pad-panel-sm)] sm:px-[var(--rc-pad-panel)]",
              classNames?.footer,
            )}
          >
            {footer}
          </footer>
        )}
      </div>
    </SidebarProvider>
  );
}
