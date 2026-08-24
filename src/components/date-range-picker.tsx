"use client";

import { CalendarDays } from "lucide-react";
import { useState, type ComponentProps } from "react";
import type { DateRange } from "react-day-picker";

import { cn } from "../lib/cn";
import { formatarData } from "../lib/data";
import { Calendar } from "./calendar";
import { inputVariants } from "./field";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

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
};

/**
 * Intervalo de datas, para filtro de relatorio e de listagem.
 *
 * Aqui nao ha digitacao, e essa e a diferenca de proposito para o DatePicker.
 * Mascara de intervalo pede duas datas num campo so, e o custo de acertar
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
  placeholder = "Escolha o periodo",
  size,
  className,
  disabled,
  disabledDays,
  numberOfMonths = 2,
  locale,
  ...props
}: DateRangePickerProps) {
  const controlado = value !== undefined;
  const [intervaloInterno, setIntervaloInterno] = useState<DateRange | undefined>(defaultValue);
  const intervalo = controlado ? value : intervaloInterno;

  const rotulo = descrever(intervalo) ?? placeholder;
  const vazio = descrever(intervalo) === undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
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
          />
        }
      >
        <span className="truncate">{rotulo}</span>
        <CalendarDays size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto min-w-0 p-3">
        <Calendar
          mode="range"
          selected={intervalo}
          defaultMonth={intervalo?.from}
          numberOfMonths={numberOfMonths}
          disabled={disabledDays}
          locale={locale}
          onSelect={(novo) => {
            if (!controlado) setIntervaloInterno(novo);
            onValueChange?.(novo);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/** `undefined` quando nao ha nada para mostrar, para o gatilho cair no placeholder. */
function descrever(intervalo: DateRange | undefined): string | undefined {
  if (!intervalo?.from) return undefined;
  const inicio = formatarData(intervalo.from);
  if (!intervalo.to) return `${inicio} – ...`;
  return `${inicio} – ${formatarData(intervalo.to)}`;
}
