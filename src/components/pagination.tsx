"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type PaginationProps = Omit<ComponentProps<"nav">, "onChange"> & {
  /** A pagina atual, contando de 1. */
  page: number;
  /** Quantas paginas existem. */
  pageCount: number;
  /**
   * Chamado com a pagina nova, contando de 1, pelas setas e pelos numeros. A
   * peca nao guarda a pagina: quem troca o `page` e quem chamou.
   */
  onPageChange: (page: number) => void;
  /** Quantos numeros aparecem em volta da pagina atual. */
  siblings?: number;
  /**
   * Os textos da peca, para trocar o idioma: `navigation` e o nome da regiao,
   * `previous` e `next` os das setas, `page` o de cada numero e `position` a
   * contagem que aparece no lugar dos numeros em tela estreita. Passe so os que
   * mudam.
   */
  labels?: Partial<PaginationLabels>;
};

export type PaginationLabels = {
  navigation: string;
  previous: string;
  next: string;
  page: (page: number) => string;
  position: (page: number, pageCount: number) => string;
};

const LABELS: PaginationLabels = {
  navigation: "Paginação",
  previous: "Página anterior",
  next: "Próxima página",
  page: (page) => `Página ${page}`,
  position: (page, pageCount) => `${page} de ${pageCount}`,
};

export function Pagination({
  className,
  page,
  pageCount,
  onPageChange,
  siblings = 1,
  labels: labelsProp,
  ...props
}: PaginationProps) {
  const labels = { ...LABELS, ...labelsProp };
  const pages = buildPages(page, pageCount, siblings);

  return (
    <nav
      {...props}
      aria-label={labels.navigation}
      className={cn(
        "flex items-center justify-between gap-2 font-sans sm:justify-start",
        className,
      )}
    >
      <Step label={labels.previous} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" />
      </Step>

      <span className="text-sm text-fg-muted sm:hidden">{labels.position(page, pageCount)}</span>

      <ol className="hidden items-center gap-1 sm:flex">
        {pages.map((number, index) =>
          number === "reticencia" ? (
            <li key={`corte-${index}`} aria-hidden="true" className="px-1 text-fg-subtle">
              ...
            </li>
          ) : (
            <li key={number}>
              <button
                type="button"
                aria-label={labels.page(number)}
                aria-current={number === page ? "page" : undefined}
                onClick={() => onPageChange(number)}
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
                {number}
              </button>
            </li>
          ),
        )}
      </ol>

      <Step label={labels.next} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        <ChevronRight size={16} aria-hidden="true" />
      </Step>
    </nav>
  );
}

function Step({ label, children, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
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

function buildPages(current: number, total: number, siblings: number): (number | "reticencia")[] {
  if (total <= 1) return total === 1 ? [1] : [];

  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);
  const output: (number | "reticencia")[] = [1];

  if (start > 2) output.push(start === 3 ? 2 : "reticencia");
  for (let number = start; number <= end; number += 1) output.push(number);
  if (end < total - 1) output.push(end === total - 2 ? total - 1 : "reticencia");
  if (total > 1) output.push(total);

  return output;
}
