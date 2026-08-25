"use client";

import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { formatDate } from "../lib/date";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { CalendarPanel } from "./calendar-panel";
import { inputVariants } from "./field";

export type { DateRange };

export type DateRangePickerProps = Omit<
  ComponentProps<"button">,
  "value" | "defaultValue" | "onChange"
> & {
  /** O intervalo escolhido, quando quem usa controla o estado. */
  value?: DateRange;
  /** O intervalo inicial, quando o componente controla o proprio estado. */
  defaultValue?: DateRange;
  /** Chamado quando o intervalo muda. Vem incompleto entre o primeiro e o segundo clique. */
  onValueChange?: (intervalo: DateRange | undefined) => void;
  /** Texto do gatilho quando nao ha intervalo. */
  placeholder?: string;
  /** Tamanho do gatilho, o mesmo vocabulario do Input. */
  size?: "sm" | "md" | "lg";
  /** Quantos meses o calendario mostra lado a lado. No celular e sempre um. */
  numberOfMonths?: number;
  /** Dias que nao podem ser escolhidos. */
  disabledDays?: ComponentProps<typeof Calendar>["disabled"];
  locale?: ComponentProps<typeof Calendar>["locale"];
  /**
   * Rodape com Aplicar. Ligado por padrao: filtro de periodo quase sempre
   * recarrega listagem, e sem confirmar ele recarregaria duas vezes, uma no
   * primeiro clique e outra no segundo.
   */
  confirmar?: boolean;
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
  confirmar = true,
  ...props
}: DateRangePickerProps) {
  const controlled = value !== undefined;
  const [intervaloInterno, setIntervaloInterno] = useState<DateRange | undefined>(defaultValue);
  const intervalo = controlled ? value : intervaloInterno;

  const [isOpen, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<DateRange | undefined>(intervalo);
  const picked = confirmar && isOpen ? rascunho : intervalo;

  const label = descrever(intervalo) ?? placeholder;
  const vazio = descrever(intervalo) === undefined;

  function mudar(novo: DateRange | undefined) {
    if (!controlled) setIntervaloInterno(novo);
    setRascunho(novo);
    onValueChange?.(novo);
  }

  const gatilho = (
    <button
      {...props}
      type="button"
      disabled={disabled}
      className={cn(
        inputVariants({ size }),
        "flex items-center justify-between gap-2 text-left",
        vazio && "text-fg-subtle",
        className,
      )}
    >
      <span className="truncate">{label}</span>
      <CalendarDays size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
    </button>
  );

  return (
    <CalendarPanel
      open={isOpen}
      onOpenChange={(abrir) => {
        setAberto(abrir);
        if (abrir) setRascunho(intervalo);
      }}
      trigger={gatilho}
      title="Escolher período"
      align="start"
      footer={
        confirmar && (
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                mudar(undefined);
                setAberto(false);
              }}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              // So com o intervalo fechado: aplicar com meia escolha mandaria
              // para a listagem um periodo que comeca e nao termina.
              disabled={!rascunho?.from || !rascunho.to}
              onClick={() => {
                mudar(rascunho);
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
        onSelect={(novo) => {
          if (confirmar) {
            setRascunho(novo);
            return;
          }
          mudar(novo);
        }}
        autoFocus
      />
    </CalendarPanel>
  );
}

/** `undefined` quando nao ha nada para mostrar, para o gatilho cair no placeholder. */
function descrever(intervalo: DateRange | undefined): string | undefined {
  if (!intervalo?.from) return undefined;
  const inicio = formatDate(intervalo.from);
  if (!intervalo.to) return `${inicio} \u2013 ...`;
  return `${inicio} \u2013 ${formatDate(intervalo.to)}`;
}
