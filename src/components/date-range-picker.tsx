"use client";

import { CalendarDays } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";

import { useState, type ComponentProps, type ReactElement } from "react";

import { cn } from "../lib/cn";
import { formatDate, toDate, type DateInput } from "../lib/date";
import { isoFromDate } from "../shared/date";
import { Button } from "./button";
import { Calendar, type CalendarProps } from "./calendar";
import { CalendarPanel } from "./calendar-panel";
import type { CalendarPassthrough } from "./date-picker";
import { inputVariants } from "./field";

export type DateRange = {
  /** O primeiro dia. */
  from: Date;
  /** O ultimo dia. Igual ao `from` num periodo de um dia so. */
  to: Date;
};

export type IsoDateRange = {
  /** O primeiro dia, em `aaaa-mm-dd`. */
  from: string;
  /** O ultimo dia, em `aaaa-mm-dd`. */
  to: string;
};

type DateRangePickerDateValue = {
  /**
   * O intervalo escolhido, quando quem usa controla o estado. Com `Date`, o
   * vazio e `undefined`, porque `null` no `value` escolhe o formato em texto:
   * guarde `DateRange | null` e passe `value={periodo ?? undefined}`.
   */
  value?: DateRange;
  /** O intervalo inicial, quando o componente controla o proprio estado. */
  defaultValue?: DateRange;
  /**
   * Chamado com o intervalo fechado nas duas pontas, ou com `null` quando a
   * escolha esvazia. O intervalo pela metade fica no calendario e nunca sai.
   */
  onValueChange?: (range: DateRange | null) => void;
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
     * Rodape com Limpar e Aplicar. Ligado por padrao, ao contrario do
     * `DatePicker`, porque periodo pede dois cliques: o primeiro ja fecha um
     * periodo de um dia e o segundo estica ate o fim, entao sem confirmar o
     * `onValueChange` sai duas vezes e um filtro recarrega a listagem duas
     * vezes. Desligado, nao ha Limpar: clicar de novo no periodo de um dia e o
     * que esvazia.
     */
    confirm?: boolean;
    /**
     * Os textos da peca, para trocar o idioma: `title` e o titulo do painel,
     * `clear` e `apply` os dois botoes do rodape do `confirm`. Os nomes dos
     * meses e dos dias vem do `locale`. Passe so os que mudam.
     */
    labels?: Partial<DateRangePickerLabels>;
  };

export type DateRangePickerLabels = {
  title: string;
  clear: string;
  apply: string;
};

const LABELS: DateRangePickerLabels = {
  title: "Escolher período",
  clear: "Limpar",
  apply: "Aplicar",
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

function toRange(input: RangeInput | null | undefined): DayPickerRange | undefined {
  if (!input) return undefined;
  const from = toDate(input.from);
  if (!from) return undefined;
  return { from, to: toDate(input.to) };
}

const isIsoRange = (input: RangeInput | null | undefined) =>
  input === null || typeof input?.from === "string";

const isClosed = (range: DayPickerRange | undefined): range is DateRange =>
  range?.from !== undefined && range.to !== undefined;

export function DateRangePicker(props: DateRangePickerDateProps): ReactElement;
export function DateRangePicker(props: DateRangePickerIsoProps): ReactElement;
export function DateRangePicker(props: DateRangePickerProps): ReactElement;
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
    showOutsideDays,
    confirm = true,
    min,
    max,
    labels: labelsProp,
    ...rest
  } = props as DateRangePickerRuntimeProps;
  const labels = { ...LABELS, ...labelsProp };
  const iso = isIsoRange(value) || isIsoRange(defaultValue);
  const controlled = value !== undefined;
  const [internalRange, setInternalRange] = useState<DayPickerRange | undefined>(() =>
    toRange(defaultValue),
  );
  const [seenValue, setSeenValue] = useState(value);
  if (seenValue !== value) {
    setSeenValue(value);
    if (value === undefined) setInternalRange(undefined);
  }
  const range = controlled ? toRange(value) : internalRange;
  const emit = onValueChange as ((next: IsoDateRange | DateRange | null) => void) | undefined;

  const [isOpen, setAberto] = useState(false);
  const [draft, setRascunho] = useState<DayPickerRange | undefined>(range);
  const picked = isOpen ? draft : range;

  const label = describe(range) ?? placeholder;
  const empty = describe(range) === undefined;

  function change(next: DateRange | null) {
    setInternalRange(next ?? undefined);
    setRascunho(next ?? undefined);
    if (next === null) {
      emit?.(null);
      return;
    }
    emit?.(iso ? { from: isoFromDate(next.from), to: isoFromDate(next.to) } : next);
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
      title={labels.title}
      align="start"
      footer={
        confirm && (
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                change(null);
                setAberto(false);
              }}
            >
              {labels.clear}
            </Button>
            <Button
              size="sm"
              disabled={!isClosed(draft)}
              onClick={() => {
                if (isClosed(draft)) change(draft);
                setAberto(false);
              }}
            >
              {labels.apply}
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
        showOutsideDays={showOutsideDays}
        min={min}
        max={max}
        onSelect={(next) => {
          setRascunho(next);
          if (confirm) return;
          if (next === undefined) change(null);
          else if (isClosed(next)) change(next);
        }}
        autoFocus
      />
    </CalendarPanel>
  );
}

function describe(range: DayPickerRange | undefined): string | undefined {
  if (!range?.from) return undefined;
  const start = formatDate(range.from);
  if (!range.to) return `${start} – ...`;
  return `${start} – ${formatDate(range.to)}`;
}
