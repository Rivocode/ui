import { useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { applyTimeMask, formatTime, parseTime, stepTime, timeWindow } from "./shared/time";
import { Text, TextInput } from "./text";

export { applyTimeMask, formatTime, parseTime, stepTime, timeWindow };

export function isOutsideWindow(value: string, min?: string, max?: string): boolean {
  const chosen = parseTime(value);
  if (chosen === undefined) return false;

  const [start, end] = timeWindow(min, max);
  return chosen < start || chosen > end;
}

export type TimeFieldProps = {
  /** The chosen time, in 24h and always `"HH:MM"`. An empty field is `""`. */
  value: string;
  /**
   * Called only with a whole time: `"08:30"`, or `""` when the field empties.
   * Half-typed text notifies no one.
   */
  onValueChange: (value: string) => void;
  /**
   * The name the screen reader announces, and what the two step buttons repeat:
   * "Horario da entrega".
   */
  label: string;
  /**
   * How many minutes the plus and minus buttons move, landing on the grid. Does
   * not reject a typed time outside it.
   */
  step?: number;
  /** First time of the window, in `"HH:MM"`. Before it the field marks itself invalid. */
  min?: string;
  /** Last time of the window, in `"HH:MM"`. After it the field marks itself invalid. */
  max?: string;
  /** The gray pattern of the empty field. */
  placeholder?: string;
  /**
   * Paints the field as an error by an outside decision; without it the field
   * decides on its own.
   */
  invalid?: boolean;
  disabled?: boolean;
  /** Styles the frame that joins the two buttons and the field. */
  className?: string;
};

export function TimeField({
  value,
  onValueChange,
  label,
  step = 15,
  min,
  max,
  placeholder = "hh:mm",
  invalid,
  disabled,
  className,
}: TimeFieldProps) {
  const { colors } = useRivo();
  const [text, setText] = useState(value);
  const [typing, setTyping] = useState(false);
  const [focused, setFocused] = useState(false);
  const emitted = useRef(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== emitted.current) setTyping(false);
  }

  const emit = (next: string) => {
    emitted.current = next;
    onValueChange(next);
  };

  const bounds = timeWindow(min, max);
  const chosen = parseTime(value);
  const shown = typing ? text : chosen === undefined ? value : formatTime(chosen);

  const impossible = typing
    ? text.length === 5 && parseTime(text) === undefined
    : value !== "" && chosen === undefined;
  const wrong = invalid ?? (impossible || isOutsideWindow(value, min, max));

  const walk = (direction: 1 | -1) => {
    setTyping(false);
    emit(formatTime(stepTime(parseTime(shown), direction, step, bounds)));
  };

  const stepper = (direction: 1 | -1, sign: string, stepLabel: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={stepLabel}
      disabled={disabled}
      onPress={() => walk(direction)}
      className="h-12 w-12 items-center justify-center active:bg-selected"
    >
      <Text className="text-xl text-fg-muted">{sign}</Text>
    </Pressable>
  );

  return (
    <View
      accessibilityLabel={label}
      accessibilityValue={{ text: shown === "" ? placeholder : shown }}
      className={cn(
        "flex-row items-center overflow-hidden rounded-md border bg-surface",
        wrong ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        disabled && "opacity-50",
        className,
      )}
    >
      {stepper(-1, "−", `Diminuir ${label}`)}
      <TextInput
        accessibilityLabel={label}
        keyboardType="number-pad"
        maxLength={5}
        editable={!disabled}
        value={shown}
        placeholder={placeholder}
        placeholderTextColor={colors["fg-subtle"]}
        style={{ textAlign: "center" }}
        onChangeText={(typed) => {
          const masked = applyTimeMask(typed);
          setText(masked);
          setTyping(true);

          const minutes = parseTime(masked);
          if (minutes !== undefined) emit(formatTime(minutes));
          else if (masked === "") emit("");
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setTyping(false);
        }}
        className="h-12 flex-1 border-r border-l border-border text-base text-fg"
      />
      {stepper(1, "+", `Aumentar ${label}`)}
    </View>
  );
}
