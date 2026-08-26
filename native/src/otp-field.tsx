import { useRef, useState, type ComponentRef } from "react";
import { Pressable, TextInput, Text, View } from "react-native";

import { cn } from "./cn";

export type OTPFieldProps = {
  /** Quantos digitos o codigo tem. */
  length?: number;
  value: string;
  onValueChange: (value: string) => void;
  /** Chamado uma vez, quando o ultimo digito entra. Mesmo nome do web. */
  onValueComplete?: (value: string) => void;
  className?: string;
};

export function OTPField({
  length = 6,
  value,
  onValueChange,
  onValueComplete,
  className,
}: OTPFieldProps) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, length);
    onValueChange(digits);
    if (digits.length === length) onValueComplete?.(digits);
  };

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => input.current?.focus()}
      className={cn("flex-row justify-between gap-2", className)}
    >
      {Array.from({ length }, (_, index) => {
        const filled = index < value.length;
        const active = focused && index === Math.min(value.length, length - 1);
        return (
          <View
            key={index}
            className={`h-14 flex-1 items-center justify-center rounded-md border bg-surface ${
              active ? "border-accent" : filled ? "border-border-strong" : "border-border"
            }`}
          >
            <Text className="text-xl font-medium text-fg">{value[index] ?? ""}</Text>
          </View>
        );
      })}
      <TextInput
        ref={input}
        accessibilityLabel={`Código de ${length} dígitos`}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        maxLength={length}
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
    </Pressable>
  );
}
