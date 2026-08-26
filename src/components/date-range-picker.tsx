"use client";

import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { formatDate } from "../lib/date";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { CalendarPanel } from "./calendar-panel";
import type { CalendarPassthrough } from "./date-picker";
import { inputVariants } from "./field";

export type { DateRange };

export type DateRangePickerProps = Omit<
  ComponentProps<"button">,
  "value" | "defaultValue" | "onChange"
> &
  CalendarPassthrough & {
    /** O intervalo escolhido, quando quem usa controla o estado. */
    value?: DateRange;
    /** O intervalo inicial, quando o componente controla o proprio estado. */
    defaultValue?: DateRange;
    /** Chamado quando o intervalo muda. Vem incompleto entre o primeiro e o segundo clique. */
    onValueChange?: (range: DateRange | undefined) => void;
    /** Texto do gatilho quando nao ha intervalo. */
    placeholder?: string;
    /** Tamanho do gatilho, o mesmo vocabulario do Input. */
    size?: "sm" | "md" | "lg";
    /** Quantos meses o calendario mostra lado a lado. No celular e sempre um. */
    numberOfMonths?: number;
    /** Dias que nao podem ser escolhidos. */
    disabledDays?: ComponentProps<typeof Calendar>["disabled"];
    /**
     * Rodape com Aplicar. Ligado por padrao: filtro de periodo quase sempre
     * recarrega listagem, e sem confirmar ele recarregaria duas vezes, uma no
     * primeiro clique e outra no segundo.
     */
    confirm?: boolean;
  };

/**
 * Intervalo de datas, para filtro de relatorio e de listagem.
 *
 * Aqui nao ha digitacao, e essa e a diferenca de proposito para o DatePicker.
 * Mask de intervalo pede duas datas num campo so, e o custo de acertar
 * teclado, colagem e ordem invertida nao se paga: quem escolhe periodo quase
 * sempre esta comparando semanas na tela, nao repetindo uma data que sabe de
 * cabeca.
 *
 * O intervalo chega incompleto no `onValueChange` entre o primeiro e o segundo
 * clique, com `from` e sem `to`. E de proposito: a tela que mostra o resumo do
 * filtro precisa acompanhar a escolha enquanto ela acontece.
 */
export function DateRangePicker({
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
  ...props
}: DateRangePickerProps) {
  const controlled = value !== undefined;
  const [internalRange, setIntervaloInterno] = useState<DateRange | undefined>(defaultValue);
  const range = controlled ? value : internalRange;

  const [isOpen, setAberto] = useState(false);
  const [draft, setRascunho] = useState<DateRange | undefined>(range);
  const picked = confirm && isOpen ? draft : range;

  const label = describe(range) ?? placeholder;
  const empty = describe(range) === undefined;

  function change(next: DateRange | undefined) {
    if (!controlled) setIntervaloInterno(next);
    setRascunho(next);
    onValueChange?.(next);
  }

  const trigger = (
    <button
      {...props}
      type="button"
      disabled={disabled}
      className={cn(
        inputVariants({ size }),
        "flex items-center justify-between gap-2 text-left",
        empty && "text-fg-subtle",
        className,
      )}
    >
      {/*
        * Duas datas por extenso num gatilho `sm` cortam, e o periodo escolhido
        * e justamente o que a pessoa precisa reler antes de confiar no filtro.
        * O `title` sai do proprio intervalo; vazio e o placeholder, texto do
        * desenvolvedor, que nao ganha dica.
        */}
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
              // So com o intervalo fechado: aplicar com meia escolha mandaria
              // para a listagem um periodo que comeca e nao termina.
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
        onSelect={(next) => {
          if (confirm) {
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

/** `undefined` quando nao ha nada para mostrar, para o gatilho cair no placeholder. */
function describe(range: DateRange | undefined): string | undefined {
  if (!range?.from) return undefined;
  const start = formatDate(range.from);
  if (!range.to) return `${start} \u2013 ...`;
  return `${start} \u2013 ${formatDate(range.to)}`;
}
