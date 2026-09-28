"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export type PageHeaderProps = Omit<ComponentProps<"header">, "title"> & {
  /** The screen's name. Rendered in an `<h1>` by default, because a page header is its top. */
  title: ReactNode;
  /**
   * The level the title is rendered at. Default `h1`: a page header is its top.
   *
   * Lower it to `h2` when the `PageHeader` is not the top - an application that already
   * has an `h1` in the shell, a panel inside a region, an example inside
   * a documentation page. Two `h1`s on the same page do not error
   * anywhere: whoever navigates by level-1 headings is the one who lands in the wrong place.
   */
  titleAs?: "h1" | "h2" | "h3";
  /** A sentence about what the screen shows. */
  description?: ReactNode;
  /** The trail up to here: the house `Breadcrumb`. */
  breadcrumb?: ReactNode;
  /** What can be done from here: create, export, filter buttons. */
  actions?: ReactNode;
  /**
   * Class per part: `row`, `heading`, `title`, `description`, `actions`.
   *
   * The `actions` box starts as `shrink-0`, so the button is not squeezed by the
   * title. When what goes there is wide - a search field, a filter
   * bar -, this is where it gets `min-w-0 shrink`, or it pushes the
   * whole row out of the page.
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

      <div className={cn("flex flex-wrap items-start justify-between gap-3", classNames?.row)}>
        <div className={cn("min-w-0", classNames?.heading)}>
          <Title
            className={cn(
              "font-display font-rc-display text-2xl leading-[var(--rc-leading-tight)] tracking-display wrap-anywhere text-fg",
              classNames?.title,
            )}
          >
            {title}
          </Title>
          {description && (
            <p className={cn("mt-1 text-sm wrap-anywhere text-fg-muted", classNames?.description)}>
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
