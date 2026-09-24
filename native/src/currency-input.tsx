import { useRef, useState } from "react";
import { View } from "react-native";

import { cn } from "./cn";
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
  "value" | "onChangeText" | "keyboardType" | "className"
> & {
  /** O valor em centavos inteiros: `123456` e R$ 1.234,56. Campo vazio e `null`. */
  value: number | null;
  /** Chamado a cada tecla com os centavos, ou `null` quando o campo esvazia. */
  onValueChange: (cents: number | null) => void;
  /** O menor valor aceito, em centavos. Abaixo dele o campo se marca invalido, e nada e corrigido sozinho. */
  min?: number;
  /** O maior valor aceito, em centavos. Acima dele o campo se marca invalido, e nada e corrigido sozinho. */
  max?: number;
  /**
   * Aceita valor negativo, com o `-` em qualquer ponto do campo; um segundo `-`
   * tira o sinal. Ligado, o teclado passa a ser o de numeros e pontuacao, que e
   * o que tem o sinal no iPhone.
   */
  allowNegative?: boolean;
  /** Veste a raiz, que embrulha o campo e o "R$". O campo de dentro e `inputClassName`. */
  className?: string;
  inputClassName?: string;
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
  inputClassName,
  ...props
}: CurrencyInputProps) {
  const [minus, setMinus] = useState(false);
  const selection = useRef<TextSelection | undefined>(undefined);

  const shown = value === null ? (minus && allowNegative ? "-" : "") : formatCents(value);
  const outside = outsideCents(value, min, max);

  return (
    <View className={cn("justify-center", className)}>
      <Input
        placeholder={placeholder}
        {...props}
        keyboardType={allowNegative ? "numbers-and-punctuation" : "number-pad"}
        value={shown}
        invalid={invalid || outside}
        onSelectionChange={(event) => {
          selection.current = event.nativeEvent.selection;
          onSelectionChange?.(event);
        }}
        onChangeText={(text) => {
          const reading = readCurrencyInput(text, shown, allowNegative, selection.current);
          selection.current = undefined;
          setMinus(reading.minus);
          if (reading.cents !== value) onValueChange(reading.cents);
        }}
        className={cn("pl-11", inputClassName)}
      />
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute left-3.5"
      >
        <Text className="text-base text-fg-subtle">R$</Text>
      </View>
    </View>
  );
}
