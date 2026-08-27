import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { cn } from "./cn";
import { Sheet } from "./sheet";
import { Text } from "./text";
import { formatTime, isOutsideWindow, parseTime, timeWindow } from "./time-field";

const OPTION_HEIGHT = 48;

type ColumnProps = {
  label: string;
  options: number[];
  selected: number | undefined;
  onSelect: (option: number) => void;
};

function TimeColumn({ label, options, selected, onSelect }: ColumnProps) {
  const list = useRef<ScrollView | null>(null);
  const found = options.indexOf(selected ?? -1);

  useEffect(() => {
    if (found > 0) list.current?.scrollTo({ y: found * OPTION_HEIGHT, animated: false });
  }, []);

  return (
    <View className="min-w-0 flex-1 gap-1">
      <Text className="px-1 text-xs text-fg-subtle">{label}</Text>
      <ScrollView
        ref={list}
        className="max-h-72 rounded-md border border-border p-1"
        accessibilityLabel={label}
      >
        {options.map((option) => {
          const active = option === selected;
          const written = String(option).padStart(2, "0");

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${written}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(option)}
              className={`h-12 items-center justify-center rounded-sm ${
                active ? "bg-accent" : "active:bg-selected"
              }`}
            >
              <Text className={`text-base ${active ? "font-medium text-accent-fg" : "text-fg"}`}>
                {written}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export type TimePickerLabels = {
  /** Nome da coluna das horas. */
  hours?: string;
  /** Nome da coluna dos minutos. */
  minutes?: string;
};

export type TimePickerProps = {
  /** A hora escolhida, em 24h e sempre `"HH:MM"`. Sem escolha e `""`. */
  value: string;
  /** Chamado so com hora inteira, do mesmo jeito que no `TimeField`. */
  onValueChange: (value: string) => void;
  /** O que o leitor de tela anuncia no gatilho, e o titulo da folha. */
  label: string;
  /** O que o gatilho mostra sem escolha: "Escolha o horario". */
  placeholder?: string;
  /** De quantos em quantos minutos a coluna da direita anda. Nao recusa hora fora da grade. */
  step?: number;
  /** Primeira hora da janela, em `"HH:MM"`. Ela recorta as duas colunas. */
  min?: string;
  /** Ultima hora da janela, em `"HH:MM"`. Ela recorta as duas colunas. */
  max?: string;
  disabled?: boolean;
  /** Os nomes das duas colunas. Trocar um nao apaga o outro. */
  labels?: TimePickerLabels;
  /** Veste o gatilho; a folha e a mesma para todos. */
  className?: string;
};

export function TimePicker({
  value,
  onValueChange,
  label,
  placeholder = "Escolha o horário",
  step = 15,
  min,
  max,
  disabled,
  labels,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const [start, end] = timeWindow(min, max);
  const grid = Math.min(Math.max(Math.round(step), 1), 60);

  const minutesOf = (hour: number) => {
    const list: number[] = [];
    for (let minute = 0; minute < 60; minute += grid) {
      const at = hour * 60 + minute;
      if (at >= start && at <= end) list.push(minute);
    }
    return list;
  };

  const hours: number[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    if (minutesOf(hour).length > 0) hours.push(hour);
  }

  const chosen = parseTime(value);
  const chosenHour = chosen === undefined ? undefined : Math.floor(chosen / 60);
  const chosenMinute = chosen === undefined ? undefined : chosen % 60;

  const columnHour =
    chosenHour !== undefined && minutesOf(chosenHour).length > 0 ? chosenHour : (hours[0] ?? 0);

  const pickHour = (hour: number) => {
    const keep = chosenMinute ?? minutesOf(hour)[0] ?? 0;
    onValueChange(formatTime(Math.min(Math.max(hour * 60 + keep, start), end)));
  };

  const pickMinute = (minute: number) => {
    onValueChange(formatTime(columnHour * 60 + minute));
    setOpen(false);
  };

  const written = chosen === undefined ? placeholder : formatTime(chosen);
  const wrong = (value !== "" && chosen === undefined) || isOutsideWindow(value, min, max);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: written }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border bg-surface px-3.5",
          wrong ? "border-danger" : "border-border-strong",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text
          numberOfLines={1}
          className={`text-base ${chosen === undefined ? "text-fg-subtle" : "text-fg"}`}
        >
          {written}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <View className="flex-row gap-3">
          <TimeColumn
            label={labels?.hours ?? "Hora"}
            options={hours}
            selected={chosenHour}
            onSelect={pickHour}
          />
          <TimeColumn
            label={labels?.minutes ?? "Minuto"}
            options={minutesOf(columnHour)}
            selected={chosenMinute}
            onSelect={pickMinute}
          />
        </View>
      </Sheet>
    </>
  );
}
