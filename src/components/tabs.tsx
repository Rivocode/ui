"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const Tabs = BaseTabs.Root;

export type TabVariant = "underline" | "segmented";

export type TabListProps = ComponentProps<typeof BaseTabs.List> & {
  /**
   * `underline` divide uma pagina em secoes; `segmented` troca a forma de ver
   * a mesma coisa, como largura de tela ou preview e codigo.
   */
  variant?: TabVariant;
};

/**
 * A fila de abas. Rola de lado quando nao cabe, em vez de espremer ou quebrar
 * linha: aba em duas linhas vira menu disfarcado, e no celular quase nenhuma
 * fila de aba cabe inteira.
 *
 * A barra de rolagem fica escondida de proposito. O gesto continua valendo, e
 * no desktop a aba ativa se traz para a vista sozinha pelo foco do teclado.
 *
 * As duas formas dizem coisas diferentes. O risco embaixo diz "esta parte da
 * pagina"; a caixinha diz "a mesma coisa, de outro jeito". Trocar uma pela
 * outra faz o controle prometer o que ele nao faz.
 */
export function TabList({ className, variant = "underline", ...props }: TabListProps) {
  const segmented = variant === "segmented";

  return (
    <BaseTabs.List
      {...props}
      data-variante={variant}
      className={cn(
        "group/abas relative flex items-center",
        "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        segmented
          ? "gap-0.5 rounded-md border border-border bg-bg p-0.5"
          : "gap-1 border-b border-border",
        className,
      )}
    >
      {/* O risco, ou a caixinha, que corre ate a aba ativa. A Base UI entrega a
       * posicao em variaveis de CSS, entao ele desliza sem nenhuma medicao
       * nossa.
       *
       * Vem antes das abas no documento de proposito: as duas coisas sao
       * posicionadas, e sem empilhamento declarado quem vem depois pinta por
       * cima. Assim o rotulo fica sobre a caixinha sem `z-index` nenhum. */}
      <BaseTabs.Indicator
        className={cn(
          "absolute left-0 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)]",
          "transition-all duration-[var(--rc-duration-base)] ease-[var(--rc-ease)]",
          segmented
            ? "top-0.5 bottom-0.5 rounded-sm bg-surface-raised"
            : "bottom-0 h-[2px] bg-accent",
        )}
      />
      {props.children}
    </BaseTabs.List>
  );
}

export function Tab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      {...props}
      className={cn(
        // `relative` poe o rotulo acima da caixinha do indicador, que e irma
        // dele e vem antes no documento.
        "relative flex shrink-0 items-center gap-1.5 px-3 font-sans font-medium",
        "h-[var(--rc-control-lg)] text-base text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
        "outline-none hover:text-fg",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "data-[active]:text-accent-text",
        "data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled",
        // Na forma de caixinha a aba e menor, porque ela mora dentro de um
        // cabecalho e nao no lugar de um titulo.
        "group-data-[variante=segmented]/abas:h-7",
        "group-data-[variante=segmented]/abas:rounded-sm",
        "group-data-[variante=segmented]/abas:px-2.5",
        "group-data-[variante=segmented]/abas:text-sm",
        "group-data-[variante=segmented]/abas:text-fg-subtle",
        "group-data-[variante=segmented]/abas:hover:text-fg",
        "group-data-[variante=segmented]/abas:data-[active]:text-fg",
        className,
      )}
    />
  );
}

export function TabPanel({ className, ...props }: ComponentProps<typeof BaseTabs.Panel>) {
  return <BaseTabs.Panel {...props} className={cn("pt-4 outline-none", className)} />;
}
