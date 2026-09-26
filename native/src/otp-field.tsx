import { useRef, useState, type ComponentRef } from "react";
import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { Presence } from "./motion";
import { TextInput, Text } from "./text";

export type OTPFieldProps = {
  /** Quantos digitos o codigo tem. */
  length?: number;
  value: string;
  onValueChange: (value: string) => void;
  /** Chamado uma vez, quando o ultimo digito entra. Mesmo nome do web. */
  onValueComplete?: (value: string) => void;
  /**
   * O nome que o leitor de tela ouve no campo: "Codigo enviado por SMS".
   * Sem ele, o leitor diz quantos digitos o codigo tem. Dentro do `FormField`, chega sozinho pelo
   * `forValue`.
   */
  label?: string;
  className?: string;
};

export function OTPField({
  length = 6,
  value,
  onValueChange,
  onValueComplete,
  label,
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
      accessible={false}
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
            <Presence show={filled} swapKey={value[index]} enter="popIn" exit="none">
              <Text className="text-xl font-rc-medium text-fg">{value[index]}</Text>
            </Presence>
          </View>
        );
      })}
      <TextInput
        ref={input}
        accessibilityLabel={
          label ?? `Código de ${length} ${length === 1 ? "dígito" : "dígitos"}`
        }
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
    </Pressable>
  );
}
