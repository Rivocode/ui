"use client";

import { ChevronRight, PanelLeft, Search } from "lucide-react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { useMobile } from "../lib/screen";
import { Menu, MenuContent, MenuGroup, MenuItem, MenuTrigger } from "./menu";
import { Sheet, SheetContent, SheetTitle } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type SidebarState = {
  /** Aberta na mesa, ou visivel como folha no celular. */
  open: boolean;
  /** Encolhida ate a coluna de icones. Nunca verdadeiro no celular. */
  collapsed: boolean;
  /**
   * Largura de celular, onde a barra vira folha.
   *
   * Esta aqui para a aplicacao ler junto: a barra ja se vira sozinha, mas o
   * cabecalho ao lado dela quase sempre precisa da mesma resposta, e ler o
   * mesmo corte por conta propria e como as duas metades da tela acabam
   * discordando sobre o que e celular.
   */
  isMobile: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar(): SidebarState {
  const state = use(SidebarContext);
  if (!state) {
    throw new Error("useSidebar precisa de um <SidebarProvider> em volta.");
  }
  return state;
}

const FlyoutContext = createContext(false);

const RowContext = createContext(false);

export type SidebarProviderProps = ComponentProps<"div"> & {
  /** Comeca aberta na mesa. No celular ela sempre comeca fechada. */
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Atalho de teclado que abre e fecha. `null` desliga. */
  shortcut?: string | null;
};

export function SidebarProvider({
  defaultOpen = true,
  open,
  onOpenChange,
  shortcut = "b",
  className,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useMobile();
  const controlled = open !== undefined;
  const [deskOpen, setDeskOpen] = useState(defaultOpen);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isOpen = controlled ? open : isMobile ? sheetOpen : deskOpen;

  const change = useCallback(
    (next: boolean) => {
      if (!controlled) {
        if (isMobile) setSheetOpen(next);
        else setDeskOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlled, isMobile, onOpenChange],
  );

  const toggle = useCallback(() => change(!isOpen), [isOpen, change]);

  useEffect(() => {
    if (!shortcut) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === shortcut && (event.metaKey || event.ctrlKey)) {
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

export type SidebarProps = ComponentProps<"aside"> & {
  /** Titulo lido no celular, onde a barra vira folha. */
  title?: string;
  /** De que lado da pagina ela mora. */
  side?: "left" | "right";
};

export function Sidebar({
  className,
  children,
  title = "Navegação",
  side = "left",
  ...props
}: SidebarProps) {
  const { open, collapsed, isMobile, close } = useSidebar();

  if (isMobile) {
    return (
      <Sheet side={side} open={open} onOpenChange={(next) => !next && close()}>
        <SheetContent className="w-[17rem] p-3">
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <div className="flex h-full flex-col gap-2">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      {...props}
      data-collapsed={collapsed || undefined}
      data-side={side}
      className={cn(
        "group/sidebar sticky top-0 flex h-dvh shrink-0 flex-col gap-2 overflow-hidden",
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
  /** O simbolo, que sobra sozinho quando a barra encolhe. */
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
        <span className="truncate font-display text-lg tracking-tight text-fg">{children}</span>
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
  /** Rotulo lido pelo leitor de tela. O campo nao tem rotulo visivel. */
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
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      />
    </div>
  );
}

export type SidebarGroupProps = ComponentProps<"div"> & {
  /** Titulo do grupo. Some quando a barra encolhe, e a linha do meio fica. */
  label?: string;
};

export function SidebarGroup({ className, label, children, ...props }: SidebarGroupProps) {
  const { collapsed } = useSidebar();

  return (
    <div {...props} className={cn("flex flex-col gap-0.5", className)}>
      {label && !collapsed && (
        <p className="px-2 py-1 text-xs font-medium tracking-[0.04em] text-fg-subtle uppercase">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

export function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return <ul {...props} className={cn("flex flex-col gap-0.5", className)} />;
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
  icon?: ReactNode;
  /** Marca a pagina em que se esta, no aria tambem. */
  active?: boolean;
  /** Numero a direita: pendencias, nao lidos. */
  badge?: ReactNode;
};

export function SidebarMenuItem({
  className,
  icon,
  active,
  badge,
  children,
  onClick,
  ...props
}: SidebarMenuItemProps) {
  const { collapsed, isMobile, close } = useSidebar();
  const inFlyout = use(FlyoutContext);
  const inRow = use(RowContext);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (isMobile) close();
  }

  if (inFlyout) {
    return (
      <MenuItem
        render={<a {...props} onClick={handleClick} aria-current={active ? "page" : undefined} />}
        className={active ? "text-fg" : undefined}
      >
        {icon && <span className="flex shrink-0 items-center">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {badge}
      </MenuItem>
    );
  }

  const label = typeof children === "string" ? children : undefined;

  const row = (
    <a
      aria-label={collapsed ? label : undefined}
      {...props}
      onClick={handleClick}
      aria-current={active ? "page" : undefined}
      className={cn(rowClass, collapsed && "justify-center px-0", className)}
    >
      {icon && <span className="flex shrink-0 items-center">{icon}</span>}
      {!collapsed && <span className="min-w-0 flex-1 truncate">{children}</span>}
      {collapsed && !label && <span className="sr-only">{children}</span>}
      {!collapsed && badge}
    </a>
  );

  const cell = collapsed ? (
    <Tooltip>
      <TooltipTrigger render={row} />
      <TooltipContent side="right">{children}</TooltipContent>
    </Tooltip>
  ) : (
    row
  );

  return inRow ? cell : <li>{cell}</li>;
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
        "opacity-0 transition-opacity duration-[var(--rc-duration-fast)]",
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
      <li {...props} className={cn("group/linha relative", className)} />
    </RowContext>
  );
}

export type SidebarMenuSubProps = Omit<ComponentProps<"button">, "children"> & {
  children?: ReactNode;
  label: string;
  icon?: ReactNode;
  /** Comeca aberto. Vale para a barra larga; encolhida ele e um menu. */
  defaultOpen?: boolean;
  /** Alguma pagina de dentro esta aberta agora. */
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
      <li className={className}>
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
    <li>
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
        <ul className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
          {children}
        </ul>
      )}
    </li>
  );
}

export type SidebarMenuSkeletonProps = Omit<ComponentProps<"ul">, "children"> & {
  /** Quantas linhas de marca de lugar. O padrao cobre uma navegacao curta. */
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

export function SidebarTrigger({ className, ...props }: ComponentProps<"button">) {
  const { toggle, open } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-label={open ? "Fechar menu" : "Abrir menu"}
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
        "hover:after:bg-accent",
        className,
      )}
    />
  );
}

export function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return <main {...props} className={cn("flex min-w-0 flex-1 flex-col", className)} />;
}
