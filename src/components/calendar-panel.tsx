"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useMobile } from "../lib/screen";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Sheet, SheetContent, SheetHandle, SheetTrigger } from "./sheet";

/*
 * `title` colide com o atributo de mesmo nome da `<div>`, e os dois sao
 * `string`: a interseccao compilaria e o texto viraria tambem a tarja amarela
 * do navegador, em cima de um painel inteiro. Aqui ele e o nome que o leitor
 * de tela ouve, e vai para o `aria-label` da casca.
 *
 * `children` e redeclarado obrigatorio: sem calendario dentro, o painel e uma
 * casca vazia.
 */
export type CalendarPanelProps = Omit<ComponentProps<"div">, "title" | "children"> & {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** O elemento que abre. O mesmo nos dois formatos. */
  trigger: ReactElement;
  /** Titulo lido no celular, onde o painel vira folha e perde o contexto. */
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  align?: "start" | "end";
  /**
   * Veste a casca, seja qual for a que o corte estiver mostrando: a folha no
   * celular e o painel ancorado na mesa. E uma casca so por vez, entao a
   * mesma classe nao vaza para a outra.
   */
  className?: string;
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
  className,
  ...rest
}: CalendarPanelProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <Sheet side="bottom" open={open} onOpenChange={onOpenChange}>
        <SheetTrigger render={trigger} />
        {/*
         * A classe de quem chama vai por ultimo nas duas cascas: o `p-4` daqui
         * e o `p-3` de baixo sao o que mais se troca, e o `cn` resolve o grupo
         * de padding pela ordem.
         */}
        {/*
         * O espalhamento vem DEPOIS do `aria-label`: o nome tirado do `title` e
         * padrao, e quem passar o proprio `aria-label` tem que vencer. Antes do
         * spread, o rotulo escrito de fora era engolido sem aviso.
         */}
        <SheetContent className={cn("p-4", className)} aria-label={title} {...rest}>
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
      <PopoverContent
        align={align}
        className={cn("w-auto min-w-0 p-3", className)}
        aria-label={title}
        {...rest}
      >
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
