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

/**
 * Verdadeiro quando o item esta sendo desenhado dentro do menu que salta da
 * barra encolhida, e nao na propria barra.
 */
const FlyoutContext = createContext(false);

export type SidebarProviderProps = ComponentProps<"div"> & {
  /** Comeca aberta na mesa. No celular ela sempre comeca fechada. */
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Atalho de teclado que abre e fecha. `null` desliga. */
  shortcut?: string | null;
};

/**
 * O estado da barra lateral, compartilhado entre a barra, o gatilho e o
 * conteudo da pagina.
 *
 * Na mesa, fechada quer dizer encolhida ate a coluna de icones, e a pagina
 * ganha a largura de volta. No celular, fechada quer dizer fora da tela: 16rem
 * de barra em 390 de largura nao deixam pagina nenhuma.
 *
 * O atalho e Ctrl+B, ou Cmd+B no Mac, o mesmo do editor. Quem trabalha o dia
 * inteiro numa tela de operacao abre e fecha isso dezenas de vezes.
 */
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
  // Duas memorias, e nao uma. `defaultOpen` fala da coluna da mesa, onde
  // aberta e o estado util e a pagina continua inteira ao lado. No celular a
  // mesma barra e uma folha por cima de tudo: comecar aberta tapa justamente a
  // tela que a pessoa veio ver, e obriga a fechar antes de comecar.
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

/**
 * A barra em si. Na mesa e uma coluna que encolhe; no celular, uma folha que
 * entra pela lateral, com o gesto de arrastar que a folha ja tem.
 */
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

/**
 * O topo da barra.
 *
 * `overflow-hidden` nao e detalhe: encolhida, a coluna tem 3,5rem, e qualquer
 * texto solto aqui vaza por baixo da pagina em vez de ser cortado. Para a
 * marca, prefira o `SidebarBrand`, que troca o nome pelo simbolo.
 */
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

/**
 * A marca no topo, que sabe encolher.
 *
 * Cortar o nome no meio da palavra e o defeito classico da barra que encolhe:
 * "RivoCode" vira "Rivo" e parece bug, nao decisao. Aqui o nome some inteiro e
 * fica o simbolo, que e o que uma coluna de 3,5rem comporta.
 */
export function SidebarBrand({ className, mark, children, ...props }: SidebarBrandProps) {
  const { collapsed } = useSidebar();

  return (
    <div
      {...props}
      className={cn(
        // `w-full` importa: sem ela a marca encolhe ate o tamanho do simbolo e
        // encosta na esquerda, enquanto todos os icones abaixo ficam centrados
        // na coluna. A diferenca de uns poucos pixels e o bastante para a
        // barra encolhida parecer torta.
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

/** O miolo que rola quando a lista passa da altura da tela. */
export function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto", className)}
    />
  );
}

export function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("mt-auto flex flex-col gap-1 border-t border-border pt-2", className)}
    />
  );
}

/** A linha entre blocos da barra. */
export function SidebarSeparator({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} role="separator" className={cn("mx-1 my-1 h-px bg-border", className)} />;
}

export type SidebarInputProps = Omit<ComponentProps<"input">, "size"> & {
  /** Rotulo lido pelo leitor de tela. O campo nao tem rotulo visivel. */
  label?: string;
};

