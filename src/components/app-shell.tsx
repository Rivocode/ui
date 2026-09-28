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
  /** The page that is open. Goes inside `<main>`, which is the skip link's target. */
  children: ReactNode;
  /**
   * What lives in the fixed header: brand, search, bell, account menu. The
   * button that opens and closes the sidebar comes in on its own at the front, when there is
   * a `sidebar`. Rendered in a `<header>`, which the screen reader announces as a banner.
   */
  header?: ReactNode;
  /**
   * The inside of the sidebar: `SidebarHeader`, `SidebarContent`,
   * `SidebarFooter` and the rest of the `Sidebar` family. The shell wraps it in a
   * `<nav>` and in the house `Sidebar`, which collapses on desktop and becomes a sheet on the
   * phone.
   */
  sidebar?: ReactNode;
  /** Which side the sidebar lives on. */
  sidebarSide?: "left" | "right";
  /**
   * Column beside the content: help, summary, recent activity. Rendered in an
   * `<aside>`, on the right from `lg` up and below the content before that.
   */
  aside?: ReactNode;
  /** The application footer, below the content. Rendered in a `<footer>`. */
  footer?: ReactNode;
  /**
   * Puts the content in a house `Container`, with its max width and
   * side padding plus the panel's top and bottom padding. `true` uses `lg`;
   * a size picks another. Without it, the content touches the edges.
   */
  container?: boolean | ContainerProps["size"];
  /**
   * Fills the parent's box instead of the window: the sidebar and the content
   * column start scrolling internally. For a shell inside a panel, a
   * `Splitter` or a documentation example.
   */
  contained?: boolean;
  /** The `id` of `<main>`, the skip link's target. Without it, a generated one. */
  mainId?: string;
  /** The skip link's texts and the region names the screen reader announces. */
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
