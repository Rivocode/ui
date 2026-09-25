import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { Text, TextInput } from "./text";

export type NumberFieldProps = {
  value: number;
  onValueChange: (value: number) => void;
  /**
   * O piso, inclusive. Nasce em 0, e nao sem piso como no web: o teclado
   * numerico do iPhone nao tem sinal de menos, entao o negativo so chegaria
   * pelo botao de menos. Passe um `min` negativo para o stepper descer ate ele.
   */
  min?: number;
  max?: number;
  step?: number;
  /** O nome que o leitor de tela anuncia: "Quantidade de parcelas". */
  label: string;
  disabled?: boolean;
  className?: string;
  /**
   * Os textos da peca, para trocar o idioma: `decrement` e `increment`
   * recebem o `label` e devolvem o nome de cada botao de passo, "Diminuir
   * Quantidade de parcelas" sem eles. Passe so os que mudam.
   */
  labels?: Partial<NumberFieldLabels>;
};

export type NumberFieldLabels = {
  decrement: (label: string) => string;
  increment: (label: string) => string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  const nudge = (delta: number) => onValueChange(clamp(value + delta, min, max));

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
        keyboardType="number-pad"
        value={String(value)}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, "");
          if (digits !== "") onValueChange(clamp(Number(digits), min, max));
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
