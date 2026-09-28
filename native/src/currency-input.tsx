import { useRef, useState } from "react";
import { View } from "react-native";

import { cn, type Slots } from "./cn";
import { Input, type InputProps } from "./field";
import {
  formatCents,
  outsideCents,
  readCurrencyInput,
  type TextSelection,
} from "./shared/currency";
import { Text } from "./text";

export type CurrencyInputProps = Omit<
  InputProps,
  "value" | "onChangeText" | "onValueChange" | "keyboardType" | "className"
> & {
  /** The value in whole cents: `123456` is R$ 1.234,56. An empty field is `null`. */
  value: number | null;
  /** Called on every keystroke with the cents, or `null` when the field empties. */
  onValueChange: (cents: number | null) => void;
  /**
   * The smallest accepted value, in cents. Below it the field marks itself
   * invalid, and nothing is corrected on its own.
   */
  min?: number;
  /**
   * The largest accepted value, in cents. Above it the field marks itself
   * invalid, and nothing is corrected on its own.
   */
  max?: number;
  /**
   * Accepts a negative value, with `-` anywhere in the field; a second `-`
   * removes the sign. When on, the keyboard becomes the numbers-and-punctuation
   * one, which is the one with the sign on iPhone.
   */
  allowNegative?: boolean;
  /** Styles the root, which wraps the field and the "R$". */
  className?: string;
  /** Class per part: `input` (the field) and `prefix` (the "R$" text). */
  classNames?: Slots<"input" | "prefix">;
};

export function CurrencyInput({
  value,
  onValueChange,
  min,
  max,
  allowNegative = false,
  invalid,
  placeholder = "0,00",
  onSelectionChange,
  className,
  classNames,
  ...props
}: CurrencyInputProps) {
  const [minus, setMinus] = useState(false);
  const selection = useRef<{ range: TextSelection; shown: string } | undefined>(undefined);

  const shown = value === null ? (minus && allowNegative ? "-" : "") : formatCents(value);
  const outside = outsideCents(value, min, max);

  return (
    <View className={cn("justify-center", className)}>
      <Input
        placeholder={placeholder}
        {...props}
        keyboardType={allowNegative ? "numbers-and-punctuation" : "number-pad"}
        value={shown}
        invalid={outside || invalid}
        onSelectionChange={(event) => {
          selection.current = { range: event.nativeEvent.selection, shown };
          onSelectionChange?.(event);
        }}
        onChangeText={(text) => {
          const known = selection.current;
          const range = known?.shown === shown ? known.range : undefined;
          const reading = readCurrencyInput(text, shown, allowNegative, range, false);
          selection.current = undefined;
          setMinus(reading.minus);
          if (reading.cents !== value) onValueChange(reading.cents);
        }}
        className={cn("pl-11", classNames?.input)}
      />
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute left-3.5"
      >
        <Text className={cn("text-base text-fg-subtle", classNames?.prefix)}>R$</Text>
      </View>
    </View>
  );
}
