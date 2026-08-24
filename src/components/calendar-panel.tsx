"use client";

import type { ReactElement, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useNarrowScreen } from "../lib/tela";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Sheet, SheetContent, SheetHandle, SheetTrigger } from "./sheet";

export type CalendarPanelProps = {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  /** O elemento que abre. O mesmo nos dois formatos. */
  trigger: ReactElement;
  /** Titulo lido no celular, onde o painel vira folha e perde o contexto. */
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  align?: "start" | "end";
};

/**
 * A casca do calendario: painel ancorado na mesa, folha de baixo no celular.
 *
 * A troca e de formato e nao de conteudo. Calendario ancorado num campo perto
 * do rodape do celular abre para fora da tela ou por cima do teclado, e o
 * usuario precisa rolar a pagina com o painel aberto. A folha resolve isso sem
 * mexer em nada do que vai dentro.
 */
export function CalendarPanel({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  footer,
  align = "start",
}: CalendarPanelProps) {
  const estreita = useNarrowScreen();

  if (estreita) {
    return (
      <Sheet side="bottom" open={open} onOpenChange={onOpenChange}>
        <SheetTrigger render={trigger} />
        <SheetContent className="p-4" aria-label={title}>
          <SheetHandle />
          <div className="flex justify-center">{children}</div>
          {footer && <div className="mt-4 border-t border-border pt-4">{footer}</div>}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align={align} className="w-auto min-w-0 p-3" aria-label={title}>
        {children}
        {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
      </PopoverContent>
    </Popover>
  );
}

/** O rodape com Limpar e Aplicar, igual nos dois seletores. */
export function CalendarPanelFooter({
  className,
  ...props
}: { className?: string } & { children: ReactNode }) {
  return <div {...props} className={cn("flex items-center justify-between gap-3", className)} />;
}
