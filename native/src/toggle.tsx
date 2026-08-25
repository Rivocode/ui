import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export type ToggleProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
};

/**
 * O botao que fica apertado: negrito ligado, filtro ativo. Liga uma
 * preferencia com efeito imediato? E Switch. Confirma uma acao? E Button.
 */
export function Toggle({ pressed, onPressedChange, children, disabled }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityState={{ selected: pressed, disabled }}
      disabled={disabled}
      onPress={() => onPressedChange(!pressed)}
      className={`h-10 flex-row items-center justify-center rounded-md border px-3.5 ${
        pressed ? "border-accent bg-accent-subtle" : "border-border-strong bg-surface"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <Text className={`text-sm font-medium ${pressed ? "text-accent-text" : "text-fg-muted"}`}>
        {children}
      </Text>
    </Pressable>
  );
}

export type ToggleGroupItem = { label: string; value: string };

export type ToggleGroupProps = {
  items: ToggleGroupItem[];
  /** Os valores apertados. Com `single`, no maximo um. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /** `single` desaperta o anterior; o padrao aceita varios ao mesmo tempo. */
  single?: boolean;
  disabled?: boolean;
};

/** Filtros lado a lado. Ver a mesma coisa de OUTRO jeito e Tabs, nao isto. */
export function ToggleGroup({ items, value, onValueChange, single, disabled }: ToggleGroupProps) {
  const toggle = (item: string, pressed: boolean) => {
    if (single) {
      onValueChange(pressed ? [item] : []);
      return;
    }
    onValueChange(pressed ? [...value, item] : value.filter((other) => other !== item));
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <Toggle
          key={item.value}
          pressed={value.includes(item.value)}
          onPressedChange={(pressed) => toggle(item.value, pressed)}
          disabled={disabled}
        >
          {item.label}
        </Toggle>
      ))}
    </View>
  );
}
