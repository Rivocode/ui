import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

export type EmptyStateProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  /**
   * Symbol or illustration. Optional.
   *
   * Rendered `aria-hidden`, like the one in `Alert`: the title and the description beside it
   * already
   * say what it draws. Applies to `<img>` and to your own SVG too, and
   * not only to the lucide icon, which protects itself.
   */
  icon?: ReactNode;
  /**
   * A drawing bigger than the icon, for the first-time empty state: the home screen
   * with nothing yet, the onboarding step. A filter with no results and a list that
   * emptied call for `icon`, not this.
   *
   * The size is up to whoever draws it: `icon` forces 32px on every SVG, and here nothing
   * is forced. Rendered `aria-hidden`, like `icon`, and in `text-fg-subtle`: paint it
   * with `currentColor` or a token class (`fill-accent-subtle`), never
   * with a literal color, or the drawing will not follow the client's theme. When
   * it comes, it takes the place of `icon`.
   */
  illustration?: ReactNode;
  /**
   * Accepts a node and not only text, like the title of `PageHeader` and of `Timeline`.
   * It used to be `string`, and so a formatted number or a `<strong>` in the middle of the
   * sentence - "Nenhuma nota em **marco**" - did not fit in an empty state, while fitting
   * in the two siblings.
   */
  title: ReactNode;
  /** Why it is empty. Required: "sem dados" explains nothing. */
  description: ReactNode;
  /** The way out. Without it the person learns about the problem and not the solution. */
  action?: ReactNode;
};

export function EmptyState({
  className,
  icon,
  illustration,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center font-sans",
        "animate-enter",
        className,
      )}
    >
      {illustration ? (
        <div aria-hidden="true" className="text-fg-subtle">
          {illustration}
        </div>
      ) : (
        icon && (
          <div aria-hidden="true" className="text-fg-subtle [&_svg]:size-8">
            {icon}
          </div>
        )
      )}
      <p className="text-lg font-rc-medium text-fg">{title}</p>
      <p className="max-w-sm text-base text-fg-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
