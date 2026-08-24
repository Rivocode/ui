"use client";

import { PanelLeft } from "lucide-react";
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
import { useTelaEstreita } from "../lib/tela";
import { Sheet, SheetContent, SheetTitle } from "./sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

type EstadoDaBarra = {
  aberta: boolean;
  encolhida: boolean;
  estreita: boolean;
  alternar: () => void;
  fechar: () => void;
};

const BarraContext = createContext<EstadoDaBarra | null>(null);

export function useSidebar(): EstadoDaBarra {
  const estado = use(BarraContext);
  if (!estado) {
    throw new Error("useSidebar precisa de um <SidebarProvider> em volta.");
  }
  return estado;
}

export type SidebarProviderProps = ComponentProps<"div"> & {
  /** Comeca aberta na mesa. No celular ela sempre comeca fechada. */
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (aberta: boolean) => void;
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
  const estreita = useTelaEstreita();
  const controlada = open !== undefined;
  const [interna, setInterna] = useState(defaultOpen);
  const aberta = controlada ? open : interna;

  const mudar = useCallback(
    (nova: boolean) => {
      if (!controlada) setInterna(nova);
      onOpenChange?.(nova);
    },
    [controlada, onOpenChange],
  );

  const alternar = useCallback(() => mudar(!aberta), [aberta, mudar]);

  useEffect(() => {
    if (!shortcut) return;
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key.toLowerCase() === shortcut && (evento.metaKey || evento.ctrlKey)) {
        evento.preventDefault();
        alternar();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [alternar, shortcut]);

  const valor = useMemo<EstadoDaBarra>(
    () => ({
      aberta,
      encolhida: !aberta && !estreita,
      estreita,
      alternar,
      fechar: () => mudar(false),
    }),
    [aberta, alternar, estreita, mudar],
  );

  return (
    <BarraContext value={valor}>
      <div
        {...props}
        data-rc-sidebar={aberta ? "aberta" : "fechada"}
        className={cn("flex min-h-dvh w-full bg-bg", className)}
      >
        {children}
      </div>
    </BarraContext>
  );
}

export type SidebarProps = ComponentProps<"aside"> & {
  /** Titulo lido no celular, onde a barra vira folha. */
  title?: string;
};

/**
 * A barra em si. Na mesa e uma coluna que encolhe; no celular, uma folha que
 * entra pela esquerda, com o gesto de arrastar que a folha ja tem.
 */
export function Sidebar({ className, children, title = "Navegacao", ...props }: SidebarProps) {
  const { aberta, encolhida, estreita, fechar } = useSidebar();

  if (estreita) {
    return (
      <Sheet side="left" open={aberta} onOpenChange={(abrir) => !abrir && fechar()}>
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
      data-encolhida={encolhida || undefined}
      className={cn(
        "group/barra sticky top-0 flex h-dvh shrink-0 flex-col gap-2 overflow-hidden",
        "border-r border-border bg-surface p-3",
        "w-[var(--rc-sidebar)] transition-[width] duration-[var(--rc-duration-base)] ease-rc",
        "data-[encolhida]:w-[var(--rc-sidebar-icone)] data-[encolhida]:px-2",
        className,
      )}
    >
      {children}
    </aside>
  );
}

/** O topo, com a marca. */
export function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("flex items-center gap-2 px-1 py-2", className)} />;
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

export type SidebarGroupProps = ComponentProps<"div"> & {
  /** Titulo do grupo. Some quando a barra encolhe, e a linha do meio fica. */
  label?: string;
};

export function SidebarGroup({ className, label, children, ...props }: SidebarGroupProps) {
  return (
    <div {...props} className={cn("flex flex-col gap-1", className)}>
      {label && (
        <p
          className={cn(
            "px-2 py-1 font-mono text-xs tracking-[0.04em] text-fg-subtle uppercase",
            // Encolhida, o titulo sairia cortado no meio da palavra. Sumir diz
            // menos, mas mentir sobre o nome do grupo diz errado.
            "group-data-[encolhida]/barra:hidden",
          )}
        >
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
  ...props
}: SidebarMenuItemProps) {
  const { encolhida } = useSidebar();

  const linha = (
    <a
      {...props}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-[var(--rc-control-md)] items-center gap-3 rounded-md px-2",
        "font-sans text-base text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "aria-[current=page]:bg-accent-subtle aria-[current=page]:text-fg",
        encolhida && "justify-center px-0",
        className,
      )}
    >
      {icon && <span className="flex shrink-0 items-center">{icon}</span>}
      {!encolhida && <span className="flex-1 truncate">{children}</span>}
      {!encolhida && badge}
    </a>
  );

  if (!encolhida) return <li>{linha}</li>;

  return (
    <li>
      <Tooltip>
        <TooltipTrigger render={linha} />
        <TooltipContent side="right">{children}</TooltipContent>
      </Tooltip>
    </li>
  );
}

/** O botao que abre e fecha. Fica no cabecalho da pagina, nao dentro da barra. */
export function SidebarTrigger({ className, ...props }: ComponentProps<"button">) {
  const { alternar, aberta } = useSidebar();

  return (
    <button
      type="button"
      onClick={alternar}
      aria-expanded={aberta}
      aria-label={aberta ? "Fechar menu" : "Abrir menu"}
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

/** A area da pagina, ao lado da barra. */
export function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return <main {...props} className={cn("flex min-w-0 flex-1 flex-col", className)} />;
}
