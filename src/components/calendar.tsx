"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type CalendarProps = ComponentProps<typeof DayPicker>;

/** As setas da navegacao e das listas de mes e ano, no nosso traco. */
const CHEVRONS = {
  left: ChevronLeft,
  right: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
} as const;

/**
 * O calendario cru, sem gatilho e sem painel. Serve para quem quer o mes na
 * propria tela, e e o miolo do DatePicker.
 *
 * A Base UI nao tem calendario, entao esta e a unica peca do catalogo com
 * fundacao de fora. A react-day-picker entra so como motor: nenhuma folha de
 * estilo dela e importada, todo desenho vem dos nossos tokens pelo
 * `classNames`. Trocar o motor um dia nao mexe no visual.
 *
 * O locale padrao e `pt-BR`, e nao o `en-US` da biblioteca, porque toda tela
 * que essa biblioteca serve hoje e em portugues. Passe `locale` para trocar.
 */
export function Calendar({ className, classNames, locale = ptBR, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={locale}
      {...props}
      className={cn("font-sans text-fg", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-3",

        // A navegacao flutua sobre a legenda do mes: a Base UI monta o `nav`
        // antes dos meses, e so o posicionamento absoluto deixa as setas na
        // mesma linha do titulo sem duplicar o cabecalho por mes.
        nav: "absolute inset-x-0 top-0 flex h-8 items-center justify-between",
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-md",
          "text-fg-muted transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
          "hover:bg-accent-subtle hover:text-fg",
          "disabled:pointer-events-none disabled:text-fg-disabled",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-md",
          "text-fg-muted transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
          "hover:bg-accent-subtle hover:text-fg",
          "disabled:pointer-events-none disabled:text-fg-disabled",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ),

        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium text-fg capitalize",

        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-xs font-normal text-fg-subtle capitalize",
        weeks: "",
        week: "mt-1 flex w-full",

        day: "relative size-9 p-0 text-center",
        day_button: cn(
          "size-9 rounded-md text-base text-fg",
          "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
          "hover:bg-accent-subtle",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none",
        ),

        today: "[&>button]:font-medium [&>button]:text-accent-text",
        outside: "[&>button]:text-fg-subtle",
        disabled: "[&>button]:text-fg-disabled",
        hidden: "invisible",

        // A selecao pinta o botao, nao a celula, para o cantinho arredondado
        // acompanhar o dia. O intervalo e a excecao: ali a celula pinta o miolo
        // para a faixa nao ter buraco entre um dia e o outro.
        selected: cn(
          "[&>button]:bg-accent [&>button]:text-accent-fg",
          "[&>button]:hover:bg-accent-hover",
        ),
        range_middle: cn(
          "bg-selected",
          "[&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-fg",
          "[&>button]:hover:bg-accent-subtle",
        ),
        range_start: "rounded-l-md bg-selected",
        range_end: "rounded-r-md bg-selected",

        ...classNames,
      }}
      components={{
        Chevron: ({ orientation = "right", size: _size, disabled: _disabled, ...chevron }) => {
          const Icone = CHEVRONS[orientation];
          return <Icone {...chevron} size={16} aria-hidden="true" />;
        },
        ...props.components,
      }}
    />
  );
}
