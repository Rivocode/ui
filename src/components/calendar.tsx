"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useMobile } from "../lib/screen";

export type CalendarProps = ComponentProps<typeof DayPicker>;

const CHEVRONS = {
  left: ChevronLeft,
  right: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
} as const;

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
  const isMobile = useMobile();

  return (
    <DayPicker
      locale={locale}
      numberOfMonths={isMobile ? 1 : numberOfMonths}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      formatters={{
        formatWeekdayName: (dia, options, lib) =>
          lib
            ? lib.format(dia, "EEEEE", options).toUpperCase()
            : dia.toLocaleDateString("pt-BR", { weekday: "narrow" }).toUpperCase(),
        ...formatters,
      }}
      {...props}
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
        dropdown: "absolute inset-0 cursor-pointer opacity-0",

        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-11 text-xs font-normal text-fg-subtle sm:w-[var(--rc-day)]",
        weeks: "",
        week: "mt-1 flex w-full",

        day: "relative size-11 p-0 text-center sm:size-[var(--rc-day)]",
        day_button: cn(
          "size-11 rounded-md text-base text-fg sm:size-[var(--rc-day)]",
          "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
          "hover:bg-accent-subtle",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none",
        ),

        today: cn(
          "[&>button]:font-medium",
          "[&:not(.rc-day-selected)>button]:text-accent-text",
        ),
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

        ...classNames,
      }}
      components={{
        Chevron: ({ orientation = "right", size: _size, disabled: _disabled, ...chevron }) => {
          const Chevron = CHEVRONS[orientation];
          return <Chevron {...chevron} size={16} aria-hidden="true" />;
        },
        ...props.components,
      }}
    />
  );
}
