"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type PaginationProps = Omit<ComponentProps<"nav">, "onChange"> & {
  /** A pagina atual, contando de 1. */
  page: number;
  /** Quantas paginas existem. */
  pageCount: number;
  onPageChange: (pagina: number) => void;
  /** Quantos numeros aparecem em volta da pagina atual. */
  siblings?: number;
};

/**
 * Navegacao entre paginas de uma listagem.
 *
 * A lista de numeros encolhe sozinha: a primeira, a ultima, a atual e os
 * vizinhos, com reticencia no lugar do que sobra. Assim ela ocupa a mesma
 * largura com dez ou com dez mil paginas.
 *
 * No celular os numeros somem e ficam so as setas com "3 de 12". Alvo de dedo
 * em numero de 32px erra o vizinho, e a pessoa quase sempre quer a proxima,
 * nao a setima.
 */
export function Pagination({
  className,
  page,
  pageCount,
  onPageChange,
  siblings = 1,
  ...props
}: PaginationProps) {
  const paginas = montarPaginas(page, pageCount, siblings);

  return (
    <nav
      {...props}
      aria-label="Paginacao"
      className={cn(
        "flex items-center justify-between gap-2 font-sans sm:justify-start",
        className,
      )}
    >
      <Passo rotulo="Pagina anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" />
      </Passo>

      <span className="text-sm text-fg-muted sm:hidden">
        {page} de {pageCount}
      </span>

      <ol className="hidden items-center gap-1 sm:flex">
        {paginas.map((numero, indice) =>
          numero === "reticencia" ? (
            <li key={`corte-${indice}`} aria-hidden="true" className="px-1 text-fg-subtle">
              ...
            </li>
          ) : (
            <li key={numero}>
              <button
                type="button"
                aria-label={`Pagina ${numero}`}
                aria-current={numero === page ? "page" : undefined}
                onClick={() => onPageChange(numero)}
                className={cn(
                  "h-[var(--rc-control-sm)] min-w-[var(--rc-control-sm)] rounded-md px-2",
                  "text-sm text-fg-muted",
                  "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
                  "hover:bg-accent-subtle hover:text-fg",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "aria-[current=page]:bg-accent aria-[current=page]:text-accent-fg",
                  "aria-[current=page]:hover:bg-accent-hover",
                )}
              >
                {numero}
              </button>
            </li>
          ),
        )}
      </ol>

      <Passo
        rotulo="Proxima pagina"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </Passo>
    </nav>
  );
}

function Passo({ rotulo, children, ...props }: ComponentProps<"button"> & { rotulo: string }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      {...props}
      className={cn(
        "inline-flex size-[var(--rc-control-sm)] items-center justify-center rounded-md",
        "border border-border text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Primeira, ultima, a atual e os vizinhos. A reticencia so entra quando pula
 * mais de uma pagina, senao ela ocuparia o lugar de um numero que caberia.
 */
function montarPaginas(atual: number, total: number, vizinhos: number): (number | "reticencia")[] {
  if (total <= 1) return total === 1 ? [1] : [];

  const inicio = Math.max(2, atual - vizinhos);
  const fim = Math.min(total - 1, atual + vizinhos);
  const saida: (number | "reticencia")[] = [1];

  if (inicio > 2) saida.push(inicio === 3 ? 2 : "reticencia");
  for (let numero = inicio; numero <= fim; numero += 1) saida.push(numero);
  if (fim < total - 1) saida.push(fim === total - 2 ? total - 1 : "reticencia");
  if (total > 1) saida.push(total);

  return saida;
}
