"use client";

import { CalendarDays } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { formatarData, lerData, mascararData } from "../lib/data";
import { Calendar } from "./calendar";
import { inputVariants } from "./field";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type CalendarPassthrough = Pick<
  ComponentProps<typeof Calendar>,
  "locale" | "startMonth" | "endMonth" | "showOutsideDays"
>;

export type DatePickerProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "size"
> &
  CalendarPassthrough & {
    /** A data escolhida, quando quem usa controla o estado. */
    value?: Date;
    /** A data inicial, quando o componente controla o proprio estado. */
    defaultValue?: Date;
    /** Chamado quando a data muda, pelo calendario ou pela digitacao. */
    onValueChange?: (data: Date | undefined) => void;
    /** Tamanho do campo, o mesmo vocabulario do Input. */
    size?: "sm" | "md" | "lg";
    /** Dias que nao podem ser escolhidos. Vai direto para o calendario. */
    disabledDays?: ComponentProps<typeof Calendar>["disabled"];
  };

/**
 * Campo de data: da para digitar e da para escolher no calendario, e os dois
 * caminhos escrevem o mesmo estado.
 *
 * Digitar vem primeiro de proposito. Quem preenche formulario o dia inteiro
 * digita `03032026` mais rapido do que navega tres meses para tras, e o
 * calendario existe para quem nao sabe a data de cabeca. A mascara garante que
 * o campo nunca chegue num formato que o leitor nao entende.
 *
 * O texto e a data vivem separados porque `03/03/2` e um estado legitimo no
 * meio da digitacao, e nao ha data nenhuma para guardar ainda. Ao sair do
 * campo, texto que nao virou data volta para a ultima data valida, e o campo
 * nunca fica mostrando meia data.
 */
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
  name,
  onBlur,
  ...props
}: DatePickerProps) {
  const controlado = value !== undefined;
  const [dataInterna, setDataInterna] = useState<Date | undefined>(defaultValue);
  const data = controlado ? value : dataInterna;

  const [texto, setTexto] = useState(() => formatarData(data));
  const [textoSujo, setTextoSujo] = useState(false);

  // O mes aberto e estado proprio: sem isso, `month` preso na data escolhida
  // trava as setas de navegacao e ninguem sai do mes atual.
  const [mes, setMes] = useState<Date>(() => data ?? new Date());

  // Enquanto ninguem digita, o campo espelha a data. Isso mantem o campo certo
  // quando a data muda de fora, sem apagar o que esta sendo digitado agora.
  const textoNaTela = textoSujo ? texto : formatarData(data);

  function mudarData(nova: Date | undefined) {
    if (!controlado) setDataInterna(nova);
    if (nova) setMes(nova);
    onValueChange?.(nova);
  }

  return (
    <div className={cn("relative", className)}>
      <input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={textoNaTela}
        onChange={(evento) => {
          const mascarado = mascararData(evento.target.value);
          setTexto(mascarado);
          setTextoSujo(true);

          const lida = lerData(mascarado);
          // Campo esvaziado limpa a data; texto pela metade ainda nao diz nada,
          // entao a data anterior fica de pe ate o campo perder o foco.
          if (lida || mascarado === "") mudarData(lida);
        }}
        onBlur={(evento) => {
          setTextoSujo(false);
          onBlur?.(evento);
        }}
        className={cn(inputVariants({ size }), "pr-10")}
      />

      <Popover
        onOpenChange={(aberto) => {
          // Abrir o calendario sempre cai no mes da data escolhida, e nao no
          // mes que sobrou de uma navegacao anterior.
          if (aberto && data) setMes(data);
        }}
      >
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              aria-label="Abrir calendario"
              className={cn(
                "absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2",
                "items-center justify-center rounded-md text-fg-muted",
                "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
                "hover:bg-accent-subtle hover:text-fg",
                "disabled:pointer-events-none disabled:text-fg-disabled",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          }
        >
          <CalendarDays size={16} aria-hidden="true" />
        </PopoverTrigger>

        <PopoverContent align="end" className="w-auto min-w-0 p-3">
          <Calendar
            mode="single"
            selected={data}
            month={mes}
            onMonthChange={setMes}
            onSelect={(nova) => {
              setTextoSujo(false);
              mudarData(nova);
            }}
            disabled={disabledDays}
            locale={locale}
            startMonth={startMonth}
            endMonth={endMonth}
            showOutsideDays={showOutsideDays}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {/* O formulario nativo precisa de um valor que o servidor entenda, e
          `dd/mm/aaaa` nao e. Vai como `aaaa-mm-dd`, o mesmo do input de data. */}
      {name && <input type="hidden" name={name} value={data ? formatarData(data).split("/").reverse().join("-") : ""} />}
    </div>
  );
}
