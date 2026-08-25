import { Pressable, Text, View } from "react-native";

export type RadioItem = { label: string; value: string; description?: string };

export type RadioGroupProps = {
  items: RadioItem[];
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

/**
 * Uma escolha entre poucas, todas visiveis - a mesma regra do web: acima de
 * meia duzia de opcoes, a peca certa e o Select. O ponto marcado e um circulo
 * preenchido, nunca glyph de fonte.
 */
export function RadioGroup({ items, value, onValueChange, disabled }: RadioGroupProps) {
  return (
    <View accessibilityRole="radiogroup" className="gap-3">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled }}
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
