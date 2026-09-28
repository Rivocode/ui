import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { cn, type Slots } from "./cn";
import { Sheet } from "./sheet";
import { Text } from "./text";
import { formatTime, isOutsideWindow, parseTime, timeWindow } from "./time-field";

const OPTION_HEIGHT = 48;

type ColumnProps = {
  label: string;
  options: number[];
  selected: number | undefined;
  onSelect: (option: number) => void;
  className?: string;
  optionClassName?: string;
};

function TimeColumn({
  label,
  options,
  selected,
  onSelect,
  className,
  optionClassName,
}: ColumnProps) {
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
        className={cn("max-h-72 rounded-md border border-border p-1", className)}
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
              className={cn(
                "h-12 items-center justify-center rounded-sm",
                active ? "bg-accent" : "active:bg-selected",
                optionClassName,
              )}
            >
              <Text className={`text-base ${active ? "font-rc-medium text-accent-fg" : "text-fg"}`}>
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
  /** Name of the hours column. */
  hours?: string;
  /** Name of the minutes column. */
  minutes?: string;
};

export type TimePickerProps = {
  /** The chosen time, in 24h and always `"HH:MM"`. With no choice it is `""`. */
  value: string;
  /** Called only with a whole time, the same way as in `TimeField`. */
  onValueChange: (value: string) => void;
  /** What the screen reader announces on the trigger, and the sheet title. */
  label: string;
  /** What the trigger shows with no choice: "Escolha o horario". */
  placeholder?: string;
  /** The minute interval the right column steps by. Does not reject a time off the grid. */
  step?: number;
  /** First time of the window, in `"HH:MM"`. It trims both columns. */
  min?: string;
  /** Last time of the window, in `"HH:MM"`. It trims both columns. */
  max?: string;
  disabled?: boolean;
  /** The names of the two columns. Changing one does not erase the other. */
  labels?: TimePickerLabels;
  /** Styles the trigger, the same node as `classNames.trigger`. */
  className?: string;
  /**
   * Class per part: `trigger` (the trigger), `panel` (the sheet), `column` (the
   * list of each column) and `option` (each hour and each minute).
   */
  classNames?: Slots<"trigger" | "panel" | "column" | "option">;
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
  classNames,
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
          classNames?.trigger,
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

      <Sheet open={open} onOpenChange={setOpen} title={label} className={classNames?.panel}>
        <View className="flex-row gap-3">
          <TimeColumn
            label={labels?.hours ?? "Hora"}
            options={hours}
            selected={chosenHour}
            onSelect={pickHour}
            className={classNames?.column}
            optionClassName={classNames?.option}
          />
          <TimeColumn
            label={labels?.minutes ?? "Minuto"}
            options={minutesOf(columnHour)}
            selected={chosenMinute}
            onSelect={pickMinute}
            className={classNames?.column}
            optionClassName={classNames?.option}
          />
        </View>
      </Sheet>
    </>
  );
}
