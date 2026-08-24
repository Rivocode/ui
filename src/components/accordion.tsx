"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

export const Accordion = BaseAccordion.Root;

export type AccordionItemProps = Omit<ComponentProps<typeof BaseAccordion.Item>, "children"> & {
  /** O que fica visivel com o item fechado. */
  title: ReactNode;
  children: ReactNode;
};

/**
 * Um item da sanfona: cabecalho, gatilho e painel numa peca so.
 *
 * As tres partes vem juntas porque a Base UI exige a ordem exata entre elas, e
 * expor cada uma separada so criaria um jeito de montar errado que quebra na
 * tela e nao no tipo. E a mesma decisao do `MenuGroup`.
 *
 * O painel anima pela altura que a Base UI mede sozinha, em
 * `--accordion-panel-height`, entao ele funciona com conteudo de tamanho
 * qualquer sem ninguem chutar um valor.
 */
export function AccordionItem({ className, title, children, ...props }: AccordionItemProps) {
  return (
    <BaseAccordion.Item {...props} className={cn("border-b border-border", className)}>
      <BaseAccordion.Header>
        <BaseAccordion.Trigger
          className={cn(
            "group flex w-full items-center justify-between gap-4 py-4 text-left",
            "font-sans text-base text-fg",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
            "hover:text-accent-text",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          )}
        >
          {title}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-fg-subtle",
              "transition-transform duration-[var(--rc-duration-base)] ease-rc",
              "group-data-[panel-open]:rotate-180",
            )}
          />
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>

      <BaseAccordion.Panel
        className={cn(
          "h-[var(--accordion-panel-height)] overflow-hidden text-base text-fg-muted",
          "transition-[height] duration-[var(--rc-duration-base)] ease-rc",
          "data-[starting-style]:h-0 data-[ending-style]:h-0",
        )}
      >
        <div className="pb-4">{children}</div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  );
}
