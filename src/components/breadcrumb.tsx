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
   * Quantas migalhas cabem antes de o meio virar reticencia.
   *
   * `max` e como o resto do catalogo chama o teto de uma lista - `Indicator`,
   * `AvatarGroup` e `TagsInput` ja o chamavam assim, e so a trilha divergia.
   */
  max?: number;
};

export function Breadcrumb({ className, items, max = 4, ...props }: BreadcrumbProps) {
  const folded = items.length > max;
  const visiveis: (Crumb | "reticencia")[] = folded
    ? [items[0]!, "reticencia", ...items.slice(-2)]
    : items;

  return (
    <nav {...props} aria-label="Caminho" className={cn("font-sans text-sm", className)}>
      <ol className="flex items-center gap-1.5">
        {visiveis.map((crumb, index) => {
          const isLast = index === visiveis.length - 1;
          const fullLabel =
            crumb !== "reticencia" && typeof crumb.label === "string" ? crumb.label : undefined;
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
