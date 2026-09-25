"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import {
  DayPicker,
  type Matcher,
  type PropsBase,
  type PropsMulti,
  type PropsMultiRequired,
  type PropsRange,
  type PropsRangeRequired,
  type PropsSingle,
  type PropsSingleRequired,
} from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import type { ComponentProps, ReactElement } from "react";

import { cn } from "../lib/cn";
import { useMobile } from "../lib/screen";
import { toDate, type DateInput } from "../lib/date";
import { isoFromDate } from "../shared/date";

type CalendarBase = Omit<
  PropsBase,
  "mode" | "required" | "startMonth" | "endMonth" | "selected" | "onSelect"
> & {
  /**
   * Primeiro mes que a navegacao alcanca.
   * @deprecated Use `min`, que para a navegacao no mesmo mes e ainda bloqueia os dias antes dele.
   */
  startMonth?: Date;
  /**
   * Ultimo mes que a navegacao alcanca.
   * @deprecated Use `max`, que para a navegacao no mesmo mes e ainda bloqueia os dias depois dele.
   */
  endMonth?: Date;
};

type DayBounds = {
  /**
   * O primeiro dia que pode ser escolhido, inclusive, em `Date` ou `aaaa-mm-dd`.
   * Os dias antes dele ficam desabilitados e a navegacao para no mes dele.
   */
  min?: Date | string;
  /**
   * O ultimo dia que pode ser escolhido, inclusive, em `Date` ou `aaaa-mm-dd`.
   * Os dias depois dele ficam desabilitados e a navegacao para no mes dele.
   */
  max?: Date | string;
};

type CountBounds = {
  /**
   * O primeiro dia que pode ser escolhido, inclusive, em `Date` ou `aaaa-mm-dd`.
   * Em `range` e `multiple`, um numero continua sendo o minimo de dias da escolha.
   */
  min?: Date | string | number;
  /**
   * O ultimo dia que pode ser escolhido, inclusive, em `Date` ou `aaaa-mm-dd`.
   * Em `range` e `multiple`, um numero continua sendo o maximo de dias da escolha.
   */
  max?: Date | string | number;
};

type Unselected = Pick<
  Exclude<ComponentProps<typeof DayPicker>, { mode: "single" | "multiple" | "range" }>,
  "mode" | "required"
>;

type NoValue = { value?: undefined; onValueChange?: undefined };

type DateValue = Unselected & {
  /**
   * O dia escolhido, em `Date` ou `aaaa-mm-dd`. Quem passa texto recebe texto
   * no `onValueChange`; `null` e texto sem dia.
   */
  value?: Date;
  /**
   * Chamado com o dia tocado, no mesmo formato do `value`. Tocar de novo no
   * dia escolhido nao desmarca.
   */
  onValueChange?: (value: Date) => void;
};

type IsoValue = Unselected & {
  value: string | null;
  onValueChange?: (value: string) => void;
};

type LegacySingle<P extends PropsSingle | PropsSingleRequired> = Omit<P, "selected" | "onSelect"> &
  NoValue & {
    /** @deprecated Use `value`, que aceita `Date` ou `aaaa-mm-dd`. */
    selected?: P["selected"];
    /** @deprecated Use `onValueChange`. */
    onSelect?: P["onSelect"];
  };

type LegacyMany<P extends PropsMulti | PropsMultiRequired | PropsRange | PropsRangeRequired> = Omit<
  P,
  "min" | "max" | "selected" | "onSelect"
> &
  NoValue &
  CountBounds & {
    /** Os dias escolhidos: uma lista em `multiple`, um `{ from, to }` em `range`. */
    selected?: P["selected"];
    /** Chamado a cada clique, com a escolha inteira no formato do `selected`. */
    onSelect?: P["onSelect"];
  };

export type CalendarDateProps = CalendarBase & DateValue & DayBounds;

export type CalendarIsoProps = CalendarBase & IsoValue & DayBounds;

export type CalendarSelectionProps = CalendarBase &
  (
    | (LegacySingle<PropsSingle> & DayBounds)
    | (LegacySingle<PropsSingleRequired> & DayBounds)
    | LegacyMany<PropsMulti>
    | LegacyMany<PropsMultiRequired>
    | LegacyMany<PropsRange>
    | LegacyMany<PropsRangeRequired>
  );

export type CalendarProps = CalendarDateProps | CalendarIsoProps | CalendarSelectionProps;

type CalendarRuntimeProps = CalendarBase & {
  mode?: PropsBase["mode"];
  required?: boolean;
  selected?: unknown;
  onSelect?: unknown;
  value?: DateInput | null;
  onValueChange?: (value: never) => void;
  min?: Date | string | number;
  max?: Date | string | number;
};

const CHEVRONS = {
  left: ChevronLeft,
  right: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
} as const;

const FAR_PAST = () => new Date(new Date().getFullYear() - 100, 0);

const FAR_FUTURE = () => new Date(new Date().getFullYear() + 10, 11);

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function withBounds(disabled: PropsBase["disabled"], lower?: Date, upper?: Date) {
  const bounds: Matcher[] = [];
  if (lower) bounds.push({ before: lower });
  if (upper) bounds.push({ after: upper });
  if (bounds.length === 0) return disabled;
  if (disabled === undefined) return bounds;
  return [...(Array.isArray(disabled) ? disabled : [disabled]), ...bounds];
}

