"use client";

import { ChevronRight } from "lucide-react";
import { Fragment, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";

export type Crumb = {
  label: ReactNode;
  /** Without `href`, the crumb is just text. The last one is usually like that. */
  href?: string;
};

export type BreadcrumbProps = Omit<ComponentProps<"nav">, "children"> & {
  items: Crumb[];
  /**
   * How many crumbs fit before the middle turns into an ellipsis: collapsed, the trail
   * shows the first and the last `max - 1`, and never fewer than the last one.
   *
   * `max` is what the rest of the catalog calls the cap of a list - `Indicator`,
   * `AvatarGroup` and `TagsInput` already called it that, and only the trail diverged.
   */
  max?: number;
  /**
   * The piece's texts, to change the language: `navigation` is the region's name,
   * "Caminho" without it.
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
