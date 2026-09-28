"use client";

import { ChevronRight, PanelLeft, Search } from "lucide-react";
import {
  cloneElement,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
  type ReactElement,
} from "react";

import { cn } from "../lib/cn";
import { hitsModShortcut } from "../lib/hotkey";
import { useMobile } from "../lib/screen";
import { Menu, MenuContent, MenuGroup, MenuItem, MenuTrigger } from "./menu";
import { Sheet, SheetContent, SheetTitle } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type SidebarState = {
  /** Open on desktop, or visible as a sheet on the phone. */
  open: boolean;
  /** Collapsed down to the icon column. Never true on the phone. */
  collapsed: boolean;
  /**
   * Phone width, where the bar becomes a sheet.
   *
   * It is here for the application to read along: the bar already adapts by itself, but the
   * header beside it almost always needs the same answer, and reading the
   * same breakpoint on its own is how the two halves of the screen end up
   * disagreeing about what a phone is.
   */
  isMobile: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar(): SidebarState {
  const state = use(SidebarContext);
  if (!state) {
    throw new Error("useSidebar needs a <SidebarProvider> around it.");
  }
  return state;
}

const FlyoutContext = createContext(false);

const RowContext = createContext(false);

const ListContext = createContext(false);

export type SidebarProviderProps = ComponentProps<"div"> & {
  /** Starts open on desktop. On the phone it always starts closed. */
  defaultOpen?: boolean;
  /**
   * Open on desktop, controlled. On the phone it does not open the sheet: the sheet has its
   * own state, and `openMobile` is what controls it.
   */
  open?: boolean;
  /**
   * Called when the bar opens or closes on desktop. Closing the sheet on the phone does not call
   * it.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The phone sheet, controlled. Without it, it starts closed and controls itself
   * on its own, without touching the desktop `open`.
   */
  openMobile?: boolean;
  /** Called when the phone sheet opens or closes. */
  onOpenMobileChange?: (open: boolean) => void;
  /**
   * Keyboard shortcut that opens and closes it, with Ctrl or Cmd. Does not fire inside
   * a text field or an editor, and ignores case. `null` turns it off.
   */
  shortcut?: string | null;
};

export function SidebarProvider({
  defaultOpen = true,
  open,
  onOpenChange,
  openMobile,
  onOpenMobileChange,
  shortcut = "b",
  className,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useMobile();
  const [deskState, setDeskOpen] = useState(defaultOpen);
  const [sheetState, setSheetOpen] = useState(false);
  const deskOpen = open ?? deskState;
  const sheetOpen = openMobile ?? sheetState;
  const isOpen = isMobile ? sheetOpen : deskOpen;

  const change = useCallback(
    (next: boolean) => {
      if (isMobile) {
        setSheetOpen(next);
        onOpenMobileChange?.(next);
      } else {
        setDeskOpen(next);
        onOpenChange?.(next);
      }
    },
    [isMobile, onOpenChange, onOpenMobileChange],
  );

  const toggle = useCallback(() => change(!isOpen), [isOpen, change]);

  useEffect(() => {
    if (!shortcut) return;
    function onKeyDown(event: KeyboardEvent) {
      if (hitsModShortcut(event, shortcut!)) {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle, shortcut]);

  const value = useMemo<SidebarState>(
    () => ({
      open: isOpen,
      collapsed: !isOpen && !isMobile,
      isMobile,
      toggle,
      close: () => change(false),
    }),
    [isOpen, toggle, isMobile, change],
  );

  return (
    <SidebarContext value={value}>
      <div
        {...props}
        data-rc-sidebar={isOpen ? "open" : "closed"}
        className={cn("flex min-h-dvh w-full bg-bg", className)}
      >
        {children}
      </div>
    </SidebarContext>
  );
}

export type SidebarProps = Omit<ComponentProps<"aside">, "title"> & {
  /** Title read on the phone, where the bar becomes a sheet. */
  title?: string;
  /** Which side of the page it lives on. */
  side?: "left" | "right";
};

export function Sidebar({
  className,
  children,
  title = "Navegação",
  side = "left",
  ref,
  ...props
}: SidebarProps) {
  const { open, collapsed, isMobile, close } = useSidebar();

  if (isMobile) {
    return (
      <Sheet side={side} open={open} onOpenChange={(next) => !next && close()}>
        <SheetContent className={cn("w-[17rem] p-3", className)}>
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <div {...(props as ComponentProps<"div">)} className="flex h-full flex-col gap-2">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      {...props}
      ref={ref}
      data-collapsed={collapsed || undefined}
      data-side={side}
      className={cn(
        "sticky top-0 flex h-dvh shrink-0 flex-col gap-2 overflow-hidden",
        "border-border bg-surface p-3",
        side === "right" ? "order-last border-l" : "border-r",
        "w-[var(--rc-sidebar)] transition-[width] duration-[var(--rc-duration-base)] ease-rc",
        "data-[collapsed]:w-[var(--rc-sidebar-icon)] data-[collapsed]:px-2",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("flex shrink-0 items-center gap-2 overflow-hidden px-1 py-2", className)}
    />
  );
}

export type SidebarBrandProps = ComponentProps<"div"> & {
  /** The symbol, which is left alone when the bar collapses. */
  mark?: ReactNode;
};

export function SidebarBrand({ className, mark, children, ...props }: SidebarBrandProps) {
  const { collapsed } = useSidebar();

  return (
    <div
      {...props}
      className={cn(
        "flex h-[var(--rc-control-md)] w-full items-center gap-2 overflow-hidden",
        collapsed ? "justify-center px-0" : "px-1",
        className,
      )}
    >
      {mark && <span className="flex shrink-0 items-center">{mark}</span>}
      {!collapsed && children && (
        <span className="truncate font-display font-rc-display text-lg tracking-tight text-fg">
          {children}
        </span>
      )}
    </div>
  );
}

export function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto", className)}
    />
  );
}

export function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  const { collapsed } = useSidebar();

  return (
    <div
      {...props}
      className={cn(
        "mt-auto flex flex-col gap-1 border-t border-border pt-2",
        collapsed && "items-center",
        className,
      )}
    />
  );
}

export function SidebarSeparator({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} role="separator" className={cn("mx-1 my-1 h-px bg-border", className)} />;
}

export type SidebarInputProps = Omit<ComponentProps<"input">, "size"> & {
  /** Label read by the screen reader. The field has no visible label. */
  label?: string;
};

export function SidebarInput({ className, label = "Buscar", ...props }: SidebarInputProps) {
  const { collapsed, toggle } = useSidebar();

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={toggle}
              aria-label={label}
              className={cn(
                "flex h-[var(--rc-control-md)] w-full items-center justify-center rounded-md",
                "text-fg-muted transition-colors duration-[var(--rc-duration-fast)] ease-rc",
                "hover:bg-accent-subtle hover:text-fg",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          }
        >
          <Search size={16} aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="relative">
      <Search
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-subtle"
      />
      <input
        {...props}
        type="search"
        aria-label={label}
        className={cn(
          "h-[var(--rc-control-md)] w-full rounded-md border border-border-strong bg-bg",
          "pr-2.5 pl-8 font-sans text-sm text-fg placeholder:text-fg-subtle",
          "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      />
    </div>
  );
}

export type SidebarGroupProps = ComponentProps<"div"> & {
  /** The group's title. Disappears when the bar collapses, and the divider line stays. */
  label?: string;
};

export function SidebarGroup({ className, label, children, ...props }: SidebarGroupProps) {
  const { collapsed } = useSidebar();

  return (
    <div {...props} className={cn("flex flex-col gap-0.5", className)}>
      {label && !collapsed && (
        <p className="px-2 py-1 text-xs font-rc-medium tracking-[0.04em] text-fg-subtle uppercase">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

export function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ListContext value={true}>
      <ul {...props} className={cn("flex list-none flex-col gap-0.5 self-stretch", className)} />
    </ListContext>
  );
}

const rowClass = cn(
  "flex h-[var(--rc-control-md)] w-full items-center gap-3 rounded-md px-2",
  "font-sans text-base text-fg-muted",
  "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
  "hover:bg-accent-subtle hover:text-fg",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "aria-[current=page]:bg-accent-subtle aria-[current=page]:text-fg",
);

export type SidebarMenuItemProps = ComponentProps<"a"> & {
  /**
   * Swaps the anchor for the router's link, keeping the row's drawing:
   * `render={<RouterLink to="/notas" />}`. Without it the item is an `<a href>`, and
   * every click reloads the whole page in an app with a router.
   */
  render?: ReactElement;
  icon?: ReactNode;
  /** Marks the page you are on, in aria too. */
  active?: boolean;
  /** Number on the right: pending items, unread ones. */
  badge?: ReactNode;
};

export function SidebarMenuItem({
  className,
  icon,
  active,
  badge,
  children,
  onClick,
  render,
  ...props
}: SidebarMenuItemProps) {
  const { collapsed, isMobile, close } = useSidebar();
  const inFlyout = use(FlyoutContext);
  const inRow = use(RowContext);
  const inList = use(ListContext);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (isMobile) close();
  }

  const anchor = (extra: Record<string, unknown>) =>
    render ? cloneElement(render, { ...props, ...extra }) : <a {...props} {...extra} />;

  if (inFlyout) {
    return (
      <MenuItem
        render={anchor({ onClick: handleClick, "aria-current": active ? "page" : undefined })}
        className={active ? "text-fg" : undefined}
      >
        {icon && <span className="flex shrink-0 items-center">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {badge}
      </MenuItem>
    );
  }

  const label = typeof children === "string" ? children : undefined;

  const row = anchor({
    "aria-label": props["aria-label"] ?? (collapsed ? label : undefined),
    onClick: handleClick,
    "aria-current": active ? "page" : undefined,
    className: cn(rowClass, collapsed && "justify-center px-0", className),
    children: (
      <>
        {icon && <span className="flex shrink-0 items-center">{icon}</span>}
        {!collapsed && <span className="min-w-0 flex-1 truncate">{children}</span>}
        {collapsed && !label && <span className="sr-only">{children}</span>}
        {!collapsed && badge}
      </>
    ),
  });

  const cell = collapsed ? (
    <Tooltip>
      <TooltipTrigger render={row} />
      <TooltipContent side="right">{children}</TooltipContent>
    </Tooltip>
  ) : (
    row
  );

  if (inRow || !inList) return cell;
  return <li className="list-none">{cell}</li>;
}

export function SidebarMenuAction({ className, ...props }: ComponentProps<"button">) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;

  return (
    <button
      type="button"
      aria-label="Mais opções"
      {...props}
      className={cn(
        "absolute top-1/2 right-1 -translate-y-1/2",
        "flex size-6 items-center justify-center rounded-sm text-fg-subtle",
        "opacity-0 transition-opacity duration-[var(--rc-duration-fast)] ease-rc-effects",
        "group-hover/linha:opacity-100 focus-visible:opacity-100",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

export function SidebarMenuRow({ className, ...props }: ComponentProps<"li">) {
  return (
    <RowContext value={true}>
      <li {...props} className={cn("group/linha relative list-none", className)} />
    </RowContext>
  );
}

export type SidebarMenuSubProps = Omit<ComponentProps<"button">, "children"> & {
  children?: ReactNode;
  label: string;
  icon?: ReactNode;
  /** Starts open. Applies to the wide bar; collapsed, it is a menu. */
  defaultOpen?: boolean;
  /** Some page inside it is open right now. */
  active?: boolean;
};

export function SidebarMenuSub({
  className,
  label,
  icon,
  defaultOpen = false,
  active,
  children,
  ...props
}: SidebarMenuSubProps) {
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return (
      <li className={cn("list-none", className)}>
        <Menu>
          <MenuTrigger
            render={
              <button
                type="button"
                aria-label={label}
                className={cn(rowClass, "justify-center px-0", active && "text-fg")}
              />
            }
          >
            {icon}
          </MenuTrigger>
          <MenuContent>
            <MenuGroup label={label}>
              <FlyoutContext value={true}>{children}</FlyoutContext>
            </MenuGroup>
          </MenuContent>
        </Menu>
      </li>
    );
  }

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        {...props}
        className={cn(rowClass, active && "text-fg", className)}
      >
        {icon && <span className="flex shrink-0 items-center">{icon}</span>}
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <ChevronRight
          size={14}
          aria-hidden="true"
          className={cn(
            "shrink-0 transition-transform duration-[var(--rc-duration-fast)] ease-rc",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <ListContext value={true}>
          <ul className="mt-0.5 ml-4 flex list-none flex-col gap-0.5 border-l border-border pl-2">
            {children}
          </ul>
        </ListContext>
      )}
    </li>
  );
}

export type SidebarMenuSkeletonProps = Omit<ComponentProps<"ul">, "children"> & {
  /** How many placeholder rows. The default covers a short navigation. */
  count?: number;
};

export function SidebarMenuSkeleton({ className, count = 5, ...props }: SidebarMenuSkeletonProps) {
  const { collapsed } = useSidebar();

  return (
    <ul {...props} aria-busy="true" className={cn("flex flex-col gap-0.5", className)}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex h-[var(--rc-control-md)] items-center gap-3 px-2">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          {!collapsed && (
            <Skeleton className="h-3" style={{ width: `${45 + ((index * 17) % 40)}%` }} />
          )}
        </li>
      ))}
    </ul>
  );
}

export type SidebarTriggerProps = ComponentProps<"button"> & {
  /**
   * The piece's texts, to change the language. On the phone the button opens and closes the
   * sheet, with `open` and `close`; on desktop it collapses and expands the bar, with
   * `collapse` and `expand`. Pass only the ones that change.
   */
  labels?: Partial<SidebarTriggerLabels>;
};

export type SidebarTriggerLabels = {
  open: string;
  close: string;
  expand: string;
  collapse: string;
};

const TRIGGER_LABELS: SidebarTriggerLabels = {
  open: "Abrir menu",
  close: "Fechar menu",
  expand: "Expandir barra lateral",
  collapse: "Recolher barra lateral",
};

export function SidebarTrigger({ className, labels: labelsProp, ...props }: SidebarTriggerProps) {
  const { toggle, open, isMobile } = useSidebar();
  const labels = { ...TRIGGER_LABELS, ...labelsProp };
  const label = isMobile
    ? open
      ? labels.close
      : labels.open
    : open
      ? labels.collapse
      : labels.expand;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-label={label}
      {...props}
      className={cn(
        "inline-flex size-[var(--rc-control-md)] items-center justify-center rounded-md",
        "text-fg-muted transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <PanelLeft size={18} aria-hidden="true" />
    </button>
  );
}

export function SidebarRail({ className, ...props }: ComponentProps<"button">) {
  const { toggle, isMobile } = useSidebar();
  if (isMobile) return null;

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onClick={toggle}
      {...props}
      className={cn(
        "absolute inset-y-0 -right-2 z-[var(--rc-z-sticky)] hidden w-4 cursor-col-resize sm:block",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2",
        "after:bg-transparent after:transition-colors after:duration-[var(--rc-duration-fast)]",
        "after:ease-rc-effects",
        "hover:after:bg-accent",
        className,
      )}
    />
  );
}

export function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return <main {...props} className={cn("flex min-w-0 flex-1 flex-col", className)} />;
}
