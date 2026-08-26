"use client";

import { ChevronRight } from "lucide-react";
import { Fragment, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";

export type Crumb = {
  label: ReactNode;
  /** Sem `href`, a migalha e so texto. A ultima costuma ser assim. */
  href?: string;
};

export type BreadcrumbProps = Omit<ComponentProps<"nav">, "children"> & {
  items: Crumb[];
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
  const folded = items.length > maxItems;
  const visiveis: (Crumb | "reticencia")[] = folded
    ? [items[0]!, "reticencia", ...items.slice(-2)]
    : items;

  return (
    <nav {...props} aria-label="Caminho" className={cn("font-sans text-sm", className)}>
      <ol className="flex items-center gap-1.5">
        {visiveis.map((crumb, index) => {
          const isLast = index === visiveis.length - 1;
          // A migalha quase sempre carrega nome de registro vindo do servidor,
          // e o `truncate` corta sem deixar saida para quem enxerga. O `title`
          // devolve o texto inteiro ao mouse; nao vai `aria-label` junto,
          // porque o texto continua no DOM e o leitor de tela ja o le - o
          // atributo so faria ele ler duas vezes. Fica de fora quando o rotulo
          // e ReactNode: `title` e string, e nao ha o que colocar nele.
          const fullLabel =
            crumb !== "reticencia" && typeof crumb.label === "string" ? crumb.label : undefined;
          // No celular so as duas ultimas ficam. A penultima e a que da
          // contexto; o resto e caminho que ninguem le no aperto.
          const wideOnly = index < visiveis.length - 2;

          return (
            <Fragment key={index}>
              {index > 0 && (
                <li aria-hidden="true" className={cn(wideOnly && "max-sm:hidden")}>
                  <ChevronRight size={14} className="text-fg-subtle" />
                </li>
              )}

              <li className={cn("min-w-0", wideOnly && "max-sm:hidden")}>
                {crumb === "reticencia" ? (
                  <span className="px-0.5 text-fg-subtle" aria-hidden="true">
                    ...
                  </span>
                ) : crumb.href && !isLast ? (
                  <a
                    href={crumb.href}
                    title={fullLabel}
                    className={cn(
                      "truncate rounded-sm text-fg-muted",
                      // A migalha mede 58x18: a largura passa, a altura de uma
                      // linha de texto pequeno nao chega aos 24 da WCAG 2.5.8.
                      // O pseudo-elemento estica so na vertical - crescer
                      // tambem na horizontal poria o halo por cima da migalha
                      // seguinte, que fica a seis pixels de distancia, e o
                      // clique cairia na migalha errada. O `truncate` traz um
                      // overflow-hidden que recortaria esse halo, mas ele nao
                      // vale em elemento inline - se algum dia a migalha virar
                      // inline-block, o alvo volta a 18 sem aviso.
                      "relative after:absolute after:inset-x-0 after:-inset-y-1.5",
                      "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
                      "hover:text-fg",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    title={fullLabel}
                    className="truncate text-fg"
                  >
                    {crumb.label}
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
