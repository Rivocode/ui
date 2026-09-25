"use client";

import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { useState, type ComponentProps, type ReactElement } from "react";

import { cn } from "../lib/cn";
import { formatDate, toDate, type DateInput } from "../lib/date";
import { isoFromDate } from "../shared/date";
import { Button } from "./button";
import { Calendar, type CalendarProps } from "./calendar";
import { CalendarPanel } from "./calendar-panel";
import type { CalendarPassthrough } from "./date-picker";
import { inputVariants } from "./field";

export type { DateRange };

export type IsoDateRange = {
  /** O primeiro dia, em `aaaa-mm-dd`. */
  from: string;
  /** O ultimo dia, em `aaaa-mm-dd`. */
  to: string;
};

type DateRangePickerDateValue = {
  /**
   * O intervalo escolhido, quando quem usa controla o estado. Aceita pontas em
   * `Date` ou em `aaaa-mm-dd`, e o `onValueChange` responde no mesmo formato.
   */
  value?: DateRange;
  /** O intervalo inicial, quando o componente controla o proprio estado. */
  defaultValue?: DateRange;
  /**
   * Chamado quando o intervalo muda. Com `Date`, vem incompleto entre o
   * primeiro e o segundo clique e `undefined` no Limpar; com `aaaa-mm-dd`, so
   * vem fechado, e `null` no Limpar.
   */
  onValueChange?: (range: DateRange | undefined) => void;
};

type DateRangePickerIsoValue =
  | {
      value: IsoDateRange | null;
      defaultValue?: undefined;
      onValueChange?: (range: IsoDateRange | null) => void;
    }
  | {
      value?: undefined;
      defaultValue: IsoDateRange | null;
      onValueChange?: (range: IsoDateRange | null) => void;
    };

type DateRangePickerBase = Omit<ComponentProps<"button">, "value" | "defaultValue" | "onChange"> &
  CalendarPassthrough & {
    /** Texto do gatilho quando nao ha intervalo. */
    placeholder?: string;
    /** Tamanho do gatilho, o mesmo vocabulario do Input. */
    size?: "sm" | "md" | "lg";
    /** O primeiro dia aceito, inclusive, em `Date` ou `aaaa-mm-dd`. */
    min?: Date | string;
    /** O ultimo dia aceito, inclusive, em `Date` ou `aaaa-mm-dd`. */
    max?: Date | string;
    /** Quantos meses o calendario mostra lado a lado. No celular e sempre um. */
    numberOfMonths?: number;
    /** Dias que nao podem ser escolhidos. */
    disabledDays?: CalendarProps["disabled"];
    /**
     * Rodape com Aplicar. Ligado por padrao: filtro de periodo quase sempre
     * recarrega listagem, e sem confirmar ele recarregaria duas vezes, uma no
     * primeiro clique e outra no segundo.
     */
    confirm?: boolean;
  };

export type DateRangePickerDateProps = DateRangePickerBase & DateRangePickerDateValue;

export type DateRangePickerIsoProps = DateRangePickerBase & DateRangePickerIsoValue;

export type DateRangePickerProps = DateRangePickerDateProps | DateRangePickerIsoProps;

type RangeInput = { from?: DateInput; to?: DateInput };

type DateRangePickerRuntimeProps = DateRangePickerBase & {
  value?: RangeInput | null;
  defaultValue?: RangeInput | null;
  onValueChange?: (range: never) => void;
};

function toRange(input: RangeInput | null | undefined): DateRange | undefined {
  if (!input) return undefined;
  const from = toDate(input.from);
  if (!from) return undefined;
  return { from, to: toDate(input.to) };
}

const isIsoRange = (input: RangeInput | null | undefined) =>
  input === null || typeof input?.from === "string";

export function DateRangePicker(props: DateRangePickerDateProps): ReactElement;
export function DateRangePicker(props: DateRangePickerIsoProps): ReactElement;
export function DateRangePicker(props: DateRangePickerProps): ReactElement {
  const {
    value,
    defaultValue,
    onValueChange,
    placeholder = "Escolha o período",
    size,
    className,
    disabled,
    disabledDays,
    numberOfMonths = 2,
    locale,
    startMonth,
    endMonth,
    showOutsideDays,
    confirm = true,
    min,
    max,
    ...rest
  } = props as DateRangePickerRuntimeProps;
  const iso = isIsoRange(value) || isIsoRange(defaultValue);
  const controlled = value !== undefined;
  const [internalRange, setInternalRange] = useState<DateRange | undefined>(() =>
    toRange(defaultValue),
  );
  const range = controlled ? toRange(value) : internalRange;
  const emit = onValueChange as
    | ((next: IsoDateRange | DateRange | null | undefined) => void)
    | undefined;

  const [isOpen, setAberto] = useState(false);
  const [draft, setRascunho] = useState<DateRange | undefined>(range);
  const pending = iso && draft?.from !== undefined && draft.to === undefined;
  const picked = isOpen && (confirm || pending) ? draft : range;

  const label = describe(range) ?? placeholder;
  const empty = describe(range) === undefined;

  function change(next: DateRange | undefined) {
    if (!controlled) setInternalRange(next);
    setRascunho(next);
    if (!iso) {
      emit?.(next);
      return;
    }
    emit?.(
      next?.from && next.to ? { from: isoFromDate(next.from), to: isoFromDate(next.to) } : null,
    );
  }

  const trigger = (
    <button
      {...rest}
      type="button"
      disabled={disabled}
      className={cn(
        inputVariants({ size }),
        "flex items-center justify-between gap-2 text-left",
        empty && "text-fg-subtle",
        className,
      )}
    >
      <span title={empty ? undefined : label} className="truncate">
        {label}
      </span>
      <CalendarDays size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
    </button>
  );

  return (
    <CalendarPanel
      open={isOpen}
      onOpenChange={(abrir) => {
        setAberto(abrir);
        if (abrir) setRascunho(range);
      }}
      trigger={trigger}
      title="Escolher período"
      align="start"
      footer={
        confirm && (
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                change(undefined);
                setAberto(false);
              }}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              disabled={!draft?.from || !draft.to}
              onClick={() => {
                change(draft);
                setAberto(false);
              }}
            >
              Aplicar
            </Button>
          </div>
        )
      }
    >
      <Calendar
        mode="range"
        selected={picked}
        defaultMonth={picked?.from}
        numberOfMonths={numberOfMonths}
        disabled={disabledDays}
        locale={locale}
        startMonth={startMonth}
        endMonth={endMonth}
        showOutsideDays={showOutsideDays}
        min={min}
        max={max}
        onSelect={(next) => {
          if (confirm || (iso && next?.from && !next.to)) {
            setRascunho(next);
            return;
          }
          change(next);
        }}
        autoFocus
      />
    </CalendarPanel>
  );
}

function describe(range: DateRange | undefined): string | undefined {
  if (!range?.from) return undefined;
  const start = formatDate(range.from);
  if (!range.to) return `${start} \u2013 ...`;
  return `${start} \u2013 ${formatDate(range.to)}`;
}
