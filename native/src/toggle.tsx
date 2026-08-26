import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "./cn";

export type ToggleProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

/**
 * O botao que fica apertado: negrito ligado, filtro ativo. Liga uma
 * preferencia com efeito imediato? E Switch. Confirma uma acao? E Button.
 */
export function Toggle({ pressed, onPressedChange, children, disabled, className }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityState={{ selected: pressed, disabled }}
      disabled={disabled}
      onPress={() => onPressedChange(!pressed)}
      className={cn(
        "h-10 flex-row items-center justify-center rounded-md border px-3.5",
        pressed ? "border-accent bg-accent-subtle" : "border-border-strong bg-surface",
        disabled && "opacity-50",
        className,
      )}
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
  /** Os valores apertados. Sem `multiple`, no maximo um. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /**
   * `multiple` aceita varios ao mesmo tempo; o padrao desaperta o anterior.
   * O nome e o sentido sao os do web: a mesma peca nao pode responder ao
   * contrario de cada lado, e antes disto o nativo pedia `single` e vinha
   * multiplo por padrao - o oposto exato.
   */
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Filtros lado a lado. Ver a mesma coisa de OUTRO jeito e Tabs, nao isto. */
export function ToggleGroup({
  items,
  value,
  onValueChange,
  multiple,
  disabled,
  className,
}: ToggleGroupProps) {
  const toggle = (item: string, pressed: boolean) => {
    if (multiple) {
      onValueChange(pressed ? [...value, item] : value.filter((other) => other !== item));
      return;
    }
    onValueChange(pressed ? [item] : []);
  };

  return (
    <View className={cn("flex-row flex-wrap gap-2", className)}>
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
