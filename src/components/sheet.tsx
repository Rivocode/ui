"use client";

import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { createContext, use, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { InertBackground } from "../lib/inert-background";
import type { Slots } from "../lib/slots";
import { useRivoContext } from "../provider/rivo-provider";

/** De onde a folha entra. */
export type SheetSide = "bottom" | "left" | "right";

const LadoContext = createContext<SheetSide>("bottom");

const SWIPE = { bottom: "down", left: "left", right: "right" } as const;

export type SheetProps = Omit<ComponentProps<typeof BaseDrawer.Root>, "swipeDirection"> & {
  /** De onde a folha entra. O gesto de fechar segue o lado. */
  side?: SheetSide;
  children: ReactNode;
};

/**
 * Painel que desliza da borda da tela.
 *
 * E a peca de navegacao no celular e o menu lateral no desktop, e por isso o
 * lado mora na raiz: o gesto de fechar tem que concordar com a direcao de
 * onde ela entrou, e deixar isso solto so cria folha que fecha para o lado
 * errado.
 *
 * Fecha por gesto, por Esc, por clique fora e pelo `SheetClose`. O gesto vem
 * da Base UI e acompanha o dedo, entao a folha nao precisa de altura fixa.
 */
export function Sheet({ side = "bottom", children, ...props }: SheetProps) {
  return (
    <LadoContext value={side}>
      <BaseDrawer.Root swipeDirection={SWIPE[side]} {...props}>
        {children}
      </BaseDrawer.Root>
    </LadoContext>
  );
}

export const SheetTrigger = BaseDrawer.Trigger;
export const SheetClose = BaseDrawer.Close;

const VIEWPORT_SIDE: Record<SheetSide, string> = {
  bottom: "items-end justify-center",
  left: "items-stretch justify-start",
  right: "items-stretch justify-end",
};

const PANEL_SIDE: Record<SheetSide, string> = {
  bottom: cn(
    "max-h-[85dvh] w-full rounded-t-xl border-t",
    "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
    "[transform:translateY(var(--drawer-swipe-movement-y))]",
    "data-[starting-style]:[transform:translateY(100%)]",
    "data-[ending-style]:[transform:translateY(100%)]",
  ),
  left: cn(
    "h-full w-[min(20rem,85vw)] border-r",
    "[transform:translateX(var(--drawer-swipe-movement-x))]",
    "data-[starting-style]:[transform:translateX(-100%)]",
    "data-[ending-style]:[transform:translateX(-100%)]",
  ),
  right: cn(
    "h-full w-[min(20rem,85vw)] border-l",
    "[transform:translateX(var(--drawer-swipe-movement-x))]",
    "data-[starting-style]:[transform:translateX(100%)]",
    "data-[ending-style]:[transform:translateX(100%)]",
  ),
};

export type SheetContentProps = ComponentProps<typeof BaseDrawer.Popup> & {
  /**
   * Classe por parte: `backdrop`, `viewport`. A tarja e irma do painel dentro
   * do portal, entao nem `className` nem variante de descendente alcancam ela.
   */
  classNames?: Slots<"backdrop" | "viewport">;
};

export function SheetContent({
  className,
  children,
  classNames,
  ...props
}: SheetContentProps) {
  const { portalContainer } = useRivoContext();
  const side = use(LadoContext);

  return (
    <BaseDrawer.Portal container={portalContainer ?? undefined}>
      <BaseDrawer.Backdrop
        className={cn(
          "fixed inset-0 z-[var(--rc-z-overlay)] bg-overlay",
          // A tarja clareia junto com o dedo: puxar a folha pela metade mostra
          // metade do que esta atras, e o gesto deixa de ser um salto.
          "opacity-[calc(1-var(--drawer-swipe-progress))]",
          "transition-opacity duration-[var(--rc-duration-sheet)] ease-rc-sheet",
          "data-[swiping]:duration-0",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          classNames?.backdrop,
        )}
      />

      <BaseDrawer.Viewport
        className={cn("fixed inset-0 z-[var(--rc-z-dialog)] flex", VIEWPORT_SIDE[side], classNames?.viewport)}
      >
        <BaseDrawer.Popup
          {...props}
          className={cn(
            "overflow-y-auto overscroll-contain border-border bg-surface shadow-3",
            "p-[var(--rc-pad-panel)]",
            "font-sans text-fg outline-none",
            "transition-transform duration-[var(--rc-duration-sheet)] ease-rc-sheet",
            // Enquanto o dedo esta na tela o painel segue o dedo sem transicao,
            // senao ele chega atrasado e parece emperrado.
            "data-[swiping]:select-none data-[swiping]:duration-0",
            PANEL_SIDE[side],
            className,
          )}
        >
          <BaseDrawer.Content>{children}</BaseDrawer.Content>
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>

      {/* Depois do painel de proposito: o `aria-hidden` que ele espelha e
          aplicado pelo gerenciador de foco que mora dentro do popup. */}
      <InertBackground container={portalContainer} />
    </BaseDrawer.Portal>
  );
}

/**
 * A barrinha de pegar, so na folha de baixo. E o unico aviso de que da para
 * arrastar, e sem ela o gesto existe mas ninguem descobre.
 */
export function SheetHandle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("mx-auto mb-4 h-1 w-10 rounded-pill bg-border-strong", className)}
    />
  );
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof BaseDrawer.Title>) {
  return (
    <BaseDrawer.Title
      {...props}
      className={cn("font-display text-xl leading-[var(--rc-leading-tight)] tracking-display text-fg", className)}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDrawer.Description>) {
  return (
    <BaseDrawer.Description {...props} className={cn("mt-2 text-base text-fg-muted", className)} />
  );
}