/**
 * A busca dentro da barra.
 *
 * Encolhida, ela vira o icone da lupa que abre a barra de volta: um campo de
 * texto de 3,5rem nao aceita nem uma palavra, e deixar ele ali so faz a pessoa
 * clicar e nao conseguir digitar.
 */
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
  // Encolhida, o titulo sairia cortado no meio da palavra. Sumir diz menos,
  // mas mentir sobre o nome do grupo diz errado. Quem decide e o estado, e nao
  // um seletor de CSS, que e como o resto do arquivo resolve o colapso.
  const { collapsed } = useSidebar();

  return (
    <div {...props} className={cn("flex flex-col gap-1", className)}>
      {label && !collapsed && (
        <p className="px-2 py-1 font-mono text-xs tracking-[0.04em] text-fg-subtle uppercase">
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

/** A classe de uma linha da barra, compartilhada entre item e submenu. */
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

/**
 * Uma linha de navegacao.
 *
 * Com a barra encolhida sobra so o icone, e o nome vira dica ao passar o
 * mouse. Sem a dica, a coluna de icones vira adivinhacao, e e por isso que
 * tanta barra encolhida so serve para quem ja decorou o sistema.
 */
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

  // No celular a barra e uma folha por cima da pagina, entao escolher para
  // onde ir e a hora de sair da frente. Na mesa ela nao cobre nada e fechar
  // sozinha so faria a pessoa reabrir a cada passo.
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (isMobile) close();
  }

  // Dentro do menu que salta da barra encolhida, a linha e um item de menu:
  // teclado, foco e fechamento ao escolher ja vem prontos de la.
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

  // Encolhida, o nome sai da tela e sobra um `<a>` com um icone dentro. A dica
  // conta isso para o olho e nao para a arvore de acessibilidade, entao o que
  // o leitor de tela encontra e uma coluna de doze "link" sem nome nenhum - no
  // estado que e o padrao de toda tela de operacao. O nome ja esta aqui na
  // mao: quando `children` e texto ele vira `aria-label`, que e o nome mais
  // limpo possivel; quando vem estruturado nao ha string para virar atributo,
  // e ai o proprio texto continua na arvore, escondido so para o olho.
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

  if (!collapsed) return <li>{row}</li>;

  return (
    <li>
      <Tooltip>
        <TooltipTrigger render={row} />
        <TooltipContent side="right">{children}</TooltipContent>
      </Tooltip>
    </li>
  );
}

/**
 * O botao secundario de uma linha: o "..." que abre opcoes daquele item.
 *
 * Fica escondido ate o ponteiro chegar na linha, e aparece sempre para quem
 * navega por teclado, senao ele viraria um destino invisivel no `Tab`.
 */
export function SidebarMenuAction({ className, ...props }: ComponentProps<"button">) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;

  return (
    <button
      type="button"
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

/** Envolve uma linha que tem acao secundaria, para o hover alcancar as duas. */
export function SidebarMenuRow({ className, ...props }: ComponentProps<"li">) {
  return <li {...props} className={cn("group/linha relative", className)} />;
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

/**
 * Um item que abre outros.
 *
 * Larga, ele e uma linha com seta que abre a lista abaixo, indentada. Encolhida
 * a barra, a lista **salta como menu ao lado**: indentar dentro de 3,5rem nao
 * cabe, e esconder os filhos deixaria uma parte do sistema sem caminho nenhum
 * enquanto a barra estivesse fechada.
 */
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
        // A linha a esquerda e que amarra os filhos ao pai. So indentar deixa
        // a lista solta assim que ela passa de tres itens.
        <ul className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
          {children}
        </ul>
      )}
    </li>
  );
}

/** Marca de lugar enquanto a navegacao vem do servidor. */
export function SidebarMenuSkeleton({ count = 5 }: { count?: number }) {
  const { collapsed } = useSidebar();

  return (
    <ul aria-busy="true" className="flex flex-col gap-0.5">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex h-[var(--rc-control-md)] items-center gap-3 px-2">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          {!collapsed && (
            // Larguras diferentes por linha: cinco barras do mesmo tamanho
            // parecem tabela, e nao uma lista de nomes que ainda vai chegar.
            <Skeleton className="h-3" style={{ width: `${45 + ((index * 17) % 40)}%` }} />
          )}
        </li>
      ))}
    </ul>
  );
}

/** O botao que abre e fecha. Fica no cabecalho da pagina, nao dentro da barra. */
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

/**
 * A faixa fina na borda da barra, que abre e fecha ao ser clicada.
 *
 * O alvo tem 1rem de largura e a linha visivel tem 1px: quem mira com o mouse
 * acerta uma faixa, e quem olha ve so a divisao entre a barra e a pagina.
 * Escondida do teclado de proposito, porque o `SidebarTrigger` ja faz o mesmo
 * e dois destinos para a mesma acao so alongam o `Tab`.
 */
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

/** A area da pagina, ao lado da barra. */
export function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return <main {...props} className={cn("flex min-w-0 flex-1 flex-col", className)} />;
}
