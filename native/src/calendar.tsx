import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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

export function Calendar({ value, onValueChange, min, max }: CalendarProps) {
  const today = new Date();
  const anchor = value ? new Date(`${value}T12:00:00`) : today;
  const [year, setYear] = useState(anchor.getFullYear());
  const [month, setMonth] = useState(anchor.getMonth());

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const shift = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
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
            className="flex-1 text-center font-mono text-xs text-fg-subtle uppercase"
          >
            {weekday}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((day, index) => {
          if (day === null) return <View key={`vazio-${index}`} className="w-[14.28%] py-1" />;

          const iso = toISO(year, month, day);
          const active = iso === value;
          const blocked = (min !== undefined && iso < min) || (max !== undefined && iso > max);

          return (
            <View key={iso} className="w-[14.28%] items-center py-0.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={formatDate(iso)}
                accessibilityState={{ selected: active, disabled: blocked }}
                disabled={blocked}
                onPress={() => onValueChange(iso)}
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

export type DatePickerProps = {
  value: string | null;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
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
        className={`h-12 flex-row items-center justify-between rounded-md border border-border-strong bg-surface px-3.5 ${
          disabled ? "opacity-50" : ""
        }`}
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
