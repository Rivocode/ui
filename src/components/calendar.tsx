"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useTelaEstreita } from "../lib/tela";

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
 *
 * Em largura de celular ele mostra um mes so, mesmo quando pedem mais.
 */
export function Calendar({
  className,
  classNames,
  locale = ptBR,
  numberOfMonths,
  captionLayout = "dropdown",
  startMonth = new Date(new Date().getFullYear() - 100, 0),
  endMonth = new Date(new Date().getFullYear() + 10, 11),
  formatters,
  ...props
}: CalendarProps) {
  // Dois meses no celular viram uma coluna de 700px de altura e o segundo fica
  // fora da tela. Um mes so, e a navegacao cobre o resto.
  const estreita = useTelaEstreita();

  return (
    <DayPicker
      locale={locale}
      numberOfMonths={estreita ? 1 : numberOfMonths}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      formatters={{
        // Uma letra por dia, como todo calendario de papel. "Seg" e "Sex"
        // comecam igual, e o cabecalho vira leitura em vez de referencia; a
        // coluna ja diz qual dia e, e o leitor de tela recebe o nome inteiro
        // pelo `aria-label` da celula.
        formatWeekdayName: (dia, opcoes, lib) =>
          lib
            ? lib.format(dia, "EEEEE", opcoes).toUpperCase()
            : dia.toLocaleDateString("pt-BR", { weekday: "narrow" }).toUpperCase(),
        ...formatters,
      }}
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

        month_caption: "flex h-8 items-center justify-center px-10",
        // A seta mora dentro do rotulo, e o Tailwind poe `display:block` em
        // todo svg, entao sem o flex aqui ela cai para a linha de baixo.
        caption_label: cn(
          "inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap",
          "text-fg capitalize",
        ),
        dropdowns: "flex items-center gap-1",
        dropdown_root: cn(
          "relative inline-flex flex-nowrap items-center gap-1 rounded-md px-2 py-1",
          "text-sm font-medium whitespace-nowrap text-fg",
          "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
          "hover:bg-accent-subtle",
          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        ),
        // A lista de verdade fica por cima, invisivel: o texto embaixo e o
        // nosso, e o menu que abre e o nativo do sistema, que no celular ja
        // vem com a roda de rolar que ninguem quer reescrever.
        dropdown: "absolute inset-0 cursor-pointer opacity-0",

        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-11 text-xs font-normal text-fg-subtle sm:w-9",
        weeks: "",
        week: "mt-1 flex w-full",

        // 44px no celular e 36 na mesa: alvo de dedo tem medida propria, e no
        // toque a diferenca entre acertar o dia e o vizinho e essa.
        day: "relative size-11 p-0 text-center sm:size-9",
        day_button: cn(
          "size-11 rounded-md text-base text-fg sm:size-9",
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
