"use client";

import { CalendarDays } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { formatDate, parseDate, maskDate } from "../lib/date";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { CalendarPanel } from "./calendar-panel";
import { Input } from "./field";

type CalendarPassthrough = Pick<
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
    onValueChange?: (data: Date | undefined) => void;
    /** Tamanho do campo, o mesmo vocabulario do Input. */
    size?: "sm" | "md" | "lg";
    /** Dias que nao podem ser escolhidos. Vai direto para o calendario. */
    disabledDays?: ComponentProps<typeof Calendar>["disabled"];
    /**
     * Sem rodape, o clique no dia ja vale e o painel fecha. Ligue quando a
     * escolha dispara trabalho caro, como recarregar uma listagem.
     */
    confirmar?: boolean;
  };

/**
 * Campo de data: da para digitar e da para escolher no calendario, e os dois
 * caminhos escrevem o mesmo estado.
 *
 * Digitar vem primeiro de proposito. Quem preenche formulario o dia inteiro
 * digita `03032026` mais rapido do que navega tres meses para tras, e o
 * calendario existe para quem nao sabe a data de cabeca.
 *
 * O texto e a data vivem separados porque `03/03/2` e um estado legitimo no
 * meio da digitacao, e nao ha data nenhuma para guardar ainda. Ao sair do
 * campo, texto que nao virou data volta para a ultima data valida.
 *
 * Com `confirmar`, o clique no dia vira rascunho e so o Aplicar escreve o
 * valor: fechar por fora descarta. A digitacao continua valendo na hora,
 * porque quem digita a data inteira ja disse o que queria.
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
  confirmar,
  name,
  onBlur,
  ...props
}: DatePickerProps) {
  const controlled = value !== undefined;
  const [dataInterna, setDataInterna] = useState<Date | undefined>(defaultValue);
  const data = controlled ? value : dataInterna;

  const [text, setText] = useState(() => formatDate(data));
  const [rawText, setRawText] = useState(false);
  const [isOpen, setAberto] = useState(false);

  // O rascunho so existe com rodape. Sem ele, o clique no dia ja e a escolha.
  const [rascunho, setRascunho] = useState<Date | undefined>(data);
  const picked = confirmar && isOpen ? rascunho : data;

  const [mes, setMes] = useState<Date>(() => data ?? new Date());

  // Enquanto ninguem digita, o campo espelha a data. Isso mantem o campo certo
  // quando a data muda de fora, sem apagar o que esta sendo digitado agora.
  const displayText = rawText ? text : formatDate(data);

  function mudarData(nova: Date | undefined) {
    if (!controlled) setDataInterna(nova);
    setRascunho(nova);
    if (nova) setMes(nova);
    onValueChange?.(nova);
  }

  const gatilho = (
    <button
      type="button"
      disabled={disabled}
      aria-label="Abrir calendario"
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
          const masked = maskDate(event.target.value);
          setText(masked);
          setRawText(true);

          const lida = parseDate(masked);
          // Campo esvaziado limpa a data; texto pela metade ainda nao diz nada,
          // entao a data anterior fica de pe ate o campo perder o foco.
          if (lida || masked === "") mudarData(lida);
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
          // Abrir sempre parte da data escolhida, e nao do mes que sobrou de
          // uma navegacao anterior. Fechar por fora descarta o rascunho.
          if (abrir) {
            setRascunho(data);
            if (data) setMes(data);
          }
        }}
        trigger={gatilho}
        title="Escolher data"
        align="end"
        footer={
          confirmar && (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  mudarData(undefined);
                  setAberto(false);
                }}
              >
                Limpar
              </Button>
              <Button
                size="sm"
                disabled={!rascunho}
                onClick={() => {
                  mudarData(rascunho);
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
            if (confirmar) {
              setRascunho(nova);
              return;
            }
            mudarData(nova);
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

      {/* O formulario nativo precisa de um valor que o servidor entenda, e
          `dd/mm/aaaa` nao e. Vai como `aaaa-mm-dd`, o mesmo do input de data. */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={data ? formatDate(data).split("/").reverse().join("-") : ""}
        />
      )}
    </div>
  );
}
