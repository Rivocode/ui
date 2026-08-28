import { useState } from "react";
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
  /** A hora escolhida, em 24h e sempre `"HH:MM"`. Campo vazio e `""`. */
  value: string;
  /** Chamado so com hora inteira: `"08:30"`, ou `""` quando o campo esvazia. Texto pela metade nao avisa ninguem. */
  onValueChange: (value: string) => void;
  /** O nome que o leitor de tela anuncia, e o que os dois botoes de passo repetem: "Horario da entrega". */
  label: string;
  /** Quantos minutos os botoes de mais e de menos andam, pousando na grade. Nao recusa hora digitada fora dela. */
  step?: number;
  /** Primeira hora da janela, em `"HH:MM"`. Antes dela o campo se marca invalido. */
  min?: string;
  /** Ultima hora da janela, em `"HH:MM"`. Depois dela o campo se marca invalido. */
  max?: string;
  /** O molde cinza do campo vazio. */
  placeholder?: string;
  /** Pinta o campo de erro por decisao de fora; sem ela o campo decide sozinho. */
  invalid?: boolean;
  disabled?: boolean;
  /** Veste a moldura que junta os dois botoes e o campo. */
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

  const bounds = timeWindow(min, max);
  const chosen = parseTime(value);
  const shown = typing ? text : chosen === undefined ? value : formatTime(chosen);

  const impossible = typing
    ? text.length === 5 && parseTime(text) === undefined
    : value !== "" && chosen === undefined;
  const wrong = invalid ?? (impossible || isOutsideWindow(value, min, max));

  const walk = (direction: 1 | -1) => {
    setTyping(false);
    onValueChange(formatTime(stepTime(parseTime(shown), direction, step, bounds)));
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
          if (minutes !== undefined) onValueChange(formatTime(minutes));
          else if (masked === "") onValueChange("");
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
