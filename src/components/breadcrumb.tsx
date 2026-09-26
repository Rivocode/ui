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
  /**
   * Quantas migalhas cabem antes de o meio virar reticencia: dobrada, a trilha
   * mostra a primeira e as `max - 1` ultimas, e nunca menos que a ultima.
   *
   * `max` e como o resto do catalogo chama o teto de uma lista - `Indicator`,
   * `AvatarGroup` e `TagsInput` ja o chamavam assim, e so a trilha divergia.
   */
  max?: number;
  /**
   * Os textos da peca, para trocar o idioma: `navigation` e o nome da regiao,
   * "Caminho" sem ele.
   */
  labels?: Partial<BreadcrumbLabels>;
};

export type BreadcrumbLabels = {
  navigation: string;
};

export function Breadcrumb({ className, items, max = 4, labels, ...props }: BreadcrumbProps) {
  const tail = Math.max(1, Math.floor(max) - 1);
  const folded = items.length - 1 - tail >= 1;
  const visiveis: (Crumb | "reticencia")[] = folded
    ? [items[0]!, "reticencia", ...items.slice(-tail)]
    : items;

  const beforeLast = visiveis.length - 2;
  const parentOnPhone = visiveis[beforeLast] === "reticencia" ? beforeLast - 1 : beforeLast;

  return (
    <nav
      {...props}
      aria-label={labels?.navigation ?? "Caminho"}
      className={cn("font-sans text-sm", className)}
    >
      <ol className="flex items-center gap-1.5">
        {visiveis.map((crumb, index) => {
          const isLast = index === visiveis.length - 1;
          const fullLabel =
            crumb !== "reticencia" && typeof crumb.label === "string" ? crumb.label : undefined;
          const wideOnly = index !== visiveis.length - 1 && index !== parentOnPhone;
          const separatorWideOnly = index < visiveis.length - 1;

          return (
            <Fragment key={index}>
              {index > 0 && (
                <li aria-hidden="true" className={cn(separatorWideOnly && "max-sm:hidden")}>
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
                      "block rounded-sm text-fg-muted",
                      "relative after:absolute after:inset-x-0 after:-inset-y-1.5",
                      "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
                      "hover:text-fg",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <span className="block truncate">{crumb.label}</span>
                  </a>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    title={fullLabel}
                    className="block truncate text-fg"
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