export function Calendar(props: CalendarDateProps): ReactElement;
export function Calendar(props: CalendarIsoProps): ReactElement;
export function Calendar(props: CalendarSelectionProps): ReactElement;
export function Calendar(props: CalendarProps): ReactElement;
export function Calendar(props: CalendarProps): ReactElement {
  const {
    className,
    classNames,
    locale = ptBR,
    numberOfMonths,
    captionLayout = "dropdown",
    startMonth,
    endMonth,
    formatters,
    animate = true,
    disabled,
    value,
    onValueChange,
    min,
    max,
    ...rest
  } = props as CalendarRuntimeProps;
  const isMobile = useMobile();

  const lower = typeof min === "number" ? undefined : toDate(min);
  const upper = typeof max === "number" ? undefined : toDate(max);
  const counts = {
    ...(typeof min === "number" ? { min } : {}),
    ...(typeof max === "number" ? { max } : {}),
  };

  const valued = value !== undefined || onValueChange !== undefined;
  const iso = typeof value === "string" || value === null;
  const chosen = toDate(value);
  const emit = onValueChange as ((next: DateInput) => void) | undefined;

  const selection = valued
    ? {
        mode: "single" as const,
        required: true as const,
        selected: chosen,
        defaultMonth: rest.defaultMonth ?? chosen ?? lower,
        onSelect: (day: Date) => emit?.(iso ? isoFromDate(day) : day),
      }
    : counts;

  return (
    <DayPicker
      locale={locale}
      numberOfMonths={isMobile ? 1 : numberOfMonths}
      captionLayout={captionLayout}
      animate={animate}
      startMonth={startMonth ?? (lower ? firstOfMonth(lower) : FAR_PAST())}
      endMonth={endMonth ?? (upper ? firstOfMonth(upper) : FAR_FUTURE())}
      formatters={{
        formatWeekdayName: (dia, options, lib) =>
          lib
            ? lib.format(dia, "EEEEE", options).toUpperCase()
            : dia.toLocaleDateString("pt-BR", { weekday: "narrow" }).toUpperCase(),
        ...formatters,
      }}
      {...(rest as ComponentProps<typeof DayPicker>)}
      {...selection}
      disabled={withBounds(disabled, lower, upper)}
      className={cn("font-sans text-fg", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-3",

        nav: "absolute inset-x-0 top-0 flex h-8 items-center justify-between",
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-md",
          "text-fg-muted transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
          "hover:bg-accent-subtle hover:text-fg",
          "aria-disabled:pointer-events-none aria-disabled:text-fg-disabled",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-md",
          "text-fg-muted transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
          "hover:bg-accent-subtle hover:text-fg",
          "aria-disabled:pointer-events-none aria-disabled:text-fg-disabled",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ),

        month_caption: "flex h-8 items-center justify-center px-10",
        caption_label: cn(
          "inline-flex items-center gap-1 text-sm font-rc-medium whitespace-nowrap",
          "text-fg capitalize",
        ),
        dropdowns: "flex items-center gap-1",
        dropdown_root: cn(
          "relative inline-flex flex-nowrap items-center gap-1 rounded-md px-2 py-1",
          "text-sm font-rc-medium whitespace-nowrap text-fg",
          "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
          "hover:bg-accent-subtle",
          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        ),
        dropdown: "absolute inset-0 cursor-pointer opacity-0",

        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-[min(2.75rem,calc((100vw_-_3.5rem)/7))] text-xs font-rc-regular text-fg-subtle sm:w-[var(--rc-day)]",
        weeks: "",
        week: "mt-1 flex w-full",

        day: "relative size-[min(2.75rem,calc((100vw_-_3.5rem)/7))] p-0 text-center sm:size-[var(--rc-day)]",
        day_button: cn(
          "size-[min(2.75rem,calc((100vw_-_3.5rem)/7))] rounded-md text-base text-fg sm:size-[var(--rc-day)]",
          "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
          "hover:bg-accent-subtle",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none",
        ),

        today: cn("[&>button]:font-rc-medium", "[&:not(.rc-day-selected)>button]:text-accent-text"),
        outside: "[&>button]:text-fg-subtle",
        disabled: "[&>button]:text-fg-disabled",
        hidden: "invisible",

        selected: cn(
          "rc-day-selected",
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

        weeks_after_enter: "animate-shift-in-next",
        weeks_before_enter: "animate-shift-in-previous",
        weeks_before_exit: "animate-shift-out-next",
        weeks_after_exit: "animate-shift-out-previous",
        caption_after_enter: "animate-appear",
        caption_before_enter: "animate-appear",
        caption_after_exit: "animate-vanish",
        caption_before_exit: "animate-vanish",

        ...classNames,
      }}
      components={{
        Chevron: ({ orientation = "right", size: _size, disabled: _disabled, ...chevron }) => {
          const Chevron = CHEVRONS[orientation];
          return <Chevron {...chevron} size={16} aria-hidden="true" />;
        },
        ...rest.components,
      }}
    />
  );
}
