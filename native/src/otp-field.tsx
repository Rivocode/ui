import { useRef, useState, type ComponentRef } from "react";
import { Pressable, TextInput, Text, View } from "react-native";

import { cn } from "./cn";

export type OTPFieldProps = {
  /** Quantos digitos o codigo tem. */
  length?: number;
  value: string;
  onValueChange: (value: string) => void;
  /** Chamado uma vez, quando o ultimo digito entra. */
  onComplete?: (value: string) => void;
  className?: string;
};

/**
 * O codigo de verificacao: caixas visiveis, UM campo de verdade escondido
 * por tras. E o unico jeito de o teclado, o autofill de SMS e o leitor de
 * tela enxergarem um campo so, enquanto o olho ve um digito por caixa.
 */
export function OTPField({ length = 6, value, onValueChange, onComplete, className }: OTPFieldProps) {
  // `useRef<TextInput>` parece obvio e e uma armadilha: sob a API estrita de
  // tipos do React Native o nome `TextInput` e o COMPONENTE, nao a instancia,
  // entao a ref virava `TextInputType` - sem `focus` - e nem entrava no
  // `ref=` do proprio campo. Como este pacote publica fonte, os dois erros
  // caiam no tsc de quem consome. `ComponentRef` pergunta ao componente qual
  // e a instancia dele, e responde certo nos dois conjuntos de tipos.
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, length);
    onValueChange(digits);
    if (digits.length === length) onComplete?.(digits);
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
        // Presente para o sistema, invisivel para o olho: as caixas acima
        // sao o rosto deste campo.
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
    </Pressable>
  );
}
