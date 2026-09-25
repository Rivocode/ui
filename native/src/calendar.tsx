import { useState } from "react";
import { Pressable, View } from "react-native";

import { cn, type Slots } from "./cn";
import { useFieldSheet } from "./field";
import { Presence } from "./motion";
import { dateFromIso, formatIsoDate, isoFromDate, toIsoDate } from "./shared/date";
import { Sheet } from "./sheet";
import { Text } from "./text";

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
] as const;

const monthLabel = (month: number) => {
  const name = MONTHS[((month % 12) + 12) % 12] ?? MONTHS[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export const formatDate = formatIsoDate;

type CalendarPart =
  | "root"
  | "nav"
  | "button_previous"
  | "button_next"
  | "caption_label"
  | "weekdays"
  | "weekday"
  | "month_grid"
  | "day"
  | "day_button"
  | "today"
  | "selected"
  | "disabled";

export type CalendarProps = {
  /** A data escolhida, como `aaaa-mm-dd`. */
  value: string | null;
  onValueChange: (value: string) => void;
  /** Limites inclusivos, no mesmo formato. */
  min?: string;
  max?: string;
  /**
   * Classe por parte, com os nomes do `DayPicker` do web: `root`, `nav` (a
   * fileira das setas), `button_previous`, `button_next`, `caption_label` (o
   * mes escrito), `weekdays` e `weekday`, `month_grid` (a grade dos dias), `day`
   * (a caixa de cada dia) e `day_button` (o toque dele). `today`, `selected` e
   * `disabled` somam na caixa do dia que esta naquele estado, como no web.
   */
  classNames?: Slots<CalendarPart>;
};

function Chevron({ left }: { left?: boolean }) {
  return (
    <View
      className={`size-2.5 border-t-2 border-r-2 border-fg-muted ${left ? "-rotate-135" : "rotate-45"}`}
    />
  );
}

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
  /** Classe por parte, os mesmos nomes do `classNames` do `Calendar`. */
  classNames?: Slots<CalendarPart>;
};

export function MonthView({
  year,
  month,
  onMonthChange,
  min,
  max,
  paintOf,
  onDayPress,
  classNames,
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

  const isoToday = isoFromDate(today);

  return (
    <View className={cn("gap-3", classNames?.root)}>
      <View className={cn("flex-row items-center justify-between", classNames?.nav)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => shift(-1)}
          hitSlop={8}
          className={cn(
            "size-9 items-center justify-center rounded-md active:bg-selected",
            classNames?.button_previous,
          )}
        >
          <Chevron left />
        </Pressable>
        <Text className={cn("text-base font-rc-medium text-fg", classNames?.caption_label)}>
          {monthLabel(month)} de {year}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês seguinte"
          onPress={() => shift(1)}
          hitSlop={8}
          className={cn(
            "size-9 items-center justify-center rounded-md active:bg-selected",
            classNames?.button_next,
          )}
        >
          <Chevron />
        </Pressable>
      </View>

      <View className={cn("flex-row", classNames?.weekdays)}>
        {WEEKDAYS.map((weekday, index) => (
          <Text
            key={index}
            font="mono"
            className={cn("flex-1 text-center text-xs text-fg-subtle uppercase", classNames?.weekday)}
          >
            {weekday}
          </Text>
        ))}
      </View>

      <Presence
        swapKey={`${year}-${month}`}
        exit="none"
        className={cn("flex-row flex-wrap", classNames?.month_grid)}
      >
        {cells.map((day, index) => {
          if (day === null) return <View key={`vazio-${index}`} className="w-[14.28%] py-1" />;

          const iso = toIsoDate(year, month, day);
          const paint = paintOf(iso);
          const active = paint.chosen;
          const blocked = (min !== undefined && iso < min) || (max !== undefined && iso > max);

          return (
            <View
              key={iso}
              className={cn(
                "w-[14.28%] items-center py-0.5",
                (paint.within === true || paint.edge !== undefined) && "bg-selected",
                (paint.edge === "start" || paint.edge === "both") && "rounded-l-pill",
                (paint.edge === "end" || paint.edge === "both") && "rounded-r-pill",
                classNames?.day,
                iso === isoToday && classNames?.today,
                active && classNames?.selected,
                blocked && classNames?.disabled,
              )}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={formatDate(iso)}
                accessibilityState={{
                  selected: active || paint.within === true,
                  disabled: blocked,
                }}
                disabled={blocked}
                onPress={() => onDayPress(iso)}
                className={cn(
                  "size-10 items-center justify-center rounded-pill",
                  active ? "bg-accent" : blocked ? "" : "active:bg-selected",
                  iso === isoToday && !active && "border border-border-strong",
                  classNames?.day_button,
                )}
              >
                <Text
                  className={`text-sm ${
                    active ? "font-rc-medium text-accent-fg" : blocked ? "text-fg-disabled" : "text-fg"
                  }`}
                >
                  {day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </Presence>
    </View>
  );
}

export function useMonthOf(iso: string | null | undefined) {
  const anchor = (iso ? dateFromIso(iso) : undefined) ?? new Date();
  const [year, setYear] = useState(anchor.getFullYear());
  const [month, setMonth] = useState(anchor.getMonth());

  const onMonthChange = (nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  };

  return { year, month, onMonthChange };
}

export function Calendar({ value, onValueChange, min, max, classNames }: CalendarProps) {
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
      classNames={classNames}
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
  /** Forca a borda de erro do gatilho, ou a apaga com `false`, por cima do erro do `Field`. */
  invalid?: boolean;
  /** Veste o gatilho; o calendario na folha e o mesmo para todos. */
  className?: string;
};

export function DatePicker({
  value,
  onValueChange,
  label,
  placeholder = "Selecione a data",
  min,
  max,
  disabled,
  invalid,
  className,
}: DatePickerProps) {
  const sheet = useFieldSheet(value);
  const flagged = invalid ?? Boolean(sheet.error);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ? formatDate(value) : placeholder }}
        accessibilityHint={sheet.error}
        disabled={disabled}
        onPress={sheet.show}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border bg-surface px-3.5",
          flagged ? "border-danger" : "border-border-strong",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text className={`text-base ${value ? "text-fg" : "text-fg-subtle"}`}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={sheet.open} onOpenChange={sheet.onOpenChange} title={label}>
        <Calendar
          value={value}
          min={min}
          max={max}
          onValueChange={(next) => {
            onValueChange(next);
            sheet.close();
          }}
        />
      </Sheet>
    </>
  );
}
