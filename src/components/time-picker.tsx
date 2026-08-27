"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { CalendarPanel } from "./calendar-panel";
import { TimeField, formatTime, parseTime, timeWindow } from "./time-field";

type ColumnProps = {
  label: string;
  options: number[];
  selected: number | undefined;
  onSelect: (option: number, closes: boolean) => void;
  className?: string;
  optionClassName?: string;
};

function TimeColumn({
  label,
  options,
  selected,
  onSelect,
  className,
  optionClassName,
}: ColumnProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const found = options.indexOf(selected ?? -1);
  const focusable = found === -1 ? 0 : found;

  useEffect(() => {
    buttons.current[focusable]?.scrollIntoView?.({ block: "nearest" });
  }, []);

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    const last = options.length - 1;
    const steps: Record<string, number | undefined> = {
      ArrowDown: focusable + 1,
      ArrowUp: focusable - 1,
      Home: 0,
      End: last,
    };

    const target = steps[event.key];
    if (target === undefined || target < 0 || target > last) return;

    event.preventDefault();
    buttons.current[target]?.focus();
    onSelect(options[target]!, false);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="px-1 font-sans text-xs text-fg-subtle">{label}</span>
      <div
        role="listbox"
        aria-label={label}
        onKeyDown={walk}
        className={cn(
          "max-h-[40vh] overflow-y-auto rounded-md border border-border p-1",
          "sm:max-h-64",
          className,
        )}
      >
        {options.map((option, index) => (
          <button
            key={option}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="option"
            aria-selected={option === selected}
            tabIndex={index === focusable ? 0 : -1}
            onClick={() => onSelect(option, true)}
            className={cn(
              "flex h-[var(--rc-control-md)] w-full items-center justify-center",
              "rounded-sm font-sans text-base text-fg tabular-nums select-none",
              "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
              "outline-none hover:bg-accent-subtle",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              option === selected && "bg-accent text-accent-fg hover:bg-accent-hover",
              optionClassName,
            )}
          >
            {String(option).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}

export type TimePickerLabels = {
  /** Nome do botao que abre o painel. */
  open?: string;
  /** Titulo lido no celular, onde o painel vira folha e perde o contexto. */
  title?: string;
  /** Nome da coluna das horas. */
  hours?: string;
  /** Nome da coluna dos minutos. */
  minutes?: string;
};

export type TimePickerProps = Omit<ComponentProps<typeof TimeField>, "className" | "classNames"> & {
  /** Veste a moldura que junta campo e botao, e nao o campo. */
  className?: string;
  /** Classe por parte: `field`, `trigger`, `panel`, `column`, `option`. */
  classNames?: Slots<"field" | "trigger" | "panel" | "column" | "option">;
  /** Os textos que o leitor de tela ouve. Cada um tem padrao proprio, e trocar um nao apaga os outros. */
  labels?: TimePickerLabels;
};

export function TimePicker({
  value,
  defaultValue,
  onValueChange,
  step = 15,
  min,
  max,
  disabled,
  className,
  classNames,
  labels,
  ...props
}: TimePickerProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => formatTime(parseTime(defaultValue ?? "")));
  const current = controlled ? value : internal;

  const [isOpen, setOpen] = useState(false);

  const [start, end] = timeWindow(min, max);
  const grid = Math.min(Math.max(Math.round(step), 1), 60);

  const minutesOf = (hour: number) => {
    const list: number[] = [];
    for (let minute = 0; minute < 60; minute += grid) {
      const at = hour * 60 + minute;
      if (at >= start && at <= end) list.push(minute);
    }
    return list;
  };

  const hours: number[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    if (minutesOf(hour).length > 0) hours.push(hour);
  }

  const chosen = parseTime(current ?? "");
  const chosenHour = chosen === undefined ? undefined : Math.floor(chosen / 60);
  const chosenMinute = chosen === undefined ? undefined : chosen % 60;

  function commit(next: string) {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  }

  const columnHour =
    chosenHour !== undefined && minutesOf(chosenHour).length > 0 ? chosenHour : (hours[0] ?? 0);

  function pickHour(hour: number) {
    const keep = chosenMinute ?? minutesOf(hour)[0] ?? 0;
    const at = Math.min(Math.max(hour * 60 + keep, start), end);
    commit(formatTime(at));
  }

  function pickMinute(minute: number, closes: boolean) {
    commit(formatTime(columnHour * 60 + minute));
    if (closes) setOpen(false);
  }

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      aria-label={labels?.open ?? "Abrir seletor de horário"}
      className={cn(
        "absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2",
        "items-center justify-center rounded-md text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "disabled:pointer-events-none disabled:text-fg-disabled",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        classNames?.trigger,
      )}
    >
      <Clock size={16} aria-hidden="true" />
    </button>
  );

  return (
    <div className={cn("relative", className)}>
      <TimeField
        {...props}
        value={current}
        onValueChange={commit}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        className={cn("pr-10", classNames?.field)}
      />

      <CalendarPanel
        open={isOpen}
        onOpenChange={setOpen}
        trigger={trigger}
        title={labels?.title ?? "Escolher horário"}
        align="end"
        className={classNames?.panel}
      >
        <div className="flex w-full gap-2 sm:w-56">
          <TimeColumn
            label={labels?.hours ?? "Hora"}
            options={hours}
            selected={chosenHour}
            onSelect={(hour) => pickHour(hour)}
            className={classNames?.column}
            optionClassName={classNames?.option}
          />
          <TimeColumn
            label={labels?.minutes ?? "Minuto"}
            options={minutesOf(columnHour)}
            selected={chosenMinute}
            onSelect={pickMinute}
            className={classNames?.column}
            optionClassName={classNames?.option}
          />
        </div>
      </CalendarPanel>
    </div>
  );
}
