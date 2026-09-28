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
  /** The first day. */
  from: Date;
  /** The last day. Equal to `from` in a one-day period. */
  to: Date;
};

export type IsoDateRange = {
  /** The first day, in `aaaa-mm-dd`. */
  from: string;
  /** The last day, in `aaaa-mm-dd`. */
  to: string;
};

type DateRangePickerDateValue = {
  /**
   * The chosen range, when the consumer controls the state. With a `Date`, the
   * empty value is `undefined`, because `null` in `value` picks the text format:
   * store `DateRange | null` and pass `value={periodo ?? undefined}`.
   */
  value?: DateRange;
  /** The initial range, when the component controls its own state. */
  defaultValue?: DateRange;
  /**
   * Called with the range closed at both ends, or with `null` when the
   * selection empties. A half-finished range stays in the calendar and never goes out.
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
    /** Trigger text when there is no range. */
    placeholder?: string;
    /** The trigger's size, the same vocabulary as Input. */
    size?: "sm" | "md" | "lg";
    /** The first accepted day, inclusive, as a `Date` or `aaaa-mm-dd`. */
    min?: Date | string;
    /** The last accepted day, inclusive, as a `Date` or `aaaa-mm-dd`. */
    max?: Date | string;
    /** How many months the calendar shows side by side. On the phone it is always one. */
    numberOfMonths?: number;
    /** Days that cannot be picked. */
    disabledDays?: CalendarProps["disabled"];
    /**
     * Footer with Limpar and Aplicar. On by default, unlike
     * `DatePicker`, because a period takes two clicks: the first already closes a
     * one-day period and the second stretches it to the end, so without confirming,
     * `onValueChange` fires twice and a filter reloads the listing twice.
     * When off, there is no Limpar: clicking the one-day period again is
     * what empties it.
     */
    confirm?: boolean;
    /**
     * The piece's texts, to change the language: `title` is the panel's title,
     * `clear` and `apply` the two buttons of the `confirm` footer. The
     * month and day names come from `locale`. Pass only the ones that change.
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
              type="button"
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
              type="button"
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
