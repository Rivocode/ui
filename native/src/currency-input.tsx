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
  /** Veste a raiz, que embrulha o campo e o "R$". */
  className?: string;
  /** Classe por parte: `input` (o campo) e `prefix` (o texto do "R$"). */
  classNames?: Slots<"input" | "prefix">;
  /**
   * Obsoleta: veste o campo de dentro, hoje em `classNames.input`.
   * @deprecated Use `classNames.input`. Com os dois, as classes se somam e a de
   * `classNames.input` vence.
   */
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
  classNames,
  inputClassName,
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
        className={cn("pl-11", inputClassName, classNames?.input)}
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
