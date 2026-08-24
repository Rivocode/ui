"use client";

import { ChevronRight } from "lucide-react";
import { Fragment, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";

export type Migalha = {
  label: ReactNode;
  /** Sem `href`, a migalha e so texto. A ultima costuma ser assim. */
  href?: string;
};

export type BreadcrumbProps = Omit<ComponentProps<"nav">, "children"> & {
  items: Migalha[];
  /** Quantas migalhas cabem antes de o meio virar reticencia. */
  maxItems?: number;
};

/**
 * O caminho ate onde o usuario esta.
 *
 * Encolhe sozinho: passando de `maxItems`, o meio vira reticencia e sobram a
 * primeira e as duas ultimas. No celular sobram so as duas ultimas, porque
 * caminho comprido rola para fora da tela e ninguem le o comeco mesmo.
 *
 * A ultima migalha nao e link e leva `aria-current="page"`: ela e onde voce
 * ja esta, e link que nao leva a lugar nenhum e ruido para quem navega por
 * teclado.
 */
export function Breadcrumb({ className, items, maxItems = 4, ...props }: BreadcrumbProps) {
  const dobrado = items.length > maxItems;
  const visiveis: (Migalha | "reticencia")[] = dobrado
    ? [items[0]!, "reticencia", ...items.slice(-2)]
    : items;

  return (
    <nav {...props} aria-label="Caminho" className={cn("font-sans text-sm", className)}>
      <ol className="flex items-center gap-1.5">
        {visiveis.map((migalha, indice) => {
          const ultima = indice === visiveis.length - 1;
          // No celular so as duas ultimas ficam. A penultima e a que da
          // contexto; o resto e caminho que ninguem le no aperto.
          const somenteNoLargo = indice < visiveis.length - 2;

          return (
            <Fragment key={indice}>
              {indice > 0 && (
                <li aria-hidden="true" className={cn(somenteNoLargo && "max-sm:hidden")}>
                  <ChevronRight size={14} className="text-fg-subtle" />
                </li>
              )}

              <li className={cn("min-w-0", somenteNoLargo && "max-sm:hidden")}>
                {migalha === "reticencia" ? (
                  <span className="px-0.5 text-fg-subtle" aria-hidden="true">
                    ...
                  </span>
                ) : migalha.href && !ultima ? (
                  <a
                    href={migalha.href}
                    className={cn(
                      "truncate rounded-sm text-fg-muted",
                      "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
                      "hover:text-fg",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    {migalha.label}
                  </a>
                ) : (
                  <span aria-current={ultima ? "page" : undefined} className="truncate text-fg">
                    {migalha.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
