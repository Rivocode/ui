"use client";

import { CalendarDays } from "lucide-react";
import { useState, type ComponentProps, type ReactElement } from "react";

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
   * A data escolhida, quando quem usa controla o estado. Aceita `Date` ou
   * `aaaa-mm-dd`, e o `onValueChange` responde no mesmo formato.
   */
  value?: Date;
  /** A data inicial, quando o componente controla o proprio estado. `Date` ou `aaaa-mm-dd`. */
  defaultValue?: Date;
  /**
   * Chamado quando a data muda, pela digitacao ou pelo Aplicar. Com `Date`,
   * vem `undefined` quando o campo esvazia; com `aaaa-mm-dd`, vem `""`.
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
    /** Tamanho do campo, o mesmo vocabulario do Input. */
    size?: "sm" | "md" | "lg";
    /**
     * O primeiro dia aceito, inclusive, em `Date` ou `aaaa-mm-dd`. Vale para o
     * calendario e para o que se digita.
     */
    min?: Date | string;
    /**
     * O ultimo dia aceito, inclusive, em `Date` ou `aaaa-mm-dd`. Vale para o
     * calendario e para o que se digita.
     */
    max?: Date | string;
    /** Dias que nao podem ser escolhidos. Vai direto para o calendario. */
    disabledDays?: CalendarProps["disabled"];
    /**
     * Sem rodape, o clique no dia ja vale e o painel fecha. Ligue quando a
     * escolha dispara trabalho caro, como recarregar uma listagem.
     */
    confirm?: boolean;
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
    ...rest
  } = props as DatePickerRuntimeProps;
  const iso = typeof value === "string" || value === null || typeof defaultValue === "string";
  const controlled = value !== undefined;
  const [internalDate, setInternalDate] = useState<Date | undefined>(() => toDate(defaultValue));
  const date = controlled ? toDate(value) : internalDate;
  const emit = onValueChange as ((next: DateInput | undefined) => void) | undefined;

  const lower = toDate(min);
  const upper = toDate(max);
  const allowed = (day: Date) =>
    (!lower || isoFromDate(day) >= isoFromDate(lower)) &&
    (!upper || isoFromDate(day) <= isoFromDate(upper));

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
      aria-label="Abrir calendário"
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
        title="Escolher data"
        align="end"
        footer={
          confirm && (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  changeDate(undefined);
                  setAberto(false);
                }}
              >
                Limpar
              </Button>
              <Button
                size="sm"
                disabled={!draft}
                onClick={() => {
                  changeDate(draft);
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
