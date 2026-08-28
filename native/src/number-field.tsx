import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { Text, TextInput } from "./text";

export type NumberFieldProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** O nome que o leitor de tela anuncia: "Quantidade de parcelas". */
  label: string;
  disabled?: boolean;
  className?: string;
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
      {stepper(-step, "−", `Diminuir ${label}`, value <= min)}
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
      {stepper(step, "+", `Aumentar ${label}`, value >= max)}
    </View>
  );
}
