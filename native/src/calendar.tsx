import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "./cn";
import { mono } from "./font";
import { Sheet } from "./sheet";

/* ---------------------------------------------------------------------------
 * Calendario e DatePicker, sem biblioteca de datas: um mes e uma conta de
 * Date, e o valor anda como ISO (aaaa-mm-dd) - sem fuso, sem hora, sem
 * surpresa de meia-noite.
 * ------------------------------------------------------------------------- */

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const toISO = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** `2026-08-25` vira `25/08/2026`, o formato que o olho daqui espera. */
export const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

export type CalendarProps = {
  /** A data escolhida, como `aaaa-mm-dd`. */
  value: string | null;
  onValueChange: (value: string) => void;
  /** Limites inclusivos, no mesmo formato. */
  min?: string;
  max?: string;
};

/** Um chevron desenhado com borda, porque glyph muda de corpo entre OS. */
function Chevron({ left }: { left?: boolean }) {
  return (
    <View
      className={`size-2.5 border-t-2 border-r-2 border-fg-muted ${left ? "-rotate-135" : "rotate-45"}`}
    />
  );
}

/** Como um dia se pinta. `edge` so vale quando ha faixa. */
export type DayPaint = {
  /** Ponta da escolha: a pastilha de acento com o numero em cima. */
  chosen: boolean;
  /** Dia entre as duas pontas de um intervalo. */
  within?: boolean;
  /** Onde a faixa comeca e termina, para arredondar so as duas beiradas. */
  edge?: "start" | "end" | "both";
};

export type MonthViewProps = {
  /** O mes desenhado, e quem o troca: o estado do mes mora em quem chama. */
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  min?: string;
  max?: string;
  /** Como cada dia se pinta, decidido por quem chama. */
  paintOf: (iso: string) => DayPaint;
  onDayPress: (iso: string) => void;
};

/**
 * Um mes desenhado, sem opiniao sobre o que e "escolhido".
 *
 * Ele existe separado porque o `Calendar` e o `DateRangePicker` precisam do
 * MESMO mes - o mesmo primeiro dia da semana, a mesma conta de dias, o mesmo
 * alvo de 40px, a mesma regra de limite. Escrito duas vezes, o dia em que um
 * dos dois ganhasse "semana comeca na segunda" o outro continuaria no domingo,
 * e ninguem descobriria qual dos dois estava errado.
 */
export function MonthView({
  year,
  month,
  onMonthChange,
  min,
  max,
  paintOf,
  onDayPress,
}: MonthViewProps) {
  const today = new Date();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const shift = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    onMonthChange(next.getFullYear(), next.getMonth());
  };

  const isoToday = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => shift(-1)}
          hitSlop={8}
          className="size-9 items-center justify-center rounded-md active:bg-selected"
        >
          <Chevron left />
        </Pressable>
        {/* Capitalizar em JS, so o mes: a classe capitalize do Tailwind
            capitaliza cada palavra e escrevia "Agosto De 2026". */}
        <Text className="text-base font-medium text-fg">
          {MONTHS[month][0].toUpperCase() + MONTHS[month].slice(1)} de {year}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês seguinte"
          onPress={() => shift(1)}
          hitSlop={8}
          className="size-9 items-center justify-center rounded-md active:bg-selected"
        >
          <Chevron />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((weekday, index) => (
          <Text
            key={index}
            style={{ fontFamily: mono }}
            className="flex-1 text-center text-xs text-fg-subtle uppercase"
          >
            {weekday}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((day, index) => {
          if (day === null) return <View key={`vazio-${index}`} className="w-[14.28%] py-1" />;

          const iso = toISO(year, month, day);
          const paint = paintOf(iso);
          const active = paint.chosen;
          const blocked = (min !== undefined && iso < min) || (max !== undefined && iso > max);

          return (
            <View
              key={iso}
              /* A faixa do intervalo pinta a CELULA, e nao a pastilha: e o
                 unico jeito de o meio do periodo sair continuo, porque a
                 pastilha tem 40px dentro de uma celula de 14,28% da largura e
                 sempre sobraria vao dos dois lados. */
              className={cn(
                "w-[14.28%] items-center py-0.5",
                (paint.within === true || paint.edge !== undefined) && "bg-selected",
                (paint.edge === "start" || paint.edge === "both") && "rounded-l-pill",
                (paint.edge === "end" || paint.edge === "both") && "rounded-r-pill",
              )}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={formatDate(iso)}
                /* Anunciado como escolhido tambem no MEIO do intervalo: o dia
                   12 faz parte do periodo mesmo sem ser ponta, e quem ouve a
                   grade so tem este estado para saber disso - a faixa pintada
                   nao existe para ele. */
                accessibilityState={{
                  selected: active || paint.within === true,
                  disabled: blocked,
                }}
                disabled={blocked}
                onPress={() => onDayPress(iso)}
                className={`size-10 items-center justify-center rounded-pill ${
                  active ? "bg-accent" : blocked ? "" : "active:bg-selected"
                } ${iso === isoToday && !active ? "border border-border-strong" : ""}`}
              >
                <Text
                  className={`text-sm ${
                    active ? "font-medium text-accent-fg" : blocked ? "text-fg-disabled" : "text-fg"
                  }`}
                >
                  {day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** O mes em que um calendario abre: o do valor, ou o de hoje. */
export function useMonthOf(iso: string | null | undefined) {
  const anchor = iso ? new Date(`${iso}T12:00:00`) : new Date();
  const [year, setYear] = useState(anchor.getFullYear());
  const [month, setMonth] = useState(anchor.getMonth());

  const onMonthChange = (nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  };

  return { year, month, onMonthChange };
}

export function Calendar({ value, onValueChange, min, max }: CalendarProps) {
  const { year, month, onMonthChange } = useMonthOf(value);

  return (
    <MonthView
      year={year}
      month={month}
      onMonthChange={onMonthChange}
      min={min}
      max={max}
      paintOf={(iso) => ({ chosen: iso === value })}
      onDayPress={onValueChange}
    />
  );
}

export type DatePickerProps = {
  value: string | null;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Veste o gatilho; o calendario na folha e o mesmo para todos. */
  className?: string;
};

/** O campo de data: gatilho como o Select, calendario numa folha de baixo. */
export function DatePicker({
  value,
  onValueChange,
  label,
  placeholder = "Selecione a data",
  min,
  max,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ? formatDate(value) : placeholder }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border border-border-strong bg-surface px-3.5",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text className={`text-base ${value ? "text-fg" : "text-fg-subtle"}`}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <Calendar
          value={value}
          min={min}
          max={max}
          onValueChange={(next) => {
            onValueChange(next);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}
