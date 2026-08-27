import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type RadioItem = { label: string; value: string; description?: string };

export type RadioGroupProps = {
  items: RadioItem[];
  value: string | null;
  onValueChange: (value: string) => void;
  /**
   * O nome do grupo para o leitor de tela. Sem ele, o grupo nao tem nome
   * nenhum.
   *
   * O web pede a mesma coisa por `aria-label` ou `aria-labelledby`, e a pagina
   * dele diz que sem isso o grupo existe para o dedo e nao para o leitor de
   * tela. Aqui nao havia como dizer: um `radiogroup` sem nome anuncia so a
   * palavra "grupo", e cada opcao se apresenta sem dizer de que pergunta ela e
   * resposta.
   *
   * Nao desenha nada - o texto visivel e do `Field`, como no `Select` e no
   * `Combobox`. Dentro de um `FormField`, repita ali o mesmo texto do `label`
   * dele.
   */
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function RadioGroup({
  items,
  value,
  onValueChange,
  label,
  disabled,
  className,
}: RadioGroupProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={cn("gap-3", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active, disabled }}
            disabled={disabled}
            onPress={() => onValueChange(item.value)}
            className={`flex-row items-start gap-2.5 ${disabled ? "opacity-50" : ""}`}
          >
            <View
              className={`mt-0.5 size-5 items-center justify-center rounded-pill border ${
                active ? "border-accent" : "border-border-strong"
              }`}
            >
              {active && <View className="size-2.5 rounded-pill bg-accent" />}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-base text-fg">{item.label}</Text>
              {item.description && (
                <Text className="text-xs text-fg-subtle">{item.description}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
