"use client";

import { CalendarDays } from "lucide-react";
import { useState, type ComponentProps, type ReactElement } from "react";
import { dateMatchModifiers } from "react-day-picker";

import { cn } from "../lib/cn";
import { formatDate, parseDate, applyDateMask, toDate, type DateInput } from "../lib/date";
import { isoFromDate } from "../shared/date";
import { Button } from "./button";
import { Calendar, type CalendarProps } from "./calendar";
import { CalendarPanel } from "./calendar-panel";
import { Input } from "./field";

export type CalendarPassthrough = Pick<CalendarProps, "locale" | "showOutsideDays">;

type DatePickerDateValue = {
  /**
   * The chosen date, when the consumer controls the state. Accepts a `Date` or
   * `aaaa-mm-dd`, and `onValueChange` answers in the same format.
   */
  value?: Date;
  /** The initial date, when the component controls its own state. `Date` or `aaaa-mm-dd`. */
  defaultValue?: Date;
  /**
   * Called when the date changes, by typing or by Aplicar. With a `Date`,
   * `undefined` comes when the field empties; with `aaaa-mm-dd`, `""` comes.
   */
  onValueChange?: (date: Date | undefined) => void;
};

type DatePickerIsoValue =
  | { value: string | null; defaultValue?: undefined; onValueChange?: (value: string) => void }
  | { value?: undefined; defaultValue: string; onValueChange?: (value: string) => void };

type DatePickerBase = Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "onValueChange" | "size" | "min" | "max"
> &
  CalendarPassthrough & {
    /** The field's size, the same vocabulary as Input. */
    size?: "sm" | "md" | "lg";
    /**
     * The first accepted day, inclusive, as a `Date` or `aaaa-mm-dd`. Applies to the
     * calendar and to what is typed.
     */
    min?: Date | string;
    /**
     * The last accepted day, inclusive, as a `Date` or `aaaa-mm-dd`. Applies to the
     * calendar and to what is typed.
     */
    max?: Date | string;
    /** Days that cannot be picked, neither in the calendar nor typed into the field. */
    disabledDays?: CalendarProps["disabled"];
    /**
     * Footer with Limpar and Aplicar. Off by default, unlike
     * `DateRangePicker`: a single date is picked in one click, so the click on the
     * day already counts and the panel closes, with no double output to avoid. Turn it on when the
     * choice triggers expensive work, like reloading a listing.
     */
    confirm?: boolean;
    /**
     * The piece's texts, to change the language: `open` is the name of the calendar
     * button, `title` the panel's title, `clear` and `apply` the two buttons
     * of the `confirm` footer. The month and day names come from `locale`.
     * Pass only the ones that change.
     */
    labels?: Partial<DatePickerLabels>;
  };

export type DatePickerLabels = {
  open: string;
  title: string;
  clear: string;
  apply: string;
};

const LABELS: DatePickerLabels = {
  open: "Abrir calendário",
  title: "Escolher data",
  clear: "Limpar",
  apply: "Aplicar",
};

export type DatePickerDateProps = DatePickerBase & DatePickerDateValue;

export type DatePickerIsoProps = DatePickerBase & DatePickerIsoValue;

export type DatePickerProps = DatePickerDateProps | DatePickerIsoProps;

type DatePickerRuntimeProps = DatePickerBase & {
  value?: DateInput | null;
  defaultValue?: DateInput;
  onValueChange?: (date: never) => void;
};

export function DatePicker(props: DatePickerDateProps): ReactElement;
export function DatePicker(props: DatePickerIsoProps): ReactElement;
export function DatePicker(props: DatePickerProps): ReactElement;
export function DatePicker(props: DatePickerProps): ReactElement {
  const {
    value,
    defaultValue,
    onValueChange,
    size,
    className,
    placeholder = "dd/mm/aaaa",
    disabled,
    disabledDays,
    locale,
    showOutsideDays,
    confirm,
    name,
    onBlur,
    min,
    max,
    labels: labelsProp,
    ...rest
  } = props as DatePickerRuntimeProps;
  const labels = { ...LABELS, ...labelsProp };
  const iso = typeof value === "string" || value === null || typeof defaultValue === "string";
  const controlled = value !== undefined;
  const [internalDate, setInternalDate] = useState<Date | undefined>(() => toDate(defaultValue));
  const [seenValue, setSeenValue] = useState(value);
  if (seenValue !== value) {
    setSeenValue(value);
    if (value === undefined) setInternalDate(undefined);
  }
  const date = controlled ? toDate(value) : internalDate;
  const emit = onValueChange as ((next: DateInput | undefined) => void) | undefined;

  const lower = toDate(min);
  const upper = toDate(max);
  const allowed = (day: Date) =>
    (!lower || isoFromDate(day) >= isoFromDate(lower)) &&
    (!upper || isoFromDate(day) <= isoFromDate(upper)) &&
    (disabledDays === undefined || !dateMatchModifiers(day, disabledDays));

  const [text, setText] = useState(() => formatDate(date));
  const [rawText, setRawText] = useState(false);
  const [isOpen, setAberto] = useState(false);

  const [draft, setRascunho] = useState<Date | undefined>(date);
  const picked = confirm && isOpen ? draft : date;

  const [mes, setMes] = useState<Date>(() => date ?? new Date());

  const displayText = rawText ? text : formatDate(date);

  function changeDate(nova: Date | undefined) {
    if (!controlled) setInternalDate(nova);
    setRascunho(nova);
    if (nova) setMes(nova);
    emit?.(iso ? (nova ? isoFromDate(nova) : "") : nova);
  }

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      aria-label={labels.open}
      className={cn(
        "absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2",
        "items-center justify-center rounded-md text-fg-muted",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "disabled:pointer-events-none disabled:text-fg-disabled",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <CalendarDays size={16} aria-hidden="true" />
    </button>
  );

  return (
    <div className={cn("relative", className)}>
      <Input
        {...rest}
        size={size}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={displayText}
        onChange={(event) => {
          const masked = applyDateMask(event.target.value);
          setText(masked);
          setRawText(true);

          const lida = parseDate(masked);
          if ((lida && allowed(lida)) || masked === "") changeDate(lida);
        }}
        onBlur={(event) => {
          setRawText(false);
          onBlur?.(event);
        }}
        className="pr-10"
      />

      <CalendarPanel
        open={isOpen}
        onOpenChange={(abrir) => {
          setAberto(abrir);
          if (abrir) {
            setRascunho(date);
            if (date) setMes(date);
          }
        }}
        trigger={trigger}
        title={labels.title}
        align="end"
        footer={
          confirm && (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  changeDate(undefined);
                  setAberto(false);
                }}
              >
                {labels.clear}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!draft}
                onClick={() => {
                  changeDate(draft);
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
          value={picked}
          month={mes}
          onMonthChange={setMes}
          onValueChange={(nova) => {
            setRawText(false);
            if (confirm) {
              setRascunho(nova);
              return;
            }
            changeDate(nova);
            setAberto(false);
          }}
          disabled={disabledDays}
          locale={locale}
          showOutsideDays={showOutsideDays}
          min={min}
          max={max}
          autoFocus
        />
      </CalendarPanel>

      {name && <input type="hidden" name={name} value={date ? isoFromDate(date) : ""} />}
    </div>
  );
}
