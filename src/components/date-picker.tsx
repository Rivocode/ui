"use client";

import { CalendarDays } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { formatDate, parseDate, applyDateMask } from "../lib/date";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { CalendarPanel } from "./calendar-panel";
import { Input } from "./field";

export type CalendarPassthrough = Pick<
  ComponentProps<typeof Calendar>,
  "locale" | "startMonth" | "endMonth" | "showOutsideDays"
>;

export type DatePickerProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "onValueChange" | "size"
> &
  CalendarPassthrough & {
    /** A data escolhida, quando quem usa controla o estado. */
    value?: Date;
    /** A data inicial, quando o componente controla o proprio estado. */
    defaultValue?: Date;
    /** Chamado quando a data muda, pela digitacao ou pelo Aplicar. */
    onValueChange?: (date: Date | undefined) => void;
    /** Tamanho do campo, o mesmo vocabulario do Input. */
    size?: "sm" | "md" | "lg";
    /** Dias que nao podem ser escolhidos. Vai direto para o calendario. */
    disabledDays?: ComponentProps<typeof Calendar>["disabled"];
    /**
     * Sem rodape, o clique no dia ja vale e o painel fecha. Ligue quando a
     * escolha dispara trabalho caro, como recarregar uma listagem.
     */
    confirm?: boolean;
  };

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  size,
  className,
  placeholder = "dd/mm/aaaa",
  disabled,
  disabledDays,
  locale,
  startMonth,
  endMonth,
  showOutsideDays,
  confirm,
  name,
  onBlur,
  ...props
}: DatePickerProps) {
  const controlled = value !== undefined;
  const [internalDate, setInternalDate] = useState<Date | undefined>(defaultValue);
  const date = controlled ? value : internalDate;

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
    onValueChange?.(nova);
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
        {...props}
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
          if (lida || masked === "") changeDate(lida);
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
          mode="single"
          selected={picked}
          month={mes}
          onMonthChange={setMes}
          onSelect={(nova) => {
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
          startMonth={startMonth}
          endMonth={endMonth}
          showOutsideDays={showOutsideDays}
          autoFocus
        />
      </CalendarPanel>

      {name && (
        <input
          type="hidden"
          name={name}
          value={date ? formatDate(date).split("/").reverse().join("-") : ""}
        />
      )}
    </div>
  );
}
