import { useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { Text, TextInput } from "./text";

export type NumberFieldProps = {
  value: number;
  onValueChange: (value: number) => void;
  /**
   * The floor, inclusive. Starts at 0, and not unbounded as on the web. With a
   * negative `min` the field accepts a typed minus sign and switches to a
   * keyboard that has the sign, and the stepper goes down to it.
   */
  min?: number;
  max?: number;
  step?: number;
  /** The name the screen reader announces: "Quantidade de parcelas". */
  label: string;
  disabled?: boolean;
  className?: string;
  /**
   * The component's texts, to change the language: `decrement` and `increment`
   * receive `label` and return the name of each step button, "Diminuir
   * Quantidade de parcelas" without them. Pass only the ones that change.
   */
  labels?: Partial<NumberFieldLabels>;
};

export type NumberFieldLabels = {
  decrement: (label: string) => string;
  increment: (label: string) => string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const decimalsOf = (n: number) => {
  const [, fraction = ""] = String(n).split(".");
  return fraction.length;
};

const written = (value: number) => String(value).replace(".", ",");

const cleanTyped = (text: string, negative: boolean) => {
  const sign = negative && text.trimStart().startsWith("-") ? "-" : "";
  const kept = text.replace(/[^\d.,]/g, "");
  const cut = kept.search(/[.,]/);
  if (cut === -1) return `${sign}${kept}`;
  return `${sign}${kept.slice(0, cut + 1)}${kept.slice(cut + 1).replace(/[.,]/g, "")}`;
};

const readTyped = (text: string): number | undefined => {
  if (!/\d/.test(text)) return undefined;
  const parsed = Number(text.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function NumberField({
  value,
  onValueChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  label,
  disabled,
  className,
  labels,
}: NumberFieldProps) {
  const { colors } = useRivo();
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const emitted = useRef(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== emitted.current) setTyping(false);
  }

  const emit = (next: number) => {
    emitted.current = next;
    onValueChange(next);
  };

  const negative = min < 0;
  const keyboardType = negative
    ? Platform.OS === "ios"
      ? "numbers-and-punctuation"
      : "numeric"
    : Number.isInteger(step)
      ? "number-pad"
      : "decimal-pad";

  const nudge = (delta: number) => {
    const base = (typing ? readTyped(text) : undefined) ?? value;
    const places = Math.max(decimalsOf(step), decimalsOf(min), decimalsOf(base));
    setTyping(false);
    emit(clamp(Number((base + delta).toFixed(places)), min, max));
  };

  const stepper = (delta: number, sign: string, stepLabel: string, blocked: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={stepLabel}
      disabled={disabled || blocked}
      onPress={() => nudge(delta)}
      className={`h-12 w-12 items-center justify-center ${blocked ? "opacity-40" : "active:bg-selected"}`}
    >
      <Text className="text-xl text-fg-muted">{sign}</Text>
    </Pressable>
  );

  return (
    <View
      accessibilityLabel={label}
      accessibilityValue={{ text: String(value) }}
      className={cn(
        "flex-row items-center overflow-hidden rounded-md border border-border-strong bg-surface",
        disabled && "opacity-50",
        className,
      )}
    >
      {stepper(
        -step,
        "−",
        labels?.decrement ? labels.decrement(label) : `Diminuir ${label}`,
        value <= min,
      )}
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        value={typing ? text : written(value)}
        onChangeText={(typed) => {
          const cleaned = cleanTyped(typed, negative);
          const parsed = readTyped(cleaned);
          setTyping(true);
          if (parsed !== undefined && parsed > max) {
            setText(written(max));
            emit(max);
            return;
          }
          setText(cleaned);
          if (parsed !== undefined && parsed >= min) emit(parsed);
        }}
        onBlur={() => {
          const parsed = typing ? readTyped(text) : undefined;
          setTyping(false);
          if (parsed !== undefined && parsed < min) emit(min);
        }}
        editable={!disabled}
        placeholderTextColor={colors["fg-subtle"]}
        style={{ textAlign: "center" }}
        className="h-12 min-w-0 flex-1 border-l border-r border-border text-base text-fg"
      />
      {stepper(
        step,
        "+",
        labels?.increment ? labels.increment(label) : `Aumentar ${label}`,
        value >= max,
      )}
    </View>
  );
}
